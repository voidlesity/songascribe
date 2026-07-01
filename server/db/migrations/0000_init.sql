CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `item_tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`track_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_category_id_unique` ON `shares` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `shares_token_unique` ON `shares` (`token`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`encoded` text NOT NULL,
	`identifier` text NOT NULL,
	`source` text NOT NULL,
	`uri` text,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`artwork_url` text,
	`length_ms` integer DEFAULT 0 NOT NULL,
	`isrc` text,
	`is_stream` integer DEFAULT false NOT NULL,
	`is_seekable` integer DEFAULT true NOT NULL,
	`plugin_info` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_encoded_unique` ON `tracks` (`encoded`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar` text,
	`theme` text DEFAULT 'dark' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);