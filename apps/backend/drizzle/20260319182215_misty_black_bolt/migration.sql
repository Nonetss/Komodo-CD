CREATE TABLE `action_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` text NOT NULL,
	`user_name` text,
	`user_email` text,
	`stack` text NOT NULL,
	`action` text NOT NULL,
	`success` integer NOT NULL,
	`message` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
