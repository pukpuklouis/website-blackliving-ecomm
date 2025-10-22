-- Cloudflare D1 Seed Data
-- Clean INSERT of essential data for development

-- Insert product categories
INSERT INTO product_categories (id, slug, title, description, series, brand, features, seo_keywords, url_path, is_active, sort_order, created_at, updated_at) VALUES
('cat_simmons_black', 'simmons-black', '席夢思黑標系列', '頂級手工製作的席夢思黑標床墊，為您提供無與倫比的睡眠體驗', 'Simmons Black Label', 'Simmons', '["頂級手工製作", "獨特袋裝彈簧系統", "優質記憶棉層", "抗菌防螨技術", "30年品質保證"]', '席夢思黑標,頂級床墊,手工製作,袋裝彈簧', '/simmons-black', 1, 1, 1735935600000, 1735935600000),
('cat_accessories', 'accessories', '精品睡眠配件', '嚴選枕頭、保潔墊與床墊保養用品，為您的睡眠帶來完整體驗', 'Premium Sleep Accessories', 'Black Living', '["專業搭配建議", "多樣配件選擇", "優質材料把關"]', '睡眠配件,枕頭,保潔墊', '/accessories', 1, 2, 1735935600000, 1735935600000),
('cat_us_imports', 'us-imports', '美國進口床墊系列', '美國原裝進口床墊與寢具用品，敬請期待更多上架商品', 'US Imports Collection', 'Black Living', '["美國原廠授權", "嚴選進口流程", "專業採購諮詢"]', '美國進口床墊,進口睡眠用品', '/us-imports', 1, 3, 1735935600000, 1735935600000);


-- Verify data insertion
-- Check total rows inserted (expect 3 for initial seed)
SELECT COUNT(*) AS total_categories FROM product_categories;

-- Display key fields for quick verification (sorted by sort_order)
SELECT id, slug, title, is_active, sort_order FROM product_categories ORDER BY sort_order;
