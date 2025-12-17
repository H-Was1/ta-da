CREATE TABLE `wins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'general',
	`created_at` text NOT NULL
);
