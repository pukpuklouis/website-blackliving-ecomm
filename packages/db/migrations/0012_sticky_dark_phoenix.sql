CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`content_markdown` text,
	`status` text DEFAULT 'draft',
	`seo_title` text,
	`seo_description` text,
	`seo_keywords` text DEFAULT '[]',
	`featured_image` text,
	`author_id` text,
	`published_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);