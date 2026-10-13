'use client';

import { useState } from 'react';
import {
  SlidersHorizontal, Plus, Trash2, Copy, Save, Eye, AlertTriangle,
  ChevronDown, ChevronUp, RefreshCw, CheckCircle2
} from 'lucide-react';
import type { SearchProfile, FilterRule, ScoringWeights, GameRequirement } from '@/types';
import { DEFAULT_FILTER_RULE, DEFAULT_SCORING_WEIGHTS } from '@/types';
import { GAMES } from '@/lib/benchmarks';
import { formatCAD } from '@/lib/utils';

// ============================================================
// Demo default profile (loaded before Supabase is connected)
// ============================================================
const DEMO_PROFILE: SearchProfile = {
  id: 'demo-profile-1',
  name: 'Best Under C$2,000',
  description: 'My main search: best gaming laptop for demanding AAA games under C$2,000.',
  isActive: true,
  isDefault: true,
  filters: DEFAULT_FILTER_RULE,
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
  gameRequirements: [
    { gameId: 'crimson_desert', resolution: '1920x1080', quality: 'high', targetFps: 60, rayTracing: false, upscaling: true, requireMeasured: false, priority: 'required' },
    { gameId: 'black_myth_wukong', resolution: '1920x1080', quality: 'high', targetFps: 60, rayTracing: false, upscaling: true, requireMeasured: false, priority: 'required' },
    { gameId: 'spider_man_2', resolution: '1920x1080', quality: 'high', targetFps: 60, rayTracing: false, upscaling: true, requireMeasured: false, priority: 'preferred' },
  ],
  notificationConfig: {
    discordEnabled: false,
    emailEnabled: false,
    emailAddress: null,
    minDealScore: 75,
    maxPrice: 2000,
    notifyOnNewListings: false,
    notifyOnPriceDrop: true,
    minPriceDropPct: 5,
  },
  checkIntervalMinutes: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_PROFILES: SearchProfile[] = [
  DEMO_PROFILE,
  {
    ...DEMO_PROFILE, id: 'demo-profile-2', name: 'RTX 5070+ Deals', isDefault: false,
    description: 'High-end RTX 5070 and above — best performance for my AAA titles.',
    filters: { ...DEFAULT_FILTER_RULE, gpus: ['RTX 5070', 'RTX 5070 Ti', 'RTX 5080', 'RTX 5090'], maxPrice: null },
  },
  {
    ...DEMO_PROFILE, id: 'demo-profile-3', name: 'Budget Under $1,000', isDefault: false,
    description: 'Best possible gaming laptop under $1,000 CAD.',
    filters: { ...DEFAULT_FILTER_RULE, maxPrice: 1000, gpus: [], minDealScore: 55 },
  },
];

const GPU_OPTIONS = [
  'RTX 5090', 'RTX 5080', 'RTX 5070 Ti', 'RTX 5070', 'RTX 5060', 'RTX 5050',
  'RTX 4090', 'RTX 4080', 'RTX 4070', 'RTX 4060', 'RTX 4050',
  'RX 9070M', 'RX 7900M', 'RX 7700S', 'RX 7600M',
];

const WEIGHT_KEYS: { key: keyof ScoringWeights; label: string; desc: string }[] = [
  { key: 'gamingPerformance', label: 'Gaming Performance', desc: 'GPU tier and TGP-adjusted performance' },
  { key: 'priceValue', label: 'Price / Value', desc: 'Price relative to performance tier' },
  { key: 'priceHistory', label: 'Price History', desc: 'How current price compares to historical data' },
  { key: 'vram', label: 'VRAM', desc: 'GPU memory capacity' },
  { key: 'ramStorage', label: 'RAM & Storage', desc: 'System memory and SSD capacity' },
  { key: 'displayQuality', label: 'Display Quality', desc: 'Resolution, refresh rate, panel type' },
  { key: 'sellerReliability', label: 'Seller Reliability', desc: 'Retailer reputation and spec confidence' },
  { key: 'conditionBonus', label: 'Condition', desc: 'New vs open-box vs refurbished' },
  { key: 'shippingPenalty', label: 'Shipping Cost', desc: 'Free shipping preferred over high shipping cost' },
];

const TOTAL_WEIGHT_100 = 100;

export default function SearchConfigPage() {
  const [profiles, setProfiles] = useState<SearchProfile[]>(DEMO_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState(DEMO_PROFILES[0].id);
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('hardware');

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? profiles[0];

  function updateProfile(updates: Partial<SearchProfile>) {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  }

  function updateFilters(updates: Partial<FilterRule>) {
    updateProfile({ filters: { ...activeProfile.filters, ...updates } });
  }

  function updateWeights(key: keyof ScoringWeights, value: number) {
    updateProfile({ scoringWeights: { ...activeProfile.scoringWeights, [key]: value } });
  }

  function addProfile() {
    const newProfile: SearchProfile = {
      ...DEMO_PROFILE,
      id: `profile-${Date.now()}`,
      name: 'New Search Profile',
      isDefault: false,
      isActive: true,
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  }

  function duplicateProfile() {
    const newProfile: SearchProfile = {
      ...activeProfile,
      id: `profile-${Date.now()}`,
      name: `${activeProfile.name} (copy)`,
      isDefault: false,
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  }

  function deleteProfile() {
    if (profiles.length <= 1) return;
    setProfiles(prev => prev.filter(p => p.id !== activeProfileId));
    setActiveProfileId(profiles.find(p => p.id !== activeProfileId)?.id ?? profiles[0].id);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const totalWeight = Object.values(activeProfile.scoringWeights).reduce((a, b) => a + b, 0);

  function toggleGpu(gpu: string) {
    const current = activeProfile.filters.gpus;
    const g = gpu as import('@/types').GPU;
    updateFilters({ gpus: current.includes(g) ? current.filter(x => x !== g) : [...current, g] });
  }

  const toggleSection = (s: string) => setExpandedSection(prev => prev === s ? '' : s);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <SlidersHorizontal size={22} color="var(--accent-light)" />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Search Configuration</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Create and manage saved search profiles. Each profile has its own filters, scoring weights, game requirements, and notification rules.
          </p>
        </div>
      </div>

      <div className="sample-data-banner" style={{ marginBottom: 20 }}>
        <AlertTriangle size={14} />
        Profiles are stored in UI state. Connect Supabase to persist and use them in background scans.
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Profile list */}
        <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Saved Profiles
          </div>
          {profiles.map(p => (
            <div
              key={p.id}
              onClick={() => setActiveProfileId(p.id)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: p.id === activeProfileId ? 'var(--accent-glow)' : 'var(--bg-card)',
                border: `1px solid ${p.id === activeProfileId ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: p.id === activeProfileId ? 'var(--accent-light)' : 'var(--text-primary)' }}>
                  {p.name}
                </span>
                {p.isDefault && <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700 }}>DEFAULT</span>}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {p.isActive ? '✓ Active' : '○ Inactive'}
              </span>
            </div>
          ))}
          <button className="btn-ghost" onClick={addProfile} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={12} />
            New Profile
          </button>
        </aside>

        {/* Profile editor */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Profile header */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input
                  className="input"
                  value={activeProfile.name}
                  onChange={e => updateProfile({ name: e.target.value })}
                  style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}
                />
                <input
                  className="input"
                  value={activeProfile.description ?? ''}
                  onChange={e => updateProfile({ description: e.target.value })}
                  placeholder="Profile description…"
                  style={{ fontSize: 12, color: 'var(--text-muted)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked={activeProfile.isActive}
                    onChange={e => updateProfile({ isActive: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Active
                </label>
                <button className="btn-ghost" onClick={duplicateProfile} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Copy size={11} /> Duplicate
                </button>
                {profiles.length > 1 && (
                  <button className="btn-ghost" onClick={deleteProfile} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red)' }}>
                    <Trash2 size={11} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* A. Hardware Filters */}
          <CollapsibleSection
            id="hardware"
            title="A. Hardware Filters"
            expanded={expandedSection === 'hardware'}
            onToggle={() => toggleSection('hardware')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* GPU */}
              <div className="filter-group">
                <label className="filter-label">GPU Selection</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {GPU_OPTIONS.map(gpu => (
                    <label key={gpu} className="checkbox-label" style={{ fontSize: 12 }}>
                      <input type="checkbox"
                        checked={activeProfile.filters.gpus.includes(gpu as import('@/types').GPU)}
                        onChange={() => toggleGpu(gpu)}
                      />
                      {gpu}
                    </label>
                  ))}
                </div>
                {activeProfile.filters.gpus.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent-light)', marginTop: 4 }}>
                    {activeProfile.filters.gpus.length} GPU(s) selected
                  </div>
                )}
                <button style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  onClick={() => updateFilters({ gpus: [] })}>
                  Clear GPU filters (show all)
                </button>
              </div>

              {/* Other hardware */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="filter-group">
                  <label className="filter-label">Min VRAM (GB)</label>
                  <select className="input" value={activeProfile.filters.minVramGb ?? ''}
                    onChange={e => updateFilters({ minVramGb: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Any</option>
                    <option value="6">6GB+</option>
                    <option value="8">8GB+</option>
                    <option value="12">12GB+</option>
                    <option value="16">16GB+</option>
                    <option value="24">24GB+</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Min RAM (GB)</label>
                  <select className="input" value={activeProfile.filters.minRamGb ?? ''}
                    onChange={e => updateFilters({ minRamGb: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Any</option>
                    <option value="8">8GB+</option>
                    <option value="16">16GB+</option>
                    <option value="32">32GB+</option>
                    <option value="64">64GB+</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Min Storage (GB)</label>
                  <select className="input" value={activeProfile.filters.minStorageGb ?? ''}
                    onChange={e => updateFilters({ minStorageGb: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Any</option>
                    <option value="256">256GB+</option>
                    <option value="512">512GB+</option>
                    <option value="1024">1TB+</option>
                    <option value="2048">2TB+</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Min Display Refresh Rate</label>
                  <select className="input" value={activeProfile.filters.minDisplayRefreshRate ?? ''}
                    onChange={e => updateFilters({ minDisplayRefreshRate: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Any</option>
                    <option value="60">60Hz+</option>
                    <option value="120">120Hz+</option>
                    <option value="144">144Hz+</option>
                    <option value="165">165Hz+</option>
                    <option value="240">240Hz+</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Condition</label>
                  {(['new', 'open_box', 'refurbished', 'used'] as const).map(c => (
                    <label key={c} className="checkbox-label" style={{ fontSize: 12 }}>
                      <input type="checkbox"
                        checked={activeProfile.filters.conditions.includes(c)}
                        onChange={() => {
                          const conds = activeProfile.filters.conditions;
                          updateFilters({ conditions: conds.includes(c) ? conds.filter(x => x !== c) : [...conds, c] });
                        }}
                      />
                      {c.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* B. Price & Retailer */}
          <CollapsibleSection
            id="price"
            title="B. Price & Retailer Filters"
            expanded={expandedSection === 'price'}
            onToggle={() => toggleSection('price')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="filter-group">
                  <label className="filter-label">Min Price (CAD)</label>
                  <input type="number" className="input" min={0} max={10000} step={50}
                    value={activeProfile.filters.minPrice ?? ''}
                    onChange={e => updateFilters({ minPrice: e.target.value ? Number(e.target.value) : null })}
                    placeholder="No minimum"
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Max Price (CAD)</label>
                  <input type="number" className="input" min={0} max={10000} step={50}
                    value={activeProfile.filters.maxPrice ?? ''}
                    onChange={e => updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : null })}
                    placeholder="No maximum"
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Min Deal Score</label>
                  <input type="number" className="input" min={0} max={100} step={5}
                    value={activeProfile.filters.minDealScore ?? ''}
                    onChange={e => updateFilters({ minDealScore: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Any"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="filter-group">
                  <label className="filter-label">Options</label>
                  <label className="checkbox-label" style={{ fontSize: 12 }}>
                    <input type="checkbox" checked={activeProfile.filters.inStockOnly}
                      onChange={e => updateFilters({ inStockOnly: e.target.checked })} />
                    In-stock only
                  </label>
                  <label className="checkbox-label" style={{ fontSize: 12 }}>
                    <input type="checkbox" checked={activeProfile.filters.excludeMarketplace}
                      onChange={e => updateFilters({ excludeMarketplace: e.target.checked })} />
                    Exclude marketplace sellers
                  </label>
                  <label className="checkbox-label" style={{ fontSize: 12 }}>
                    <input type="checkbox" checked={activeProfile.filters.allowUnknownSpecs}
                      onChange={e => updateFilters({ allowUnknownSpecs: e.target.checked })} />
                    Allow unknown specs
                  </label>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Filter Logic</label>
                  <select className="input" value={activeProfile.filters.logic}
                    onChange={e => updateFilters({ logic: e.target.value as 'AND' | 'OR' })}>
                    <option value="AND">AND — all conditions must match</option>
                    <option value="OR">OR — any condition can match</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Filter summary */}
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'inherit' }}>Active rule: </span>
              {[
                activeProfile.filters.gpus.length > 0 && `GPU IN (${activeProfile.filters.gpus.join(', ')})`,
                activeProfile.filters.maxPrice && `price ≤ ${formatCAD(activeProfile.filters.maxPrice)}`,
                activeProfile.filters.minRamGb && `RAM ≥ ${activeProfile.filters.minRamGb}GB`,
                activeProfile.filters.minDealScore && `score ≥ ${activeProfile.filters.minDealScore}`,
                activeProfile.filters.inStockOnly && 'in_stock = true',
                activeProfile.filters.conditions.length > 0 && `condition IN (${activeProfile.filters.conditions.join(', ')})`,
              ].filter(Boolean).join(` ${activeProfile.filters.logic} `) || 'No filters applied (show all)'}
            </div>
          </CollapsibleSection>

          {/* C. Game Requirements */}
          <CollapsibleSection
            id="games"
            title="C. Game-Specific Performance Requirements"
            expanded={expandedSection === 'games'}
            onToggle={() => toggleSection('games')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.values(GAMES).map(game => {
                const req = activeProfile.gameRequirements.find(r => r.gameId === game.id);
                const isSelected = !!req;

                return (
                  <div key={game.id} className="card" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSelected ? 12 : 0 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{game.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {game.demandLevel.replace('_', ' ')} · {game.dlssSupport ? 'DLSS' : ''} {game.fsrSupport ? 'FSR' : ''} {game.rayTracingSupport ? '· RT' : ''}
                        </div>
                      </div>
                      <label className="checkbox-label" style={{ fontSize: 12 }}>
                        <input type="checkbox" checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              updateProfile({ gameRequirements: [...activeProfile.gameRequirements, {
                                gameId: game.id, resolution: '1920x1080', quality: 'high',
                                targetFps: 60, rayTracing: false, upscaling: true,
                                requireMeasured: false, priority: 'required',
                              }]});
                            } else {
                              updateProfile({ gameRequirements: activeProfile.gameRequirements.filter(r => r.gameId !== game.id) });
                            }
                          }}
                        />
                        Track this game
                      </label>
                    </div>

                    {isSelected && req && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                        <div className="filter-group">
                          <label className="filter-label" style={{ fontSize: 10 }}>Resolution</label>
                          <select className="input" style={{ fontSize: 11 }} value={req.resolution}
                            onChange={e => updateProfile({ gameRequirements: activeProfile.gameRequirements.map(r => r.gameId === game.id ? { ...r, resolution: e.target.value } : r) })}>
                            <option value="1920x1080">1080p</option>
                            <option value="2560x1440">1440p</option>
                            <option value="3840x2160">4K</option>
                          </select>
                        </div>
                        <div className="filter-group">
                          <label className="filter-label" style={{ fontSize: 10 }}>Quality</label>
                          <select className="input" style={{ fontSize: 11 }} value={req.quality}
                            onChange={e => updateProfile({ gameRequirements: activeProfile.gameRequirements.map(r => r.gameId === game.id ? { ...r, quality: e.target.value as typeof req.quality } : r) })}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="ultra">Ultra</option>
                          </select>
                        </div>
                        <div className="filter-group">
                          <label className="filter-label" style={{ fontSize: 10 }}>Target FPS</label>
                          <select className="input" style={{ fontSize: 11 }} value={req.targetFps}
                            onChange={e => updateProfile({ gameRequirements: activeProfile.gameRequirements.map(r => r.gameId === game.id ? { ...r, targetFps: Number(e.target.value) } : r) })}>
                            <option value="30">30 fps</option>
                            <option value="45">45 fps</option>
                            <option value="60">60 fps</option>
                            <option value="90">90 fps</option>
                            <option value="120">120 fps</option>
                          </select>
                        </div>
                        <div className="filter-group">
                          <label className="filter-label" style={{ fontSize: 10 }}>Priority</label>
                          <select className="input" style={{ fontSize: 11 }} value={req.priority}
                            onChange={e => updateProfile({ gameRequirements: activeProfile.gameRequirements.map(r => r.gameId === game.id ? { ...r, priority: e.target.value as typeof req.priority } : r) })}>
                            <option value="required">Required</option>
                            <option value="preferred">Preferred</option>
                            <option value="nice_to_have">Nice to have</option>
                          </select>
                        </div>
                        <label className="checkbox-label" style={{ fontSize: 11, alignSelf: 'flex-end', paddingBottom: 4 }}>
                          <input type="checkbox" checked={req.upscaling}
                            onChange={e => updateProfile({ gameRequirements: activeProfile.gameRequirements.map(r => r.gameId === game.id ? { ...r, upscaling: e.target.checked } : r) })}
                          />
                          Allow DLSS/FSR
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* D. Scoring Weights */}
          <CollapsibleSection
            id="scoring"
            title="D. Deal Scoring Weights"
            expanded={expandedSection === 'scoring'}
            onToggle={() => toggleSection('scoring')}
          >
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: totalWeight === TOTAL_WEIGHT_100 ? 'var(--green)' : 'var(--amber)' }}>
                Total weight: {totalWeight} {totalWeight !== TOTAL_WEIGHT_100 ? '(should sum to 100)' : '✓'}
              </span>
              <button className="btn-ghost" style={{ fontSize: 11 }}
                onClick={() => updateProfile({ scoringWeights: { ...DEFAULT_SCORING_WEIGHTS } })}>
                <RefreshCw size={11} style={{ marginRight: 4 }} />
                Reset defaults
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {WEIGHT_KEYS.map(({ key, label, desc }) => {
                const val = activeProfile.scoringWeights[key];
                const pct = totalWeight > 0 ? (val / totalWeight) * 100 : 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{desc}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                        <input type="number" className="input" style={{ width: 64, textAlign: 'center', fontSize: 12 }}
                          value={val} min={0} max={100}
                          onChange={e => updateWeights(key, Math.max(0, Number(e.target.value)))}
                        />
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* E. Notifications */}
          <CollapsibleSection
            id="notif"
            title="E. Notification Rules"
            expanded={expandedSection === 'notif'}
            onToggle={() => toggleSection('notif')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="filter-group">
                <label className="filter-label">Min Deal Score to Alert</label>
                <input type="number" className="input" min={0} max={100}
                  value={activeProfile.notificationConfig.minDealScore}
                  onChange={e => updateProfile({ notificationConfig: { ...activeProfile.notificationConfig, minDealScore: Number(e.target.value) } })}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">Max Price Alert (CAD)</label>
                <input type="number" className="input" min={0}
                  value={activeProfile.notificationConfig.maxPrice ?? ''}
                  placeholder="No limit"
                  onChange={e => updateProfile({ notificationConfig: { ...activeProfile.notificationConfig, maxPrice: e.target.value ? Number(e.target.value) : null } })}
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">Options</label>
                <label className="checkbox-label" style={{ fontSize: 12 }}>
                  <input type="checkbox" checked={activeProfile.notificationConfig.discordEnabled}
                    onChange={e => updateProfile({ notificationConfig: { ...activeProfile.notificationConfig, discordEnabled: e.target.checked } })} />
                  Discord alerts
                </label>
                <label className="checkbox-label" style={{ fontSize: 12 }}>
                  <input type="checkbox" checked={activeProfile.notificationConfig.emailEnabled}
                    onChange={e => updateProfile({ notificationConfig: { ...activeProfile.notificationConfig, emailEnabled: e.target.checked } })} />
                  Email alerts
                </label>
                <label className="checkbox-label" style={{ fontSize: 12 }}>
                  <input type="checkbox" checked={activeProfile.notificationConfig.notifyOnPriceDrop}
                    onChange={e => updateProfile({ notificationConfig: { ...activeProfile.notificationConfig, notifyOnPriceDrop: e.target.checked } })} />
                  Notify on price drops
                </label>
                <label className="checkbox-label" style={{ fontSize: 12 }}>
                  <input type="checkbox" checked={activeProfile.notificationConfig.notifyOnNewListings}
                    onChange={e => updateProfile({ notificationConfig: { ...activeProfile.notificationConfig, notifyOnNewListings: e.target.checked } })} />
                  Notify on new listings
                </label>
              </div>
              <div className="filter-group">
                <label className="filter-label">Min Price Drop % to Alert</label>
                <input type="number" className="input" min={0} max={100}
                  value={activeProfile.notificationConfig.minPriceDropPct ?? ''}
                  placeholder="Any drop"
                  onChange={e => updateProfile({ notificationConfig: { ...activeProfile.notificationConfig, minPriceDropPct: e.target.value ? Number(e.target.value) : null } })}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Note: Set Discord webhook in .env.local as DISCORD_WEBHOOK_URL
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Save button */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 8 }}>
            <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={14} />
              Save Profile
            </button>
            <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Eye size={12} />
              Preview Matching Listings
            </button>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--green)' }}>
                <CheckCircle2 size={14} />
                Saved!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ id, title, expanded, onToggle, children }: {
  id: string; title: string; expanded: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="card">
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', fontWeight: 600, fontSize: 13,
        }}
      >
        <span>{title}</span>
        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      )}
    </div>
  );
}
