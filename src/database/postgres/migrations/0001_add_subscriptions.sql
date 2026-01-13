CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"contractCode" varchar(255) NOT NULL,
	"startDate" varchar(50) NOT NULL,
	"endDate" varchar(50),
	"monthlyAmount" real NOT NULL,
	"promoCode" varchar(255),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL
);
