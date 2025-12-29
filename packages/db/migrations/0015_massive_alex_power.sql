ALTER TABLE `orders` ADD `gomypay_order_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_gateway` text DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_details` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_initiated_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_completed_at` integer;