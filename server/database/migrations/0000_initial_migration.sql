CREATE TABLE `data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user` integer,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL
);
