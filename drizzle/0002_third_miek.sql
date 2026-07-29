CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryId` int NOT NULL,
	`buyerId` int NOT NULL,
	`farmerId` int NOT NULL,
	`productId` int NOT NULL,
	`orderedQuantity` varchar(64) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`deliveryLocation` varchar(255),
	`estimatedDelivery` timestamp,
	`status` enum('confirmed','in-transit','delivered','cancelled') NOT NULL DEFAULT 'confirmed',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_inquiryId_unique` UNIQUE(`inquiryId`)
);
