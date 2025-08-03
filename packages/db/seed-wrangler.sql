-- Cloudflare D1 Seed Data
-- Clean insert of essential data for development

-- Clear existing data
DELETE FROM users;
DELETE FROM products;
DELETE FROM customer_profiles;

-- Insert users
INSERT INTO users (id, name, email, email_verified, phone, role, image, preferences, created_at, updated_at) VALUES 
('user_admin_001', 'Louis Chen', 'pukpuk.tw@gmail.com', 1, '+886-912-345-678', 'admin', 'https://lh3.googleusercontent.com/a/ACg8ocJZWZvXJZ4YyeVNF9tD-V553wXeGPOn3hXM-lvst-p15Jg-d4oQ=s96-c', '{"theme": "light", "notifications": true}', 1735935600000, 1735935600000),
('user_customer_001', '王小明', 'wang@example.com', 1, '+886-987-654-321', 'customer', NULL, '{"theme": "light", "emailUpdates": true}', 1735935600000, 1735935600000),
('user_customer_002', '李美華', 'lee@example.com', 1, '+886-912-888-999', 'customer', NULL, '{"emailUpdates": false}', 1735935600000, 1735935600000),
('user_customer_003', '陳志強', 'chen@example.com', 1, '+886-955-123-456', 'customer', NULL, '{"theme": "dark"}', 1735935600000, 1735935600000);

-- Insert products
INSERT INTO products (id, name, slug, description, category, images, variants, features, specifications, in_stock, featured, sort_order, seo_title, seo_description, created_at, updated_at) VALUES 
('prod_001', '席夢思黑牌 Classic 獨立筒床墊', 'simmons-black-classic', '席夢思頂級黑牌系列，採用獨立筒彈簧技術，提供絕佳的支撐與舒適度。適合各種睡眠姿勢，讓您享受一夜好眠。', 'simmons-black', '["https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]', '[{"id": "var_001", "name": "標準雙人 150x188cm", "sku": "SB-CL-150", "price": 89000, "originalPrice": 110000, "size": "150x188cm", "firmness": "中偏硬", "inStock": true, "sortOrder": 0}, {"id": "var_002", "name": "加大雙人 180x188cm", "sku": "SB-CL-180", "price": 109000, "originalPrice": 130000, "size": "180x188cm", "firmness": "中偏硬", "inStock": true, "sortOrder": 1}]', '["獨立筒彈簧支撐系統", "天然乳膠舒適層", "透氣竹炭纖維面料", "十年品質保證", "免費到府安裝"]', '{"彈簧數量": "1000+ 獨立筒", "厚度": "32cm", "硬度": "中偏硬", "保固": "10年", "產地": "台灣製造"}', 1, 1, 0, '席夢思黑牌Classic床墊 | 台灣總代理 | 黑哥家居', '席夢思頂級黑牌Classic獨立筒床墊，提供極致睡眠品質。十年保固，免費到府安裝，分期0利率。', 1735935600000, 1735935600000),
('prod_002', '防蟎枕頭保護套組', 'pillow-protector-set', '高品質防蟎枕頭保護套，有效防止塵蟎孳生，保護您的健康睡眠環境。一組包含2個枕頭套。', 'accessories', '["https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800"]', '[{"id": "var_002", "name": "標準尺寸 48x74cm", "sku": "ACC-PP-STD", "price": 1980, "size": "48x74cm", "inStock": true, "sortOrder": 0}]', '["防蟎抗菌材質", "透氣不悶熱", "可機洗清潔", "包裝附贈2個"]', '{"材質": "聚酯纖維", "尺寸": "48x74cm", "數量": "2個/組", "清潔": "可機洗"}', 1, 0, 0, '防蟎枕頭保護套 | 健康寢具 | 黑哥家居', '高品質防蟎枕頭保護套組，有效防護塵蟎，維護睡眠健康。可機洗，一組2個。', 1735935600000, 1735935600000);

-- Insert customer_profiles
INSERT INTO customer_profiles (
  id, customer_number, name, email, phone, segment,
  total_spent, order_count, avg_order_value,
  created_at, updated_at
) VALUES
('cust_001', 'CU20240001', '王小明', 'wang@example.com', '+886-987-654-321', 'vip', 150000, 3, 50000, 1735935600000, 1735935600000),
('cust_002', 'CU20240002', '李美華', 'lee@example.com', '+886-912-888-999', 'regular', 85000, 2, 42500, 1735935600000, 1735935600000),
('cust_003', 'CU20240003', '陳志強', 'chen@example.com', '+886-955-123-456', 'new', 0, 0, 0, 1735935600000, 1735935600000);

-- Verify data insertion
SELECT 'Users inserted:' as info, COUNT(*) as count FROM users;
SELECT 'Products inserted:' as info, COUNT(*) as count FROM products;
SELECT 'Customer profiles inserted:' as info, COUNT(*) as count FROM customer_profiles;