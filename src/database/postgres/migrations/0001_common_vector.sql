CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"contractCode" varchar(50) NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"monthlyAmount" numeric(10, 2) NOT NULL,
	"promoCode" varchar(50),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL
);
