CREATE TABLE `post_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6B7280',
	`icon` text,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`seo_title` text,
	`seo_description` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_categories_name_unique` ON `post_categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_categories_slug_unique` ON `post_categories` (`slug`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`author_id` text,
	`author_name` text,
	`status` text DEFAULT 'draft',
	`featured` integer DEFAULT false,
	`category_id` text,
	`category` text DEFAULT '部落格文章',
	`tags` text DEFAULT '[]',
	`featured_image` text,
	`seo_title` text,
	`seo_description` text,
	`seo_keywords` text DEFAULT '[]',
	`canonical_url` text,
	`og_title` text,
	`og_description` text,
	`og_image` text,
	`published_at` integer,
	`scheduled_at` integer,
	`view_count` integer DEFAULT 0,
	`reading_time` integer DEFAULT 5,
	`allow_comments` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `post_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "title", "slug", "description", "content", "excerpt", "author_id", "author_name", "status", "featured", "category_id", "category", "tags", "featured_image", "seo_title", "seo_description", "seo_keywords", "canonical_url", "og_title", "og_description", "og_image", "published_at", "scheduled_at", "view_count", "reading_time", "allow_comments", "sort_order", "created_at", "updated_at") SELECT "id", "title", "slug", "description", "content", "excerpt", "author_id", "author_name", "status", "featured", "category_id", "category", "tags", "featured_image", "seo_title", "seo_description", "seo_keywords", "canonical_url", "og_title", "og_description", "og_image", "published_at", "scheduled_at", "view_count", "reading_time", "allow_comments", "sort_order", "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);