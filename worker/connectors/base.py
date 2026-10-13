"""
Retailer Connector Base Class
==============================
All retailer connectors must inherit from BaseConnector.
Each connector is responsible for one retailer and must:
  1. Respect robots.txt and rate limits
  2. Never fabricate data
  3. Fail gracefully without crashing the worker
  4. Return ConnectorResult objects
"""

from __future__ import annotations

import time
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


log = logging.getLogger(__name__)


@dataclass
class ConnectorResult:
    """
    Result from fetching a single listing.
    Either listing is populated, or error is set.
    """
    listing: Optional[dict] = None
    error: Optional[str] = None


class BaseConnector(ABC):
    """
    Abstract base class for retailer data connectors.

    Subclasses must implement:
      - retailer_id: str
      - display_name: str
      - fetch() -> list[ConnectorResult]

    Guidelines:
      - Only access permitted data sources (public pages allowed by robots.txt,
        official APIs, affiliate feeds)
      - Never bypass CAPTCHAs or authentication
      - Respect rate limits — use self.rate_limit_sleep()
      - Each listing must have at minimum: name, url, current_price, retailer
      - Mark spec_confidence accurately
      - Never invent prices, stock status, or specifications
    """

    #: Unique identifier matching the retailer_connectors table
    retailer_id: str = ""

    #: Human-readable name
    display_name: str = ""

    #: Data source type: 'api', 'scrape', 'rss', 'affiliate', 'manual'
    data_source: str = "scrape"

    #: Seconds to wait between requests (respect rate limits)
    request_delay_seconds: float = 2.0

    #: Maximum retries per request
    max_retries: int = 3

    #: Request timeout seconds
    timeout_seconds: int = 15

    def rate_limit_sleep(self) -> None:
        """Sleep to respect the retailer's rate limits."""
        time.sleep(self.request_delay_seconds)

    @abstractmethod
    def fetch(self) -> list[ConnectorResult]:
        """
        Fetch current laptop listings from this retailer.
        Returns a list of ConnectorResult objects.
        Must handle all exceptions internally.
        """
        raise NotImplementedError

    def _build_base_listing(self) -> dict:
        """Returns a listing dict with all required fields set to safe defaults."""
        return {
            "retailer": self.retailer_id,
            "retailer_listing_id": None,
            "name": "",
            "url": "",
            "image_url": None,
            "current_price": 0.0,
            "previous_price": None,
            "reference_price": None,
            "shipping_cost": None,
            "currency": "CAD",
            "condition": "new",
            "in_stock": True,
            "seller": None,
            "is_marketplace": False,
            "source": self.data_source,
            "raw_specs": {},
            "gpu": "UNKNOWN",
            "gpu_vram_gb": None,
            "gpu_tgp_w": None,
            "cpu_model": None,
            "ram_gb": None,
            "storage_gb": None,
            "display_resolution": None,
            "display_refresh_rate_hz": None,
            "spec_confidence": 0,
            "deal_score": None,
            "score_breakdown": None,
            "score_explanations": [],
            "score_warnings": [],
            "score_is_estimated": True,
        }

    def _validate_listing(self, listing: dict) -> list[str]:
        """
        Validate a listing dict. Returns list of validation errors.
        A listing with errors should be discarded or flagged.
        """
        errors = []
        if not listing.get("name"):
            errors.append("Missing name")
        if not listing.get("url"):
            errors.append("Missing URL")
        if not listing.get("current_price") or listing["current_price"] <= 0:
            errors.append("Invalid price")
        if not listing.get("retailer_listing_id"):
            errors.append("Missing retailer_listing_id")
        return errors
