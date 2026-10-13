'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, TrendingDown, Zap, Clock, BarChart3, ShoppingBag } from 'lucide-react';
import { DealCard } from '@/components/deals/DealCard';
import { FilterSidebar, type FiltersState } from '@/components/deals/FilterSidebar';
import { formatCAD } from '@/lib/utils';
import { scoreDeal } from '@/lib/scoring';
import type { RetailerListing, PriceHistory } from '@/types';

// ============================================================
// DEMO DATA — shown when Supabase is not configured
// All values are illustrative examples, not real offers.
// ============================================================
const DEMO_LISTINGS: RetailerListing[] = [
  {
    id: 'demo-1', product_id: null, retailer: 'best_buy_ca', retailer_listing_id: 'BB-demo-1',
    name: '⚠️ [SAMPLE] ASUS ROG Strix G16 — RTX 5070, Ryzen 9, 32GB, 1TB',
    url: '#', image_url: null,
    current_price: 1899.99, previous_price: 2099.99, reference_price: 2199.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 5070', gpu_vram_gb: 8, gpu_tgp_w: 115,
    cpu_model: 'Ryzen 9 8945HX', ram_gb: 32, storage_gb: 1024,
    display_resolution: '2560x1600', display_refresh_rate_hz: 165,
    spec_confidence: 90, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: ['⚠️ SAMPLE DATA — not a real listing'],
    score_is_estimated: true, last_checked: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2', product_id: null, retailer: 'canada_computers', retailer_listing_id: 'CC-demo-2',
    name: '⚠️ [SAMPLE] Lenovo Legion 5i Pro — RTX 5070 Ti, Core Ultra 7, 32GB, 1TB',
    url: '#', image_url: null,
    current_price: 2249.99, previous_price: 2499.99, reference_price: 2599.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 5070 Ti', gpu_vram_gb: 12, gpu_tgp_w: 150,
    cpu_model: 'Core Ultra 7 265HX', ram_gb: 32, storage_gb: 1024,
    display_resolution: '2560x1600', display_refresh_rate_hz: 240,
    spec_confidence: 88, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: ['⚠️ SAMPLE DATA — not a real listing'],
    score_is_estimated: true, last_checked: new Date(Date.now() - 1800000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3', product_id: null, retailer: 'memory_express', retailer_listing_id: 'ME-demo-3',
    name: '⚠️ [SAMPLE] Dell G16 Gaming — RTX 4070, Core i7, 16GB, 512GB',
    url: '#', image_url: null,
    current_price: 1499.99, previous_price: 1799.99, reference_price: 1899.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 4070', gpu_vram_gb: 8, gpu_tgp_w: 125,
    cpu_model: 'Core i7-13650HX', ram_gb: 16, storage_gb: 512,
    display_resolution: '2560x1600', display_refresh_rate_hz: 165,
    spec_confidence: 85, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: ['⚠️ SAMPLE DATA — not a real listing'],
    score_is_estimated: true, last_checked: new Date(Date.now() - 3600000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-4', product_id: null, retailer: 'newegg_ca', retailer_listing_id: 'NE-demo-4',
    name: '⚠️ [SAMPLE] Acer Nitro V16 — RTX 4060, Ryzen 7, 16GB, 1TB',
    url: '#', image_url: null,
    current_price: 999.99, previous_price: 1199.99, reference_price: 1249.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 4060', gpu_vram_gb: 8, gpu_tgp_w: 80,
    cpu_model: 'Ryzen 7 7745HX', ram_gb: 16, storage_gb: 1024,
    display_resolution: '1920x1080', display_refresh_rate_hz: 144,
    spec_confidence: 82, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: ['⚠️ SAMPLE DATA — not a real listing'],
    score_is_estimated: true, last_checked: new Date(Date.now() - 7200000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-5', product_id: null, retailer: 'best_buy_ca', retailer_listing_id: 'BB-demo-5',
    name: '⚠️ [SAMPLE] MSI Titan GT18 — RTX 5080, Core i9, 64GB, 2TB',
    url: '#', image_url: null,
    current_price: 3099.99, previous_price: 3299.99, reference_price: 3499.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 5080', gpu_vram_gb: 16, gpu_tgp_w: 175,
    cpu_model: 'Core i9-14900HX', ram_gb: 64, storage_gb: 2048,
    display_resolution: '2560x1600', display_refresh_rate_hz: 240,
    spec_confidence: 80, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: ['⚠️ SAMPLE DATA — not a real listing'],
    score_is_estimated: true, last_checked: new Date(Date.now() - 900000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-6', product_id: null, retailer: 'canada_computers', retailer_listing_id: 'CC-demo-6',
    name: '⚠️ [SAMPLE] HP OMEN 16 — RTX 5060, Ryzen 9, 16GB, 512GB',
    url: '#', image_url: null,
    current_price: 1349.99, previous_price: 1549.99, reference_price: 1599.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 5060', gpu_vram_gb: 8, gpu_tgp_w: 95,
    cpu_model: 'Ryzen 9 8945HX', ram_gb: 16, storage_gb: 512,
    display_resolution: '1920x1080', display_refresh_rate_hz: 165,
    spec_confidence: 75, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: ['⚠️ SAMPLE DATA — not a real listing'],
    score_is_estimated: true, last_checked: new Date(Date.now() - 2700000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

const DEMO_HISTORIES: Record<string, PriceHistory> = {
  'demo-1': { current: 1899.99, previous: 2099.99, lowest: 1849.99, highest: 2299.99, average: 2050.00, observations: [], daysTracked: 45, lastObservedAt: new Date().toISOString() },
  'demo-2': { current: 2249.99, previous: 2499.99, lowest: 2199.99, highest: 2699.99, average: 2399.00, observations: [], daysTracked: 30, lastObservedAt: new Date().toISOString() },
  'demo-3': { current: 1499.99, previous: 1799.99, lowest: 1499.99, highest: 1999.99, average: 1699.00, observations: [], daysTracked: 60, lastObservedAt: new Date().toISOString() },
  'demo-4': { current: 999.99, previous: 1199.99, lowest: 949.99, highest: 1299.99, average: 1099.00, observations: [], daysTracked: 90, lastObservedAt: new Date().toISOString() },
  'demo-5': { current: 3099.99, previous: 3299.99, lowest: 2999.99, highest: 3499.99, average: 3200.00, observations: [], daysTracked: 15, lastObservedAt: new Date().toISOString() },
  'demo-6': { current: 1349.99, previous: 1549.99, lowest: 1299.99, highest: 1649.99, average: 1450.00, observations: [], daysTracked: 22, lastObservedAt: new Date().toISOString() },
};

const DEFAULT_FILTERS: FiltersState = {
  gpus: [], maxPrice: null, minRamGb: null, minDealScore: null,
  retailers: [], inStockOnly: true, excludeMarketplace: false, sortBy: 'deal_score_desc',
};

// Budget quick-filter tabs
const BUDGET_TABS = [
  { label: 'All', value: null },
  { label: 'Under $1k', value: 1000 },
  { label: 'Under $1.5k', value: 1500 },
  { label: 'Under $2k', value: 2000 },
];

export default function DashboardPage() {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [budgetTab, setBudgetTab] = useState<number | null>(null);

  // Score all demo listings
  const scoredListings = useMemo(() =>
    DEMO_LISTINGS.map(l => ({
      listing: l,
      history: DEMO_HISTORIES[l.id] ?? null,
      score: scoreDeal(l, DEMO_HISTORIES[l.id] ?? null),
    })),
  []);

  // Apply filters
  const filtered = useMemo(() => {
    let result = scoredListings;

    if (filters.gpus.length > 0) {
      result = result.filter(r => r.listing.gpu && filters.gpus.includes(r.listing.gpu));
    }
    const maxP = budgetTab ?? filters.maxPrice;
    if (maxP != null) {
      result = result.filter(r => r.listing.current_price <= maxP);
    }
    if (filters.minRamGb != null) {
      result = result.filter(r => (r.listing.ram_gb ?? 0) >= filters.minRamGb!);
    }
    if (filters.minDealScore != null) {
      result = result.filter(r => r.score.total >= filters.minDealScore!);
    }
    if (filters.retailers.length > 0) {
      result = result.filter(r => filters.retailers.includes(r.listing.retailer));
    }
    if (filters.inStockOnly) {
      result = result.filter(r => r.listing.in_stock);
    }
    if (filters.excludeMarketplace) {
      result = result.filter(r => !r.listing.is_marketplace);
    }

    // Sort
    switch (filters.sortBy) {
      case 'deal_score_desc':
        result = [...result].sort((a, b) => b.score.total - a.score.total);
        break;
      case 'price_asc':
        result = [...result].sort((a, b) => a.listing.current_price - b.listing.current_price);
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => b.listing.current_price - a.listing.current_price);
        break;
      default:
        result = [...result].sort((a, b) => b.score.total - a.score.total);
    }

    return result;
  }, [scoredListings, filters, budgetTab]);

  // Stats
  const stats = useMemo(() => {
    const all = scoredListings;
    const lowestPrice = Math.min(...all.map(r => r.listing.current_price));
    const lowestListing = all.find(r => r.listing.current_price === lowestPrice);
    const bestScore = Math.max(...all.map(r => r.score.total));
    const bestListing = all.find(r => r.score.total === bestScore);
    const totalDropped = all.filter(r => r.listing.previous_price && r.listing.previous_price > r.listing.current_price);
    return { lowestListing, bestListing, dropsCount: totalDropped.length, totalListings: all.length };
  }, [scoredListings]);

  function toggleCompare(listing: RetailerListing) {
    setCompareIds(prev =>
      prev.includes(listing.id)
        ? prev.filter(id => id !== listing.id)
        : prev.length < 4 ? [...prev, listing.id] : prev
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Sample data banner */}
      <div className="sample-data-banner" style={{ marginBottom: 20 }}>
        <AlertTriangle size={14} />
        <strong>Development Mode:</strong> Showing sample data.{' '}
        Configure your Supabase credentials in <code>.env.local</code> to see real listings.{' '}
        See the{' '}
        <a href="/settings" style={{ color: 'inherit', textDecoration: 'underline' }}>Settings page</a>{' '}
        to connect.
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          {
            label: 'Active Listings',
            value: stats.totalListings,
            sub: '↑ 3 new today',
            icon: <ShoppingBag size={18} color="var(--accent-light)" />,
            color: 'var(--accent)',
          },
          {
            label: 'Lowest Price',
            value: formatCAD(Math.min(...DEMO_LISTINGS.map(l => l.current_price))),
            sub: stats.lowestListing?.listing.gpu ?? '',
            icon: <TrendingDown size={18} color="var(--green)" />,
            color: 'var(--green)',
          },
          {
            label: 'Best Deal Score',
            value: `${stats.bestListing?.score.total ?? 0}/100`,
            sub: stats.bestListing?.listing.gpu ?? '',
            icon: <Zap size={18} color="#fbbf24" />,
            color: '#fbbf24',
          },
          {
            label: 'Last Updated',
            value: '5 min ago',
            sub: 'Sample data',
            icon: <Clock size={18} color="var(--text-muted)" />,
            color: 'var(--text-muted)',
          },
        ].map(({ label, value, sub, icon, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: `${color}15`,
              border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget quick tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Quick Filter:</span>
        <div className="tab-list">
          {BUDGET_TABS.map(({ label, value }) => (
            <button
              key={label}
              className={`tab ${budgetTab === value ? 'active' : ''}`}
              onClick={() => setBudgetTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} listings shown
        </span>
      </div>

      {/* Compare bar */}
      {compareIds.length > 0 && (
        <div style={{
          background: 'var(--accent-glow)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 10, padding: '10px 16px',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <BarChart3 size={16} color="var(--accent-light)" />
          <span style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 600 }}>
            {compareIds.length} laptop{compareIds.length > 1 ? 's' : ''} selected for comparison
          </span>
          <a href={`/compare?ids=${compareIds.join(',')}`} className="btn-primary" style={{ textDecoration: 'none', fontSize: 12, padding: '6px 14px' }}>
            Compare Now
          </a>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setCompareIds([])}>
            Clear
          </button>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Filter sidebar */}
        <FilterSidebar filters={filters} onChange={setFilters} />

        {/* Listings grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No listings match these filters</div>
              <div style={{ fontSize: 13 }}>Try relaxing your GPU, price, or score requirements.</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}>
              {filtered.map(({ listing, history, score }) => (
                <DealCard
                  key={listing.id}
                  listing={listing}
                  history={history}
                  score={score}
                  onCompare={toggleCompare}
                  isInComparison={compareIds.includes(listing.id)}
                  featuredGames={['crimson_desert', 'black_myth_wukong', 'spider_man_2']}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
