CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`isActive` text DEFAULT 'true' NOT NULL,
	`lastLogin` text,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_unique` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoiceRef` text NOT NULL,
	`subscriptionId` text NOT NULL,
	`userId` text NOT NULL,
	`billingDate` text NOT NULL,
	`periodStart` text NOT NULL,
	`periodEnd` text NOT NULL,
	`amountExclVat` real NOT NULL,
	`vatAmount` real NOT NULL,
	`amountInclVat` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`contractCode` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text,
	`monthlyAmount` real NOT NULL,
	`promoCode` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text,
	`lastName` text,
	`email` text,
	`password` text NOT NULL,
	`paymentMethod` text,
	`status` text DEFAULT 'OK' NOT NULL,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);