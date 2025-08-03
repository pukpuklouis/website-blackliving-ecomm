-- Create missing customer-related tables
-- Run with: wrangler d1 execute blackliving-db --file=./scripts/create-customer-tables.sql --local

-- Customer Profiles Table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  customer_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birthday TEXT,
  gender TEXT,
  address TEXT, -- JSON
  shipping_addresses TEXT DEFAULT '[]', -- JSON array
  total_spent REAL DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  avg_order_value REAL DEFAULT 0,
  last_purchase_at INTEGER, -- timestamp
  first_purchase_at INTEGER, -- timestamp
  favorite_categories TEXT DEFAULT '[]', -- JSON array
  purchase_history TEXT DEFAULT '[]', -- JSON array
  segment TEXT DEFAULT 'new', -- new, regular, vip, inactive
  lifetime_value REAL DEFAULT 0,
  churn_risk TEXT DEFAULT 'low', -- low, medium, high
  last_contact_at INTEGER, -- timestamp
  contact_preference TEXT DEFAULT 'email', -- email, phone, sms
  notes TEXT DEFAULT '',
  source TEXT DEFAULT 'website',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Customer Tags Table
CREATE TABLE IF NOT EXISTS customer_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  description TEXT,
  category TEXT DEFAULT 'custom', -- behavioral, demographic, custom
  created_at INTEGER NOT NULL
);

-- Customer Tag Assignments Table
CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  id TEXT PRIMARY KEY,
  customer_profile_id TEXT NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  customer_tag_id TEXT NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL,
  assigned_at INTEGER NOT NULL,
  UNIQUE(customer_profile_id, customer_tag_id)
);

-- Customer Interactions Table
CREATE TABLE IF NOT EXISTS customer_interactions (
  id TEXT PRIMARY KEY,
  customer_profile_id TEXT NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- call, email, meeting, purchase, support
  title TEXT NOT NULL,
  description TEXT,
  related_id TEXT, -- related order, appointment, etc.
  related_type TEXT, -- order, appointment, etc.
  performed_by TEXT,
  metadata TEXT DEFAULT '{}', -- JSON
  created_at INTEGER NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_number ON customer_profiles(customer_number);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_segment ON customer_profiles(segment);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_churn_risk ON customer_profiles(churn_risk);

CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_customer_profile_id ON customer_tag_assignments(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_customer_tag_id ON customer_tag_assignments(customer_tag_id);

CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_profile_id ON customer_interactions(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_type ON customer_interactions(type);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_created_at ON customer_interactions(created_at);

-- Verify tables were created
SELECT 'customer_profiles' as table_name, COUNT(*) as table_exists FROM sqlite_master WHERE type='table' AND name='customer_profiles'
UNION ALL
SELECT 'customer_tags', COUNT(*) FROM sqlite_master WHERE type='table' AND name='customer_tags'
UNION ALL  
SELECT 'customer_tag_assignments', COUNT(*) FROM sqlite_master WHERE type='table' AND name='customer_tag_assignments'
UNION ALL
SELECT 'customer_interactions', COUNT(*) FROM sqlite_master WHERE type='table' AND name='customer_interactions';