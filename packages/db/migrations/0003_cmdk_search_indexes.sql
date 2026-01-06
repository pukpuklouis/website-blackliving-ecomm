-- Adds indexes to improve unified search performance
CREATE INDEX IF NOT EXISTS idx_products_search_fields
  ON products (name, category, in_stock);

CREATE INDEX IF NOT EXISTS idx_products_description_search
  ON products (description);

CREATE INDEX IF NOT EXISTS idx_posts_search_fields
  ON posts (title, category, status);

CREATE INDEX IF NOT EXISTS idx_posts_description_search
  ON posts (description);

CREATE INDEX IF NOT EXISTS idx_posts_published_at
  ON posts (published_at);
