ALTER TABLE `users` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `addressLine2` text;--> statement-breakpoint
ALTER TABLE `users` ADD `city` text;--> statement-breakpoint
ALTER TABLE `users` ADD `postalCode` text;--> statement-breakpoint
ALTER TABLE `users` ADD `country` text DEFAULT 'FR';--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` text;