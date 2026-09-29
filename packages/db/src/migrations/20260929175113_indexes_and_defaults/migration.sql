PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_action_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` text NOT NULL,
	`user_name` text,
	`user_email` text,
	`stack` text NOT NULL,
	`action` text NOT NULL,
	`success` integer NOT NULL,
	`message` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
INSERT INTO `__new_action_history`(`id`, `user_id`, `user_name`, `user_email`, `stack`, `action`, `success`, `message`, `created_at`) SELECT `id`, `user_id`, `user_name`, `user_email`, `stack`, `action`, `success`, `message`, `created_at` FROM `action_history`;--> statement-breakpoint
DROP TABLE `action_history`;--> statement-breakpoint
ALTER TABLE `__new_action_history` RENAME TO `action_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_komodo` (
	`id` integer PRIMARY KEY,
	`name` text,
	`url` text,
	`key` text,
	`secret` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
INSERT INTO `__new_komodo`(`id`, `name`, `url`, `key`, `secret`, `created_at`, `updated_at`) SELECT `id`, `name`, `url`, `key`, `secret`, `created_at`, `updated_at` FROM `komodo`;--> statement-breakpoint
DROP TABLE `komodo`;--> statement-breakpoint
ALTER TABLE `__new_komodo` RENAME TO `komodo`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `action_history_createdAt_idx` ON `action_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `action_history_stack_idx` ON `action_history` (`stack`);--> statement-breakpoint
CREATE INDEX `action_history_userId_idx` ON `action_history` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `komodo_name_uidx` ON `komodo` (`name`);--> statement-breakpoint
CREATE INDEX `account_providerId_accountId_idx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `apikey_key_idx` ON `apikey` (`key`);--> statement-breakpoint
CREATE INDEX `apikey_referenceId_idx` ON `apikey` (`reference_id`);--> statement-breakpoint
CREATE INDEX `apikey_configId_idx` ON `apikey` (`config_id`);--> statement-breakpoint
CREATE INDEX `session_expiresAt_idx` ON `session` (`expires_at`);--> statement-breakpoint
-- Datos: el default antiguo (CURRENT_TIMESTAMP) guardaba texto UTC en columnas
-- `mode: "timestamp"`; se pasa a segundos epoch como el resto.
UPDATE `action_history` SET `created_at` = unixepoch(`created_at`) WHERE typeof(`created_at`) = 'text';--> statement-breakpoint
UPDATE `komodo` SET `created_at` = unixepoch(`created_at`) WHERE typeof(`created_at`) = 'text';--> statement-breakpoint
UPDATE `komodo` SET `updated_at` = unixepoch(`updated_at`) WHERE typeof(`updated_at`) = 'text';--> statement-breakpoint
-- Keys creadas con Better Auth < 1.5 solo tenían `user_id`: desde 1.5 el
-- dueño se busca por `reference_id` y la config por `config_id`.
UPDATE `apikey` SET `reference_id` = `user_id` WHERE `reference_id` IS NULL AND `user_id` IS NOT NULL;--> statement-breakpoint
UPDATE `apikey` SET `config_id` = 'default' WHERE `config_id` IS NULL;
