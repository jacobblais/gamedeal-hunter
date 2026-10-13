// ============================================================
// GameDeal Hunter — Core TypeScript Types
// ============================================================

export type GPU =
  | 'RTX 4050' | 'RTX 4060' | 'RTX 4070' | 'RTX 4080' | 'RTX 4090'
  | 'RTX 5050' | 'RTX 5060' | 'RTX 5070' | 'RTX 5070 Ti' | 'RTX 5080' | 'RTX 5090'
  | 'RX 7600M' | 'RX 7700S' | 'RX 7900M' | 'RX 9070M'
  | 'Arc A770M' | 'Arc B580M'
  | 'OTHER' | 'UNKNOWN';

export type CPUManufacturer = 'Intel' | 'AMD' | 'Apple' | 'Qualcomm' | 'UNKNOWN';

export type Condition = 'new' | 'open_box' | 'refurbished' | 'used';

export type ListingSource = 'api' | 'scrape' | 'rss' | 'affiliate' | 'manual';

export type SpecConfidence = 'verified' | 'estimated' | 'unknown';

export type GameId =
  | 'crimson_desert'
  | 'black_myth_wukong'
  | 'spider_man_2'
  | 'cyberpunk_2077'
  | 'elden_ring'
  | 'alan_wake_2'
  | 'rdr2'
  | 'control';

export interface Game {
  id: GameId;
  name: string;
  releaseYear: number;
  demandLevel: 'light' | 'medium' | 'demanding' | 'very_demanding';
  rayTracingSupport: boolean;
  dlssSupport: boolean;
  fsrSupport: boolean;
}

export interface LaptopSpecs {
  // GPU
  gpu: GPU;
  gpuVram: number | null; // GB
  gpuTgp: number | null;  // Watts (TGP / power limit)
  gpuTgpConfidence: SpecConfidence;

  // CPU
  cpuManufacturer: CPUManufacturer;
  cpuModel: string | null;
  cpuGeneration: number | null;
  cpuCores: number | null;
  cpuBaseClock: number | null; // GHz
  cpuBoostClock: number | null; // GHz

  // Memory & Storage
  ramGb: number | null;
  ramType: 'DDR4' | 'DDR5' | 'LPDDR5' | 'UNKNOWN' | null;
  storageGb: number | null;
  storageType: 'SSD' | 'HDD' | 'HYBRID' | null;

  // Display
  displayInches: number | null;
  displayResolution: string | null; // e.g. "1920x1080"
  displayRefreshRate: number | null; // Hz
  displayPanel: 'IPS' | 'VA' | 'OLED' | 'TN' | 'UNKNOWN' | null;

  // Other
  weightKg: number | null;
  batteryWh: number | null;
  os: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  modelNumber: string | null;
  specs: LaptopSpecs;
  createdAt: string;
  updatedAt: string;
}

// RetailerListing uses snake_case to match Supabase column names directly.
// This avoids needing a mapping layer between DB and frontend.
export interface RetailerListing {
  id: string;
  product_id: string | null;
  retailer: string;
  retailer_listing_id: string | null;
  name: string;
  url: string;
  image_url: string | null;
  current_price: number; // CAD
  previous_price: number | null;
  reference_price: number | null;
  shipping_cost: number | null;
  currency: 'CAD';
  condition: Condition;
  in_stock: boolean;
  seller: string | null;
  is_marketplace: boolean;
  source: ListingSource;
  raw_specs: Record<string, string>;
  // Normalized specs stored as flat columns (mirrors DB)
  gpu: GPU | null;
  gpu_vram_gb: number | null;
  gpu_tgp_w: number | null;
  cpu_model: string | null;
  ram_gb: number | null;
  storage_gb: number | null;
  display_resolution: string | null;
  display_refresh_rate_hz: number | null;
  spec_confidence: number; // 0-100
  // Deal score (computed by worker or scoring engine)
  deal_score: number | null;
  score_breakdown: Record<string, number> | null;
  score_explanations: string[] | null;
  score_warnings: string[] | null;
  score_is_estimated: boolean;
  last_checked: string;
  created_at: string;
  updated_at: string;
}

export interface PriceObservation {
  id: string;
  listing_id: string;
  price: number;
  shipping_cost: number | null;
  in_stock: boolean;
  observed_at: string;
}

export interface PriceHistory {
  current: number;
  previous: number | null;
  lowest: number;
  highest: number;
  average: number;
  observations: PriceObservation[];
  daysTracked: number;
  lastObservedAt: string;
}

export interface BenchmarkResult {
  id: string;
  productId: string;
  game: GameId;
  resolution: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  rayTracing: boolean;
  upscaling: 'none' | 'dlss' | 'fsr' | 'xess';
  upscalingMode: 'performance' | 'balanced' | 'quality' | null;
  fpsMin: number | null;
  fps1pctLow: number | null;
  fpsAvg: number;
  fpsMax: number | null;
  isEstimate: boolean;
  confidence: SpecConfidence;
  sourceUrl: string | null;
  sourceName: string | null;
  measuredAt: string | null;
  createdAt: string;
}

