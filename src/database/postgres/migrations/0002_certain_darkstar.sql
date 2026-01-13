CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invoiceRef" varchar(50) NOT NULL,
	"subscriptionId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"billingDate" timestamp NOT NULL,
	"periodStart" timestamp NOT NULL,
	"periodEnd" timestamp NOT NULL,
	"amountExclVat" numeric(10, 2) NOT NULL,
	"vatAmount" numeric(10, 2) NOT NULL,
	"amountInclVat" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "addressLine2" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "postalCode" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" varchar(2) DEFAULT 'FR';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dateOfBirth" timestamp;