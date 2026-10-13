'use client';

import { useState } from 'react';
import {
  Settings, Bell, Database, Webhook, Mail, Save, RefreshCw,
  CheckCircle2, AlertTriangle, ExternalLink
} from 'lucide-react';

const TABS = ['General', 'Notifications', 'Database', 'Retailers'] as const;
type Tab = typeof TABS[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    budgetCad: 2000,
    preferredGames: ['crimson_desert', 'black_myth_wukong', 'spider_man_2'],
    discordWebhookUrl: '',
    discordEnabled: false,
    emailEnabled: false,
    emailAddress: '',
    resendApiKey: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    workerApiKey: '',
    defaultSortBy: 'deal_score_desc',
    inStockOnly: true,
    excludeMarketplace: false,
  });

  const handleSave = () => {
    // In real app: persist to database
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateSetting = (key: string, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Settings size={22} color="var(--accent-light)" />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Configure your preferences, notifications, and service credentials.
            Secrets are stored in environment variables, never in the database.
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="tab-list" style={{ marginBottom: 24 }}>
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'General' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SettingsSection title="Search Preferences" icon={<Settings size={16} />}>
            <SettingsRow label="Budget (CAD)" description="Your target maximum price for deals.">
              <input
                type="number"
                className="input"
                style={{ width: 140 }}
                value={settings.budgetCad}
                onChange={e => updateSetting('budgetCad', Number(e.target.value))}
                min={500} max={10000} step={100}
              />
            </SettingsRow>

            <SettingsRow label="Default Sort" description="How to sort the main deals list.">
              <select
                className="input"
                style={{ width: 220 }}
                value={settings.defaultSortBy}
                onChange={e => updateSetting('defaultSortBy', e.target.value)}
              >
                <option value="deal_score_desc">Best Deal Score</option>
                <option value="price_asc">Lowest Price</option>
                <option value="price_desc">Highest Price</option>
                <option value="newest_first">Newest First</option>
              </select>
            </SettingsRow>

            <SettingsRow label="In-Stock Only" description="Hide out-of-stock listings by default.">
              <input
                type="checkbox"
                checked={settings.inStockOnly}
                onChange={e => updateSetting('inStockOnly', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
            </SettingsRow>

            <SettingsRow label="Exclude Marketplace" description="Exclude third-party marketplace sellers.">
              <input
                type="checkbox"
                checked={settings.excludeMarketplace}
                onChange={e => updateSetting('excludeMarketplace', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
            </SettingsRow>
          </SettingsSection>

          <div className="sample-data-banner">
            <AlertTriangle size={14} />
            Settings are currently stored in UI state only. Connect Supabase to persist preferences.
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Discord */}
          <SettingsSection title="Discord Notifications" icon={<Webhook size={16} />}>
            <div className="sample-data-banner" style={{ marginBottom: 16 }}>
              <AlertTriangle size={14} />
              Discord webhook URLs must be set in <code>.env.local</code> (DISCORD_WEBHOOK_URL) — never entered in the UI for security.
            </div>

            <SettingsRow label="Discord Enabled" description="Send deal alerts to a Discord channel.">
              <input
                type="checkbox"
                checked={settings.discordEnabled}
                onChange={e => updateSetting('discordEnabled', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
            </SettingsRow>

            <SettingsRow
              label="Webhook URL"
              description="Set DISCORD_WEBHOOK_URL in your .env.local file."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="password"
                  className="input"
                  style={{ width: 240 }}
                  value="••••••••••••••••••••"
                  readOnly
                  placeholder="Set in .env.local"
                />
                <span style={{ fontSize: 11, color: 'var(--green)' }}>
                  {process.env.NEXT_PUBLIC_SITE_URL ? '✓ Configured' : 'Not set'}
                </span>
              </div>
            </SettingsRow>
          </SettingsSection>

          {/* Email */}
          <SettingsSection title="Email Notifications (Resend)" icon={<Mail size={16} />}>
            <div className="sample-data-banner" style={{ marginBottom: 16 }}>
              <AlertTriangle size={14} />
              RESEND_API_KEY must be set in <code>.env.local</code>. See{' '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                resend.com
              </a>
            </div>

            <SettingsRow label="Email Enabled" description="Send deal alerts by email.">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={e => updateSetting('emailEnabled', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
            </SettingsRow>

            <SettingsRow label="Notification Email" description="Address to send deal alerts to.">
              <input
                type="email"
                className="input"
                style={{ width: 240 }}
                value={settings.emailAddress}
                onChange={e => updateSetting('emailAddress', e.target.value)}
                placeholder="you@example.com"
              />
            </SettingsRow>
          </SettingsSection>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'Database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SettingsSection title="Supabase Connection" icon={<Database size={16} />}>
            <div className="sample-data-banner" style={{ marginBottom: 16 }}>
              <AlertTriangle size={14} />
              Configure these in <code>.env.local</code>. Copy from <code>.env.example</code> and fill in your values.
            </div>

            {[
              { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', desc: 'Your project URL from Supabase dashboard → Settings → API' },
              { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Anon Key', desc: 'Public anon key (safe for frontend, RLS enforced)' },
              { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', desc: 'Server-side only. Never expose publicly.' },
            ].map(({ key, label, desc }) => (
              <SettingsRow key={key} label={label} description={desc}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="password"
                    className="input"
                    style={{ width: 240 }}
                    readOnly
                    placeholder={`Set ${key} in .env.local`}
                    value="••••••••"
                  />
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}
                  >
                    Supabase <ExternalLink size={10} />
                  </a>
                </div>
              </SettingsRow>
            ))}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Setup Instructions
              </div>
              <ol style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>supabase.com</a></li>
                <li>Go to SQL Editor and run <code>supabase/migrations/001_initial_schema.sql</code></li>
                <li>Optionally run <code>002_sample_data.sql</code> for development data</li>
                <li>Copy your URL and keys from Settings → API</li>
                <li>Add them to <code>.env.local</code> (copy from <code>.env.example</code>)</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          </SettingsSection>
        </div>
      )}

      {/* Retailers Tab */}
      {activeTab === 'Retailers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Retailer connectors are managed in the database after Supabase is connected.
            Connect to Supabase to enable/disable retailers, adjust scan intervals, and view scan health.
          </div>

          {[
            { name: 'Best Buy Canada', source: 'Public pages (robots.txt allowed)', status: 'ready', interval: '60 min' },
            { name: 'Canada Computers', source: 'Public pages (robots.txt allowed)', status: 'ready', interval: '60 min' },
            { name: 'Memory Express', source: 'Public pages', status: 'ready', interval: '60 min' },
            { name: 'Newegg Canada', source: 'Public pages', status: 'ready', interval: '60 min' },
            { name: 'Lenovo Canada', source: 'Official brand site', status: 'ready', interval: '120 min' },
            { name: 'Dell Canada', source: 'Official brand site', status: 'ready', interval: '120 min' },
            { name: 'HP Canada', source: 'Official brand site', status: 'ready', interval: '120 min' },
            { name: 'Amazon.ca', source: 'Requires PA-API (affiliate enrollment)', status: 'pending_config', interval: '60 min' },
          ].map(({ name, source, status, interval }) => (
            <div key={name} className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{source}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{interval}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
                  background: status === 'ready' ? 'var(--green-dim)' : 'var(--amber-dim)',
                  color: status === 'ready' ? 'var(--green)' : 'var(--amber)',
                }}>
                  {status === 'ready' ? '✓ Ready' : '⚠ Config needed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div style={{ marginTop: 28, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={14} />
          Save Settings
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--green)' }}>
            <CheckCircle2 size={14} />
            Saved!
          </span>
        )}
      </div>
    </div>
  );
}

function SettingsSection({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--accent-light)' }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, description, children }: {
  label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}
