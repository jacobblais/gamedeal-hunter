"""
Memory Express Connector
=========================
Placeholder connector for Memory Express Canada.
Memory Express serves static product pages but uses JavaScript
for some features. This connector needs manual review of their
current robots.txt and page structure before activating.

Status: STUB — returns documented limitation.
"""

from __future__ import annotations

import logging
from .base import BaseConnector, ConnectorResult

log = logging.getLogger(__name__)


class MemoryExpressConnector(BaseConnector):
    retailer_id = "memory_express"
    display_name = "Memory Express"
    data_source = "scrape"

    def fetch(self) -> list[ConnectorResult]:
        log.info(
            "[memory_express] Connector is a stub. "
            "To enable: verify robots.txt, review page structure at "
            "https://www.memoryexpress.com/Category/Laptops?Filter=Gaming_Laptops, "
            "and implement the HTML parser. Returning empty result."
        )
        return [
            ConnectorResult(
                error=(
                    "Memory Express: Connector not yet implemented. "
                    "See worker/connectors/memory_express.py to implement."
                )
            )
        ]
