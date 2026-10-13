-- ============================================================
-- GameDeal Hunter — Sample Data (CLEARLY LABELED AS FAKE)
-- Migration 002: Development seed data only
-- DO NOT RUN in production
-- ============================================================

-- NOTE: All prices, products, and listings below are synthetic
-- development data. They are NOT real offers from Canadian retailers.

-- ============================================================
-- SAMPLE PRODUCTS
-- ============================================================

INSERT INTO products (slug, name, brand, model_number, gpu, gpu_vram_gb, gpu_tgp_w, gpu_tgp_confidence,
  cpu_manufacturer, cpu_model, cpu_generation, cpu_cores, cpu_boost_clock_ghz,
  ram_gb, ram_type, storage_gb, storage_type,
  display_inches, display_resolution, display_refresh_rate_hz, display_panel, os)
VALUES
  ('asus-rog-strix-g16-2025', 'ASUS ROG Strix G16 (2025)', 'ASUS', 'G614JVR', 'RTX 5070', 8, 115, 'verified',
   'Intel', 'Core Ultra 9 275HX', 15, 24, 5.4,
   32, 'DDR5', 1024, 'SSD', 16.0, '2560x1600', 165, 'IPS', 'Windows 11 Home'),

  ('lenovo-legion-5i-pro-2025', 'Lenovo Legion 5i Pro 2025', 'Lenovo', '83DH0000CA', 'RTX 5070 Ti', 12, 150, 'verified',
   'Intel', 'Core Ultra 7 265HX', 15, 20, 5.3,
   32, 'DDR5', 1024, 'SSD', 16.0, '2560x1600', 240, 'IPS', 'Windows 11 Home'),

  ('msi-titan-gt77-rtx5080', 'MSI Titan GT77 RTX 5080', 'MSI', 'GT77HX-13VI', 'RTX 5080', 16, 175, 'estimated',
   'Intel', 'Core i9-13980HX', 13, 24, 5.6,
   64, 'DDR5', 2048, 'SSD', 17.3, '3840x2160', 144, 'IPS', 'Windows 11 Pro'),

  ('acer-nitro-5-rtx4060', 'Acer Nitro 5 AN515-58', 'Acer', 'NH.QFHAA.001', 'RTX 4060', 8, 80, 'verified',
   'Intel', 'Core i7-12700H', 12, 14, 4.7,
   16, 'DDR4', 512, 'SSD', 15.6, '1920x1080', 144, 'IPS', 'Windows 11 Home'),

  ('dell-g16-rtx4070', 'Dell G16 Gaming Laptop', 'Dell', 'G7620-7547BLK', 'RTX 4070', 8, 125, 'verified',
   'Intel', 'Core i7-13650HX', 13, 14, 4.9,
   16, 'DDR5', 512, 'SSD', 16.0, '2560x1600', 165, 'IPS', 'Windows 11 Home'),

  ('gigabyte-aero-16-oled-rtx4080', 'Gigabyte AERO 16 OLED RTX 4080', 'Gigabyte', 'AERO 16 BSF', 'RTX 4080', 12, 150, 'estimated',
   'Intel', 'Core i9-13980HX', 13, 24, 5.6,
   32, 'DDR5', 2048, 'SSD', 16.0, '3840x2400', 60, 'OLED', 'Windows 11 Pro'),

  ('hp-omen-16-rtx5060', 'HP OMEN 16 (2025)', 'HP', '9P4H5UA#ABA', 'RTX 5060', 8, 95, 'estimated',
   'AMD', 'Ryzen 9 8945HX', 8, 8, 5.2,
   16, 'DDR5', 512, 'SSD', 16.1, '1920x1080', 165, 'IPS', 'Windows 11 Home');

-- ============================================================
-- SAMPLE RETAILER LISTINGS (⚠️ FAKE DEVELOPMENT DATA)
-- ============================================================

