/**
 * GameDeal Hunter — Deal Scoring Engine
 *
 * Transparent, configurable deal scoring algorithm.
 * Each laptop receives a score 0–100 based on weighted factors.
 * All weights are configurable per search profile.
 */

import type { RetailerListing, PriceHistory, DealScore, ScoringWeights, GameRequirement } from '@/types';
import { DEFAULT_SCORING_WEIGHTS } from '@/types';

// ============================================================
// GPU PERFORMANCE TIER (normalized 0–100)
// Based on estimated laptop gaming performance at ~1080p High
// ============================================================

const GPU_PERFORMANCE_TIER: Record<string, number> = {
  'RTX 5090':    100,
  'RTX 5080':     93,
  'RTX 5070 Ti':  85,
  'RTX 5070':     78,
  'RTX 4090':     90,
  'RTX 4080':     82,
  'RTX 5060':     68,
  'RTX 4070':     72,
  'RTX 4060':     58,
  'RTX 5050':     52,
  'RTX 4050':     45,
  'RX 9070M':     70,
  'RX 7900M':     75,
  'RX 7700S':     55,
  'RX 7600M':     48,
  'Arc B580M':    50,
  'Arc A770M':    45,
  'OTHER':        35,
  'UNKNOWN':      20,
};

function tgpMultiplier(gpu: string, tgpW: number | null): number {
  if (tgpW === null) return 0.92;
  const expected: Record<string, number> = {
    'RTX 5090': 175, 'RTX 5080': 175, 'RTX 5070 Ti': 150,
    'RTX 5070': 115, 'RTX 4090': 175, 'RTX 4080': 150,
    'RTX 5060': 95,  'RTX 4070': 125, 'RTX 4060': 80,
    'RTX 5050': 75,  'RTX 4050': 70,
  };
  const base = expected[gpu] ?? 100;
  const ratio = tgpW / base;
  if (ratio >= 1.0) return 1.0;
  if (ratio >= 0.9) return 0.97;
  if (ratio >= 0.8) return 0.93;
  if (ratio >= 0.7) return 0.87;
  if (ratio >= 0.6) return 0.78;
  return 0.65;
}

function vramScore(vramGb: number | null): number {
  if (vramGb === null) return 30;
  if (vramGb >= 24) return 100;
  if (vramGb >= 16) return 90;
  if (vramGb >= 12) return 80;
  if (vramGb >= 8)  return 70;
  if (vramGb >= 6)  return 50;
  return 30;
}

function ramStorageScore(ramGb: number | null, storageGb: number | null): number {
  const ramS = ramGb === null ? 40 :
    ramGb >= 64 ? 100 : ramGb >= 32 ? 90 : ramGb >= 16 ? 75 : ramGb >= 8 ? 50 : 25;
  const storS = storageGb === null ? 40 :
    storageGb >= 2048 ? 100 : storageGb >= 1024 ? 90 : storageGb >= 512 ? 70 : 40;
  return (ramS + storS) / 2;
}

function displayScore(refreshHz: number | null, resolution: string | null): number {
  let score = 50;
  if (refreshHz !== null) {
    if (refreshHz >= 300) score += 30;
    else if (refreshHz >= 240) score += 25;
    else if (refreshHz >= 165) score += 20;
    else if (refreshHz >= 144) score += 15;
    else if (refreshHz >= 120) score += 10;
  }
  if (resolution) {
    const [w] = resolution.split('x').map(Number);
    if (w >= 3840) score += 20;
    else if (w >= 2560) score += 15;
    else if (w >= 1920) score += 10;
  }
  return Math.min(100, score);
}

function priceValueScore(perfTier: number, priceCAD: number, shippingCAD: number | null): number {
  const totalPrice = priceCAD + (shippingCAD ?? 0);
  const idealPrice = perfTier * 20;
  const ratio = idealPrice / totalPrice;
  if (ratio >= 1.5) return 100;
  if (ratio >= 1.2) return 90;
  if (ratio >= 1.0) return 80;
  if (ratio >= 0.8) return 65;
  if (ratio >= 0.6) return 50;
  if (ratio >= 0.4) return 35;
  return 20;
}

function priceHistoryScore(history: PriceHistory | null, currentPrice: number): number {
  if (!history || history.daysTracked < 3) return 50;
  const vsLowest = currentPrice / history.lowest;
  const vsAverage = currentPrice / history.average;
  if (vsLowest <= 1.0 && vsAverage <= 0.95) return 100;
  if (vsLowest <= 1.02) return 90;
  if (vsLowest <= 1.05) return 80;
  if (vsAverage <= 1.0) return 70;
  if (vsAverage <= 1.05) return 60;
  return 40;
}

function conditionBonus(condition: string): number {
  switch (condition) {
    case 'new': return 100;
    case 'open_box': return 80;
    case 'refurbished': return 60;
    case 'used': return 40;
    default: return 70;
  }
}

function sellerReliabilityScore(retailer: string, isMarketplace: boolean, specConfidence: number): number {
  const directRetailers = new Set([
    'best_buy_ca', 'canada_computers', 'memory_express',
    'newegg_ca', 'lenovo_ca', 'dell_ca', 'hp_ca', 'asus_ca'
  ]);
  let base = directRetailers.has(retailer) ? 90 : 70;
  if (isMarketplace) base -= 20;
  const confBonus = Math.floor(specConfidence / 10);
  return Math.min(100, Math.max(0, base + confBonus));
}

