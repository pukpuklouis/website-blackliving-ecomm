-- Cloudflare D1 Seed Data
-- Clean INSERT of essential data for development


-- Insert products from Simmons product data
INSERT INTO products (id, name, slug, description, category, images, variants, features, specifications, in_stock, featured, sort_order, seo_title, seo_description, created_at, updated_at) VALUES 
('prod_s01', '席夢思 Series One', 'simmons-series-one', '席夢思 Series One 系列，提供從特硬到柔軟枕頭層等多種選擇，滿足不同睡眠需求。採用睡眠氣候技術與三弦鋼獨立筒，為您帶來穩固舒適的睡眠體驗。', 'simmons-black', '[
  "https://pub-bdf23ffacc974ac28ddec02806cf30cb.r2.dev/s1%20extra%20firm.png",
  "https://pub-bdf23ffacc974ac28ddec02806cf30cb.r2.dev/s1%20extra%20firm-1.png",
  "https://pub-bdf23ffacc974ac28ddec02806cf30cb.r2.dev/s1%20extra%20firm2.png"
]', '[
  {"id": "var_s01_ef_dbl", "name": "標準雙人", "sku": "SS1-EF-DBL", "price": 92000, "originalPrice": 115000, "size": "double", "firmness": "extra-firm", "stock": 8, "inStock": true, "sortOrder": 0},
  {"id": "var_s01_ef_qen", "name": "加大雙人", "sku": "SS1-EF-QEN", "price": 112000, "originalPrice": 135000, "size": "queen", "firmness": "extra-firm", "stock": 5, "inStock": true, "sortOrder": 1},
  {"id": "var_s01_md_dbl", "name": "標準雙人", "sku": "SS1-MD-DBL", "price": 92000, "originalPrice": 115000, "size": "double", "firmness": "medium", "stock": 10, "inStock": true, "sortOrder": 2},
  {"id": "var_s01_md_qen", "name": "加大雙人", "sku": "SS1-MD-QEN", "price": 112000, "originalPrice": 135000, "size": "queen", "firmness": "medium", "stock": 7, "inStock": true, "sortOrder": 3},
  {"id": "var_s01_pl_dbl", "name": "標準雙人", "sku": "SS1-PL-DBL", "price": 92000, "originalPrice": 115000, "size": "double", "firmness": "plush", "stock": 7, "inStock": true, "sortOrder": 4},
  {"id": "var_s01_pl_qen", "name": "加大雙人", "sku": "SS1-PL-QEN", "price": 112000, "originalPrice": 135000, "size": "queen", "firmness": "plush", "stock": 4, "inStock": true, "sortOrder": 5},
  {"id": "var_s01_fpt_qen", "name": "加大雙人", "sku": "SS1-FPT-QEN", "price": 122000, "originalPrice": 145000, "size": "queen", "firmness": "firm-pillow-top", "stock": 6, "inStock": true, "sortOrder": 6}
]', '["睡眠氣候™技術", "三弦鋼獨立筒袋裝彈簧科技", "Beautyrest® 凝膠記憶泡棉", "硬質舒適泡棉", "涼感高密度泡棉", "空氣感泡棉", "膠感泡棉", "Pillow Top 舒適層"]', '{"硬度": "提供特硬、適中、柔軟、適中偏硬等多種選擇", "技術": "睡眠氣候™, 三弦鋼獨立筒", "泡棉類型": "硬質, 涼感高密度, 凝膠記憶泡棉, 空氣感, 膠感", "保固": "10年"}', 1, 1, 1, '席夢思 Series One | 黑哥家居', '探索席夢思 Series One 床墊系列，提供多種硬度選擇，為您量身打造無與倫比的支撐與舒適。立即選購，享受優質睡眠。', 1735935600000, 1735935600000),



-- Verify data insertion
-- SELECT 'Products inserted:' as info, COUNT(*) as count FROM products;
-- SELECT 'Posts inserted:' as info, COUNT(*) as count FROM posts;