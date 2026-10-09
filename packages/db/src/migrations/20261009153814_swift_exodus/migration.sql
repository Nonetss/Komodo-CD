CREATE TABLE `image_scan` (
	`image` text PRIMARY KEY,
	`status` text NOT NULL,
	`digest` text,
	`os` text,
	`critical` integer DEFAULT 0 NOT NULL,
	`high` integer DEFAULT 0 NOT NULL,
	`medium` integer DEFAULT 0 NOT NULL,
	`low` integer DEFAULT 0 NOT NULL,
	`unknown` integer DEFAULT 0 NOT NULL,
	`fixable` integer DEFAULT 0 NOT NULL,
	`vulnerabilities` text DEFAULT '[]' NOT NULL,
	`error` text,
	`error_kind` text,
	`requested_at` integer,
	`scanned_at` integer,
	`attempted_at` integer
);
--> statement-breakpoint
CREATE INDEX `image_scan_status_idx` ON `image_scan` (`status`);