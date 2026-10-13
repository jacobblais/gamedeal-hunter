/**
 * GameDeal Hunter — Static Benchmark / Game Data
 *
 * This module holds static game metadata and estimated FPS ranges.
 * Real benchmark data is stored in the database.
 * Estimates here are used as fallbacks and for UI display.
 */

import type { Game, GameId } from '@/types';

export const GAMES: Record<GameId, Game> = {
  crimson_desert: {
    id: 'crimson_desert',
    name: 'Crimson Desert',
    releaseYear: 2025,
    demandLevel: 'very_demanding',
    rayTracingSupport: true,
    dlssSupport: true,
    fsrSupport: true,
  },
  black_myth_wukong: {
    id: 'black_myth_wukong',
    name: 'Black Myth: Wukong',
    releaseYear: 2024,
    demandLevel: 'very_demanding',
    rayTracingSupport: true,
    dlssSupport: true,
    fsrSupport: true,
  },
  spider_man_2: {
    id: 'spider_man_2',
    name: "Marvel's Spider-Man 2",
    releaseYear: 2024,
    demandLevel: 'demanding',
    rayTracingSupport: true,
    dlssSupport: true,
    fsrSupport: true,
  },
  cyberpunk_2077: {
    id: 'cyberpunk_2077',
    name: 'Cyberpunk 2077',
    releaseYear: 2020,
    demandLevel: 'very_demanding',
    rayTracingSupport: true,
    dlssSupport: true,
    fsrSupport: true,
  },
  elden_ring: {
    id: 'elden_ring',
    name: 'Elden Ring',
    releaseYear: 2022,
    demandLevel: 'medium',
    rayTracingSupport: false,
    dlssSupport: false,
    fsrSupport: true,
  },
  alan_wake_2: {
    id: 'alan_wake_2',
    name: 'Alan Wake 2',
    releaseYear: 2023,
    demandLevel: 'very_demanding',
    rayTracingSupport: true,
    dlssSupport: true,
    fsrSupport: true,
  },
  rdr2: {
    id: 'rdr2',
    name: 'Red Dead Redemption 2',
    releaseYear: 2019,
    demandLevel: 'demanding',
    rayTracingSupport: false,
    dlssSupport: true,
    fsrSupport: true,
  },
  control: {
    id: 'control',
    name: 'Control',
    releaseYear: 2019,
    demandLevel: 'demanding',
    rayTracingSupport: true,
    dlssSupport: true,
    fsrSupport: false,
  },
};

