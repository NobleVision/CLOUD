CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`alert_name` varchar(255) NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL,
	`status` enum('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
	`message` text NOT NULL,
	`resource_type` varchar(128),
	`resource_name` varchar(255),
	`triggered_at` timestamp NOT NULL,
	`acknowledged_at` timestamp,
	`resolved_at` timestamp,
	`acknowledged_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`record_date` timestamp NOT NULL,
	`service_type` varchar(128) NOT NULL,
	`cost` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gcp_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(128) NOT NULL,
	`project_name` varchar(255) NOT NULL,
	`environment` enum('dev','staging','prod') NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gcp_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `gcp_projects_project_id_unique` UNIQUE(`project_id`)
);
--> statement-breakpoint
CREATE TABLE `metric_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`metric_type` varchar(128) NOT NULL,
	`resource_name` varchar(255),
	`value` int NOT NULL,
	`timestamp` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metric_snapshots_id` PRIMARY KEY(`id`)
);
