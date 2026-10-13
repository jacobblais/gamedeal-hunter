"""
Canada Computers Connector
===========================
Fetches gaming laptop listings from Canada Computers.

Data access:
  - canadacomputers.com serves static HTML product listing pages.
  - robots.txt check (as of implementation): No blanket Disallow for
    product search/listing pages. Crawl-delay is not explicitly set.
  - We use a 3-second delay between requests to be respectful.
  - User-Agent identifies us as a bot.
  - We do NOT store or reproduce full page content, only extract
    price, availability, and product specification data.

If Canada Computers changes their robots.txt or sends a request
to stop crawling, this connector must be disabled immediately.
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from .base import BaseConnector, ConnectorResult
from normalizer import parse_gpu, parse_ram, parse_storage, parse_display

log = logging.getLogger(__name__)

BASE_URL = "https://www.canadacomputers.com"
SEARCH_URL = "https://www.canadacomputers.com/products/gaming/laptops"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; GameDealHunterBot/1.0; +https://github.com/gamedeal-hunter)",
    "Accept-Language": "en-CA,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class CanadaComputersConnector(BaseConnector):
    retailer_id = "canada_computers"
    display_name = "Canada Computers"
    data_source = "scrape"
    request_delay_seconds = 3.0

    def fetch(self) -> list[ConnectorResult]:
        """
        Fetch gaming laptop listings from Canada Computers.
        Returns list of ConnectorResult objects.
        """
        results: list[ConnectorResult] = []

        try:
            soup = self._fetch_page(SEARCH_URL)
            if not soup:
                return [ConnectorResult(error="Failed to fetch Canada Computers listing page")]

            # Find product cards — Canada Computers uses <div class="productTemplate">
            # or similar. The exact selector may change with site updates.
            product_cards = soup.select(".productTemplate, [data-sku], .product-item")

            if not product_cards:
                log.warning(
                    "[canada_computers] No product cards found — page structure may have changed. "
                    "Manual inspection required. Returning empty result."
                )
                return [
                    ConnectorResult(
                        error=(
                            "Canada Computers: No product cards found at expected CSS selectors. "
                            "The page structure may have changed. Manual review of "
                            "worker/connectors/canada_computers.py required."
                        )
                    )
                ]

            log.info("[canada_computers] Found %d product cards", len(product_cards))

            for card in product_cards[:50]:  # Limit to first 50 per run
                result = self._parse_card(card)
                if result:
                    results.append(result)
                self.rate_limit_sleep()

        except Exception as e:
            log.error("[canada_computers] Unexpected error: %s", e)
            results.append(ConnectorResult(error=str(e)))

        return results

    def _fetch_page(self, url: str) -> BeautifulSoup | None:
        """Fetch a page with retries and rate limiting."""
        for attempt in range(self.max_retries):
            try:
                resp = requests.get(
                    url,
                    headers=HEADERS,
                    timeout=self.timeout_seconds,
                )
                if resp.status_code == 200:
                    return BeautifulSoup(resp.text, "html.parser")
                if resp.status_code in (429, 403):
                    log.warning("[canada_computers] Rate limited or blocked (HTTP %d)", resp.status_code)
                    return None
                log.warning("[canada_computers] HTTP %d on attempt %d", resp.status_code, attempt + 1)
            except requests.RequestException as e:
                log.error("[canada_computers] Request failed (attempt %d): %s", attempt + 1, e)

            if attempt < self.max_retries - 1:
                time.sleep(self.request_delay_seconds * (2 ** attempt))

        return None

    def _parse_card(self, card) -> ConnectorResult | None:
        """
        Extract listing data from a product card element.
        Returns None if the card doesn't look like a gaming laptop,
        or if required fields are missing.
        """
        try:
            listing = self._build_base_listing()

            # Name
            name_el = card.select_one(".productTemplate_title, .product-title, h2 a, h3 a")
            if not name_el:
                return None
            name = name_el.get_text(strip=True)
            if not name:
                return None

            # Only include gaming laptops
            lower_name = name.lower()
            gaming_keywords = ["gaming", "rtx", "radeon rx", "legion", "rog", "nitro", "tuf", "omen", "g16", "g15"]
            if not any(kw in lower_name for kw in gaming_keywords):
                return None

            listing["name"] = name

            # URL
            link_el = name_el if name_el.name == "a" else card.select_one("a[href*='/product_info']")
            if link_el and link_el.get("href"):
                listing["url"] = urljoin(BASE_URL, link_el["href"])
            else:
                return None

            # Retailer listing ID from URL
            url_match = re.search(r"/product_info/(\d+)", listing["url"])
            listing["retailer_listing_id"] = url_match.group(1) if url_match else hashlib.md5(listing["url"].encode()).hexdigest()[:16]

            # Price — look for CAD price patterns
            price_el = card.select_one(".price, .productTemplate_price, [class*='price']")
            if price_el:
                price_text = price_el.get_text(strip=True)
                price_match = re.search(r"\$?([\d,]+\.?\d*)", price_text.replace(",", ""))
                if price_match:
                    listing["current_price"] = float(price_match.group(1).replace(",", ""))

            if listing["current_price"] <= 0:
                return None

            # Image
            img_el = card.select_one("img")
            if img_el:
                listing["image_url"] = img_el.get("src") or img_el.get("data-src")

            # Stock
            out_of_stock_el = card.select_one(".outofstock, .out-of-stock, [class*='outofstock']")
            listing["in_stock"] = out_of_stock_el is None

            # Extract specs from name
            listing.update(self._extract_specs_from_name(name))

            # Validate
            errors = self._validate_listing(listing)
            if errors:
                log.debug("[canada_computers] Listing validation failed: %s — %s", name, errors)
                return None

            return ConnectorResult(listing=listing)

        except Exception as e:
            log.error("[canada_computers] Failed to parse card: %s", e)
            return ConnectorResult(error=str(e))

    def _extract_specs_from_name(self, name: str) -> dict:
        """
        Extract GPU, RAM, storage from product name as a best-effort.
        Confidence is low since we're parsing unstructured text.
        """
        specs: dict = {"spec_confidence": 40, "raw_specs": {"name": name}}

        gpu = parse_gpu(name)
        if gpu:
            specs["gpu"] = gpu
            specs["spec_confidence"] += 20

        ram = parse_ram(name)
        if ram:
            specs["ram_gb"] = ram
            specs["spec_confidence"] += 10

        storage = parse_storage(name)
        if storage:
            specs["storage_gb"] = storage
            specs["spec_confidence"] += 10

        display = parse_display(name)
        if display:
            specs.update(display)
            specs["spec_confidence"] += 10

        return specs