// Estimated average FPS for each GPU at 1080p High, no RT, DLSS Quality
// Used when no benchmark data exists in the database
export const GPU_FPS_ESTIMATES: Record<string, Record<GameId, { min: number; avg: number; max: number }>> = {
  'RTX 5090': {
    crimson_desert:   { min: 105, avg: 128, max: 158 },
    black_myth_wukong:{ min: 112, avg: 135, max: 165 },
    spider_man_2:     { min: 125, avg: 150, max: 185 },
    cyberpunk_2077:   { min: 98, avg: 120, max: 148 },
    elden_ring:       { min: 58, avg: 60, max: 60 },
    alan_wake_2:      { min: 90, avg: 112, max: 138 },
    rdr2:             { min: 88, avg: 108, max: 132 },
    control:          { min: 105, avg: 128, max: 158 },
  },
  'RTX 5080': {
    crimson_desert:   { min: 90, avg: 112, max: 138 },
    black_myth_wukong:{ min: 96, avg: 118, max: 145 },
    spider_man_2:     { min: 108, avg: 130, max: 160 },
    cyberpunk_2077:   { min: 82, avg: 102, max: 125 },
    elden_ring:       { min: 58, avg: 60, max: 60 },
    alan_wake_2:      { min: 78, avg: 96, max: 118 },
    rdr2:             { min: 75, avg: 92, max: 112 },
    control:          { min: 90, avg: 110, max: 135 },
  },
  'RTX 5070 Ti': {
    crimson_desert:   { min: 82, avg: 102, max: 125 },
    black_myth_wukong:{ min: 88, avg: 108, max: 132 },
    spider_man_2:     { min: 95, avg: 118, max: 145 },
    cyberpunk_2077:   { min: 72, avg: 90, max: 110 },
    elden_ring:       { min: 58, avg: 60, max: 60 },
    alan_wake_2:      { min: 68, avg: 85, max: 105 },
    rdr2:             { min: 65, avg: 82, max: 100 },
    control:          { min: 80, avg: 98, max: 120 },
  },
  'RTX 5070': {
    crimson_desert:   { min: 68, avg: 85, max: 105 },
    black_myth_wukong:{ min: 72, avg: 89, max: 108 },
    spider_man_2:     { min: 80, avg: 98, max: 118 },
    cyberpunk_2077:   { min: 62, avg: 78, max: 96 },
    elden_ring:       { min: 58, avg: 60, max: 60 },
    alan_wake_2:      { min: 58, avg: 72, max: 88 },
    rdr2:             { min: 55, avg: 68, max: 84 },
    control:          { min: 68, avg: 85, max: 105 },
  },
  'RTX 4090': {
    crimson_desert:   { min: 85, avg: 105, max: 130 },
    black_myth_wukong:{ min: 90, avg: 112, max: 138 },
    spider_man_2:     { min: 100, avg: 122, max: 150 },
    cyberpunk_2077:   { min: 78, avg: 96, max: 118 },
    elden_ring:       { min: 58, avg: 60, max: 60 },
    alan_wake_2:      { min: 72, avg: 88, max: 108 },
    rdr2:             { min: 68, avg: 85, max: 105 },
    control:          { min: 85, avg: 105, max: 130 },
  },
  'RTX 4080': {
    crimson_desert:   { min: 72, avg: 90, max: 112 },
    black_myth_wukong:{ min: 78, avg: 96, max: 118 },
    spider_man_2:     { min: 88, avg: 108, max: 132 },
    cyberpunk_2077:   { min: 64, avg: 80, max: 98 },
    elden_ring:       { min: 58, avg: 60, max: 60 },
    alan_wake_2:      { min: 60, avg: 75, max: 92 },
    rdr2:             { min: 58, avg: 72, max: 88 },
    control:          { min: 72, avg: 90, max: 112 },
  },
  'RTX 5060': {
    crimson_desert:   { min: 58, avg: 72, max: 90 },
    black_myth_wukong:{ min: 62, avg: 78, max: 96 },
    spider_man_2:     { min: 68, avg: 85, max: 105 },
    cyberpunk_2077:   { min: 52, avg: 65, max: 80 },
    elden_ring:       { min: 55, avg: 60, max: 60 },
    alan_wake_2:      { min: 48, avg: 60, max: 74 },
    rdr2:             { min: 46, avg: 58, max: 72 },
    control:          { min: 58, avg: 72, max: 88 },
  },
  'RTX 4070': {
    crimson_desert:   { min: 55, avg: 68, max: 84 },
    black_myth_wukong:{ min: 58, avg: 72, max: 88 },
    spider_man_2:     { min: 65, avg: 80, max: 98 },
    cyberpunk_2077:   { min: 48, avg: 60, max: 74 },
    elden_ring:       { min: 55, avg: 60, max: 60 },
    alan_wake_2:      { min: 44, avg: 55, max: 68 },
    rdr2:             { min: 42, avg: 52, max: 64 },
    control:          { min: 55, avg: 68, max: 84 },
  },
  'RTX 4060': {
    crimson_desert:   { min: 45, avg: 56, max: 70 },
    black_myth_wukong:{ min: 48, avg: 60, max: 75 },
    spider_man_2:     { min: 55, avg: 68, max: 84 },
    cyberpunk_2077:   { min: 38, avg: 48, max: 60 },
    elden_ring:       { min: 50, avg: 60, max: 60 },
    alan_wake_2:      { min: 35, avg: 44, max: 55 },
    rdr2:             { min: 34, avg: 42, max: 52 },
    control:          { min: 45, avg: 56, max: 70 },
  },
  'RTX 5050': {
    crimson_desert:   { min: 38, avg: 48, max: 60 },
    black_myth_wukong:{ min: 40, avg: 50, max: 62 },
    spider_man_2:     { min: 45, avg: 56, max: 70 },
    cyberpunk_2077:   { min: 32, avg: 40, max: 50 },
    elden_ring:       { min: 45, avg: 58, max: 60 },
    alan_wake_2:      { min: 28, avg: 35, max: 44 },
    rdr2:             { min: 27, avg: 34, max: 42 },
    control:          { min: 38, avg: 48, max: 60 },
  },
  'RTX 4050': {
    crimson_desert:   { min: 32, avg: 40, max: 50 },
    black_myth_wukong:{ min: 34, avg: 42, max: 52 },
    spider_man_2:     { min: 38, avg: 48, max: 60 },
    cyberpunk_2077:   { min: 26, avg: 32, max: 40 },
    elden_ring:       { min: 40, avg: 55, max: 60 },
    alan_wake_2:      { min: 22, avg: 28, max: 35 },
    rdr2:             { min: 22, avg: 28, max: 34 },
    control:          { min: 32, avg: 40, max: 50 },
  },
};

export function getEstimatedFps(
  gpu: string,
  gameId: GameId,
  tgpW?: number | null
): { min: number; avg: number; max: number } | null {
  const gameFps = GPU_FPS_ESTIMATES[gpu]?.[gameId];
  if (!gameFps) return null;

  // Apply TGP adjustment
  const expectedTgp: Record<string, number> = {
    'RTX 5090': 175, 'RTX 5080': 175, 'RTX 5070 Ti': 150,
    'RTX 5070': 115, 'RTX 4090': 175, 'RTX 4080': 150,
    'RTX 5060': 95,  'RTX 4070': 125, 'RTX 4060': 80,
    'RTX 5050': 75,  'RTX 4050': 70,
  };

  let mult = 1.0;
  if (tgpW !== null && tgpW !== undefined) {
    const base = expectedTgp[gpu] ?? 100;
    const ratio = tgpW / base;
    mult = ratio >= 1.0 ? 1.0 : ratio >= 0.9 ? 0.97 : ratio >= 0.8 ? 0.93 : ratio >= 0.7 ? 0.87 : 0.78;
  }

  return {
    min: Math.round(gameFps.min * mult),
    avg: Math.round(gameFps.avg * mult),
    max: Math.round(gameFps.max * mult),
  };
}

export function getFpsLabel(fps: number): { label: string; color: string } {
  if (fps >= 120) return { label: 'Exceptional', color: '#22c55e' };
  if (fps >= 90)  return { label: 'Excellent', color: '#4ade80' };
  if (fps >= 60)  return { label: 'Smooth', color: '#86efac' };
  if (fps >= 45)  return { label: 'Playable', color: '#fbbf24' };
  if (fps >= 30)  return { label: 'Marginal', color: '#f97316' };
  return { label: 'Poor', color: '#ef4444' };
}
