CREATE TABLE `komodo` (
	`id` integer PRIMARY KEY,
	`name` text,
	`url` text,
	`key` text,
	`secret` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
