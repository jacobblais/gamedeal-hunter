'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink, Heart, GitCompare, TrendingDown, Cpu,
  HardDrive, Monitor, AlertTriangle, CheckCircle2, Zap, MemoryStick
} from 'lucide-react';
import type { RetailerListing, PriceHistory, DealScore } from '@/types';
import { formatCAD, timeAgo, scoreColor, scoreLabel, getRetailerInfo, getGpuColor, truncate } from '@/lib/utils';
import { getEstimatedFps, getFpsLabel, GAMES } from '@/lib/benchmarks';
import type { GameId } from '@/types';

interface DealCardProps {
  listing: RetailerListing;
  history: PriceHistory | null;
  score: DealScore;
  onFavorite?: (id: string) => void;
  onCompare?: (listing: RetailerListing) => void;
  isFavorited?: boolean;
  isInComparison?: boolean;
  featuredGames?: GameId[];
}

export function DealCard({
  listing,
  history,
  score,
  onFavorite,
  onCompare,
  isFavorited = false,
  isInComparison = false,
  featuredGames = ['crimson_desert', 'black_myth_wukong', 'spider_man_2'],
}: DealCardProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const retailer = getRetailerInfo(listing.retailer);
  const gpuColor = getGpuColor(listing.gpu ?? '');
  const sColor = scoreColor(score.total);
  const isSampleData = listing.score_warnings?.some(w => w.includes('SAMPLE'));

  const priceDrop = listing.previous_price && listing.previous_price > listing.current_price
    ? { amount: listing.previous_price - listing.current_price, pct: ((listing.previous_price - listing.current_price) / listing.previous_price) * 100 }
    : null;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorited(!favorited);
    onFavorite?.(listing.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCompare?.(listing);
  };

  return (
    <div className={`deal-card ${score.total >= 80 ? 'exceptional' : ''}`}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Sample data warning */}
      {isSampleData && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
          padding: '4px 12px',
          fontSize: 10,
          color: 'var(--amber)',
          fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <AlertTriangle size={10} />
          SAMPLE DATA — Not a real listing
        </div>
      )}

      {/* Header: Image + Score + Name */}
      <div style={{ display: 'flex', gap: 14, padding: '14px 14px 0' }}>
        {/* Image placeholder */}
        <div style={{
          width: 88, height: 68, flexShrink: 0, borderRadius: 8,
          background: `linear-gradient(135deg, ${gpuColor}22, ${gpuColor}44)`,
          border: `1px solid ${gpuColor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Cpu size={28} color={gpuColor} style={{ opacity: 0.7 }} />
        </div>

        {/* Title area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, minWidth: 0 }}>
              {truncate(listing.name.replace('⚠️ [SAMPLE DATA] ', ''), 65)}
            </div>

            {/* Deal Score Ring */}
            <div className="score-ring" style={{
              background: `${sColor}20`,
              border: `2px solid ${sColor}60`,
              color: sColor,
              flexShrink: 0,
            }}>
              {score.total}
            </div>
          </div>

          {/* GPU + CPU tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
            {listing.gpu && listing.gpu !== 'UNKNOWN' && (
              <span className="gpu-tag" style={{
                background: `${gpuColor}20`,
                borderColor: `${gpuColor}40`,
                color: gpuColor,
              }}>
                {listing.gpu}
              </span>
            )}
            {listing.gpu_tgp_w && (
              <span style={{
                fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
                background: 'var(--bg-elevated)', borderRadius: 4, padding: '2px 6px',
                border: '1px solid var(--border)',
              }}>
                {listing.gpu_tgp_w}W TGP
              </span>
            )}
            {listing.gpu_vram_gb && (
              <span style={{
                fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
                background: 'var(--bg-elevated)', borderRadius: 4, padding: '2px 6px',
                border: '1px solid var(--border)',
              }}>
                {listing.gpu_vram_gb}GB VRAM
              </span>
            )}
          </div>

          {/* Score label */}
          <div style={{ fontSize: 11, color: sColor, fontWeight: 600 }}>
            {scoreLabel(score.total)}
          </div>
        </div>
      </div>

      {/* Specs row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, padding: '10px 14px',
        borderTop: '1px solid var(--border)', marginTop: 12,
        fontSize: 12, color: 'var(--text-secondary)',
      }}>
        {listing.cpu_model && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Cpu size={11} />
            {truncate(listing.cpu_model, 22)}
          </span>
        )}
        {listing.ram_gb && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MemoryStick size={11} />
            {listing.ram_gb}GB RAM
          </span>
        )}
        {listing.storage_gb && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HardDrive size={11} />
            {listing.storage_gb >= 1024 ? `${listing.storage_gb / 1024}TB` : `${listing.storage_gb}GB`} SSD
          </span>
        )}
        {listing.display_refresh_rate_hz && listing.display_resolution && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Monitor size={11} />
            {listing.display_resolution} {listing.display_refresh_rate_hz}Hz
          </span>
        )}
      </div>

      {/* FPS Estimates */}
      {listing.gpu && listing.gpu !== 'UNKNOWN' && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Est. FPS @ 1080p High + DLSS Quality
          </div>
          <div className="fps-bar-container">
            {featuredGames.map(gameId => {
              const game = GAMES[gameId];
              if (!game) return null;
              const fps = getEstimatedFps(listing.gpu ?? '', gameId, listing.gpu_tgp_w);
              if (!fps) return null;
              const label = getFpsLabel(fps.avg);
              const barPct = Math.min(100, (fps.avg / 150) * 100);
              return (
                <div key={gameId} className="fps-bar-row">
                  <span style={{ width: 120, color: 'var(--text-muted)', flexShrink: 0, fontSize: 11 }}>
                    {game.name.length > 18 ? game.name.slice(0, 17) + '…' : game.name}
                  </span>
                  <div className="fps-bar-track">
                    <div className="fps-bar-fill" style={{
                      width: `${barPct}%`,
                      background: label.color,
                    }} />
                  </div>
                  <span style={{ width: 56, color: label.color, fontWeight: 600, textAlign: 'right', flexShrink: 0, fontSize: 11 }}>
                    ~{fps.avg} fps
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 68, flexShrink: 0 }}>
                    ({label.label})
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 5 }}>
            ⚠️ Estimates only — actual FPS depends on TGP, cooling, and settings
          </div>
        </div>
      )}

      {/* Price + History */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="price-current">{formatCAD(listing.current_price)}</span>
              {listing.previous_price && listing.previous_price > listing.current_price && (
                <span className="price-was">{formatCAD(listing.previous_price)}</span>
              )}
              {priceDrop && (
                <span className="price-drop">
                  <TrendingDown size={10} />
                  -{priceDrop.pct.toFixed(0)}%
                </span>
              )}
              {listing.shipping_cost === 0 && (
                <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>
                  Free shipping
                </span>
              )}
              {listing.shipping_cost && listing.shipping_cost > 0 && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  +{formatCAD(listing.shipping_cost)} shipping
                </span>
              )}
            </div>
            {history && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                Low: {formatCAD(history.lowest)} · Avg: {formatCAD(history.average)}
                {listing.current_price <= history.lowest * 1.01 && (
                  <span style={{ color: 'var(--green)', marginLeft: 6, fontWeight: 600 }}>
                    <CheckCircle2 size={10} style={{ display: 'inline', marginRight: 2 }} />
                    Historical low!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Retailer badge */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}>
            {retailer.name}
          </div>
        </div>
      </div>

      {/* Score explanation */}
      {score.explanations.length > 0 && (
        <div style={{
          padding: '8px 14px',
          background: 'rgba(99, 102, 241, 0.04)',
          borderTop: '1px solid rgba(99,102,241,0.1)',
          fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <Zap size={10} style={{ color: 'var(--accent-light)', marginRight: 5 }} />
          {score.explanations[0]}
        </div>
      )}

      {/* Action bar */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8,
        background: 'var(--bg-secondary)',
      }}>
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', fontSize: 12 }}
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={12} />
          View Deal
        </a>

        <button
          className="btn-ghost"
          style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
          onClick={handleFavorite}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={13} fill={favorited ? 'currentColor' : 'none'} style={{ color: favorited ? '#f43f5e' : undefined }} />
        </button>

        <button
          className="btn-ghost"
          style={{
            padding: '7px 10px',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
            ...(isInComparison ? { borderColor: 'var(--accent)', color: 'var(--accent-light)' } : {}),
          }}
          onClick={handleCompare}
          title={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
        >
          <GitCompare size={13} />
        </button>

        <Link
          href={`/deals/${listing.id}`}
          className="btn-ghost"
          style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          Details
        </Link>
      </div>

      {/* Last updated */}
      <div style={{
        padding: '4px 14px 8px',
        fontSize: 10, color: 'var(--text-muted)',
        background: 'var(--bg-secondary)',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Updated {timeAgo(listing.last_checked)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {listing.in_stock
            ? <><span className="status-dot online" /> In stock</>
            : <><span className="status-dot error" /> Out of stock</>
          }
        </span>
      </div>
    </div>
  );
}
