ALTER TABLE `users` ADD `avatar_data` blob;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_mime` text;--> statement-breakpoint
CREATE INDEX `categories_user_id_idx` ON `categories` (`user_id`);--> statement-breakpoint
CREATE INDEX `categories_public_created_at_idx` ON `categories` (`is_public`,`created_at`);--> statement-breakpoint
CREATE INDEX `items_category_position_idx` ON `items` (`category_id`,`position`,`id`);--> statement-breakpoint
CREATE INDEX `item_tracks_item_position_idx` ON `item_tracks` (`item_id`,`position`,`id`);--> statement-breakpoint
CREATE INDEX `item_tracks_track_id_idx` ON `item_tracks` (`track_id`);--> statement-breakpoint
CREATE INDEX `shares_expires_at_idx` ON `shares` (`expires_at`);
