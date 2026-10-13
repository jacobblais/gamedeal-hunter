'use client';

import { RefreshCw, Bell, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function TopBar() {
  return (
    <header style={{
      height: 56,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: Breadcrumb / title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Best Gaming Laptop Deals
        </span>
        <span style={{
          fontSize: 11, color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 4, padding: '2px 7px', fontWeight: 500
        }}>
          Canada
        </span>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Scan status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="status-dot unknown" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            DB not connected
          </span>
        </div>

        {/* Manual refresh */}
        <button
          className="btn-ghost"
          style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => window.location.reload()}
          title="Refresh listings"
        >
          <RefreshCw size={14} />
          <span style={{ fontSize: 12 }}>Refresh</span>
        </button>

        {/* Alerts */}
        <Link href="/alerts" style={{ textDecoration: 'none' }}>
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Bell size={14} />
            <span style={{ fontSize: 12 }}>Alerts</span>
          </button>
        </Link>

        {/* Docs link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ExternalLink size={14} />
            <span style={{ fontSize: 12 }}>Docs</span>
          </button>
        </a>
      </div>
    </header>
  );
}
