"""
Notification Module
====================
Sends Discord and email notifications for qualifying deals.
Never exposes webhook URLs or API keys in logs or error messages.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import requests

log = logging.getLogger(__name__)


def _sanitize_url(url: str) -> str:
    """Remove URL for logging — never log webhook URLs."""
    return "[webhook URL hidden]"


def send_discord_notification(webhook_url: str, listing: dict, reason: str) -> None:
    """
    Send a Discord embed notification for a deal.

    Args:
        webhook_url: Discord webhook URL (from env var, never logged)
        listing: The retailer listing dict
        reason: Human-readable reason this is a good deal
    """
    if not webhook_url:
        raise ValueError("Discord webhook URL is not configured")

    name = listing.get("name", "Unknown Laptop").replace("⚠️ [SAMPLE DATA] ", "")
    price = listing.get("current_price", 0)
    gpu = listing.get("gpu", "Unknown GPU")
    cpu = listing.get("cpu_model", "Unknown CPU")
    ram = listing.get("ram_gb")
    storage = listing.get("storage_gb")
    retailer = listing.get("retailer", "Unknown Retailer")
    score = listing.get("deal_score", 0)
    url = listing.get("url", "#")
    vram = listing.get("gpu_vram_gb")
    tgp = listing.get("gpu_tgp_w")
    prev_price = listing.get("previous_price")

    # Score emoji
    score_emoji = "🔥" if score >= 85 else "⭐" if score >= 70 else "✅"

    # Price drop info
    price_drop_text = ""
    if prev_price and prev_price > price:
        drop = prev_price - price
        drop_pct = (drop / prev_price) * 100
        price_drop_text = f"📉 Down from ${prev_price:,.2f} (saved ${drop:,.2f}, {drop_pct:.0f}% off)"

    # Specs summary
    specs_parts = []
    if gpu and gpu != "UNKNOWN": specs_parts.append(f"**GPU:** {gpu}{f' ({tgp}W TGP)' if tgp else ''}")
    if cpu: specs_parts.append(f"**CPU:** {cpu}")
    if ram: specs_parts.append(f"**RAM:** {ram}GB")
    if storage: specs_parts.append(f"**Storage:** {storage//1024}TB" if storage >= 1024 else f"**Storage:** {storage}GB")
    if vram: specs_parts.append(f"**VRAM:** {vram}GB")

    description_parts = [reason]
    if price_drop_text:
        description_parts.append(price_drop_text)

    payload = {
        "username": "GameDeal Hunter",
        "avatar_url": "https://cdn.discordapp.com/embed/avatars/0.png",
        "embeds": [
            {
                "title": f"{score_emoji} Gaming Laptop Deal — {score}/100",
                "description": "\n".join(description_parts),
                "color": 0x22c55e if score >= 80 else 0xfbbf24 if score >= 65 else 0x6366f1,
                "fields": [
                    {
                        "name": "💻 " + (name[:50] + "..." if len(name) > 50 else name),
                        "value": "\n".join(specs_parts) if specs_parts else "Specs not fully confirmed",
                        "inline": False,
                    },
                    {
                        "name": "💰 Price",
                        "value": f"**C${price:,.2f}** ({retailer.replace('_', ' ').title()})",
                        "inline": True,
                    },
                    {
                        "name": "📊 Deal Score",
                        "value": f"**{score}/100**",
                        "inline": True,
                    },
                ],
                "footer": {
                    "text": "GameDeal Hunter • Estimates only — verify before purchasing",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "url": url if url != "#" else None,
            }
        ],
    }

    resp = requests.post(webhook_url, json=payload, timeout=10)
    if resp.status_code not in (200, 204):
        raise RuntimeError(f"Discord webhook returned HTTP {resp.status_code}: {resp.text[:200]}")

    log.info("Discord notification sent for listing: %s (score=%d)", name[:40], score)


def send_email_notification(
    resend_api_key: str,
    to_email: str,
    from_email: str,
    listing: dict,
    reason: str,
) -> None:
    """
    Send an HTML email notification using Resend API.

    Args:
        resend_api_key: Resend API key (from env var)
        to_email: Recipient email address
        from_email: Sender email address
        listing: The retailer listing dict
        reason: Why this is a good deal
    """
    if not resend_api_key:
        raise ValueError("Resend API key is not configured")

    name = listing.get("name", "Unknown Laptop").replace("⚠️ [SAMPLE DATA] ", "")
    price = listing.get("current_price", 0)
    score = listing.get("deal_score", 0)
    url = listing.get("url", "#")

    html = f"""
    <html>
    <body style="font-family: system-ui, sans-serif; background: #0a0b0f; color: #f0f2ff; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #13151e; border: 1px solid #1e2235; border-radius: 12px; padding: 24px;">
        <h1 style="font-size: 20px; color: #22c55e; margin-bottom: 4px;">🔥 Gaming Laptop Deal</h1>
        <p style="color: #8b92b3; font-size: 13px;">Deal Score: <strong style="color: #f0f2ff;">{score}/100</strong></p>
        <hr style="border-color: #1e2235; margin: 16px 0;">
        <h2 style="font-size: 16px; color: #f0f2ff;">{name}</h2>
        <p style="font-size: 24px; font-weight: 700; color: #f0f2ff; margin: 8px 0;">C${price:,.2f}</p>
        <p style="color: #8b92b3;">{reason}</p>
        <a href="{url}" style="display: inline-block; margin-top: 16px; background: #6366f1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600;">View Deal →</a>
        <hr style="border-color: #1e2235; margin: 24px 0;">
        <p style="font-size: 11px; color: #4a5080;">FPS estimates are approximate. Always verify specifications before purchasing. Prices may change.</p>
      </div>
    </body>
    </html>
    """

    resp = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_email,
            "to": [to_email],
            "subject": f"🔥 Gaming Deal: {name[:60]} — C${price:,.2f} (Score: {score}/100)",
            "html": html,
        },
        timeout=15,
    )

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Resend API returned HTTP {resp.status_code}")

    log.info("Email notification sent to %s for listing: %s", to_email, name[:40])
