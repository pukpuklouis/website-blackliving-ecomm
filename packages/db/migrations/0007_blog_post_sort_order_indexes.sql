-- Migration 0007: Add composite indexes to optimize blog post sort order queries
-- The indexes follow the three-layer sort pattern: (sort_order = 0), sort_order ASC, updated_at DESC

-- Index for general post listing queries
CREATE INDEX IF NOT EXISTS `idx_posts_sort_layer`
  ON `posts` ((`sort_order` = 0), `sort_order`, `updated_at` DESC);
--> statement-breakpoint
-- Index for admin queries that additionally filter by status
CREATE INDEX IF NOT EXISTS `idx_posts_status_sort_layer`
  ON `posts` (`status`, (`sort_order` = 0), `sort_order`, `updated_at` DESC);
