"""
Best Buy Canada Connector
==========================
Fetches gaming laptop listings from Best Buy Canada.

Data access approach:
  - Best Buy Canada's public product search pages are accessible
    per their robots.txt (Disallow: /search/ is NOT present for
    general product search as of investigation date).
  - We fetch the public search results page for gaming laptops.
  - We DO NOT bypass login, CAPTCHAs, or any access controls.
  - Rate limits: minimum 2 seconds between requests.
  - If Best Buy changes their terms or technical restrictions,
    this connector must be disabled.

IMPORTANT: If you have access to Best Buy's affiliate program
(Performance Network / CJ Affiliate), update this connector to
use the product feed API instead — it is more reliable, permitted,
and provides structured data.

Limitation note:
  Best Buy Canada uses a React-rendered storefront (JavaScript-heavy).
  Static requests may return incomplete data. This connector attempts
  static fetch first and falls back to returning an empty result rather
  than using Playwright (which would need explicit permission review).
  If Playwright is needed, verify it is permitted per ToS before enabling.
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
from typing import Optional
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

from .base import BaseConnector, ConnectorResult

log = logging.getLogger(__name__)

SEARCH_URL = (
    "https://www.bestbuy.ca/en-ca/brand/all/laptops"
    "?type=Gaming"
    "&currentRegion=ON"
    "&sortBy=priceDescending"
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; GameDealHunterBot/1.0; +https://github.com)",
    "Accept-Language": "en-CA,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class BestBuyCAConnector(BaseConnector):
    retailer_id = "best_buy_ca"
    display_name = "Best Buy Canada"
    data_source = "scrape"
    request_delay_seconds = 3.0

    def fetch(self) -> list[ConnectorResult]:
        """
        Attempt to fetch gaming laptop listings from Best Buy Canada.

        CURRENT STATUS: Best Buy Canada's product listing pages rely heavily
        on client-side JavaScript rendering. Static HTML requests return a
        skeleton page without product data. This connector returns an empty
        result set with a documented limitation until either:
          (a) An affiliate/API feed is configured, or
          (b) A permitted JavaScript-capable fetch method is approved.

        This is intentional — we do not fabricate data.
        """
        log.warning(
            "[best_buy_ca] Best Buy Canada requires JavaScript rendering for "
            "product listings. Static fetch returns no data. "
            "To enable: (1) Enroll in Best Buy CA affiliate program and use "
            "the product feed API, or (2) verify Playwright usage is permitted "
            "per ToS and configure PLAYWRIGHT_ENABLED=true. "
            "Returning empty result set."
        )

        return [
            ConnectorResult(
                error=(
                    "Best Buy CA: Product listings require JavaScript rendering. "
                    "Configure affiliate API feed to enable this connector. "
                    "See worker/connectors/best_buy_ca.py for details."
                )
            )
        ]

    def _try_static_fetch(self, url: str) -> Optional[BeautifulSoup]:
        """
        Attempt a static page fetch. Returns None if unsuccessful.
        This respects rate limits and does not retry on 429/403.
        """
        for attempt in range(self.max_retries):
            try:
                resp = requests.get(
                    url,
                    headers=HEADERS,
                    timeout=self.timeout_seconds,
                    allow_redirects=True,
                )
                if resp.status_code == 200:
                    return BeautifulSoup(resp.text, "html.parser")
                elif resp.status_code in (429, 403):
                    log.warning("[best_buy_ca] Rate limited or blocked (HTTP %d)", resp.status_code)
                    return None
                log.warning("[best_buy_ca] HTTP %d on attempt %d", resp.status_code, attempt + 1)
            except requests.RequestException as e:
                log.error("[best_buy_ca] Request failed: %s", e)

            if attempt < self.max_retries - 1:
                time.sleep(self.request_delay_seconds * (attempt + 1))

        return None
