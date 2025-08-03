CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_number` text NOT NULL,
	`user_id` text,
	`customer_info` text NOT NULL,
	`store_location` text NOT NULL,
	`preferred_date` text NOT NULL,
	`preferred_time` text NOT NULL,
	`confirmed_datetime` integer,
	`product_interest` text DEFAULT '[]',
	`visit_purpose` text DEFAULT '試躺體驗',
	`status` text DEFAULT 'pending',
	`notes` text DEFAULT '',
	`admin_notes` text DEFAULT '',
	`staff_assigned` text,
	`actual_visit_time` integer,
	`completed_at` integer,
	`follow_up_required` integer DEFAULT false,
	`follow_up_notes` text DEFAULT '',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_appointment_number_unique` ON `appointments` (`appointment_number`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `customer_interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_profile_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`related_id` text,
	`related_type` text,
	`performed_by` text,
	`metadata` text DEFAULT '{}',
	`created_at` integer,
	FOREIGN KEY (`customer_profile_id`) REFERENCES `customer_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`customer_number` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`birthday` text,
	`gender` text,
	`address` text,
	`shipping_addresses` text DEFAULT '[]',
	`total_spent` real DEFAULT 0,
	`order_count` integer DEFAULT 0,
	`avg_order_value` real DEFAULT 0,
	`last_order_at` integer,
	`last_purchase_at` integer,
	`first_purchase_at` integer,
	`favorite_categories` text DEFAULT '[]',
	`purchase_history` text DEFAULT '[]',
	`segment` text DEFAULT 'new',
	`lifetime_value` real DEFAULT 0,
	`churn_risk` text DEFAULT 'low',
	`last_contact_at` integer,
	`contact_preference` text DEFAULT 'email',
	`notes` text DEFAULT '',
	`source` text DEFAULT 'website',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_profiles_customer_number_unique` ON `customer_profiles` (`customer_number`);--> statement-breakpoint
CREATE TABLE `customer_tag_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_profile_id` text,
	`customer_tag_id` text,
	`assigned_by` text,
	`assigned_at` integer,
	FOREIGN KEY (`customer_profile_id`) REFERENCES `customer_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_tag_id`) REFERENCES `customer_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customer_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6B7280',
	`description` text,
	`category` text DEFAULT 'custom',
	`is_system` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_tags_name_unique` ON `customer_tags` (`name`);--> statement-breakpoint
CREATE TABLE `newsletters` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active',
	`source` text DEFAULT 'website',
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletters_email_unique` ON `newsletters` (`email`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`customer_info` text NOT NULL,
	`items` text NOT NULL,
	`subtotal_amount` real NOT NULL,
	`shipping_fee` real DEFAULT 0,
	`total_amount` real NOT NULL,
	`payment_method` text DEFAULT 'bank_transfer',
	`status` text DEFAULT 'pending_payment',
	`payment_status` text DEFAULT 'unpaid',
	`payment_proof` text,
	`payment_verified_at` integer,
	`payment_verified_by` text,
	`notes` text DEFAULT '',
	`admin_notes` text DEFAULT '',
	`shipping_address` text,
	`tracking_number` text,
	`shipping_company` text,
	`shipped_at` integer,
	`delivered_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `posts` (
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
	`category` text DEFAULT '睡眠知識',
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
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`variants` text DEFAULT '[]' NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`specifications` text DEFAULT '{}' NOT NULL,
	`in_stock` integer DEFAULT true,
	`featured` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`seo_title` text,
	`seo_description` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`product_id` text,
	`rating` integer NOT NULL,
	`content` text NOT NULL,
	`source` text DEFAULT 'website',
	`verified` integer DEFAULT false,
	`featured` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false,
	`image` text,
	`created_at` integer,
	`updated_at` integer,
	`phone` text,
	`role` text DEFAULT 'customer',
	`preferences` text DEFAULT '{}'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
