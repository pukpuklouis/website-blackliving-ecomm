-- Customer Account Seed Data
-- Seed data for new customer account management tables

-- Sample Customer Addresses (台灣地址格式)
INSERT INTO customer_addresses (id, user_id, type, label, is_default, recipient_name, recipient_phone, city, district, postal_code, street, building, floor, room, delivery_instructions, access_code, usage_count, is_active, created_at, updated_at) VALUES
-- 王小明的地址
('ca_sample_001', 'user_customer_001', 'both', '家裡', 1, '王小明', '0912345678', '台北市', '信義區', '110', '信義路五段100號', '台北101大樓', '88', '8801', '請按門鈴，白天在家', '1234', 5, 1, 1704067200000, 1704067200000),
('ca_sample_002', 'user_customer_001', 'shipping', '公司', 0, '王小明', '0912345678', '台北市', '中山區', '104', '南京東路三段50號', '商業大樓', '12', '1205', '上班時間收件', '5678', 2, 1, 1704067200000, 1704067200000),

-- 李美華的地址
('ca_sample_003', 'user_customer_002', 'both', '家裡', 1, '李美華', '0923456789', '新北市', '板橋區', '220', '文化路一段200號', '板橋住宅', '5', '502', '管理員代收', '9876', 3, 1, 1704067200000, 1704067200000),
('ca_sample_004', 'user_customer_002', 'shipping', '娘家', 0, '李媽媽', '0934567890', '桃園市', '中壢區', '320', '中正路300號', '', '', '', '假日在家', '', 1, 1, 1704067200000, 1704067200000);

-- Sample Payment Methods (安全的代幣化資料)
INSERT INTO customer_payment_methods (id, user_id, type, provider, card_token, last_four_digits, expiry_month, expiry_year, cardholder_name, bank_name, bank_code, account_type, account_last_four, wallet_provider, wallet_account_id, is_default, is_active, nickname, last_used_at, usage_count, created_at, updated_at) VALUES
-- 王小明的付款方式
('cpm_sample_001', 'user_customer_001', 'credit_card', 'visa', 'tok_visa_xxxxxxxxxxxx1234', '1234', '12', '2025', '王小明', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '我的Visa卡', 1704067200000, 8, 1704067200000, 1704067200000),
('cpm_sample_002', 'user_customer_001', 'digital_wallet', 'line_pay', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'line_pay', 'lp_encrypted_account_001', 0, 1, 'LINE Pay', 1704067200000, 3, 1704067200000, 1704067200000),

-- 李美華的付款方式
('cpm_sample_003', 'user_customer_002', 'credit_card', 'mastercard', 'tok_mastercard_xxxxxxxxxxxx5678', '5678', '08', '2026', '李美華', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '主要信用卡', 1704067200000, 5, 1704067200000, 1704067200000),
('cpm_sample_004', 'user_customer_002', 'bank_account', NULL, NULL, NULL, NULL, NULL, NULL, '台灣銀行', '004', 'checking', '9999', NULL, NULL, 0, 1, '薪轉戶', 1704067200000, 2, 1704067200000, 1704067200000);

-- Sample User Security Records
INSERT INTO user_security (id, user_id, password_hash, password_salt, password_last_changed, force_password_change, last_login_at, last_login_ip, last_login_user_agent, login_count, two_factor_enabled, two_factor_secret, backup_codes, is_locked, locked_at, locked_reason, failed_login_attempts, last_failed_login_at, allow_data_collection, allow_marketing, allow_sms_marketing, created_at, updated_at) VALUES
-- 王小明的安全設定
('us_sample_001', 'user_customer_001', '$2b$12$example_hash_for_user_001', 'salt_001', 1704067200000, 0, 1735862400000, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 45, 0, NULL, '[]', 0, NULL, NULL, 0, NULL, 1, 1, 0, 1704067200000, 1735862400000),

-- 李美華的安全設定
('us_sample_002', 'user_customer_002', '$2b$12$example_hash_for_user_002', 'salt_002', 1704067200000, 0, 1735862400000, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 32, 1, 'JBSWY3DPEHPK3PXP', '["backup001", "backup002", "backup003"]', 0, NULL, NULL, 0, NULL, 1, 1, 1, 1704067200000, 1735862400000);

-- Sample Wishlist Items
INSERT INTO customer_wishlists (id, user_id, product_id, variant_id, notes, priority, price_alert, added_at, last_viewed_at, view_count) VALUES
-- 王小明的願望清單
('cw_sample_001', 'user_customer_001', 'prod_001', 'var_king_size', '想等促銷再買', 'high', 80000.00, 1704067200000, 1735862400000, 8),
('cw_sample_002', 'user_customer_001', 'prod_002', NULL, '配合床墊一起買', 'medium', NULL, 1704153600000, 1735862400000, 3),

-- 李美華的願望清單
('cw_sample_003', 'user_customer_002', 'prod_001', 'var_queen_size', '新家裝潢完再購買', 'high', 70000.00, 1704240000000, 1735862400000, 12),
('cw_sample_004', 'user_customer_002', 'prod_002', NULL, '考慮中', 'low', NULL, 1704326400000, 1735862400000, 2);

-- Sample Recently Viewed Products
INSERT INTO customer_recently_viewed (id, user_id, product_id, viewed_at, view_duration_seconds, referrer_url, device_type, created_at) VALUES
-- 王小明最近瀏覽
('crv_sample_001', 'user_customer_001', 'prod_001', 1735862400000, 180, 'https://google.com/search?q=simmons床墊', 'desktop', 1735862400000),
('crv_sample_002', 'user_customer_001', 'prod_002', 1735859000000, 240, 'https://blackliving.com.tw/', 'desktop', 1735859000000),
('crv_sample_003', 'user_customer_001', 'prod_001', 1735855600000, 60, 'https://blackliving.com.tw/simmons-black/', 'mobile', 1735855600000),

