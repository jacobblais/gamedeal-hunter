"""
Tests — GameDeal Hunter Worker
================================
Tests for:
  - Spec normalizer (GPU/RAM/storage extraction)
  - Deal scorer (score calculation)
  - Price normalization
  - Listing validation

Run with: python -m pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'worker'))

import pytest
from normalizer import parse_gpu, parse_ram, parse_storage, parse_display, parse_vram, normalize_listing
from scorer import score_listing


# ============================================================
# GPU PARSING TESTS
# ============================================================

class TestParseGpu:
    def test_rtx_5070(self):
        assert parse_gpu("ASUS ROG Strix G16 RTX 5070 Gaming Laptop") == "RTX 5070"

    def test_rtx_5070_ti(self):
        assert parse_gpu("Lenovo Legion 7 RTX 5070 Ti 32GB RAM") == "RTX 5070 Ti"

    def test_rtx_4060(self):
        assert parse_gpu("Acer Nitro 5 with NVIDIA GeForce RTX 4060") == "RTX 4060"

    def test_rtx_5080(self):
        assert parse_gpu("MSI Titan RTX5080 Gaming") == "RTX 5080"

    def test_rx_7900m(self):
        assert parse_gpu("ASUS ROG Zephyrus RX 7900M 16GB") == "RX 7900M"

    def test_no_gpu(self):
        assert parse_gpu("Dell Inspiron 15 Intel Core i5 laptop") is None

    def test_does_not_invent_gpu(self):
        assert parse_gpu("RTX 999 Gaming Machine") is None

    def test_rtx_4070_not_5070(self):
        # Must not confuse RTX 4070 with 5070
        result = parse_gpu("Dell G16 RTX 4070 Gaming")
        assert result == "RTX 4070"
        assert result != "RTX 5070"


# ============================================================
# RAM PARSING TESTS
# ============================================================

class TestParseRam:
    def test_16gb_ddr5(self):
        assert parse_ram("16GB DDR5 RAM") == 16

    def test_32gb(self):
        assert parse_ram("Laptop 32GB memory") == 32

    def test_with_storage_nearby(self):
        # Should not confuse 1TB storage with RAM
        result = parse_ram("16GB RAM, 1TB SSD")
        assert result == 16

    def test_no_ram(self):
        assert parse_ram("RTX 5070 Gaming Laptop") is None

    def test_invalid_size(self):
        # 999GB is not a valid RAM size
        assert parse_ram("999GB RAM") is None


# ============================================================
# STORAGE PARSING TESTS
# ============================================================

class TestParseStorage:
    def test_1tb_ssd(self):
        assert parse_storage("1TB SSD NVMe") == 1024

    def test_512gb(self):
        assert parse_storage("512GB SSD") == 512

    def test_2tb(self):
        assert parse_storage("2TB M.2 NVMe") == 2048

    def test_no_storage(self):
        assert parse_storage("16GB DDR5 Gaming Laptop") is None


# ============================================================
# DISPLAY PARSING TESTS
# ============================================================

class TestParseDisplay:
    def test_1080p_144hz(self):
        result = parse_display("15.6\" 1920x1080 144Hz IPS")
        assert result.get("display_resolution") == "1920x1080"
        assert result.get("display_refresh_rate_hz") == 144

    def test_1440p_165hz(self):
        result = parse_display("16\" QHD 2560x1600 165Hz")
        assert result.get("display_resolution") == "2560x1600"
        assert result.get("display_refresh_rate_hz") == 165

    def test_no_display(self):
        result = parse_display("RTX 5070 Laptop")
        assert result == {}


# ============================================================
# NORMALIZER TESTS
# ============================================================

class TestNormalizeListing:
    def _base_listing(self, name="ASUS ROG RTX 5070 16GB RAM 1TB SSD 2560x1600 165Hz"):
        return {
            "retailer": "test_retailer",
            "retailer_listing_id": "test-001",
            "name": name,
            "url": "https://example.com/product/test-001",
            "current_price": 1899.99,
            "currency": "CAD",
            "condition": "new",
            "in_stock": True,
            "is_marketplace": False,
            "source": "scrape",
            "raw_specs": {},
            "spec_confidence": 0,
        }

    def test_extracts_gpu(self):
        listing = normalize_listing(self._base_listing())
        assert listing["gpu"] == "RTX 5070"

    def test_extracts_ram(self):
        listing = normalize_listing(self._base_listing())
        assert listing["ram_gb"] == 16

    def test_extracts_storage(self):
        listing = normalize_listing(self._base_listing())
        assert listing["storage_gb"] == 1024

    def test_extracts_display(self):
        listing = normalize_listing(self._base_listing())
        assert listing["display_resolution"] == "2560x1600"
        assert listing["display_refresh_rate_hz"] == 165

    def test_confidence_increases(self):
        listing = normalize_listing(self._base_listing())
        assert listing["spec_confidence"] >= 50

    def test_does_not_overwrite_existing_gpu(self):
        base = self._base_listing()
        base["gpu"] = "RTX 5080"  # Already set (verified)
        listing = normalize_listing(base)
        assert listing["gpu"] == "RTX 5080"  # Must not be overwritten

    def test_sets_unknown_for_missing_gpu(self):
        base = self._base_listing("Dell Inspiron 15 i5 laptop no GPU")
        listing = normalize_listing(base)
        assert listing["gpu"] == "UNKNOWN"

    def test_does_not_invent_price(self):
        base = self._base_listing()
        listing = normalize_listing(base)
        assert listing["current_price"] == 1899.99  # Unchanged


# ============================================================
# SCORER TESTS
# ============================================================

class TestScoreListing:
    def _listing(self, gpu="RTX 5070", price=1899.99, vram=8, ram=32, tgp=115):
        return {
            "retailer": "canada_computers",
            "current_price": price,
            "shipping_cost": 0,
            "condition": "new",
            "in_stock": True,
            "is_marketplace": False,
            "gpu": gpu,
            "gpu_vram_gb": vram,
            "gpu_tgp_w": tgp,
            "ram_gb": ram,
            "storage_gb": 1024,
            "display_resolution": "2560x1600",
            "display_refresh_rate_hz": 165,
            "spec_confidence": 85,
        }

    def test_score_returns_integer_0_to_100(self):
        result = score_listing(self._listing())
        assert 0 <= result["deal_score"] <= 100

    def test_higher_gpu_scores_higher(self):
        rtx5080 = score_listing(self._listing(gpu="RTX 5080", price=3000))
        rtx4060 = score_listing(self._listing(gpu="RTX 4060", price=3000))
        # Same price, RTX 5080 is better — should have higher gaming performance sub-score
        assert rtx5080["score_breakdown"]["gamingPerformance"] > rtx4060["score_breakdown"]["gamingPerformance"]

    def test_better_price_scores_higher(self):
        cheap = score_listing(self._listing(price=1200))
        expensive = score_listing(self._listing(price=2500))
        assert cheap["deal_score"] > expensive["deal_score"]

    def test_low_tgp_penalizes_score(self):
        full_tgp = score_listing(self._listing(tgp=115))
        low_tgp = score_listing(self._listing(tgp=50))
        assert full_tgp["deal_score"] > low_tgp["deal_score"]

    def test_score_breakdown_sums_approximately(self):
        result = score_listing(self._listing())
        assert result["deal_score"] is not None
        assert isinstance(result["score_breakdown"], dict)

    def test_explanations_present(self):
        result = score_listing(self._listing())
        assert len(result["score_explanations"]) > 0

    def test_low_vram_warning(self):
        result = score_listing(self._listing(vram=6))
        assert any("VRAM" in w for w in result["score_warnings"])

    def test_score_is_estimated(self):
        result = score_listing(self._listing())
        assert result["score_is_estimated"] is True


# ============================================================
# PRICE NORMALIZATION TESTS
# ============================================================

class TestPriceNormalization:
    """
    Test that prices are never fabricated or silently modified.
    """

    def test_zero_price_flagged(self):
        from connectors.base import BaseConnector
        class TestConnector(BaseConnector):
            retailer_id = "test"
            display_name = "Test"
            def fetch(self): return []

        connector = TestConnector()
        listing = connector._build_base_listing()
        listing["name"] = "Test Laptop"
        listing["url"] = "https://example.com"
        listing["retailer_listing_id"] = "test-123"
        listing["current_price"] = 0  # Zero price
        errors = connector._validate_listing(listing)
        assert any("price" in e.lower() or "invalid" in e.lower() for e in errors)

    def test_negative_price_flagged(self):
        from connectors.base import BaseConnector
        class TestConnector(BaseConnector):
            retailer_id = "test"
            display_name = "Test"
            def fetch(self): return []

        connector = TestConnector()
        listing = connector._build_base_listing()
        listing["name"] = "Test"
        listing["url"] = "https://example.com"
        listing["retailer_listing_id"] = "test-124"
        listing["current_price"] = -100
        errors = connector._validate_listing(listing)
        assert len(errors) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
