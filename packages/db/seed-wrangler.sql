-- Cloudflare D1 Seed Data
-- Clean insert of essential data for development

-- Clear existing data
DELETE FROM users;
DELETE FROM products;
DELETE FROM customer_profiles;
DELETE FROM post_categories;
DELETE FROM posts;

-- Insert users
INSERT INTO users (id, name, email, email_verified, phone, role, image, preferences, created_at, updated_at) VALUES 
('user_admin_001', 'Louis Chen', 'pukpuk.tw@gmail.com', 1, '+886-912-345-678', 'admin', 'https://lh3.googleusercontent.com/a/ACg8ocJZWZvXJZ4YyeVNF9tD-V553wXeGPOn3hXM-lvst-p15Jg-d4oQ=s96-c', '{"theme": "light", "notifications": true}', 1735935600000, 1735935600000),
('user_customer_001', '王小明', 'wang@example.com', 1, '+886-987-654-321', 'customer', NULL, '{"theme": "light", "emailUpdates": true}', 1735935600000, 1735935600000),
('user_customer_002', '李美華', 'lee@example.com', 1, '+886-912-888-999', 'customer', NULL, '{"emailUpdates": false}', 1735935600000, 1735935600000),
('user_customer_003', '陳志強', 'chen@example.com', 1, '+886-955-123-456', 'customer', NULL, '{"theme": "dark"}', 1735935600000, 1735935600000);