-- 李美華最近瀏覽
('crv_sample_004', 'user_customer_002', 'prod_002', 1735862000000, 300, 'https://facebook.com/blackliving', 'mobile', 1735862000000),
('crv_sample_005', 'user_customer_002', 'prod_001', 1735858600000, 120, 'https://blackliving.com.tw/products/', 'desktop', 1735858600000);

-- Sample Orders (needed for review references)
INSERT INTO orders (id, order_number, user_id, customer_info, items, subtotal_amount, shipping_fee, total_amount, payment_method, status, payment_status, shipping_address, notes, created_at, updated_at) VALUES
-- 王小明的訂單
('order_sample_001', 'BL2024010001', 'user_customer_001', '{"name": "王小明", "email": "wang@example.com", "phone": "0912345678"}', '[{"productId": "prod_001", "name": "席夢思黑牌 Classic 獨立筒床墊", "quantity": 1, "price": 89000, "variantId": "var_king_size"}]', 89000, 2000, 91000, 'credit_card', 'completed', 'paid', '{"city": "台北市", "district": "信義區", "street": "信義路五段100號", "recipientName": "王小明", "recipientPhone": "0912345678"}', '配送時間: 週末', 1701475200000, 1701475200000),

-- 李美華的訂單  
('order_sample_002', 'BL2024010002', 'user_customer_002', '{"name": "李美華", "email": "lee@example.com", "phone": "0923456789"}', '[{"productId": "prod_001", "name": "席夢思黑牌 Classic 獨立筒床墊", "quantity": 1, "price": 79000, "variantId": "var_queen_size"}]', 79000, 2000, 81000, 'bank_transfer', 'completed', 'paid', '{"city": "新北市", "district": "板橋區", "street": "文化路一段200號", "recipientName": "李美華", "recipientPhone": "0923456789"}', '', 1702080000000, 1702080000000);

-- Sample Customer Reviews
INSERT INTO customer_reviews (id, user_id, product_id, order_id, rating, title, content, pros, cons, images, status, moderated_by, moderated_at, moderation_notes, helpful_count, total_votes, verified, purchase_date, featured, display_name, show_full_name, created_at, updated_at) VALUES
-- 王小明的評價
('cr_sample_001', 'user_customer_001', 'prod_001', 'order_sample_001', 5, '睡眠品質大幅提升！', '使用這張床墊三個月了，腰痛問題明顯改善，每天醒來都很有精神。Simmons Black Label確實值得這個價位，材質和工藝都很棒。', '["支撐性極佳", "材質舒適", "有效改善睡眠", "售後服務好"]', '["價格偏高", "需要適應期"]', '["https://r2.blackliving.com.tw/reviews/rev_001_img1.jpg", "https://r2.blackliving.com.tw/reviews/rev_001_img2.jpg"]', 'approved', 'admin_001', 1704326400000, '優質評價，已核准展示', 15, 18, 1, 1701475200000, 1, '王先生', 0, 1704412800000, 1704412800000),

-- 李美華的評價
('cr_sample_002', 'user_customer_002', 'prod_001', 'order_sample_002', 4, '整體滿意，推薦購買', '床墊品質不錯，躺起來很舒服，比之前的彈簧床好很多。店員服務態度很好，配送也很準時。唯一缺點是價格比較高，但考慮到品質還是值得的。', '["舒適度佳", "品質穩定", "服務專業", "配送及時"]', '["價格昂貴"]', '["https://r2.blackliving.com.tw/reviews/rev_002_img1.jpg"]', 'approved', 'admin_001', 1704499200000, '正面評價，已核准', 8, 10, 1, 1702080000000, 0, '李小姐', 0, 1704585600000, 1704585600000);

-- Sample Notification Preferences
INSERT INTO customer_notification_preferences (id, user_id, email_order_updates, email_appointment_reminders, email_newsletters, email_promotions, email_price_alerts, email_product_recommendations, sms_order_updates, sms_appointment_reminders, sms_promotions, sms_delivery_updates, push_order_updates, push_appointment_reminders, push_promotions, email_frequency, sms_frequency, created_at, updated_at) VALUES
-- 王小明的通知設定 (喜歡接收完整資訊)
('cnp_sample_001', 'user_customer_001', 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 'immediate', 'important_only', 1704067200000, 1735862400000),

-- 李美華的通知設定 (只要重要通知)
('cnp_sample_002', 'user_customer_002', 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 'daily', 'immediate', 1704067200000, 1735862400000);

-- Update existing users with enhanced profiles
UPDATE users SET 
  phone = '0912345678',
  preferences = '{"newsletter": true, "sms": false, "language": "zh-TW", "currency": "TWD"}'
WHERE id = 'user_customer_001';

UPDATE users SET 
  phone = '0923456789', 
  preferences = '{"newsletter": false, "sms": true, "language": "zh-TW", "currency": "TWD"}'
WHERE id = 'user_customer_002';

-- Statistics and Insights (for admin dashboard)
-- These could be views or computed values

/*
Customer Account Management Statistics:
- Total registered users: Check users table
- Users with saved addresses: Check customer_addresses table  
- Users with saved payment methods: Check customer_payment_methods table
- Wishlist conversion rate: Orders containing wishlist items / Total wishlist items
- Most viewed products: Aggregate customer_recently_viewed
- Average review rating by product: Aggregate customer_reviews
*/