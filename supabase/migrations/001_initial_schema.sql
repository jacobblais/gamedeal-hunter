-- ============================================================
-- GameDeal Hunter — Database Schema
-- Supabase PostgreSQL Migration 001
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE gpu_model AS ENUM (
  'RTX 4050', 'RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090',
  'RTX 5050', 'RTX 5060', 'RTX 5070', 'RTX 5070 Ti', 'RTX 5080', 'RTX 5090',
  'RX 7600M', 'RX 7700S', 'RX 7900M', 'RX 9070M',
  'Arc A770M', 'Arc B580M',
  'OTHER', 'UNKNOWN'
);

CREATE TYPE laptop_condition AS ENUM ('new', 'open_box', 'refurbished', 'used');

CREATE TYPE listing_source AS ENUM ('api', 'scrape', 'rss', 'affiliate', 'manual');

CREATE TYPE spec_confidence AS ENUM ('verified', 'estimated', 'unknown');

CREATE TYPE scan_status AS ENUM ('running', 'success', 'partial', 'failed');

CREATE TYPE delivery_status AS ENUM ('sent', 'failed', 'skipped');

CREATE TYPE notification_channel AS ENUM ('discord', 'email');

-- ============================================================
-- PRODUCTS (normalized laptop models)
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model_number TEXT,
  -- GPU specs
  gpu gpu_model DEFAULT 'UNKNOWN',
  gpu_vram_gb SMALLINT,
  gpu_tgp_w SMALLINT,
  gpu_tgp_confidence spec_confidence DEFAULT 'unknown',
  -- CPU specs
  cpu_manufacturer TEXT,
  cpu_model TEXT,
  cpu_generation SMALLINT,
  cpu_cores SMALLINT,
  cpu_base_clock_ghz NUMERIC(4,2),
  cpu_boost_clock_ghz NUMERIC(4,2),
  -- Memory
  ram_gb SMALLINT,
  ram_type TEXT,
  storage_gb SMALLINT,
  storage_type TEXT,
  -- Display
  display_inches NUMERIC(4,1),
  display_resolution TEXT,
  display_refresh_rate_hz SMALLINT,
  display_panel TEXT,
  -- Other
  weight_kg NUMERIC(4,2),
  battery_wh NUMERIC(5,1),
  os TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_products_gpu ON products(gpu);
CREATE INDEX idx_products_brand ON products(brand);

-- ============================================================
-- RETAILER CONNECTORS
-- ============================================================

CREATE TABLE retailer_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  is_paused BOOLEAN DEFAULT FALSE NOT NULL,
  check_interval_minutes INTEGER DEFAULT 60 NOT NULL,
  last_scan_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  consecutive_errors INTEGER DEFAULT 0 NOT NULL,
  data_source listing_source DEFAULT 'scrape' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- RETAILER LISTINGS
-- ============================================================

CREATE TABLE retailer_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  retailer TEXT NOT NULL,
  retailer_listing_id TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  current_price NUMERIC(10,2) NOT NULL,
  previous_price NUMERIC(10,2),
  reference_price NUMERIC(10,2),
  shipping_cost NUMERIC(8,2),
  currency TEXT DEFAULT 'CAD' NOT NULL,
  condition laptop_condition DEFAULT 'new' NOT NULL,
  in_stock BOOLEAN DEFAULT TRUE NOT NULL,
  seller TEXT,
  is_marketplace BOOLEAN DEFAULT FALSE NOT NULL,
  source listing_source DEFAULT 'scrape' NOT NULL,
  raw_specs JSONB DEFAULT '{}',
  -- Normalized specs (may differ from product if not matched)
  gpu gpu_model DEFAULT 'UNKNOWN',
  gpu_vram_gb SMALLINT,
  gpu_tgp_w SMALLINT,
  cpu_model TEXT,
  ram_gb SMALLINT,
  storage_gb SMALLINT,
  display_resolution TEXT,
  display_refresh_rate_hz SMALLINT,
  spec_confidence SMALLINT DEFAULT 0, -- 0-100
  -- Deal score
  deal_score SMALLINT,
  score_breakdown JSONB,
  score_explanations TEXT[],
  score_warnings TEXT[],
  score_is_estimated BOOLEAN DEFAULT TRUE,
  -- Timestamps
  last_checked TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(retailer, retailer_listing_id)
);

