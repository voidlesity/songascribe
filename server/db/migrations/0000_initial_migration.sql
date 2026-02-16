CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user` integer,
	`name` text,
	`is_public` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`categorie` integer,
	`name` text,
	FOREIGN KEY (`categorie`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` integer,
	`share_token` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_share_token_unique` ON `shares` (`share_token`);--> statement-breakpoint
CREATE TABLE `songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spotify_id` text,
	`name` text,
	`artist` text,
	`album` text,
	`album_art` text,
	`duration` integer,
	`preview_url` text,
	`url` text,
	`release_date` text,
	`popularity` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `songs_spotify_id_unique` ON `songs` (`spotify_id`);--> statement-breakpoint
CREATE TABLE `songs_map` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item` integer,
	`song` integer,
	FOREIGN KEY (`item`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`song`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_spotify` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`settings` blob
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_spotify_unique` ON `users` (`id_spotify`);