// ============================================================
// MAIN SCORING FUNCTION
// ============================================================

export function scoreDeal(
  listing: RetailerListing,
  history: PriceHistory | null,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  _gameRequirements: GameRequirement[] = [],
): DealScore {
  const explanations: string[] = [];
  const warnings: string[] = [];

  const gpu = listing.gpu ?? 'UNKNOWN';
  const gpuBase = GPU_PERFORMANCE_TIER[gpu] ?? 20;
  const tgpMult = tgpMultiplier(gpu, listing.gpu_tgp_w);
  const adjustedGpuPerf = gpuBase * tgpMult;

  const subScores = {
    gamingPerformance: adjustedGpuPerf,
    priceValue: priceValueScore(adjustedGpuPerf, listing.current_price, listing.shipping_cost),
    priceHistory: priceHistoryScore(history, listing.current_price),
    vram: vramScore(listing.gpu_vram_gb),
    ramStorage: ramStorageScore(listing.ram_gb, listing.storage_gb),
    displayQuality: displayScore(listing.display_refresh_rate_hz, listing.display_resolution),
    sellerReliability: sellerReliabilityScore(listing.retailer, listing.is_marketplace, listing.spec_confidence),
    conditionBonus: conditionBonus(listing.condition),
    shippingPenalty: listing.shipping_cost && listing.shipping_cost > 0
      ? Math.max(0, 100 - listing.shipping_cost * 2)
      : 100,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const normWeights = Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, v / totalWeight])
  ) as unknown as ScoringWeights;

  const total = Math.round(
    subScores.gamingPerformance * normWeights.gamingPerformance +
    subScores.priceValue * normWeights.priceValue +
    subScores.priceHistory * normWeights.priceHistory +
    subScores.vram * normWeights.vram +
    subScores.ramStorage * normWeights.ramStorage +
    subScores.displayQuality * normWeights.displayQuality +
    subScores.sellerReliability * normWeights.sellerReliability +
    subScores.conditionBonus * normWeights.conditionBonus +
    subScores.shippingPenalty * normWeights.shippingPenalty
  );

  // --- Explanations ---
  if (adjustedGpuPerf >= 80) explanations.push('Excellent gaming performance tier');
  else if (adjustedGpuPerf >= 65) explanations.push('Strong gaming performance for the price');
  else if (adjustedGpuPerf >= 50) explanations.push('Solid mid-range gaming performance');
  else explanations.push('Entry-level gaming performance');

  if (subScores.priceValue >= 85) explanations.push('Outstanding value for the performance level');
  else if (subScores.priceValue >= 70) explanations.push('Good price-to-performance ratio');
  else if (subScores.priceValue <= 40) warnings.push('Price is high relative to performance tier');

  if (history && history.daysTracked >= 3) {
    if (listing.current_price <= history.lowest * 1.01) {
      explanations.push('At or near lowest observed price since tracking began');
    } else if (listing.current_price <= history.average * 0.95) {
      explanations.push('Below average observed price');
    } else if (listing.current_price > history.average * 1.1) {
      warnings.push('Price is above average observed price');
    }
  } else {
    warnings.push('Insufficient price history (fewer than 3 days tracked)');
  }

  if ((listing.gpu_vram_gb ?? 0) >= 12) explanations.push(`${listing.gpu_vram_gb}GB VRAM — excellent for demanding games`);
  else if ((listing.gpu_vram_gb ?? 0) < 8) warnings.push('Less than 8GB VRAM may limit demanding games at high settings');
  if (listing.spec_confidence < 60) warnings.push('Specification confidence is low — specs may be incomplete');
  if (listing.is_marketplace) warnings.push('Third-party marketplace listing — verify seller reputation');
  if (listing.condition !== 'new') warnings.push(`Condition: ${listing.condition} — not brand new`);
  if (tgpMult < 0.85) warnings.push(`Low GPU power limit (${listing.gpu_tgp_w}W) — performance below full ${gpu} potential`);
  if (listing.score_warnings?.some(w => w.includes('SAMPLE'))) {
    warnings.push('⚠️ DEVELOPMENT SAMPLE DATA — not a real listing');
  }

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      gamingPerformance: Math.round(subScores.gamingPerformance),
      priceValue: Math.round(subScores.priceValue),
      priceHistory: Math.round(subScores.priceHistory),
      vram: Math.round(subScores.vram),
      ramStorage: Math.round(subScores.ramStorage),
      displayQuality: Math.round(subScores.displayQuality),
      sellerReliability: Math.round(subScores.sellerReliability),
      conditionBonus: Math.round(subScores.conditionBonus),
      shippingPenalty: Math.round(subScores.shippingPenalty),
    },
    explanations,
    warnings,
    isEstimated: true,
  };
}

export function getGpuPerfTier(gpu: string): number {
  return GPU_PERFORMANCE_TIER[gpu] ?? 20;
}

export function getGpuTierLabel(tier: number): string {
  if (tier >= 90) return 'Flagship';
  if (tier >= 78) return 'High-End';
  if (tier >= 65) return 'Upper Mid-Range';
  if (tier >= 50) return 'Mid-Range';
  if (tier >= 38) return 'Entry Gaming';
  return 'Budget';
}
