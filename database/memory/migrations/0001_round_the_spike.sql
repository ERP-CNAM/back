PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY DEFAULT 'ee879fab-dd07-47e5-a6fb-c45f676b00dc' NOT NULL,
	`firstName` text,
	`lastName` text,
	`email` text,
	`paymentMethod` text,
	`status` text DEFAULT 'OK' NOT NULL,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "firstName", "lastName", "email", "paymentMethod", "status", "createdAt", "updatedAt") SELECT "id", "firstName", "lastName", "email", "paymentMethod", "status", "createdAt", "updatedAt" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);