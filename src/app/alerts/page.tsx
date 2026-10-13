'use client';

import { Bell, AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AlertsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={22} color="var(--accent-light)" />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Price Alerts</h1>
        </div>
        <Link href="/search-config">
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Plus size={12} /> Configure in Search Profiles
          </button>
        </Link>
      </div>
      <div className="sample-data-banner" style={{ marginBottom: 20 }}>
        <AlertTriangle size={14} />
        Connect Supabase and configure notifications in{' '}
        <Link href="/settings" style={{ color: 'inherit', textDecoration: 'underline' }}>Settings</Link> to enable alerts.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { type: 'discord', label: 'Discord Alerts', desc: 'Sends a rich embed when a qualifying deal is found.', status: 'not configured' },
          { type: 'email', label: 'Email Alerts (Resend)', desc: 'Sends an HTML email for deals matching your search profiles.', status: 'not configured' },
        ].map(({ type, label, desc, status }) => (
          <div key={type} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
                background: 'var(--amber-dim)', color: 'var(--amber)',
              }}>
                ⚠ {status}
              </span>
              <Link href="/settings">
                <button className="btn-ghost" style={{ fontSize: 12 }}>Configure</button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px 20px', marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Notification History</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          No notifications sent yet. Configure Supabase and notifications to see history here.
        </div>
      </div>
    </div>
  );
}
