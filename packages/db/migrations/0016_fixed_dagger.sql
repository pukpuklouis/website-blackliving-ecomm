CREATE TABLE `bank_account_info` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_name` text NOT NULL,
	`bank_code` text,
	`branch_name` text,
	`branch_code` text,
	`account_number` text NOT NULL,
	`account_holder` text NOT NULL,
	`is_active` integer DEFAULT true,
	`display_order` integer DEFAULT 0,
	`notes` text,
	`updated_by` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`status` text DEFAULT 'pending',
	`message_id` text,
	`error_message` text,
	`retry_count` integer DEFAULT 0,
	`related_id` text,
	`related_type` text,
	`sent_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_emails` text DEFAULT '[]' NOT NULL,
	`customer_service_email` text,
	`enable_new_order_admin` integer DEFAULT true,
	`enable_payment_confirm_admin` integer DEFAULT true,
	`enable_appointment_admin` integer DEFAULT true,
	`enable_bank_transfer_customer` integer DEFAULT true,
	`enable_order_shipped_customer` integer DEFAULT true,
	`enable_appointment_customer` integer DEFAULT true,
	`sender_name` text DEFAULT 'Black Living 黑哥家居',
	`reply_to_email` text DEFAULT 'service@blackliving.tw',
	`updated_by` text,
	`created_at` integer,
	`updated_at` integer
);