-- Insert products
INSERT INTO products (id, name, slug, description, category, images, variants, features, specifications, in_stock, featured, sort_order, seo_title, seo_description, created_at, updated_at) VALUES 
('prod_001', '席夢思黑牌 Classic 獨立筒床墊', 'simmons-black-classic', '席夢思頂級黑牌系列，採用獨立筒彈簧技術，提供絕佳的支撐與舒適度。適合各種睡眠姿勢，讓您享受一夜好眠。', 'simmons-black', '["https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]', '[{"id": "var_001", "name": "標準雙人偏硬", "sku": "SB-CL-DBL-FIRM", "price": 89000, "originalPrice": 110000, "size": "double", "firmness": "firm", "stock": 5, "inStock": true, "sortOrder": 0}, {"id": "var_002", "name": "加大雙人偏硬", "sku": "SB-CL-QEN-FIRM", "price": 109000, "originalPrice": 130000, "size": "queen", "firmness": "firm", "stock": 3, "inStock": true, "sortOrder": 1}, {"id": "var_003", "name": "加大雙人適中", "sku": "SB-CL-QEN-MED", "price": 109000, "originalPrice": 130000, "size": "queen", "firmness": "medium", "stock": 4, "inStock": true, "sortOrder": 2}]', '["獨立筒彈簧支撐系統", "天然乳膠舒適層", "透氣竹炭纖維面料", "十年品質保證", "免費到府安裝"]', '{"彈簧數量": "1000+ 獨立筒", "厚度": "32cm", "硬度": "中偏硬", "保固": "10年", "產地": "台灣製造"}', 1, 1, 1, '席夢思黑牌Classic床墊 | 台灣總代理 | 黑哥家居', '席夢思頂級黑牌Classic獨立筒床墊，提供極致睡眠品質。十年保固，免費到府安裝，分期0利率。', 1735935600000, 1735935600000),
('prod_002', '防蟎枕頭保護套組', 'pillow-protector-set', '高品質防蟎枕頭保護套，有效防止塵蟎孳生，保護您的健康睡眠環境。一組包含2個枕頭套。', 'accessories', '["https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800"]', '[{"id": "var_004", "name": "標準尺寸套組", "sku": "ACC-PP-STD", "price": 1980, "originalPrice": 2500, "size": "single", "firmness": "medium", "stock": 20, "inStock": true, "sortOrder": 0}]', '["防蟎抗菌材質", "透氣不悶熱", "可機洗清潔", "包裝附贈2個"]', '{"材質": "聚酯纖維", "尺寸": "48x74cm", "數量": "2個/組", "清潔": "可機洗"}', 1, 1, 0, '防蟎枕頭保護套 | 健康寢具 | 黑哥家居', '高品質防蟎枕頭保護套組，有效防護塵蟎，維護睡眠健康。可機洗，一組2個。', 1735935600000, 1735935600000),
('prod_003', '記憶泡棉枕頭', 'memory-foam-pillow', '符合人體工學設計的記憶泡棉枕頭，提供頸部完美支撐。慢回彈特性，有效舒緩頸部壓力。', 'accessories', '["https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800"]', '[{"id": "var_005", "name": "標準高度", "sku": "ACC-MFP-STD", "price": 2980, "originalPrice": 3500, "size": "standard", "firmness": "medium", "stock": 15, "inStock": true, "sortOrder": 0}, {"id": "var_006", "name": "高型設計", "sku": "ACC-MFP-HIGH", "price": 3280, "originalPrice": 3800, "size": "large", "firmness": "medium", "stock": 12, "inStock": true, "sortOrder": 1}]', '["記憶泡棉材質", "符合人體工學", "慢回彈特性", "透氣外套可拆洗", "兩種高度選擇"]', '{"材質": "記憶泡棉", "外套": "可拆洗布套", "保固": "2年", "產地": "台灣製造"}', 1, 1, 1, '記憶泡棉枕頭 | 人體工學設計 | 黑哥家居', '符合人體工學的記憶泡棉枕頭，提供完美頸部支撐。慢回彈材質，有效舒緩睡眠壓力。', 1735935600000, 1735935600000),
('prod_004', '床包組合套裝', 'bedsheet-set', '100%純棉床包組合，包含床包、枕套、被套。柔軟親膚，透氣舒適，多種顏色可選。', 'accessories', '["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"]', '[{"id": "var_007", "name": "雙人組合", "sku": "ACC-BS-DBL", "price": 3980, "originalPrice": 4800, "size": "double", "firmness": "standard", "stock": 25, "inStock": true, "sortOrder": 0}]', '["100%純棉材質", "柔軟親膚觸感", "透氣吸濕排汗", "不易起毛球", "可機洗烘乾"]', '{"材質": "100%純棉", "件數": "3件套裝", "尺寸": "適合雙人床", "清潔": "可機洗"}', 1, 1, 2, '純棉床包組合 | 柔軟親膚 | 黑哥家居', '100%純棉床包組合套裝，柔軟親膚透氣舒適。包含床包枕套被套，居家必備寢具。', 1735935600000, 1735935600000),
('prod_005', '乳膠床墊保潔墊', 'latex-mattress-protector', '天然乳膠床墊保潔墊，防水透氣，保護床墊延長使用壽命。抗菌防蟎，維護睡眠健康環境。', 'accessories', '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]', '[{"id": "var_008", "name": "基本防護", "sku": "ACC-LMP-BASIC", "price": 2680, "originalPrice": 3200, "size": "standard", "firmness": "basic", "stock": 18, "inStock": true, "sortOrder": 0}]', '["天然乳膠材質", "防水透氣設計", "抗菌防蟎功能", "四角鬆緊帶設計", "可機洗清潔"]', '{"材質": "天然乳膠", "功能": "防水透氣", "厚度": "3cm", "清潔": "可機洗"}', 1, 0, 3, '乳膠保潔墊 | 防水透氣 | 黑哥家居', '天然乳膠床墊保潔墊，防水透氣抗菌防蟎。保護床墊延長使用壽命，維護健康睡眠。', 1735935600000, 1735935600000);

