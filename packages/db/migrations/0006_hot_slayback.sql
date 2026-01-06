-- Migration 0006: Add auth_tokens, product_categories, reservations tables and overlay_settings column
-- Made idempotent with IF NOT EXISTS to handle existing tables

CREATE TABLE IF NOT EXISTS `auth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`token_hash` text NOT NULL,
	`type` text NOT NULL,
	`context` text DEFAULT '{}',
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`series` text NOT NULL,
	`brand` text NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`seo_keywords` text,
	`url_path` text NOT NULL,
	`is_active` integer DEFAULT true,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `product_categories_slug_unique` ON `product_categories` (`slug`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reservation_data` text NOT NULL,
	`status` text DEFAULT 'pending',
	`verification_pending` integer DEFAULT true,
	`appointment_id` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
-- Add overlay_settings column to posts table (the only new column in this migration)
ALTER TABLE `posts` ADD COLUMN `overlay_settings` text DEFAULT '{}';
