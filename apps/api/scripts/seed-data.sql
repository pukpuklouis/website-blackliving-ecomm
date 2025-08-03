-- Sample data for BlackLiving database
-- Run with: wrangler d1 execute blackliving-db --file=./scripts/seed-data.sql --local

-- Clear existing data
DELETE FROM customer_interactions;
DELETE FROM customer_tag_assignments;
DELETE FROM customer_tags;
DELETE FROM customer_profiles;
DELETE FROM appointments;
DELETE FROM orders;

-- Insert Users (admin)
INSERT OR REPLACE INTO users (
  id, name, email, email_verified, role, phone, image, preferences, created_at, updated_at
) VALUES 
(
  'user_admin_001',
  'Louis Chen', 
  'pukpuk.tw@gmail.com',
  1,
  'admin',
  '+886-912-345-678',
  'https://lh3.googleusercontent.com/a/ACg8ocJZWZvXJZ4YyeVNF9tD-V553wXeGPOn3hXM-lvst-p15Jg-d4oQ=s96-c',
  '{"theme":"light","notifications":true}',
  1735838400000,
  1735838400000
),
(
  'user_customer_001',
  '王小明',
  'wang@example.com', 
  1,
  'customer',
  '+886-987-654-321',
  NULL,
  '{"theme":"light","emailUpdates":true}',
  1735838400000,
  1735838400000
);

-- Insert Customer Tags
INSERT INTO customer_tags (id, name, color, description, category, created_at) VALUES
('tag_001', 'VIP客戶', '#8B5CF6', '消費金額超過50萬的頂級客戶', 'behavioral', 1735838400000),
('tag_002', '回購客戶', '#10B981', '有多次購買記錄的忠實客戶', 'behavioral', 1735838400000),
('tag_003', '年輕族群', '#F59E0B', '25-35歲的年輕消費族群', 'demographic', 1735838400000);

-- Insert Customer Profiles
INSERT INTO customer_profiles (
  id, user_id, customer_number, name, email, phone, birthday, gender,
  address, shipping_addresses, total_spent, order_count, avg_order_value,
  last_purchase_at, first_purchase_at, favorite_categories, segment,
  lifetime_value, churn_risk, last_contact_at, contact_preference,
  notes, source, created_at, updated_at
) VALUES
(
  'customer_001',
  'user_customer_001', 
  'CU202501001',
  '王小明',
  'wang@example.com',
  '+886-987-654-321',
  '1985-06-15',
  'male',
  '{"city":"台北市","district":"信義區","street":"信義路五段7號","postalCode":"110"}',
  '[{"city":"台北市","district":"信義區","street":"信義路五段7號","postalCode":"110"}]',
  150000,
  3,
  50000,
  1735664400000, -- 2025-01-01
  1703728400000, -- 2024-01-01  
  '["simmons-black","accessories"]',
  'vip',
  200000,
  'low',
  1735750800000, -- recent
  'email',
  '重要VIP客戶，對品質要求極高，推薦高端產品',
  'google_ads',
  1735838400000,
  1735838400000
),
(
  'customer_002',
  NULL,
  'CU202501002',
  '李美華', 
  'lee@example.com',
  '+886-912-888-999',
  '1990-03-22',
  'female',
  '{"city":"新北市","district":"板橋區","street":"文化路一段188號","postalCode":"220"}',
  '[]',
  45000,
  1,
  45000,
  1733072400000, -- 2024-12-02
  1733072400000, -- 2024-12-02
  '["accessories"]',
  'new',
  60000,
  'medium',
  NULL,
  'phone',
  '首次購買客戶，對價格較敏感',
  'facebook_ads',
  1735838400000,
  1735838400000
),
(
  'customer_003',
  NULL,
  'CU202501003',
  '陳志強',
  'chen@example.com',
  '+886-955-123-456',
  '1978-12-05', 
  'male',
  '{"city":"台中市","district":"西屯區","street":"台灣大道三段99號","postalCode":"407"}',
  '[]',
  280000,
  4,
  70000,
  1728748800000, -- 2024-10-15
  1652140800000, -- 2022-05-10
  '["simmons-black","us-imports"]',
  'regular',
  350000,
  'low',
  NULL,
  'email',
  '穩定回購客戶，偏好美國進口產品',
  'referral',
  1735838400000,
  1735838400000
);

