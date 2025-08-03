-- Customer Profile Performance Indexes
-- Optimized indexes for customer profile CRUD operations

-- Core user lookups (most frequent)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Customer profile lookups
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_number ON customer_profiles(customer_number);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_segment ON customer_profiles(segment);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_updated_at ON customer_profiles(updated_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_segment ON customer_profiles(user_id, segment);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_segment_value ON customer_profiles(segment, lifetime_value);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_churn_risk ON customer_profiles(churn_risk, last_contact_at);

-- Address management performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_type ON customer_addresses(user_id, type);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_active ON customer_addresses(user_id, is_active);

-- Payment methods performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON customer_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON customer_payment_methods(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON customer_payment_methods(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON customer_payment_methods(user_id, type);

-- Security and login tracking
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_last_login ON user_security(user_id, last_login_at);
CREATE INDEX IF NOT EXISTS idx_user_security_locked ON user_security(is_locked, locked_at);

-- Wishlist and personalization
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON customer_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON customer_wishlists(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON customer_recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_cleanup ON customer_recently_viewed(created_at);

-- Reviews and feedback
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON customer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON customer_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON customer_reviews(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON customer_reviews(featured, rating);

-- Notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON customer_notification_preferences(user_id);

-- Analytics and reporting indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_analytics ON customer_profiles(total_spent, order_count, avg_order_value);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_dates ON customer_profiles(created_at, last_order_at);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_source ON customer_profiles(source, created_at);

-- Customer interactions tracking
CREATE INDEX IF NOT EXISTS idx_customer_interactions_profile_id ON customer_interactions(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_type ON customer_interactions(customer_profile_id, type);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_date ON customer_interactions(created_at);

-- Customer tags system
CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_profile ON customer_tag_assignments(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_tag ON customer_tag_assignments(customer_tag_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_category ON customer_tags(category, is_system);

-- Orders performance (for profile analytics)
CREATE INDEX IF NOT EXISTS idx_orders_user_analytics ON orders(user_id, status, total_amount);
CREATE INDEX IF NOT EXISTS idx_orders_user_dates ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, created_at);