CREATE INDEX idx_listings_product ON retailer_listings(product_id);
CREATE INDEX idx_listings_retailer ON retailer_listings(retailer);
CREATE INDEX idx_listings_gpu ON retailer_listings(gpu);
CREATE INDEX idx_listings_price ON retailer_listings(current_price);
CREATE INDEX idx_listings_score ON retailer_listings(deal_score DESC);
CREATE INDEX idx_listings_in_stock ON retailer_listings(in_stock) WHERE in_stock = TRUE;

-- ============================================================
-- PRICE OBSERVATIONS (time-series)
-- ============================================================

CREATE TABLE price_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES retailer_listings(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(8,2),
  in_stock BOOLEAN DEFAULT TRUE NOT NULL,
  observed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_price_obs_listing ON price_observations(listing_id, observed_at DESC);

-- Prevent duplicate observations (same price+stock within 1 hour)
CREATE UNIQUE INDEX idx_price_obs_dedup ON price_observations(listing_id, price, in_stock, date_trunc('hour', observed_at AT TIME ZONE 'UTC'));

-- ============================================================
-- BENCHMARK RESULTS
-- ============================================================

CREATE TABLE benchmark_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  -- Can also be for a GPU model without a specific product
  gpu gpu_model,
  game TEXT NOT NULL,
  resolution TEXT NOT NULL,
  quality TEXT NOT NULL,
  ray_tracing BOOLEAN DEFAULT FALSE,
  upscaling TEXT DEFAULT 'none',
  upscaling_mode TEXT,
  fps_min SMALLINT,
  fps_1pct_low SMALLINT,
  fps_avg SMALLINT NOT NULL,
  fps_max SMALLINT,
  is_estimate BOOLEAN DEFAULT TRUE NOT NULL,
  confidence spec_confidence DEFAULT 'estimated',
  source_url TEXT,
  source_name TEXT,
  measured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_has_product_or_gpu CHECK (product_id IS NOT NULL OR gpu IS NOT NULL)
);

CREATE INDEX idx_benchmarks_product ON benchmark_results(product_id);
CREATE INDEX idx_benchmarks_gpu ON benchmark_results(gpu);
CREATE INDEX idx_benchmarks_game ON benchmark_results(game);

-- ============================================================
-- USER PREFERENCES (single-user initially)
-- ============================================================

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- enable for multi-user
  budget_cad NUMERIC(10,2) DEFAULT 2000,
  default_profile_id UUID,
  default_sort_by TEXT DEFAULT 'deal_score_desc',
  preferred_games TEXT[] DEFAULT ARRAY['crimson_desert','black_myth_wukong','spider_man_2'],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- SEARCH PROFILES
-- ============================================================

CREATE TABLE search_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  scoring_weights JSONB NOT NULL DEFAULT '{}',
  game_requirements JSONB NOT NULL DEFAULT '[]',
  notification_config JSONB NOT NULL DEFAULT '{}',
  check_interval_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Only one default profile allowed
CREATE UNIQUE INDEX idx_profiles_single_default ON search_profiles(is_default) WHERE is_default = TRUE;

-- ============================================================
-- FAVORITES
-- ============================================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES retailer_listings(id) ON DELETE CASCADE,
  target_price NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(listing_id)
);

-- ============================================================
-- PRICE ALERTS
-- ============================================================

CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES retailer_listings(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES search_profiles(id) ON DELETE SET NULL,
  target_price NUMERIC(10,2),
  min_deal_score SMALLINT DEFAULT 70,
  notify_discord BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_alert_target CHECK (listing_id IS NOT NULL OR product_id IS NOT NULL OR profile_id IS NOT NULL)
);

-- ============================================================
-- NOTIFICATION HISTORY
-- ============================================================

CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES retailer_listings(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES search_profiles(id) ON DELETE SET NULL,
  channel notification_channel NOT NULL,
  reason TEXT NOT NULL,
  deal_score SMALLINT,
  price NUMERIC(10,2),
  payload JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivery_status delivery_status DEFAULT 'sent' NOT NULL
);

CREATE INDEX idx_notifications_listing ON notification_history(listing_id, sent_at DESC);
CREATE INDEX idx_notifications_sent ON notification_history(sent_at DESC);

-- ============================================================
-- SCAN RUNS
-- ============================================================

