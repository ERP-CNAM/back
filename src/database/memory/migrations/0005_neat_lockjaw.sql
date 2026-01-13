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
