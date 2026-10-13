import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPriceDrop(current: number, previous: number): { amount: number; pct: number } {
  const amount = previous - current;
  const pct = (amount / previous) * 100;
  return { amount, pct };
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export function scoreColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#4ade80';
  if (score >= 55) return '#fbbf24';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'Great Deal';
  if (score >= 55) return 'Good Value';
  if (score >= 40) return 'Fair';
  return 'Poor Value';
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

export const RETAILER_DISPLAY: Record<string, { name: string; color: string }> = {
  best_buy_ca:       { name: 'Best Buy', color: '#1a5fb4' },
  canada_computers:  { name: 'Canada Computers', color: '#cc0000' },
  memory_express:    { name: 'Memory Express', color: '#e6920a' },
  newegg_ca:         { name: 'Newegg', color: '#e46c0a' },
  lenovo_ca:         { name: 'Lenovo', color: '#e60000' },
  dell_ca:           { name: 'Dell', color: '#007db8' },
  hp_ca:             { name: 'HP', color: '#0096d6' },
  amazon_ca:         { name: 'Amazon.ca', color: '#ff9900' },
  walmart_ca:        { name: 'Walmart', color: '#007dc6' },
};

export function getRetailerInfo(retailer: string): { name: string; color: string } {
  return RETAILER_DISPLAY[retailer] ?? { name: retailer, color: '#6b7280' };
}

export const GPU_COLORS: Record<string, string> = {
  'RTX 5090': '#7c3aed',
  'RTX 5080': '#8b5cf6',
  'RTX 5070 Ti': '#a78bfa',
  'RTX 5070': '#c4b5fd',
  'RTX 5060': '#ddd6fe',
  'RTX 5050': '#ede9fe',
  'RTX 4090': '#2563eb',
  'RTX 4080': '#3b82f6',
  'RTX 4070': '#60a5fa',
  'RTX 4060': '#93c5fd',
  'RTX 4050': '#bfdbfe',
  'RX 7900M': '#dc2626',
  'RX 9070M': '#ef4444',
};

export function getGpuColor(gpu: string): string {
  return GPU_COLORS[gpu] ?? '#6b7280';
}
