'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GitCompare, Trophy, CheckCircle2, XCircle, Minus } from 'lucide-react';
import { formatCAD, scoreColor } from '@/lib/utils';
import { getEstimatedFps, getFpsLabel, GAMES } from '@/lib/benchmarks';
import { scoreDeal } from '@/lib/scoring';
import type { RetailerListing } from '@/types';

// Demo laptops for comparison
const DEMO_COMPARE: RetailerListing[] = [
  {
    id: 'demo-1', product_id: null, retailer: 'best_buy_ca', retailer_listing_id: 'BB-demo-1',
    name: 'ASUS ROG Strix G16 — RTX 5070',
    url: '#', image_url: null,
    current_price: 1899.99, previous_price: 2099.99, reference_price: 2199.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 5070', gpu_vram_gb: 8, gpu_tgp_w: 115,
    cpu_model: 'Ryzen 9 8945HX', ram_gb: 32, storage_gb: 1024,
    display_resolution: '2560x1600', display_refresh_rate_hz: 165,
    spec_confidence: 90, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: [],
    score_is_estimated: true, last_checked: new Date().toISOString(),
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3', product_id: null, retailer: 'memory_express', retailer_listing_id: 'ME-demo-3',
    name: 'Dell G16 — RTX 4070',
    url: '#', image_url: null,
    current_price: 1499.99, previous_price: 1799.99, reference_price: 1899.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 4070', gpu_vram_gb: 8, gpu_tgp_w: 125,
    cpu_model: 'Core i7-13650HX', ram_gb: 16, storage_gb: 512,
    display_resolution: '2560x1600', display_refresh_rate_hz: 165,
    spec_confidence: 85, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: [],
    score_is_estimated: true, last_checked: new Date().toISOString(),
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-4', product_id: null, retailer: 'newegg_ca', retailer_listing_id: 'NE-demo-4',
    name: 'Acer Nitro V16 — RTX 4060',
    url: '#', image_url: null,
    current_price: 999.99, previous_price: 1199.99, reference_price: 1249.99, shipping_cost: 0,
    currency: 'CAD', condition: 'new', in_stock: true, seller: null, is_marketplace: false,
    source: 'manual', raw_specs: {},
    gpu: 'RTX 4060', gpu_vram_gb: 8, gpu_tgp_w: 80,
    cpu_model: 'Ryzen 7 7745HX', ram_gb: 16, storage_gb: 1024,
    display_resolution: '1920x1080', display_refresh_rate_hz: 144,
    spec_confidence: 82, deal_score: null, score_breakdown: null,
    score_explanations: [], score_warnings: [],
    score_is_estimated: true, last_checked: new Date().toISOString(),
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

const GAME_IDS = ['crimson_desert', 'black_myth_wukong', 'spider_man_2', 'cyberpunk_2077'] as const;

type CellVal = string | number | null;

function BestBadge({ idx }: { idx: number }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
      background: 'rgba(34,197,94,0.15)', color: 'var(--green)', marginLeft: 4,
    }}>
      BEST
    </span>
  );
}

function CompareCell({ value, isBest, isWorst, isNeutral }: {
  value: React.ReactNode; isBest?: boolean; isWorst?: boolean; isNeutral?: boolean;
}) {
  return (
    <td style={{
      padding: '12px 16px', textAlign: 'center', fontSize: 13,
      color: isBest ? 'var(--green)' : isWorst ? 'var(--red)' : 'var(--text-primary)',
      background: isBest ? 'rgba(34,197,94,0.05)' : isWorst ? 'rgba(239,68,68,0.04)' : 'transparent',
      borderBottom: '1px solid var(--border)',
      fontWeight: isBest ? 700 : 400,
    }}>
      {value}
    </td>
  );
}

