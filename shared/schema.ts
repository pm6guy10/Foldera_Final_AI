import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json, real, boolean } from "drizzle-orm/pg-core";
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
  sessionId: text("session_id"), // session identifier
  type: text("type").notNull(), // event type: conversion, click, view, etc.
  name: text("name").notNull(), // specific event name
  experimentKey: text("experiment_key"), // associated experiment
  variantKey: text("variant_key"), // associated variant
  props: json("props"), // additional event properties
  createdAt: timestamp("created_at").defaultNow(),
});

// User sessions for journey tracking
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(), // visitor identifier
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // session duration in milliseconds
  pageCount: integer("page_count").default(0),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"), // mobile, desktop, tablet
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Page views with enhanced tracking
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  url: text("url").notNull(),
  path: text("path").notNull(),
  title: text("title"),
  referrer: text("referrer"),
  duration: integer("duration"), // time spent on page in milliseconds
  maxScrollDepth: real("max_scroll_depth").default(0), // percentage of page scrolled
  exitPage: boolean("exit_page").default(false),
  bounced: boolean("bounced").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Section engagement tracking
export const sectionViews = pgTable("section_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  pageViewId: varchar("page_view_id").notNull().references(() => pageViews.id),
  sectionId: text("section_id").notNull(), // hero, features, pricing, etc.
  sectionName: text("section_name"),
  timeVisible: integer("time_visible"), // time section was visible in milliseconds
  scrollDepthOnEntry: real("scroll_depth_on_entry"),
  scrollDepthOnExit: real("scroll_depth_on_exit"),
  wasFullyVisible: boolean("was_fully_visible").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Form interactions tracking
export const formInteractions = pgTable("form_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  formId: text("form_id").notNull(), // form identifier
  fieldId: text("field_id"), // specific field if applicable
  fieldName: text("field_name"),
  action: text("action").notNull(), // focus, blur, input, submit, abandon
  fieldValue: text("field_value"), // anonymized or hashed value
  timeSpent: integer("time_spent"), // time spent on field in milliseconds
  completed: boolean("completed").default(false),
  abandoned: boolean("abandoned").default(false),
  errors: json("errors"), // validation errors
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversion funnel definitions
export const conversionFunnels = pgTable("conversion_funnels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  steps: json("steps").notNull(), // array of funnel steps with conditions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Funnel progression tracking
export const funnelProgression = pgTable("funnel_progression", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id"),
  funnelId: varchar("funnel_id").notNull().references(() => conversionFunnels.id),
  stepIndex: integer("step_index").notNull(),
  stepName: text("step_name").notNull(),
  completed: boolean("completed").default(true),
  timeToComplete: integer("time_to_complete"), // milliseconds from funnel start
  revenue: real("revenue"), // if this step involves revenue
  metadata: json("metadata"), // additional step-specific data
  createdAt: timestamp("created_at").defaultNow(),
});

// User journeys across sessions
export const userJourneys = pgTable("user_journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(),
  firstVisit: timestamp("first_visit").defaultNow(),
  lastVisit: timestamp("last_visit").defaultNow(),
  totalSessions: integer("total_sessions").default(1),
  totalPageViews: integer("total_page_views").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // milliseconds
  conversionCount: integer("conversion_count").default(0),
  totalRevenue: real("total_revenue").default(0),
  cohortMonth: text("cohort_month"), // YYYY-MM for cohort analysis
  ltv: real("ltv").default(0), // lifetime value
  status: text("status").default("active"), // active, converted, churned
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Privacy and consent management
export const consentSettings = pgTable("consent_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitorId: text("visitor_id").notNull(),
  analyticsConsent: boolean("analytics_consent").default(true),
  marketingConsent: boolean("marketing_consent").default(false),
  personalizationConsent: boolean("personalization_consent").default(false),
  dataRetentionDays: integer("data_retention_days").default(365),
  optedOutAt: timestamp("opted_out_at"),
  consentGivenAt: timestamp("consent_given_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  createdAt: true,
});

export const insertSectionViewSchema = createInsertSchema(sectionViews).omit({
  id: true,
  createdAt: true,
});

export const insertFormInteractionSchema = createInsertSchema(formInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertConversionFunnelSchema = createInsertSchema(conversionFunnels).omit({
  id: true,
  createdAt: true,
});

export const insertFunnelProgressionSchema = createInsertSchema(funnelProgression).omit({
  id: true,
  createdAt: true,
});

export const insertUserJourneySchema = createInsertSchema(userJourneys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsentSettingsSchema = createInsertSchema(consentSettings).omit({
  id: true,
  updatedAt: true,
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
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertSectionView = z.infer<typeof insertSectionViewSchema>;
export type SectionView = typeof sectionViews.$inferSelect;
export type InsertFormInteraction = z.infer<typeof insertFormInteractionSchema>;
export type FormInteraction = typeof formInteractions.$inferSelect;
export type InsertConversionFunnel = z.infer<typeof insertConversionFunnelSchema>;
export type ConversionFunnel = typeof conversionFunnels.$inferSelect;
export type InsertFunnelProgression = z.infer<typeof insertFunnelProgressionSchema>;
export type FunnelProgression = typeof funnelProgression.$inferSelect;
export type InsertUserJourney = z.infer<typeof insertUserJourneySchema>;
export type UserJourney = typeof userJourneys.$inferSelect;
export type InsertConsentSettings = z.infer<typeof insertConsentSettingsSchema>;
export type ConsentSettings = typeof consentSettings.$inferSelect;