-- Insert customer_profiles
INSERT INTO customer_profiles (
  id, customer_number, name, email, phone, segment,
  total_spent, order_count, avg_order_value,
  created_at, updated_at
) VALUES
('cust_001', 'CU20240001', '王小明', 'wang@example.com', '+886-987-654-321', 'vip', 150000, 3, 50000, 1735935600000, 1735935600000),
('cust_002', 'CU20240002', '李美華', 'lee@example.com', '+886-912-888-999', 'regular', 85000, 2, 42500, 1735935600000, 1735935600000),
('cust_003', 'CU20240003', '陳志強', 'chen@example.com', '+886-955-123-456', 'new', 0, 0, 0, 1735935600000, 1735935600000);

-- Insert post categories
INSERT INTO post_categories (id, name, slug, description, color, icon, is_active, sort_order, seo_title, seo_description, created_at, updated_at) VALUES 
('cat_001', '部落格文章', 'blog-post', '分享睡眠知識、產品介紹和居家生活資訊', '#3B82F6', 'blog', 1, 0, '部落格文章 | 黑哥家居', '睡眠知識分享、產品介紹和居家生活資訊', 1735935600000, 1735935600000),
('cat_002', '客戶評價', 'client-review', '真實客戶使用心得與推薦分享', '#10B981', 'star', 1, 1, '客戶評價 | 黑哥家居', '真實客戶使用心得與推薦，了解產品實際效果', 1735935600000, 1735935600000);

-- Insert sample posts
INSERT INTO posts (id, title, slug, description, content, excerpt, author_id, author_name, status, featured, category_id, category, tags, featured_image, seo_title, seo_description, og_title, og_description, published_at, view_count, reading_time, allow_comments, sort_order, created_at, updated_at) VALUES 
('post_001', '如何選擇適合的床墊硬度？', 'how-to-choose-mattress-firmness', '了解不同睡眠姿勢對床墊硬度的需求，選擇最適合您的床墊', '# 如何選擇適合的床墊硬度？

選擇床墊時，硬度是最重要的考量因素之一。正確的床墊硬度不僅影響睡眠品質，更關係到脊椎健康和身體的恢復。

## 不同睡眠姿勢的需求

### 側睡者
側睡是最常見的睡眠姿勢，約佔70%的人群。側睡者需要**中軟到中等硬度**的床墊，讓肩膀和髖部能夠適度下沉，保持脊椎的自然曲線。

### 仰睡者  
仰睡者適合**中等到偏硬**的床墊，提供腰部足夠的支撐，防止下背部過度彎曲。

### 趴睡者
趴睡者需要**偏硬的床墊**，避免身體過度下沉造成脊椎不當彎曲。

## 體重考量

- **輕體重（60kg以下）**：選擇偏軟床墊，確保身體能適度貼合
- **中等體重（60-90kg）**：中等硬度最為適合
- **重體重（90kg以上）**：選擇偏硬床墊，提供足夠支撐

## 席夢思黑牌的硬度選擇

我們的席夢思黑牌系列提供多種硬度選擇：
- **偏軟**：適合側睡、輕體重者
- **中等**：適合大部分睡眠者的通用選擇  
- **偏硬**：適合仰睡、趴睡、重體重者

歡迎預約到店體驗，找到最適合您的床墊硬度！', '了解不同睡眠姿勢和體重對床墊硬度的需求，選擇最適合的席夢思床墊', 'user_admin_001', 'Louis Chen', 'published', 1, 'cat_001', '部落格文章', '["睡眠知識", "床墊選擇", "脊椎健康"]', 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800', '如何選擇適合的床墊硬度 | 睡眠專家指南 | 黑哥家居', '專業睡眠顧問教您根據睡眠姿勢和體重選擇最適合的床墊硬度，改善睡眠品質', '如何選擇適合的床墊硬度？', '了解不同睡眠姿勢對床墊硬度需求，選擇最適合您的席夢思床墊', 1735935600000, 156, 5, 1, 0, 1735935600000, 1735935600000),

