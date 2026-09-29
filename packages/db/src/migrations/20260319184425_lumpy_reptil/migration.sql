PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_apikey` (
	`id` text PRIMARY KEY,
	`name` text,
	`start` text,
	`prefix` text,
	`key` text NOT NULL,
	`user_id` text,
	`reference_id` text,
	`config_id` text,
	`refill_interval` integer,
	`refill_amount` integer,
	`last_refill_at` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`rate_limit_time_window` integer,
	`rate_limit_max` integer,
	`rate_limit_enabled` integer,
	`request_count` integer DEFAULT 0 NOT NULL,
	`remaining` integer,
	`last_request` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`permissions` text,
	`metadata` text,
	CONSTRAINT `fk_apikey_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_apikey`(`id`, `name`, `start`, `prefix`, `key`, `user_id`, `reference_id`, `config_id`, `refill_interval`, `refill_amount`, `last_refill_at`, `enabled`, `rate_limit_time_window`, `rate_limit_max`, `rate_limit_enabled`, `request_count`, `remaining`, `last_request`, `expires_at`, `created_at`, `updated_at`, `permissions`, `metadata`) SELECT `id`, `name`, `start`, `prefix`, `key`, `user_id`, `reference_id`, `config_id`, `refill_interval`, `refill_amount`, `last_refill_at`, `enabled`, `rate_limit_time_window`, `rate_limit_max`, `rate_limit_enabled`, `request_count`, `remaining`, `last_request`, `expires_at`, `created_at`, `updated_at`, `permissions`, `metadata` FROM `apikey`;--> statement-breakpoint
DROP TABLE `apikey`;--> statement-breakpoint
ALTER TABLE `__new_apikey` RENAME TO `apikey`;--> statement-breakpoint
PRAGMA foreign_keys=ON;