'use client';

import { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import type { SortOption } from '@/types';

const GPU_OPTIONS = [
  'RTX 5090', 'RTX 5080', 'RTX 5070 Ti', 'RTX 5070',
  'RTX 5060', 'RTX 5050',
  'RTX 4090', 'RTX 4080', 'RTX 4070', 'RTX 4060', 'RTX 4050',
  'RX 9070M', 'RX 7900M', 'RX 7700S', 'RX 7600M',
];

const RETAILER_OPTIONS = [
  { value: 'best_buy_ca', label: 'Best Buy' },
  { value: 'canada_computers', label: 'Canada Computers' },
  { value: 'memory_express', label: 'Memory Express' },
  { value: 'newegg_ca', label: 'Newegg' },
  { value: 'lenovo_ca', label: 'Lenovo' },
  { value: 'dell_ca', label: 'Dell' },
  { value: 'hp_ca', label: 'HP' },
  { value: 'amazon_ca', label: 'Amazon.ca' },
];

export interface FiltersState {
  gpus: string[];
  maxPrice: number | null;
  minRamGb: number | null;
  minDealScore: number | null;
  retailers: string[];
  inStockOnly: boolean;
  excludeMarketplace: boolean;
  sortBy: SortOption;
}

const DEFAULTS: FiltersState = {
  gpus: [],
  maxPrice: null,
  minRamGb: null,
  minDealScore: null,
  retailers: [],
  inStockOnly: true,
  excludeMarketplace: false,
  sortBy: 'deal_score_desc',
};

interface FilterSidebarProps {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const [open, setOpen] = useState(true);

  function toggleGpu(gpu: string) {
    onChange({
      ...filters,
      gpus: filters.gpus.includes(gpu)
        ? filters.gpus.filter(g => g !== gpu)
        : [...filters.gpus, gpu],
    });
  }

  function toggleRetailer(r: string) {
    onChange({
      ...filters,
      retailers: filters.retailers.includes(r)
        ? filters.retailers.filter(x => x !== r)
        : [...filters.retailers, r],
    });
  }

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      alignSelf: 'flex-start',
      position: 'sticky',
      top: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
          <Filter size={14} />
          Filters
        </div>
        <button
          className="btn-ghost"
          style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={() => onChange({ ...DEFAULTS })}
        >
          <RotateCcw size={10} /> Reset
        </button>
      </div>

      {/* Sort */}
      <div className="filter-group">
        <label className="filter-label">Sort by</label>
        <select
          className="input"
          value={filters.sortBy}
          onChange={e => onChange({ ...filters, sortBy: e.target.value as SortOption })}
        >
          <option value="deal_score_desc">Best Deal Score</option>
          <option value="price_asc">Lowest Price</option>
          <option value="price_desc">Highest Price</option>
          <option value="newest_first">Newest First</option>
        </select>
      </div>

      {/* Max Price */}
      <div className="filter-group">
        <label className="filter-label">Max Price (CAD)</label>
        <select
          className="input"
          value={filters.maxPrice ?? ''}
          onChange={e => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Any price</option>
          <option value="800">Under $800</option>
          <option value="1000">Under $1,000</option>
          <option value="1200">Under $1,200</option>
          <option value="1500">Under $1,500</option>
          <option value="2000">Under $2,000</option>
          <option value="2500">Under $2,500</option>
        </select>
      </div>

      {/* GPU */}
      <div className="filter-group">
        <label className="filter-label">GPU</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
          {GPU_OPTIONS.map(gpu => (
            <label key={gpu} className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.gpus.includes(gpu)}
                onChange={() => toggleGpu(gpu)}
              />
              <span>{gpu}</span>
              {filters.gpus.includes(gpu) && (
                <X size={10} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              )}
            </label>
          ))}
        </div>
        {filters.gpus.length > 0 && (
          <button
            style={{ fontSize: 11, color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            onClick={() => onChange({ ...filters, gpus: [] })}
          >
            Clear GPU filters
          </button>
        )}
      </div>

      {/* Min RAM */}
      <div className="filter-group">
        <label className="filter-label">Min RAM</label>
        <select
          className="input"
          value={filters.minRamGb ?? ''}
          onChange={e => onChange({ ...filters, minRamGb: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Any</option>
          <option value="8">8GB+</option>
          <option value="16">16GB+</option>
          <option value="32">32GB+</option>
          <option value="64">64GB+</option>
        </select>
      </div>

      {/* Min Deal Score */}
      <div className="filter-group">
        <label className="filter-label">Min Deal Score</label>
        <select
          className="input"
          value={filters.minDealScore ?? ''}
          onChange={e => onChange({ ...filters, minDealScore: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Any</option>
          <option value="50">50+ (Fair)</option>
          <option value="60">60+ (Good)</option>
          <option value="70">70+ (Great)</option>
          <option value="80">80+ (Excellent)</option>
          <option value="90">90+ (Exceptional)</option>
        </select>
      </div>

      {/* Retailer */}
      <div className="filter-group">
        <label className="filter-label">Retailer</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {RETAILER_OPTIONS.map(({ value, label }) => (
            <label key={value} className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.retailers.includes(value)}
                onChange={() => toggleRetailer(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="filter-group">
        <label className="filter-label">Options</label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={e => onChange({ ...filters, inStockOnly: e.target.checked })}
          />
          In stock only
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.excludeMarketplace}
            onChange={e => onChange({ ...filters, excludeMarketplace: e.target.checked })}
          />
          Exclude marketplace
        </label>
      </div>
    </aside>
  );
}
