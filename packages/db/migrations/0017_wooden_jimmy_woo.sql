PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notification_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_emails` text DEFAULT '[]' NOT NULL,
	`customer_service_email` text,
	`enable_new_order_admin` integer DEFAULT true,
	`enable_payment_confirm_admin` integer DEFAULT true,
	`enable_appointment_admin` integer DEFAULT true,
	`enable_bank_transfer_customer` integer DEFAULT true,
	`enable_order_shipped_customer` integer DEFAULT true,
	`enable_appointment_customer` integer DEFAULT true,
	`sender_name` text DEFAULT 'Black Living 黑哥居家',
	`reply_to_email` text DEFAULT 'service@blackliving.tw',
	`updated_by` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_notification_settings`("id", "admin_emails", "customer_service_email", "enable_new_order_admin", "enable_payment_confirm_admin", "enable_appointment_admin", "enable_bank_transfer_customer", "enable_order_shipped_customer", "enable_appointment_customer", "sender_name", "reply_to_email", "updated_by", "created_at", "updated_at") SELECT "id", "admin_emails", "customer_service_email", "enable_new_order_admin", "enable_payment_confirm_admin", "enable_appointment_admin", "enable_bank_transfer_customer", "enable_order_shipped_customer", "enable_appointment_customer", "sender_name", "reply_to_email", "updated_by", "created_at", "updated_at" FROM `notification_settings`;--> statement-breakpoint
DROP TABLE `notification_settings`;--> statement-breakpoint
ALTER TABLE `__new_notification_settings` RENAME TO `notification_settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `orders` ADD `last_reminder_sent_at` integer;