'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap, Heart, Settings, SlidersHorizontal, GitCompare,
  Cpu, BarChart3, Bell, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Zap, label: 'Deals Dashboard' },
  { href: '/compare', icon: GitCompare, label: 'Compare' },
  { href: '/search-config', icon: SlidersHorizontal, label: 'Search Config' },
  { href: '/deals', icon: BarChart3, label: 'All Deals' },
  { href: '/favorites', icon: Heart, label: 'Favorites' },
  { href: '/alerts', icon: Bell, label: 'Price Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const GPU_CATEGORIES = [
  { label: 'RTX 5090', color: '#7c3aed' },
  { label: 'RTX 5080', color: '#8b5cf6' },
  { label: 'RTX 5070 Ti', color: '#a78bfa' },
  { label: 'RTX 5070', color: '#c4b5fd' },
  { label: 'RTX 5060', color: '#ddd6fe' },
  { label: 'RTX 5050', color: '#ede9fe' },
  { label: 'RTX 4090', color: '#2563eb' },
  { label: 'RTX 4080', color: '#3b82f6' },
  { label: 'RTX 4070', color: '#60a5fa' },
  { label: 'RTX 4060', color: '#93c5fd' },
  { label: 'RTX 4050', color: '#bfdbfe' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      gap: 8,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 4px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={16} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            GameDeal
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            Hunter
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* GPU Quick Filter */}
      <div style={{ marginTop: 16 }}>
        <div className="filter-label" style={{ padding: '0 4px', marginBottom: 8 }}>
          GPU Categories
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Link href="/" className="nav-item" style={{ fontSize: 12, padding: '6px 8px' }}>
            <Cpu size={12} />
            <span>All GPUs</span>
          </Link>
          {GPU_CATEGORIES.map(({ label, color }) => (
            <Link
              key={label}
              href={`/?gpu=${encodeURIComponent(label)}`}
              className="nav-item"
              style={{ fontSize: 12, padding: '5px 8px' }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0,
              }} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Scan Status */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span className="status-dot unknown scanning-pulse" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Auto-scan
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Configure Supabase to enable
          </div>
          <Link
            href="/settings"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, color: 'var(--accent-light)', marginTop: 6,
              textDecoration: 'none',
            }}
          >
            Configure <ChevronRight size={10} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
