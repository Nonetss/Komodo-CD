CREATE TABLE `ntfy` (
	`id` integer PRIMARY KEY,
	`url` text NOT NULL,
	`topic` text NOT NULL,
	`token` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
