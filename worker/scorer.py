"""
Deal Scorer — Python Worker
============================
Mirrors the TypeScript scoring logic for use in the background worker.
When the worker updates listings in Supabase, it stores the computed score
so the frontend can display it without recalculating on every page load.
"""

from __future__ import annotations

import math


GPU_PERFORMANCE_TIER = {
    "RTX 5090": 100, "RTX 5080": 93, "RTX 5070 Ti": 85,
    "RTX 5070": 78,  "RTX 4090": 90, "RTX 4080": 82,
    "RTX 5060": 68,  "RTX 4070": 72, "RTX 4060": 58,
    "RTX 5050": 52,  "RTX 4050": 45,
    "RX 9070M": 70,  "RX 7900M": 75, "RX 7700S": 55, "RX 7600M": 48,
    "Arc B580M": 50, "Arc A770M": 45,
    "OTHER": 35, "UNKNOWN": 20,
}

EXPECTED_TGP = {
    "RTX 5090": 175, "RTX 5080": 175, "RTX 5070 Ti": 150,
    "RTX 5070": 115, "RTX 4090": 175, "RTX 4080": 150,
    "RTX 5060": 95,  "RTX 4070": 125, "RTX 4060": 80,
    "RTX 5050": 75,  "RTX 4050": 70,
}

DEFAULT_WEIGHTS = {
    "gamingPerformance": 30,
    "priceValue": 25,
    "priceHistory": 15,
    "vram": 10,
    "ramStorage": 8,
    "displayQuality": 5,
    "sellerReliability": 4,
    "conditionBonus": 2,
    "shippingPenalty": 1,
}

DIRECT_RETAILERS = {
    "best_buy_ca", "canada_computers", "memory_express",
    "newegg_ca", "lenovo_ca", "dell_ca", "hp_ca", "asus_ca",
}


def _tgp_mult(gpu: str, tgp_w: int | None) -> float:
    if tgp_w is None:
        return 0.92
    base = EXPECTED_TGP.get(gpu, 100)
    ratio = tgp_w / base
    if ratio >= 1.0: return 1.0
    if ratio >= 0.9: return 0.97
    if ratio >= 0.8: return 0.93
    if ratio >= 0.7: return 0.87
    if ratio >= 0.6: return 0.78
    return 0.65


def _vram_score(vram_gb: int | None) -> float:
    if vram_gb is None: return 30
    if vram_gb >= 24: return 100
    if vram_gb >= 16: return 90
    if vram_gb >= 12: return 80
    if vram_gb >= 8: return 70
    if vram_gb >= 6: return 50
    return 30


def _ram_storage_score(ram: int | None, storage: int | None) -> float:
    ram_s = 40 if ram is None else (100 if ram >= 64 else 90 if ram >= 32 else 75 if ram >= 16 else 50 if ram >= 8 else 25)
    stor_s = 40 if storage is None else (100 if storage >= 2048 else 90 if storage >= 1024 else 70 if storage >= 512 else 40)
    return (ram_s + stor_s) / 2


def _display_score(hz: int | None, resolution: str | None) -> float:
    score = 50.0
    if hz:
        score += 30 if hz >= 300 else 25 if hz >= 240 else 20 if hz >= 165 else 15 if hz >= 144 else 10 if hz >= 120 else 0
    if resolution:
        try:
            w = int(resolution.split("x")[0])
            score += 20 if w >= 3840 else 15 if w >= 2560 else 10 if w >= 1920 else 0
        except (ValueError, IndexError):
            pass
    return min(100, score)


def _price_value_score(perf: float, price: float, shipping: float | None) -> float:
    total = price + (shipping or 0)
    ideal = perf * 20
    ratio = ideal / total if total > 0 else 0
    if ratio >= 1.5: return 100
    if ratio >= 1.2: return 90
    if ratio >= 1.0: return 80
    if ratio >= 0.8: return 65
    if ratio >= 0.6: return 50
    if ratio >= 0.4: return 35
    return 20


def score_listing(listing: dict, weights: dict | None = None) -> dict:
    """
    Compute deal score for a listing dict.
    Returns a dict of score fields to merge into the listing.
    """
    w = weights or DEFAULT_WEIGHTS
    total_w = sum(w.values())
    nw = {k: v / total_w for k, v in w.items()}

    gpu = listing.get("gpu") or "UNKNOWN"
    gpu_base = GPU_PERFORMANCE_TIER.get(gpu, 20)
    tgp_mult = _tgp_mult(gpu, listing.get("gpu_tgp_w"))
    perf = gpu_base * tgp_mult

    sub = {
        "gamingPerformance": perf,
        "priceValue": _price_value_score(perf, listing.get("current_price", 0), listing.get("shipping_cost")),
        "priceHistory": 50,  # Worker doesn't have history context; default
        "vram": _vram_score(listing.get("gpu_vram_gb")),
        "ramStorage": _ram_storage_score(listing.get("ram_gb"), listing.get("storage_gb")),
        "displayQuality": _display_score(listing.get("display_refresh_rate_hz"), listing.get("display_resolution")),
        "sellerReliability": (80 if listing.get("retailer") in DIRECT_RETAILERS else 60) + (listing.get("spec_confidence", 0) // 10),
        "conditionBonus": {"new": 100, "open_box": 80, "refurbished": 60, "used": 40}.get(listing.get("condition", "new"), 70),
        "shippingPenalty": max(0, 100 - (listing.get("shipping_cost") or 0) * 2),
    }

    total = min(100, max(0, round(
        sub["gamingPerformance"] * nw["gamingPerformance"] +
        sub["priceValue"] * nw["priceValue"] +
        sub["priceHistory"] * nw["priceHistory"] +
        sub["vram"] * nw["vram"] +
        sub["ramStorage"] * nw["ramStorage"] +
        sub["displayQuality"] * nw["displayQuality"] +
        sub["sellerReliability"] * nw["sellerReliability"] +
        sub["conditionBonus"] * nw["conditionBonus"] +
        sub["shippingPenalty"] * nw["shippingPenalty"]
    )))

    explanations = []
    warnings = []
    if perf >= 80: explanations.append("Excellent gaming performance tier")
    elif perf >= 65: explanations.append("Strong gaming performance for the price")
    else: explanations.append("Mid-range gaming performance")
    if sub["priceValue"] >= 80: explanations.append("Good value for performance level")
    if (listing.get("gpu_vram_gb") or 0) < 8: warnings.append("Less than 8GB VRAM may limit demanding games")
    if listing.get("spec_confidence", 0) < 60: warnings.append("Low spec confidence — specs may be incomplete")

    return {
        "deal_score": total,
        "score_breakdown": {k: round(v) for k, v in sub.items()},
        "score_explanations": explanations,
        "score_warnings": warnings,
        "score_is_estimated": True,
    }
