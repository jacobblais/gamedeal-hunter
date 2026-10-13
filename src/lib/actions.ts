'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { RetailerListing, PriceHistory, PriceObservation, SortOption } from '@/types';

// ============================================================
// LISTINGS — fetch with filters
// ============================================================

export interface ListingsFilter {
  gpus?: string[];
  minPrice?: number;
  maxPrice?: number;
  minDealScore?: number;
  retailers?: string[];
  conditions?: string[];
  minRamGb?: number;
  minStorageGb?: number;
  minDisplayRefreshRate?: number;
  inStockOnly?: boolean;
  excludeMarketplace?: boolean;
  sortBy?: SortOption;
  limit?: number;
  offset?: number;
}

export async function getListings(filter: ListingsFilter = {}): Promise<RetailerListing[]> {
  const db = createServerClient();

  let query = db
    .from('retailer_listings')
    .select('*');

  if (filter.gpus && filter.gpus.length > 0) {
    query = query.in('gpu', filter.gpus);
  }
  if (filter.minPrice != null) {
    query = query.gte('current_price', filter.minPrice);
  }
  if (filter.maxPrice != null) {
    query = query.lte('current_price', filter.maxPrice);
  }
  if (filter.minDealScore != null) {
    query = query.gte('deal_score', filter.minDealScore);
  }
  if (filter.retailers && filter.retailers.length > 0) {
    query = query.in('retailer', filter.retailers);
  }
  if (filter.conditions && filter.conditions.length > 0) {
    query = query.in('condition', filter.conditions);
  }
  if (filter.minRamGb != null) {
    query = query.gte('ram_gb', filter.minRamGb);
  }
  if (filter.minStorageGb != null) {
    query = query.gte('storage_gb', filter.minStorageGb);
  }
  if (filter.minDisplayRefreshRate != null) {
    query = query.gte('display_refresh_rate_hz', filter.minDisplayRefreshRate);
  }
  if (filter.inStockOnly) {
    query = query.eq('in_stock', true);
  }
  if (filter.excludeMarketplace) {
    query = query.eq('is_marketplace', false);
  }

  // Sorting
  switch (filter.sortBy ?? 'deal_score_desc') {
    case 'deal_score_desc':
      query = query.order('deal_score', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('current_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('current_price', { ascending: false });
      break;
    case 'newest_first':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('deal_score', { ascending: false });
  }

  query = query.limit(filter.limit ?? 50).range(filter.offset ?? 0, (filter.offset ?? 0) + (filter.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) {
    console.error('[getListings]', error.message);
    return [];
  }
  return (data ?? []) as RetailerListing[];
}

// ============================================================
// PRICE HISTORY for a listing
// ============================================================

export async function getPriceHistory(listingId: string): Promise<PriceHistory | null> {
  const db = createServerClient();

  const { data, error } = await db
    .from('price_observations')
    .select('*')
    .eq('listing_id', listingId)
    .order('observed_at', { ascending: true });

  if (error || !data || data.length === 0) return null;

  const observations = data as PriceObservation[];
  const prices = observations.map(o => o.price);
  const first = observations[0];
  const last = observations[observations.length - 1];

  const daysTracked = Math.ceil(
    (new Date(last.observed_at).getTime() - new Date(first.observed_at).getTime()) / 86400000
  );

  return {
    current: last.price,
    previous: observations.length > 1 ? observations[observations.length - 2].price : null,
    lowest: Math.min(...prices),
    highest: Math.max(...prices),
    average: prices.reduce((a, b) => a + b, 0) / prices.length,
    observations,
    daysTracked,
    lastObservedAt: last.observed_at,
  };
}

// ============================================================
// SCAN STATUS
// ============================================================

export async function getScanStatus() {
  const db = createServerClient();

  const { data: connectors } = await db
    .from('retailer_connectors')
    .select('*')
    .order('display_name', { ascending: true });

  const { data: recentScans } = await db
    .from('scan_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  return { connectors: connectors ?? [], recentScans: recentScans ?? [] };
}

// ============================================================
// SEARCH PROFILES
// ============================================================

export async function getSearchProfiles() {
  const db = createServerClient();
  const { data, error } = await db
    .from('search_profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getDefaultProfile() {
  const db = createServerClient();
  const { data } = await db
    .from('search_profiles')
    .select('*')
    .eq('is_default', true)
    .single();
  return data;
}

// ============================================================
// STATS for dashboard
// ============================================================

export async function getDashboardStats() {
  const db = createServerClient();

  const [countResult, lowestResult, bestValueResult, lastScanResult] = await Promise.allSettled([
    db.from('retailer_listings').select('id', { count: 'exact' }).eq('in_stock', true),
    db.from('retailer_listings').select('current_price, gpu, name').eq('in_stock', true).order('current_price', { ascending: true }).limit(1).single(),
    db.from('retailer_listings').select('gpu, deal_score, current_price, name').eq('in_stock', true).not('deal_score', 'is', null).order('deal_score', { ascending: false }).limit(1).single(),
    db.from('scan_runs').select('completed_at, status').order('started_at', { ascending: false }).limit(1).single(),
  ]);

  return {
    activeListings: countResult.status === 'fulfilled' ? countResult.value.count ?? 0 : 0,
    lowestPrice: lowestResult.status === 'fulfilled' ? lowestResult.value.data : null,
    bestValue: bestValueResult.status === 'fulfilled' ? bestValueResult.value.data : null,
    lastScan: lastScanResult.status === 'fulfilled' ? lastScanResult.value.data : null,
  };
}
