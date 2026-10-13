"""
Spec Normalizer
================
Parses raw product names and spec strings into structured fields.
Uses pattern matching — never assumes or invents values.
If a spec cannot be reliably extracted, it is left as None.
"""

from __future__ import annotations

import re
import logging
from typing import Optional

log = logging.getLogger(__name__)

# ============================================================
# GPU Detection
# ============================================================

GPU_PATTERNS = [
    # RTX 50 series
    (r"\bRTX\s*5090\b", "RTX 5090"),
    (r"\bRTX\s*5080\b", "RTX 5080"),
    (r"\bRTX\s*5070\s*Ti\b", "RTX 5070 Ti"),
    (r"\bRTX\s*5070\b", "RTX 5070"),
    (r"\bRTX\s*5060\b", "RTX 5060"),
    (r"\bRTX\s*5050\b", "RTX 5050"),
    # RTX 40 series
    (r"\bRTX\s*4090\b", "RTX 4090"),
    (r"\bRTX\s*4080\b", "RTX 4080"),
    (r"\bRTX\s*4070\b", "RTX 4070"),
    (r"\bRTX\s*4060\b", "RTX 4060"),
    (r"\bRTX\s*4050\b", "RTX 4050"),
    # AMD RX
    (r"\bRX\s*9070M\b", "RX 9070M"),
    (r"\bRX\s*7900M\b", "RX 7900M"),
    (r"\bRX\s*7700S\b", "RX 7700S"),
    (r"\bRX\s*7600M\b", "RX 7600M"),
    # Intel Arc
    (r"\bArc\s*B580M\b", "Arc B580M"),
    (r"\bArc\s*A770M\b", "Arc A770M"),
]


def parse_gpu(text: str) -> Optional[str]:
    """Extract GPU model from text. Returns None if not found."""
    for pattern, gpu_name in GPU_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return gpu_name
    return None


# ============================================================
# RAM Detection
# ============================================================

def parse_ram(text: str) -> Optional[int]:
    """Extract RAM in GB. Returns None if not found."""
    # Patterns like: 16GB RAM, 32GB DDR5, 32 GB
    patterns = [
        r"(\d+)\s*GB\s+(?:DDR[45]|LPDDR[45]|RAM)",
        r"(\d+)\s*GB\s+(?:of\s+)?(?:system\s+)?(?:memory|ram)",
        r"(?:^|[\s,/\-])(\d+)\s*GB(?=\s*(?:DDR|RAM|,|$|\s+SSD|\s+HDD|\s+storage))",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if 4 <= val <= 256 and val in (4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256):
                return val
    return None


# ============================================================
# Storage Detection
# ============================================================

def parse_storage(text: str) -> Optional[int]:
    """Extract SSD storage in GB. Returns None if not found."""
    patterns = [
        r"(\d+)\s*TB\s*(?:SSD|NVMe|M\.2|HDD|storage)?",
        r"(\d+)\s*GB\s*(?:SSD|NVMe|M\.2)",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            unit = "TB" if "TB" in m.group(0).upper() else "GB"
            gb = val * 1024 if unit == "TB" else val
            if 128 <= gb <= 32768:
                return gb
    return None


# ============================================================
# Display Detection
# ============================================================

def parse_display(text: str) -> dict:
    """Extract display resolution and refresh rate from text."""
    result = {}

    # Resolution patterns: 1920x1080, 2560x1600, 3840x2160
    res_m = re.search(r"(\d{3,4})\s*[xX×]\s*(\d{3,4})", text)
    if res_m:
        w, h = int(res_m.group(1)), int(res_m.group(2))
        if 1024 <= w <= 7680 and 600 <= h <= 4320:
            result["display_resolution"] = f"{w}x{h}"

    # Refresh rate: 144Hz, 165 Hz, 240Hz
    hz_m = re.search(r"(\d{2,3})\s*[Hh][Zz]", text)
    if hz_m:
        hz = int(hz_m.group(1))
        if 60 <= hz <= 480:
            result["display_refresh_rate_hz"] = hz

    return result


# ============================================================
# VRAM Detection
# ============================================================

def parse_vram(text: str) -> Optional[int]:
    """Extract VRAM in GB from text. Returns None if not found."""
    patterns = [
        r"(\d+)\s*GB\s*(?:GDDR[56X]+|HBM[23]?|VRAM|graphics\s+memory)",
        r"(\d+)GB\s*GPU\s*memory",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if val in (2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48, 80):
                return val
    return None


# ============================================================
# Main normalize function
# ============================================================

def normalize_listing(raw: dict) -> dict:
    """
    Takes a raw listing dict (from a connector) and normalizes all
    spec fields. Returns a copy of the dict with enriched fields.
    Never overwrites a field that was already set with a verified value.
    """
    listing = dict(raw)  # Don't mutate original
    name = listing.get("name", "")
    raw_specs = listing.get("raw_specs", {})

    # Combine all text sources for spec extraction
    spec_text = " ".join([
        name,
        raw_specs.get("description", ""),
        raw_specs.get("specs", ""),
        raw_specs.get("title", ""),
    ])

    confidence = listing.get("spec_confidence", 0)

    # GPU
    if not listing.get("gpu") or listing["gpu"] == "UNKNOWN":
        gpu = parse_gpu(spec_text)
        if gpu:
            listing["gpu"] = gpu
            confidence += 20
        else:
            listing["gpu"] = "UNKNOWN"

    # RAM
    if not listing.get("ram_gb"):
        ram = parse_ram(spec_text)
        if ram:
            listing["ram_gb"] = ram
            confidence += 10

    # Storage
    if not listing.get("storage_gb"):
        storage = parse_storage(spec_text)
        if storage:
            listing["storage_gb"] = storage
            confidence += 10

    # Display
    if not listing.get("display_resolution") or not listing.get("display_refresh_rate_hz"):
        display = parse_display(spec_text)
        if display:
            listing.update({k: v for k, v in display.items() if not listing.get(k)})
            confidence += 10

    # VRAM (from spec text if not set)
    if not listing.get("gpu_vram_gb"):
        vram = parse_vram(spec_text)
        if vram:
            listing["gpu_vram_gb"] = vram
            confidence += 5

    listing["spec_confidence"] = min(100, confidence)

    # Ensure condition is valid
    valid_conditions = {"new", "open_box", "refurbished", "used"}
    if listing.get("condition") not in valid_conditions:
        listing["condition"] = "new"

    # Ensure source is valid
    valid_sources = {"api", "scrape", "rss", "affiliate", "manual"}
    if listing.get("source") not in valid_sources:
        listing["source"] = "scrape"

    return listing