export interface DealScore {
  total: number; // 0-100
  breakdown: {
    gamingPerformance: number;
    priceValue: number;
    priceHistory: number;
    vram: number;
    ramStorage: number;
    displayQuality: number;
    sellerReliability: number;
    conditionBonus: number;
    shippingPenalty: number;
  };
  explanations: string[];
  warnings: string[];
  isEstimated: boolean;
}

export interface DealCard {
  listing: RetailerListing;
  product: Product | null;
  priceHistory: PriceHistory | null;
  score: DealScore;
  benchmarks: BenchmarkResult[];
  similarListings: RetailerListing[];
}

// ---- Search / Filter types ----

export interface GameRequirement {
  gameId: GameId;
  resolution: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  targetFps: number;
  rayTracing: boolean;
  upscaling: boolean;
  requireMeasured: boolean;
  priority: 'required' | 'preferred' | 'nice_to_have';
}

export interface ScoringWeights {
  gamingPerformance: number;
  priceValue: number;
  priceHistory: number;
  vram: number;
  ramStorage: number;
  displayQuality: number;
  sellerReliability: number;
  conditionBonus: number;
  shippingPenalty: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  gamingPerformance: 30,
  priceValue: 25,
  priceHistory: 15,
  vram: 10,
  ramStorage: 8,
  displayQuality: 5,
  sellerReliability: 4,
  conditionBonus: 2,
  shippingPenalty: 1,
};

export interface FilterRule {
  logic: 'AND' | 'OR';
  gpus: GPU[];
  excludeGpus: GPU[];
  minVramGb: number | null;
  maxVramGb: number | null;
  minTgpW: number | null;
  cpuManufacturers: CPUManufacturer[];
  minRamGb: number | null;
  maxRamGb: number | null;
  minStorageGb: number | null;
  minDisplayRefreshRate: number | null;
  displayResolutions: string[];
  conditions: Condition[];
  brands: string[];
  excludeBrands: string[];
  retailers: string[];
  excludeRetailers: string[];
  minPrice: number | null;
  maxPrice: number | null;
  maxPriceWithShipping: number | null;
  minDealScore: number | null;
  minHistoricalDropPct: number | null;
  minSpecConfidence: number | null;
  inStockOnly: boolean;
  excludeMarketplace: boolean;
  allowUnknownSpecs: boolean;
}

export const DEFAULT_FILTER_RULE: FilterRule = {
  logic: 'AND',
  gpus: [],
  excludeGpus: [],
  minVramGb: null,
  maxVramGb: null,
  minTgpW: null,
  cpuManufacturers: [],
  minRamGb: null,
  maxRamGb: null,
  minStorageGb: null,
  minDisplayRefreshRate: null,
  displayResolutions: [],
  conditions: ['new'],
  brands: [],
  excludeBrands: [],
  retailers: [],
  excludeRetailers: [],
  minPrice: null,
  maxPrice: 2000,
  maxPriceWithShipping: null,
  minDealScore: 50,
  minHistoricalDropPct: null,
  minSpecConfidence: null,
  inStockOnly: true,
  excludeMarketplace: false,
  allowUnknownSpecs: true,
};

export interface NotificationConfig {
  discordEnabled: boolean;
  emailEnabled: boolean;
  emailAddress: string | null;
  minDealScore: number;
  maxPrice: number | null;
  notifyOnNewListings: boolean;
  notifyOnPriceDrop: boolean;
  minPriceDropPct: number | null;
}

export interface SearchProfile {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  filters: FilterRule;
  scoringWeights: ScoringWeights;
  gameRequirements: GameRequirement[];
  notificationConfig: NotificationConfig;
  checkIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  budgetCad: number;
  defaultProfileId: string | null;
  defaultSortBy: SortOption;
  preferredGames: GameId[];
  createdAt: string;
  updatedAt: string;
}

export type SortOption =
  | 'deal_score_desc'
  | 'price_asc'
  | 'price_desc'
  | 'performance_desc'
  | 'value_desc'
  | 'price_drop_desc'
  | 'historical_low_desc'
  | 'newest_first';

export interface ScanRun {
  id: string;
  retailer: string;
  profileId: string | null;
  status: 'running' | 'success' | 'partial' | 'failed';
  listingsFound: number;
  listingsNew: number;
  listingsUpdated: number;
  errors: string[];
  startedAt: string;
  completedAt: string | null;
}

export interface RetailerConnector {
  id: string;
  retailer: string;
  displayName: string;
  logoUrl: string | null;
  isEnabled: boolean;
  isPaused: boolean;
  checkIntervalMinutes: number;
  lastScanAt: string | null;
  lastSuccessAt: string | null;
  consecutiveErrors: number;
  dataSource: ListingSource;
  notes: string | null;
}

export interface NotificationHistory {
  id: string;
  listingId: string;
  profileId: string | null;
  channel: 'discord' | 'email';
  reason: string;
  dealScore: number;
  price: number;
  sentAt: string;
  deliveryStatus: 'sent' | 'failed' | 'skipped';
}
