"""
GameDeal Hunter — Python Worker
================================
Entry point for the background data collection worker.
Loads retailer connectors, fetches listings, normalizes specs,
scores deals, and sends notifications.

Requirements:
  pip install -r requirements.txt

Environment variables (set in .env or GitHub Actions secrets):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  DISCORD_WEBHOOK_URL (optional)
  RESEND_API_KEY (optional)
  WORKER_API_KEY (for manual trigger endpoint auth)
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional

from supabase import create_client, Client

from connectors.base import ConnectorResult
from connectors.best_buy_ca import BestBuyCAConnector
from connectors.canada_computers import CanadaComputersConnector
from connectors.memory_express import MemoryExpressConnector
from normalizer import normalize_listing
from scorer import score_listing
from notifier import send_discord_notification, send_email_notification

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("worker")


def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
        )
    return create_client(url, key)


def record_scan_start(db: Client, retailer: str) -> str:
    result = db.table("scan_runs").insert({
        "retailer": retailer,
        "status": "running",
        "listings_found": 0,
        "listings_new": 0,
        "listings_updated": 0,
        "errors": [],
    }).execute()
    return result.data[0]["id"]


def record_scan_end(
    db: Client,
    scan_id: str,
    status: str,
    found: int,
    new_count: int,
    updated: int,
    errors: list[str],
) -> None:
    db.table("scan_runs").update({
        "status": status,
        "listings_found": found,
        "listings_new": new_count,
        "listings_updated": updated,
        "errors": errors,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", scan_id).execute()


def upsert_listing(db: Client, listing: dict) -> tuple[str, bool]:
    """
    Insert or update a retailer listing.
    Returns (listing_id, is_new).
    """
    retailer = listing["retailer"]
    retailer_listing_id = listing.get("retailer_listing_id")

    if not retailer_listing_id:
        log.warning("Listing missing retailer_listing_id, skipping: %s", listing.get("name"))
        return "", False

    # Check existing
    existing = (
        db.table("retailer_listings")
        .select("id, current_price, in_stock")
        .eq("retailer", retailer)
        .eq("retailer_listing_id", retailer_listing_id)
        .maybe_single()
        .execute()
    )

    is_new = existing.data is None

    if is_new:
        result = db.table("retailer_listings").insert(listing).execute()
        listing_id = result.data[0]["id"]
    else:
        listing_id = existing.data["id"]
        # Carry forward previous price
        listing["previous_price"] = existing.data["current_price"]
        db.table("retailer_listings").update(listing).eq("id", listing_id).execute()

    # Record price observation (dedup handled by DB unique index)
    try:
        db.table("price_observations").insert({
            "listing_id": listing_id,
            "price": listing["current_price"],
            "shipping_cost": listing.get("shipping_cost"),
            "in_stock": listing.get("in_stock", True),
        }).execute()
    except Exception as e:
        # Duplicate observation (same price within same hour) — expected
        log.debug("Price observation dedup: %s", e)

    return listing_id, is_new


def get_enabled_connectors() -> list:
    """
    Return instantiated connector objects for enabled retailers.
    Each connector is independent — failures do not affect others.
    """
    return [
        BestBuyCAConnector(),
        CanadaComputersConnector(),
        MemoryExpressConnector(),
    ]


def run_connector(connector, db: Client) -> dict:
    """Run a single connector with error isolation."""
    retailer = connector.retailer_id
    log.info("Starting scan: %s", retailer)
    scan_id = record_scan_start(db, retailer)
    errors: list[str] = []
    found = new_count = updated = 0

    try:
        # Update last_scan_at on connector record
        db.table("retailer_connectors").update({
            "last_scan_at": datetime.now(timezone.utc).isoformat(),
        }).eq("retailer", retailer).execute()

        results: list[ConnectorResult] = connector.fetch()
        log.info("[%s] Fetched %d listings", retailer, len(results))

        for result in results:
            if result.error:
                errors.append(result.error)
                continue

            raw = result.listing
            if not raw:
                continue

            found += 1
            try:
                # Normalize and score
                normalized = normalize_listing(raw)
                score_data = score_listing(normalized)
                normalized.update(score_data)

                listing_id, is_new = upsert_listing(db, normalized)
                if is_new:
                    new_count += 1
                else:
                    updated += 1

            except Exception as e:
                log.error("[%s] Failed to process listing '%s': %s", retailer, raw.get("name", "?"), e)
                errors.append(str(e))

        # Mark connector healthy
        db.table("retailer_connectors").update({
            "consecutive_errors": 0,
            "last_success_at": datetime.now(timezone.utc).isoformat(),
        }).eq("retailer", retailer).execute()

        status = "success" if not errors else "partial"

    except Exception as e:
        log.error("[%s] Connector failed: %s", retailer, e)
        errors.append(str(e))
        status = "failed"

        # Increment error counter
        try:
            db.rpc("increment_connector_errors", {"p_retailer": retailer}).execute()
        except Exception:
            pass

    record_scan_end(db, scan_id, status, found, new_count, updated, errors)
    log.info("[%s] Done: %d found, %d new, %d updated, %d errors", retailer, found, new_count, updated, len(errors))

    return {
        "retailer": retailer,
        "status": status,
        "found": found,
        "new": new_count,
        "updated": updated,
        "errors": errors,
    }


def evaluate_alerts(db: Client, scan_results: list[dict]) -> None:
    """
    After all connectors run, check which listings qualify for notifications.
    Skips notifications if credentials are not configured.
    """
    discord_url = os.environ.get("DISCORD_WEBHOOK_URL")
    resend_key = os.environ.get("RESEND_API_KEY")

    if not discord_url and not resend_key:
        log.info("No notification credentials configured — skipping alerts")
        return

    # Fetch active notification profiles
    profiles = db.table("search_profiles").select("*").eq("is_active", True).execute()
    if not profiles.data:
        return

    for profile in profiles.data:
        notif = profile.get("notification_config", {})
        if not notif.get("discordEnabled") and not notif.get("emailEnabled"):
            continue

        min_score = notif.get("minDealScore", 75)
        max_price = notif.get("maxPrice")
        min_drop_pct = notif.get("minPriceDropPct")

        # Find qualifying listings
        query = (
            db.table("retailer_listings")
            .select("*")
            .gte("deal_score", min_score)
            .eq("in_stock", True)
        )
        if max_price:
            query = query.lte("current_price", max_price)

        candidates = query.execute()

        for listing in (candidates.data or []):
            # Check if we recently notified about this listing
            recent = (
                db.table("notification_history")
                .select("id, sent_at")
                .eq("listing_id", listing["id"])
                .order("sent_at", desc=True)
                .limit(1)
                .execute()
            )

            if recent.data:
                # Don't re-notify within 24 hours unless price dropped significantly
                from datetime import timedelta
                last_sent = datetime.fromisoformat(recent.data[0]["sent_at"])
                if datetime.now(timezone.utc) - last_sent < timedelta(hours=24):
                    continue

            # Check price drop requirement
            if min_drop_pct and listing.get("previous_price"):
                prev = listing["previous_price"]
                curr = listing["current_price"]
                if prev > 0:
                    drop_pct = ((prev - curr) / prev) * 100
                    if drop_pct < min_drop_pct:
                        continue

            reason = "Deal meets all configured criteria"
            if listing.get("previous_price") and listing["previous_price"] > listing["current_price"]:
                prev = listing["previous_price"]
                curr = listing["current_price"]
                drop = prev - curr
                pct = (drop / prev) * 100
                reason = f"Price dropped by ${drop:.0f} ({pct:.0f}%)"

            # Send Discord notification
            if notif.get("discordEnabled") and discord_url:
                try:
                    send_discord_notification(discord_url, listing, reason)
                    db.table("notification_history").insert({
                        "listing_id": listing["id"],
                        "profile_id": profile["id"],
                        "channel": "discord",
                        "reason": reason,
                        "deal_score": listing.get("deal_score"),
                        "price": listing["current_price"],
                        "delivery_status": "sent",
                    }).execute()
                except Exception as e:
                    log.error("Discord notification failed: %s", e)
                    db.table("notification_history").insert({
                        "listing_id": listing["id"],
                        "profile_id": profile["id"],
                        "channel": "discord",
                        "reason": reason,
                        "deal_score": listing.get("deal_score"),
                        "price": listing["current_price"],
                        "delivery_status": "failed",
                        "payload": {"error": str(e)},
                    }).execute()


def main() -> None:
    log.info("=== GameDeal Hunter Worker Starting ===")
    db = get_supabase()

    connectors = get_enabled_connectors()
    scan_results = []

    for connector in connectors:
        try:
            result = run_connector(connector, db)
            scan_results.append(result)
        except Exception as e:
            log.error("Unexpected error in connector %s: %s", getattr(connector, "retailer_id", "?"), e)

    # Evaluate notifications after all scans
    try:
        evaluate_alerts(db, scan_results)
    except Exception as e:
        log.error("Alert evaluation failed: %s", e)

    log.info("=== Worker Complete ===")
    for r in scan_results:
        log.info("  %-25s status=%-8s found=%-4d new=%-4d updated=%-4d errors=%d",
            r["retailer"], r["status"], r["found"], r["new"], r["updated"], len(r["errors"]))


if __name__ == "__main__":
    main()