export default function ComparePage() {
  const [laptops] = useState(DEMO_COMPARE);
  const scores = laptops.map(l => scoreDeal(l, null));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <GitCompare size={22} color="var(--accent-light)" />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Laptop Comparison
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Compare specs, prices, and estimated gaming performance side-by-side.
            All estimates are approximate — verify before purchasing.
          </p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          {/* Header row */}
          <thead>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', background: 'var(--bg-elevated)', width: 180, borderBottom: '2px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                Specification
              </th>
              {laptops.map((l, i) => (
                <th key={l.id} style={{
                  padding: '16px', textAlign: 'center',
                  background: 'var(--bg-elevated)',
                  borderBottom: '2px solid var(--border)',
                  borderLeft: '1px solid var(--border)',
                  minWidth: 200,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {l.name}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 18, fontWeight: 700, color: scoreColor(scores[i].total),
                    background: `${scoreColor(scores[i].total)}15`,
                    padding: '3px 10px', borderRadius: 6,
                  }}>
                    <Trophy size={13} />
                    {scores[i].total}
                    <span style={{ fontSize: 11, opacity: 0.7 }}>/100</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Price */}
            <SectionHeader label="💰 Price" />
            <tr>
              <RowLabel label="Current Price (CAD)" />
              {laptops.map((l, i) => {
                const prices = laptops.map(x => x.current_price);
                const isBest = l.current_price === Math.min(...prices);
                const isWorst = l.current_price === Math.max(...prices);
                return <CompareCell key={l.id} value={formatCAD(l.current_price)} isBest={isBest} isWorst={isWorst} />;
              })}
            </tr>
            <tr>
              <RowLabel label="Was Price" />
              {laptops.map(l => (
                <CompareCell key={l.id}
                  value={l.previous_price ? formatCAD(l.previous_price) : '—'}
                  isNeutral />
              ))}
            </tr>
            <tr>
              <RowLabel label="Savings" />
              {laptops.map(l => {
                const savings = l.previous_price ? l.previous_price - l.current_price : 0;
                const allSavings = laptops.map(x => (x.previous_price ?? x.current_price) - x.current_price);
                return <CompareCell key={l.id}
                  value={savings > 0 ? `${formatCAD(savings)} (${((savings / (l.previous_price ?? l.current_price)) * 100).toFixed(0)}% off)` : '—'}
                  isBest={savings === Math.max(...allSavings) && savings > 0}
                />;
              })}
            </tr>

            {/* GPU */}
            <SectionHeader label="🎮 GPU" />
            <tr>
              <RowLabel label="GPU" />
              {laptops.map(l => <CompareCell key={l.id} value={l.gpu ?? 'Unknown'} />)}
            </tr>
            <tr>
              <RowLabel label="VRAM" />
              {laptops.map((l, i) => {
                const vrams = laptops.map(x => x.gpu_vram_gb ?? 0);
                return <CompareCell key={l.id}
                  value={l.gpu_vram_gb ? `${l.gpu_vram_gb}GB` : '?'}
                  isBest={l.gpu_vram_gb === Math.max(...vrams)}
                  isWorst={l.gpu_vram_gb === Math.min(...vrams) && vrams.some(v => v !== vrams[0])} />;
              })}
            </tr>
            <tr>
              <RowLabel label="GPU TGP" />
              {laptops.map((l, i) => {
                const tgps = laptops.map(x => x.gpu_tgp_w ?? 0);
                return <CompareCell key={l.id}
                  value={l.gpu_tgp_w ? `${l.gpu_tgp_w}W` : 'Unknown'}
                  isBest={l.gpu_tgp_w === Math.max(...tgps)}
                  isWorst={l.gpu_tgp_w === Math.min(...tgps) && tgps.some(v => v !== tgps[0])} />;
              })}
            </tr>

            {/* CPU */}
            <SectionHeader label="⚡ CPU" />
            <tr>
              <RowLabel label="CPU" />
              {laptops.map(l => <CompareCell key={l.id} value={l.cpu_model ?? 'Unknown'} />)}
            </tr>

            {/* Memory */}
            <SectionHeader label="💾 Memory & Storage" />
            <tr>
              <RowLabel label="RAM" />
              {laptops.map((l, i) => {
                const rams = laptops.map(x => x.ram_gb ?? 0);
                return <CompareCell key={l.id}
                  value={l.ram_gb ? `${l.ram_gb}GB` : '?'}
                  isBest={l.ram_gb === Math.max(...rams)} />;
              })}
            </tr>
            <tr>
              <RowLabel label="Storage" />
              {laptops.map((l, i) => {
                const ss = laptops.map(x => x.storage_gb ?? 0);
                return <CompareCell key={l.id}
                  value={l.storage_gb ? (l.storage_gb >= 1024 ? `${l.storage_gb/1024}TB` : `${l.storage_gb}GB`) : '?'}
                  isBest={l.storage_gb === Math.max(...ss)} />;
              })}
            </tr>

            {/* Display */}
            <SectionHeader label="🖥️ Display" />
            <tr>
              <RowLabel label="Resolution" />
              {laptops.map(l => <CompareCell key={l.id} value={l.display_resolution ?? '?'} />)}
            </tr>
            <tr>
              <RowLabel label="Refresh Rate" />
              {laptops.map((l, i) => {
                const rrs = laptops.map(x => x.display_refresh_rate_hz ?? 0);
                return <CompareCell key={l.id}
                  value={l.display_refresh_rate_hz ? `${l.display_refresh_rate_hz}Hz` : '?'}
                  isBest={l.display_refresh_rate_hz === Math.max(...rrs)} />;
              })}
            </tr>

            {/* FPS Estimates */}
            <SectionHeader label="🎯 Estimated FPS (1080p High + DLSS Quality)" />
            {GAME_IDS.map(gameId => {
              const game = GAMES[gameId];
              if (!game) return null;
              const fpsList = laptops.map(l => getEstimatedFps(l.gpu ?? '', gameId, l.gpu_tgp_w));
              const avgs = fpsList.map(f => f?.avg ?? 0);
              const maxAvg = Math.max(...avgs);
              const minAvg = Math.min(...avgs.filter(a => a > 0));
              return (
                <tr key={gameId}>
                  <RowLabel label={game.name} />
                  {laptops.map((l, i) => {
                    const fps = fpsList[i];
                    if (!fps) return <CompareCell key={l.id} value="N/A" isNeutral />;
                    const label = getFpsLabel(fps.avg);
                    return (
                      <CompareCell key={l.id}
                        isBest={fps.avg === maxAvg}
                        isWorst={fps.avg === minAvg && minAvg !== maxAvg}
                        value={
                          <div>
                            <div style={{ fontWeight: 700 }}>~{fps.avg} fps</div>
                            <div style={{ fontSize: 10, color: label.color }}>{label.label}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>({fps.min}–{fps.max})</div>
                          </div>
                        }
                      />
                    );
                  })}
                </tr>
              );
            })}

            {/* Deal Score */}
            <SectionHeader label="📊 Deal Analysis" />
            <tr>
              <RowLabel label="Deal Score" />
              {scores.map((s, i) => {
                const allScores = scores.map(x => x.total);
                return (
                  <CompareCell key={laptops[i].id}
                    isBest={s.total === Math.max(...allScores)}
                    isWorst={s.total === Math.min(...allScores) && allScores.some(x => x !== allScores[0])}
                    value={
                      <span style={{ color: scoreColor(s.total), fontWeight: 700, fontSize: 16 }}>
                        {s.total}/100
                      </span>
                    }
                  />
                );
              })}
            </tr>
            <tr>
              <RowLabel label="Top Reason" />
              {scores.map((s, i) => (
                <CompareCell key={laptops[i].id} isNeutral
                  value={<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.explanations[0] ?? '—'}</span>}
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
        ⚠️ FPS estimates are approximate and based on GPU tier and TGP. Actual performance varies by game settings, driver version, and cooling.
        Benchmark data marked as estimates have not been independently measured. This comparison uses sample data.
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={100} style={{
        padding: '8px 16px', background: 'var(--bg-elevated)',
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        borderTop: '2px solid var(--border)', borderBottom: '1px solid var(--border)',
      }}>
        {label}
      </td>
    </tr>
  );
}

function RowLabel({ label }: { label: string }) {
  return (
    <td style={{
      padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)',
      fontWeight: 500, background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
    }}>
      {label}
    </td>
  );
}
