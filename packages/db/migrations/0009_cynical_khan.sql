ALTER TABLE `products` ADD `accessory_type` text DEFAULT 'standalone' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `parent_product_id` text;