INSERT INTO retailer_listings (
  product_id, retailer, retailer_listing_id, name, url, image_url,
  current_price, previous_price, reference_price, shipping_cost,
  currency, condition, in_stock, seller, is_marketplace, source,
  gpu, gpu_vram_gb, gpu_tgp_w, cpu_model, ram_gb, storage_gb,
  display_resolution, display_refresh_rate_hz, spec_confidence,
  deal_score, score_explanations, score_warnings, score_is_estimated,
  raw_specs
)
SELECT
  p.id,
  'best_buy_ca',
  'BestBuyCA-' || p.slug,
  '⚠️ [SAMPLE DATA] ' || p.name,
  'https://www.bestbuy.ca/placeholder/' || p.slug,
  NULL,
  CASE p.gpu
    WHEN 'RTX 5080' THEN 2999.99
    WHEN 'RTX 5070 Ti' THEN 2299.99
    WHEN 'RTX 5070' THEN 1899.99
    WHEN 'RTX 5060' THEN 1399.99
    WHEN 'RTX 4080' THEN 2499.99
    WHEN 'RTX 4070' THEN 1599.99
    WHEN 'RTX 4060' THEN 1099.99
    ELSE 999.99
  END,
  CASE p.gpu
    WHEN 'RTX 5080' THEN 3199.99
    WHEN 'RTX 5070 Ti' THEN 2499.99
    WHEN 'RTX 5070' THEN 1999.99
    WHEN 'RTX 5060' THEN 1549.99
    WHEN 'RTX 4080' THEN 2699.99
    WHEN 'RTX 4070' THEN 1799.99
    WHEN 'RTX 4060' THEN 1249.99
    ELSE 1149.99
  END,
  CASE p.gpu
    WHEN 'RTX 5080' THEN 3299.99
    WHEN 'RTX 5070 Ti' THEN 2599.99
    WHEN 'RTX 5070' THEN 2099.99
    WHEN 'RTX 5060' THEN 1599.99
    WHEN 'RTX 4080' THEN 2799.99
    WHEN 'RTX 4070' THEN 1899.99
    WHEN 'RTX 4060' THEN 1299.99
    ELSE 1199.99
  END,
  0,
  'CAD', 'new', TRUE, NULL, FALSE, 'manual',
  p.gpu, p.gpu_vram_gb, p.gpu_tgp_w, p.cpu_model, p.ram_gb, p.storage_gb,
  p.display_resolution, p.display_refresh_rate_hz, 85,
  CASE p.gpu
    WHEN 'RTX 5080' THEN 88
    WHEN 'RTX 5070 Ti' THEN 85
    WHEN 'RTX 5070' THEN 82
    WHEN 'RTX 5060' THEN 72
    WHEN 'RTX 4080' THEN 78
    WHEN 'RTX 4070' THEN 74
    WHEN 'RTX 4060' THEN 64
    ELSE 60
  END,
  ARRAY['Strong estimated gaming performance', 'Price lower than previous observed', 'High spec confidence'],
  ARRAY['⚠️ SAMPLE DATA — not a real listing'],
  TRUE,
  '{}'
FROM products p;

-- Add a second retailer listing for some products
INSERT INTO retailer_listings (
  product_id, retailer, retailer_listing_id, name, url, image_url,
  current_price, previous_price, reference_price, shipping_cost,
  currency, condition, in_stock, seller, is_marketplace, source,
  gpu, gpu_vram_gb, gpu_tgp_w, cpu_model, ram_gb, storage_gb,
  display_resolution, display_refresh_rate_hz, spec_confidence,
  deal_score, score_explanations, score_warnings, score_is_estimated,
  raw_specs
)
SELECT
  p.id,
  'canada_computers',
  'CC-' || p.slug,
  '⚠️ [SAMPLE DATA] ' || p.name,
  'https://www.canadacomputers.com/placeholder/' || p.slug,
  NULL,
  CASE p.gpu
    WHEN 'RTX 5080' THEN 2949.99
    WHEN 'RTX 5070 Ti' THEN 2249.99
    WHEN 'RTX 5070' THEN 1849.99
    WHEN 'RTX 5060' THEN 1379.99
    WHEN 'RTX 4080' THEN 2449.99
    WHEN 'RTX 4070' THEN 1549.99
    WHEN 'RTX 4060' THEN 1079.99
    ELSE 979.99
  END,
  NULL,
  NULL,
  0,
  'CAD', 'new', TRUE, NULL, FALSE, 'manual',
  p.gpu, p.gpu_vram_gb, p.gpu_tgp_w, p.cpu_model, p.ram_gb, p.storage_gb,
  p.display_resolution, p.display_refresh_rate_hz, 75,
  CASE p.gpu
    WHEN 'RTX 5080' THEN 89
    WHEN 'RTX 5070 Ti' THEN 86
    WHEN 'RTX 5070' THEN 83
    WHEN 'RTX 5060' THEN 73
    WHEN 'RTX 4080' THEN 79
    WHEN 'RTX 4070' THEN 75
    WHEN 'RTX 4060' THEN 65
    ELSE 61
  END,
  ARRAY['Competitive price at Canada Computers', 'Good spec confidence'],
  ARRAY['⚠️ SAMPLE DATA — not a real listing'],
  TRUE,
  '{}'
FROM products p
WHERE p.gpu IN ('RTX 5070', 'RTX 4070', 'RTX 4060');

-- ============================================================
-- SAMPLE PRICE OBSERVATIONS
-- ============================================================

INSERT INTO price_observations (listing_id, price, shipping_cost, in_stock, observed_at)
SELECT
  rl.id,
  rl.current_price + (random() * 200 - 100),
  0,
  TRUE,
  NOW() - INTERVAL '1 day' * generate_series
FROM retailer_listings rl
CROSS JOIN generate_series(1, 30);

-- Latest observation = current price
INSERT INTO price_observations (listing_id, price, shipping_cost, in_stock, observed_at)
SELECT id, current_price, shipping_cost, in_stock, NOW()
FROM retailer_listings
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE BENCHMARK DATA (estimates only)
-- ============================================================

INSERT INTO benchmark_results (gpu, game, resolution, quality, ray_tracing, upscaling, upscaling_mode,
  fps_min, fps_1pct_low, fps_avg, fps_max, is_estimate, confidence, source_name)
