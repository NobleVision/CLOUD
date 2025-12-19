import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** User identifier for authentication. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// GCP Projects and Environments
export const environmentEnum = pgEnum("environment", ["dev", "staging", "prod"]);

export const gcpProjects = pgTable("gcp_projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: varchar("project_id", { length: 128 }).notNull().unique(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  environment: environmentEnum("environment").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GcpProject = typeof gcpProjects.$inferSelect;
export type InsertGcpProject = typeof gcpProjects.$inferInsert;

// Alerts and Incidents
export const severityEnum = pgEnum("severity", ["critical", "warning", "info"]);
export const statusEnum = pgEnum("status", ["active", "acknowledged", "resolved"]);

export const alerts = pgTable("alerts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("project_id").notNull(),
  alertName: varchar("alert_name", { length: 255 }).notNull(),
  severity: severityEnum("severity").notNull(),
  status: statusEnum("status").default("active").notNull(),
  message: text("message").notNull(),
  resourceType: varchar("resource_type", { length: 128 }),
  resourceName: varchar("resource_name", { length: 255 }),
  triggeredAt: timestamp("triggered_at").notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  acknowledgedBy: integer("acknowledged_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Cost tracking
export const costRecords = pgTable("cost_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("project_id").notNull(),
  recordDate: timestamp("record_date").notNull(),
  serviceType: varchar("service_type", { length: 128 }).notNull(),
  cost: integer("cost").notNull(), // Store as cents to avoid decimal issues
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CostRecord = typeof costRecords.$inferSelect;
export type InsertCostRecord = typeof costRecords.$inferInsert;

// Metrics snapshots for historical tracking
export const metricSnapshots = pgTable("metric_snapshots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("project_id").notNull(),
  metricType: varchar("metric_type", { length: 128 }).notNull(),
  resourceName: varchar("resource_name", { length: 255 }),
  value: integer("value").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MetricSnapshot = typeof metricSnapshots.$inferSelect;
export type InsertMetricSnapshot = typeof metricSnapshots.$inferInsert;
