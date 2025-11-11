CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`content_type` text,
	`media_type` text NOT NULL,
	`size` integer NOT NULL,
	`folder` text DEFAULT 'uploads' NOT NULL,
	`metadata` text DEFAULT '{}',
	`uploaded_by` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_key_unique` ON `media_assets` (`key`);