VALUES
  -- RTX 5070 — Crimson Desert (estimated based on similar hardware)
  ('RTX 5070', 'crimson_desert', '1920x1080', 'high', FALSE, 'dlss', 'quality', 68, 72, 85, 105, TRUE, 'estimated', 'Estimate from RTX 4070 Ti mobile benchmarks'),
  ('RTX 5070', 'crimson_desert', '2560x1440', 'high', FALSE, 'dlss', 'quality', 58, 62, 72, 88, TRUE, 'estimated', 'Estimate from RTX 4070 Ti mobile benchmarks'),
  ('RTX 5070', 'black_myth_wukong', '1920x1080', 'high', FALSE, 'dlss', 'quality', 72, 76, 89, 108, TRUE, 'estimated', 'Estimate from RTX 4070 Ti mobile'),
  ('RTX 5070', 'black_myth_wukong', '2560x1440', 'high', FALSE, 'dlss', 'quality', 60, 65, 76, 92, TRUE, 'estimated', 'Estimate from RTX 4070 Ti mobile'),
  ('RTX 5070', 'spider_man_2', '1920x1080', 'high', FALSE, 'dlss', 'quality', 80, 84, 98, 118, TRUE, 'estimated', 'Estimate based on GPU tier'),
  ('RTX 5070', 'cyberpunk_2077', '1920x1080', 'ultra', FALSE, 'dlss', 'quality', 65, 70, 82, 98, TRUE, 'estimated', 'Estimate from RTX 4070 Ti mobile'),
  -- RTX 5070 Ti
  ('RTX 5070 Ti', 'crimson_desert', '1920x1080', 'high', FALSE, 'dlss', 'quality', 82, 88, 102, 125, TRUE, 'estimated', 'Estimate from GPU tier'),
  ('RTX 5070 Ti', 'black_myth_wukong', '1920x1080', 'high', FALSE, 'dlss', 'quality', 88, 94, 110, 132, TRUE, 'estimated', 'Estimate from GPU tier'),
  ('RTX 5070 Ti', 'spider_man_2', '1920x1080', 'high', FALSE, 'dlss', 'quality', 95, 100, 118, 142, TRUE, 'estimated', 'Estimate from GPU tier'),
  -- RTX 5080
  ('RTX 5080', 'crimson_desert', '2560x1440', 'ultra', FALSE, 'dlss', 'quality', 90, 96, 112, 138, TRUE, 'estimated', 'Estimate from GPU tier'),
  ('RTX 5080', 'black_myth_wukong', '2560x1440', 'ultra', FALSE, 'dlss', 'quality', 95, 100, 118, 145, TRUE, 'estimated', 'Estimate from GPU tier'),
  -- RTX 4070
  ('RTX 4070', 'crimson_desert', '1920x1080', 'high', FALSE, 'dlss', 'quality', 58, 62, 72, 88, TRUE, 'estimated', 'Estimate from desktop RTX 4070 scaled to 125W mobile'),
  ('RTX 4070', 'black_myth_wukong', '1920x1080', 'high', FALSE, 'dlss', 'quality', 62, 67, 78, 95, TRUE, 'estimated', 'Estimate'),
  ('RTX 4070', 'spider_man_2', '1920x1080', 'high', FALSE, 'dlss', 'quality', 70, 75, 88, 108, TRUE, 'estimated', 'Estimate'),
  -- RTX 4060
  ('RTX 4060', 'crimson_desert', '1920x1080', 'high', FALSE, 'dlss', 'quality', 48, 52, 62, 78, TRUE, 'estimated', 'Estimate from RTX 3070 mobile baseline'),
  ('RTX 4060', 'black_myth_wukong', '1920x1080', 'high', FALSE, 'dlss', 'quality', 52, 56, 68, 82, TRUE, 'estimated', 'Estimate'),
  ('RTX 4060', 'spider_man_2', '1920x1080', 'high', FALSE, 'dlss', 'quality', 58, 62, 74, 90, TRUE, 'estimated', 'Estimate'),
  -- RTX 4080
  ('RTX 4080', 'crimson_desert', '2560x1440', 'high', FALSE, 'dlss', 'quality', 78, 84, 98, 120, TRUE, 'estimated', 'Estimate'),
  ('RTX 4080', 'black_myth_wukong', '2560x1440', 'high', FALSE, 'dlss', 'quality', 82, 88, 104, 128, TRUE, 'estimated', 'Estimate'),
  -- RTX 5060
  ('RTX 5060', 'crimson_desert', '1920x1080', 'high', FALSE, 'dlss', 'quality', 62, 67, 78, 95, TRUE, 'estimated', 'Estimate from GPU tier'),
  ('RTX 5060', 'black_myth_wukong', '1920x1080', 'high', FALSE, 'dlss', 'quality', 66, 70, 84, 100, TRUE, 'estimated', 'Estimate from GPU tier'),
  ('RTX 5060', 'spider_man_2', '1920x1080', 'high', FALSE, 'dlss', 'quality', 72, 76, 92, 112, TRUE, 'estimated', 'Estimate from GPU tier');