-- Insert Customer Tag Assignments
INSERT INTO customer_tag_assignments (
  id, customer_profile_id, customer_tag_id, assigned_by, assigned_at
) VALUES
('assign_001', 'customer_001', 'tag_001', 'admin', 1735838400000),
('assign_002', 'customer_001', 'tag_002', 'admin', 1735838400000),
('assign_003', 'customer_002', 'tag_003', 'admin', 1735838400000),
('assign_004', 'customer_003', 'tag_002', 'admin', 1735838400000);

-- Insert Customer Interactions
INSERT INTO customer_interactions (
  id, customer_profile_id, type, title, description, performed_by, metadata, created_at
) VALUES
(
  'interaction_001',
  'customer_001',
  'call',
  '產品諮詢電話',
  '客戶詢問新款床墊規格與價格',
  'Louis Chen',
  '{"duration":"15分鐘","outcome":"已發送報價單"}',
  1735665600000
),
(
  'interaction_002',
  'customer_001', 
  'purchase',
  '完成訂單 ORD-001',
  '購買席夢思黑牌Classic床墊',
  'system',
  '{"amount":89000,"method":"信用卡"}',
  1735060800000
);

-- Insert Orders
INSERT INTO orders (
  id, order_number, customer_id, customer_name, customer_email, customer_phone,
  items, subtotal, shipping_fee, tax, total_amount, shipping_address,
  payment_method, payment_status, order_status, notes, created_at, updated_at
) VALUES
(
  'ORD-001',
  'BL-2024-001', 
  'customer_001',
  '王小明',
  'wang@example.com',
  '+886-987-654-321',
  '[{"productId":"prod_001","variantId":"var_001","name":"席夢思黑牌 Classic 獨立筒床墊","variant":"標準雙人 150x188cm","price":89000,"quantity":1,"total":89000}]',
  89000,
  0,
  0,
  89000,
  '{"name":"王小明","phone":"+886-987-654-321","city":"台北市","district":"信義區","street":"信義路五段7號","postalCode":"110"}',
  'credit_card',
  'paid',
  'delivered',
  '客戶要求週末配送',
  1734541200000, -- 2024-12-18
  1734541200000
),
(
  'ORD-002',
  'BL-2024-002',
  'customer_002',
  '李美華',
  'lee@example.com', 
  '+886-912-888-999',
  '[{"productId":"prod_002","variantId":"var_002","name":"防蟎枕頭保護套組","variant":"標準尺寸 48x74cm","price":1980,"quantity":2,"total":3960}]',
  3960,
  150,
  0,
  4110,
  '{"name":"李美華","phone":"+886-912-888-999","city":"新北市","district":"板橋區","street":"文化路一段188號","postalCode":"220"}',
  'bank_transfer',
  'pending',
  'processing',
  '',
  1735146000000, -- 2024-12-25
  1735146000000
);

-- Insert Appointments
INSERT INTO appointments (
  id, customer_name, customer_email, customer_phone, appointment_date,
  time_slot, service_type, status, notes, preferred_products,
  assigned_staff, created_at, updated_at
) VALUES
(
  'apt_001',
  '張三豐',
  'zhang@example.com',
  '+886-922-333-444',
  1736703600000, -- 2025-01-15 14:00
  '14:00-15:00',
  'showroom_visit',
  'confirmed',
  '希望試躺床墊，比較不同硬度',
  '["席夢思黑牌","美國進口枕頭"]',
  'Louis Chen',
  1735838400000,
  1735838400000
),
(
  'apt_002',
  '林小雨',
  'lin@example.com',
  '+886-933-666-777', 
  1736962800000, -- 2025-01-18 10:00
  '10:00-11:00',
  'home_consultation',
  'pending',
  '新居裝潢，需要整套寢具建議',
  '[]',
  '',
  1735838400000,
  1735838400000
);

-- Verify data insertion
SELECT 'customer_profiles' as table_name, COUNT(*) as count FROM customer_profiles
UNION ALL
SELECT 'customer_tags', COUNT(*) FROM customer_tags  
UNION ALL
SELECT 'customer_tag_assignments', COUNT(*) FROM customer_tag_assignments
UNION ALL
SELECT 'customer_interactions', COUNT(*) FROM customer_interactions
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL  
SELECT 'appointments', COUNT(*) FROM appointments;