('post_002', '席夢思床墊使用三年心得分享', 'simmons-mattress-3-year-review', '王太太分享使用席夢思黑牌床墊三年來的真實體驗', '# 席夢思床墊使用三年心得分享

我是王太太，三年前在黑哥家居購買了席夢思黑牌Classic床墊，今天想和大家分享這三年來的使用心得。

## 購買動機

當時因為舊床墊已經使用超過十年，每天早上起床都腰酸背痛，嚴重影響生活品質。在朋友推薦下來到黑哥家居，店員非常專業地為我們介紹不同床墊的特性。

## 使用體驗

### 支撐性表現 ⭐⭐⭐⭐⭐
席夢思的獨立筒彈簧真的很棒！我先生翻身時完全不會影響到我的睡眠，這點讓我非常滿意。腰部支撐也很到位，再也沒有腰痛的問題。

### 舒適度 ⭐⭐⭐⭐⭐  
乳膠舒適層提供很好的包覆感，躺下去就能感受到身體被溫柔地承托著。夏天使用也不會悶熱，透氣性很好。

### 耐用性 ⭐⭐⭐⭐⭐
使用三年來，床墊依然保持良好的彈性和支撐力，沒有明顯的凹陷或變形。品質真的很值得信賴。

## 售後服務

黑哥家居的服務真的沒話說！購買後定期會關心使用狀況，還提供保養建議。真正做到終身服務的承諾。

## 總結

這三年來的睡眠品質大幅提升，每天早上都能精神飽滿地起床。雖然當初價格不便宜，但現在看來真的是值得的投資。

**推薦指數：⭐⭐⭐⭐⭐**

準備購買床墊的朋友，真心推薦席夢思黑牌系列！', '王太太分享席夢思黑牌床墊三年使用心得，從支撐性、舒適度到售後服務的完整評價', 'user_customer_001', '王小明', 'published', 1, 'cat_002', '客戶評價', '["客戶心得", "席夢思", "使用評價"]', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', '席夢思床墊三年使用心得 | 真實客戶評價 | 黑哥家居', '真實客戶分享席夢思黑牌床墊三年使用體驗，從支撐性到耐用性的完整評價', '席夢思床墊使用三年心得分享', '王太太真實分享席夢思黑牌床墊三年使用體驗和評價', 1735935600000, 89, 3, 1, 1, 1735935600000, 1735935600000),

('post_003', '睡眠品質與床墊的關係', 'sleep-quality-and-mattress-relationship', '探討好床墊如何改善睡眠品質，提升生活健康', '# 睡眠品質與床墊的關係

現代人普遍面臨睡眠問題，根據台灣睡眠醫學學會的調查，約有25%的成年人有慢性失眠困擾。除了生活壓力、3C產品使用等因素外，床墊品質也是影響睡眠的重要因素。

## 床墊如何影響睡眠

### 1. 脊椎對齊
好的床墊能維持脊椎的自然曲線，減少肌肉緊張，讓身體在睡眠中得到充分放鬆。

### 2. 壓力點舒緩
優質床墊能均勻分散身體重量，減少肩膀、髖部等壓力點的負擔。

### 3. 動作隔離
獨立筒彈簧系統能有效隔離伴侶的翻身動作，減少睡眠中斷。

### 4. 溫度調節
透氣材質有助於體溫調節，避免因過熱而影響睡眠。

## 選擇合適床墊的要點

1. **個人體型**：根據身高體重選擇適合的硬度
2. **睡眠習慣**：考慮睡姿、是否容易出汗等
3. **健康狀況**：有無腰痛、過敏等問題
4. **伴侶需求**：考慮雙方的睡眠習慣差異

## 席夢思的睡眠科學

席夢思擁有150年的製床經驗，結合現代睡眠科學研究，開發出符合人體工學的床墊結構：

- **獨立筒彈簧**：1000+個獨立彈簧提供精準支撐
- **舒適層設計**：多層材質組合，平衡支撐與舒適
- **邊緣強化**：加強床邊支撐，擴大有效睡眠面積

投資一張好床墊，就是投資您的健康！', '探討床墊品質如何影響睡眠，了解選擇優質床墊對健康的重要性', 'user_admin_001', 'Louis Chen', 'published', 0, 'cat_001', '部落格文章', '["睡眠健康", "床墊知識", "脊椎保健"]', 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800', '睡眠品質與床墊的關係 | 睡眠健康指南 | 黑哥家居', '了解床墊品質如何影響睡眠品質，選擇合適床墊改善睡眠健康', '睡眠品質與床墊的關係', '探討好床墊如何改善睡眠品質，提升生活健康', 1735935600000, 234, 4, 1, 2, 1735935600000, 1735935600000),

