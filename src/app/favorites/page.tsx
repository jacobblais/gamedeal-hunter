'use client';

import { Heart, AlertTriangle } from 'lucide-react';

export default function FavoritesPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Heart size={22} color="var(--accent-light)" />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Favorites</h1>
      </div>
      <div className="sample-data-banner" style={{ marginBottom: 20 }}>
        <AlertTriangle size={14} />
        Connect Supabase to enable favorites. Favorite any deal from the dashboard.
      </div>
      <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Heart size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No favorites yet</div>
        <div style={{ fontSize: 13 }}>Use the ♥ button on any deal card to save it here.</div>
      </div>
    </div>
  );
}