CREATE TABLE scan_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer TEXT NOT NULL,
  profile_id UUID REFERENCES search_profiles(id) ON DELETE SET NULL,
  status scan_status DEFAULT 'running' NOT NULL,
  listings_found INTEGER DEFAULT 0,
  listings_new INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds NUMERIC(8,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (completed_at - started_at))
  ) STORED
);

CREATE INDEX idx_scan_runs_retailer ON scan_runs(retailer, started_at DESC);
CREATE INDEX idx_scan_runs_status ON scan_runs(status);

-- ============================================================
-- SEED: RETAILER CONNECTORS
-- ============================================================

INSERT INTO retailer_connectors (retailer, display_name, data_source, check_interval_minutes, notes) VALUES
  ('best_buy_ca', 'Best Buy Canada', 'scrape', 60, 'Public product pages; respect robots.txt. Affiliate API available if enrolled.'),
  ('canada_computers', 'Canada Computers', 'scrape', 60, 'Static product pages allowed per robots.txt.'),
  ('memory_express', 'Memory Express', 'scrape', 60, 'Static product pages.'),
  ('newegg_ca', 'Newegg Canada', 'scrape', 60, 'Public listing pages.'),
  ('lenovo_ca', 'Lenovo Canada', 'scrape', 120, 'Official brand site.'),
  ('dell_ca', 'Dell Canada', 'scrape', 120, 'Official brand site.'),
  ('hp_ca', 'HP Canada', 'scrape', 120, 'Official brand site.'),
  ('amazon_ca', 'Amazon.ca', 'affiliate', 60, 'Use Product Advertising API (PA-API) only. Requires affiliate enrollment.');

-- ============================================================
-- SEED: DEFAULT SEARCH PROFILE
-- ============================================================

INSERT INTO search_profiles (name, description, is_active, is_default, filters, scoring_weights, game_requirements, notification_config)
VALUES (
  'Best Under C$2,000',
  'My main search: best gaming laptop for demanding AAA games under C$2,000.',
  TRUE,
  TRUE,
  '{
    "logic": "AND",
    "gpus": [],
    "excludeGpus": [],
    "minVramGb": 8,
    "maxVramGb": null,
    "minTgpW": null,
    "cpuManufacturers": [],
    "minRamGb": 16,
    "maxRamGb": null,
    "minStorageGb": 512,
    "minDisplayRefreshRate": 144,
    "displayResolutions": [],
    "conditions": ["new"],
    "brands": [],
    "excludeBrands": [],
    "retailers": [],
    "excludeRetailers": [],
    "minPrice": null,
    "maxPrice": 2000,
    "maxPriceWithShipping": null,
    "minDealScore": 55,
    "minHistoricalDropPct": null,
    "minSpecConfidence": null,
    "inStockOnly": true,
    "excludeMarketplace": false,
    "allowUnknownSpecs": true
  }',
  '{
    "gamingPerformance": 30,
    "priceValue": 25,
    "priceHistory": 15,
    "vram": 10,
    "ramStorage": 8,
    "displayQuality": 5,
    "sellerReliability": 4,
    "conditionBonus": 2,
    "shippingPenalty": 1
  }',
  '[
    {"gameId": "crimson_desert", "resolution": "1920x1080", "quality": "high", "targetFps": 60, "rayTracing": false, "upscaling": true, "requireMeasured": false, "priority": "required"},
    {"gameId": "black_myth_wukong", "resolution": "1920x1080", "quality": "high", "targetFps": 60, "rayTracing": false, "upscaling": true, "requireMeasured": false, "priority": "required"},
    {"gameId": "spider_man_2", "resolution": "1920x1080", "quality": "high", "targetFps": 60, "rayTracing": false, "upscaling": true, "requireMeasured": false, "priority": "preferred"}
  ]',
  '{
    "discordEnabled": false,
    "emailEnabled": false,
    "emailAddress": null,
    "minDealScore": 75,
    "maxPrice": 2000,
    "notifyOnNewListings": false,
    "notifyOnPriceDrop": true,
    "minPriceDropPct": 5
  }'
);

-- ============================================================
-- SEED: USER PREFERENCES
-- ============================================================

INSERT INTO user_preferences (budget_cad, default_sort_by, preferred_games)
VALUES (2000, 'deal_score_desc', ARRAY['crimson_desert','black_myth_wukong','spider_man_2']);

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON retailer_listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prefs_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON search_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_connectors_updated_at BEFORE UPDATE ON retailer_connectors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
