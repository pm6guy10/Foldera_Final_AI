import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const demoRequests = pgTable("demo_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  company: text("company").notNull(),
  teamSize: text("team_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matterMetrics = pgTable("matter_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentId: text("document_id").notNull(),
  documentName: text("document_name").notNull(),
  scanStatus: text("scan_status").notNull(), // scanning, conflict, fixing, protected
  riskLevel: text("risk_level"), // low, medium, high, critical
  conflictCount: integer("conflict_count").default(0),
  lastScanned: timestamp("last_scanned").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const violations = pgTable("violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matterMetricId: varchar("matter_metric_id").notNull().references(() => matterMetrics.id),
  violationType: text("violation_type").notNull(), // compliance, conflict, legal, regulatory
  severity: text("severity").notNull(), // low, medium, high, critical
  description: text("description").notNull(),
  suggestedFix: text("suggested_fix"),
  status: text("status").notNull().default("detected"), // detected, fixing, resolved, ignored
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const filings = pgTable("filings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filingType: text("filing_type").notNull(), // contract, report, submission, disclosure
  documentPath: text("document_path").notNull(),
  status: text("status").notNull().default("draft"), // draft, review, submitted, approved, rejected
  submittedTo: text("submitted_to"), // regulatory body, client, internal
  submissionDate: timestamp("submission_date"),
  approvalDate: timestamp("approval_date"),
  metadata: json("metadata"), // additional filing-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const experiments = pgTable("experiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // unique experiment identifier
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  allocation: integer("allocation").notNull().default(100), // percentage of traffic to include
  createdAt: timestamp("created_at").defaultNow(),
});

export const variants = pgTable("variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  experimentId: varchar("experiment_id").notNull().references(() => experiments.id),
  key: text("key").notNull(), // variant identifier within experiment
  weight: integer("weight").notNull().default(50), // weight for variant distribution
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  visitorId: text("visitor_id").notNull(), // visitor identifier (anonymous or user ID)
  experimentId: varchar("experiment_id").notNull().references(() => experiments.id),
  variantKey: text("variant_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(), // visitor identifier
  type: text("type").notNull(), // event type: conversion, click, view, etc.
  name: text("name").notNull(), // specific event name
  experimentKey: text("experiment_key"), // associated experiment
  variantKey: text("variant_key"), // associated variant
  props: json("props"), // additional event properties
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertDemoRequestSchema = createInsertSchema(demoRequests).omit({
  id: true,
  createdAt: true,
});

export const insertMatterMetricSchema = createInsertSchema(matterMetrics).omit({
  id: true,
  createdAt: true,
  lastScanned: true,
});

export const insertViolationSchema = createInsertSchema(violations).omit({
  id: true,
  createdAt: true,
});

export const insertFilingSchema = createInsertSchema(filings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExperimentSchema = createInsertSchema(experiments).omit({
  id: true,
  createdAt: true,
});

export const insertVariantSchema = createInsertSchema(variants).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDemoRequest = z.infer<typeof insertDemoRequestSchema>;
export type DemoRequest = typeof demoRequests.$inferSelect;
export type InsertMatterMetric = z.infer<typeof insertMatterMetricSchema>;
export type MatterMetric = typeof matterMetrics.$inferSelect;
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type Violation = typeof violations.$inferSelect;
export type InsertFiling = z.infer<typeof insertFilingSchema>;
export type Filing = typeof filings.$inferSelect;
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type Experiment = typeof experiments.$inferSelect;
export type InsertVariant = z.infer<typeof insertVariantSchema>;
export type Variant = typeof variants.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
