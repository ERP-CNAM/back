CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"isActive" varchar(10) DEFAULT 'true' NOT NULL,
	"lastLogin" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"firstName" varchar(255),
	"lastName" varchar(255),
	"email" varchar(255),
	"password" varchar(255) NOT NULL,
	"paymentMethod" text,
	"status" varchar(50) DEFAULT 'OK' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
