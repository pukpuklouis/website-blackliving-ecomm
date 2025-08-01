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
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_appointments` (
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
INSERT INTO `__new_appointments`("id", "appointment_number", "user_id", "customer_info", "store_location", "preferred_date", "preferred_time", "confirmed_datetime", "product_interest", "visit_purpose", "status", "notes", "admin_notes", "staff_assigned", "actual_visit_time", "completed_at", "follow_up_required", "follow_up_notes", "created_at", "updated_at") SELECT "id", "appointment_number", "user_id", "customer_info", "store_location", "preferred_date", "preferred_time", "confirmed_datetime", "product_interest", "visit_purpose", "status", "notes", "admin_notes", "staff_assigned", "actual_visit_time", "completed_at", "follow_up_required", "follow_up_notes", "created_at", "updated_at" FROM `appointments`;--> statement-breakpoint
DROP TABLE `appointments`;--> statement-breakpoint
ALTER TABLE `__new_appointments` RENAME TO `appointments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_appointment_number_unique` ON `appointments` (`appointment_number`);--> statement-breakpoint
CREATE TABLE `__new_orders` (
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
INSERT INTO `__new_orders`("id", "order_number", "user_id", "customer_info", "items", "subtotal_amount", "shipping_fee", "total_amount", "payment_method", "status", "payment_status", "payment_proof", "payment_verified_at", "payment_verified_by", "notes", "admin_notes", "shipping_address", "tracking_number", "shipping_company", "shipped_at", "delivered_at", "created_at", "updated_at") SELECT "id", "order_number", "user_id", "customer_info", "items", "subtotal_amount", "shipping_fee", "total_amount", "payment_method", "status", "payment_status", "payment_proof", "payment_verified_at", "payment_verified_by", "notes", "admin_notes", "shipping_address", "tracking_number", "shipping_company", "shipped_at", "delivered_at", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
ALTER TABLE `posts` ADD `excerpt` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `author_name` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `category` text DEFAULT '睡眠知識';--> statement-breakpoint
ALTER TABLE `posts` ADD `seo_keywords` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `posts` ADD `canonical_url` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `og_title` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `og_description` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `og_image` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `scheduled_at` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `view_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `posts` ADD `reading_time` integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE `posts` ADD `allow_comments` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `posts` ADD `sort_order` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `sessions` ADD `role` text;