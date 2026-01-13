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
