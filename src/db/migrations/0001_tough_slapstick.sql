CREATE TABLE `diagram_collaborators` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`diagram_id` text NOT NULL,
	`user_id` text NOT NULL,
	`permission` text DEFAULT 'viewer' NOT NULL,
	`invited_by` text,
	`invited_at` text DEFAULT (datetime('now')),
	`accepted_at` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `diagram_revisions` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`diagram_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`thumbnail` text,
	`changes_summary` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `diagrams` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'flowchart' NOT NULL,
	`content` text DEFAULT '{}' NOT NULL,
	`thumbnail` text,
	`is_public` integer DEFAULT false,
	`is_template` integer DEFAULT false,
	`version` integer DEFAULT 1,
	`owner_id` text NOT NULL,
	`company_id` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
