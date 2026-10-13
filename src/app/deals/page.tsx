'use client';

import { BarChart3, AlertTriangle } from 'lucide-react';

export default function AllDealsPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <BarChart3 size={22} color="var(--accent-light)" />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>All Deals</h1>
      </div>
      <div className="sample-data-banner" style={{ marginBottom: 20 }}>
        <AlertTriangle size={14} />
        Connect Supabase to see all tracked listings. Use the dashboard for demo data.
      </div>
      <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 13 }}>
          All active retailer listings will appear here once Supabase is connected.
          The main dashboard shows the same data with sample deals during development.
        </div>
      </div>
    </div>
  );
}