('post_004', '李先生的睡眠改善之路', 'mr-lee-sleep-improvement-journey', '李先生分享更換席夢思床墊後睡眠品質大幅改善的經歷', '# 李先生的睡眠改善之路

大家好，我是李先生，今天想跟大家分享我的睡眠改善經歷。

## 睡眠困擾的開始

身為工程師的我，長期坐辦公室導致腰椎問題。加上使用了15年的舊床墊早已失去彈性，每天晚上輾轉難眠，白天精神不濟，工作效率也大受影響。

## 尋找解決方案

太太建議我們換床墊，於是開始四處比較。最後選擇黑哥家居，主要是因為：

1. **專業諮詢**：店員詳細了解我們的需求和健康狀況
2. **試躺體驗**：提供充足時間讓我們仔細體驗
3. **品牌信賴**：席夢思的品質和口碑值得信賴

## 使用後的改變

### 第一週
剛開始有點不習慣，畢竟用了15年的舊床墊。但明顯感覺到腰部支撐比以前好很多。

### 第一個月  
睡眠品質開始改善，半夜醒來的次數減少，早上起床時腰痛的情況也有所緩解。

### 三個月後
睡眠品質大幅提升！現在每天都能一覺到天亮，白天精神飽滿，工作效率也提高了。

## 意外的收穫

除了改善睡眠，還有一些意外的好處：

- **伴侶關係**：因為動作隔離效果好，不會互相干擾，夫妻關係也更和諧
- **工作表現**：睡眠充足讓我思緒更清晰，獲得主管肯定
- **健康狀況**：腰痛問題大幅改善，減少了醫療支出

## 給大家的建議

如果您也有睡眠問題，真的建議投資一張好床墊。雖然價格不便宜，但想想每天使用8小時，一用就是10-15年，算下來CP值其實很高！

**評分：支撐性 ⭐⭐⭐⭐⭐ | 舒適度 ⭐⭐⭐⭐⭐ | 服務品質 ⭐⭐⭐⭐⭐**

感謝黑哥家居讓我重拾好眠！', '李先生分享更換席夢思床墊後，從睡眠困擾到一覺好眠的改善歷程', 'user_customer_002', '李美華', 'published', 0, 'cat_002', '客戶評價', '["睡眠改善", "客戶故事", "健康生活"]', 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800', '李先生的睡眠改善之路 | 客戶成功案例 | 黑哥家居', '李先生分享更換席夢思床墊後睡眠品質大幅改善的真實經歷和心得', '李先生的睡眠改善之路', '從睡眠困擾到一覺好眠，李先生的床墊選擇心得分享', 1735935600000, 78, 4, 1, 3, 1735935600000, 1735935600000);

-- Verify data insertion
SELECT 'Users inserted:' as info, COUNT(*) as count FROM users;
SELECT 'Products inserted:' as info, COUNT(*) as count FROM products;
SELECT 'Customer profiles inserted:' as info, COUNT(*) as count FROM customer_profiles;
SELECT 'Post categories inserted:' as info, COUNT(*) as count FROM post_categories;
SELECT 'Posts inserted:' as info, COUNT(*) as count FROM posts;