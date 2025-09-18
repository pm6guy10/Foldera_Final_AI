import { type User, type InsertUser, type DemoRequest, type InsertDemoRequest, type Experiment, type InsertExperiment, type Variant, type InsertVariant, type Assignment, type InsertAssignment, type Event, type InsertEvent, type Session, type InsertSession, type PageView, type InsertPageView, type SectionView, type InsertSectionView, type FormInteraction, type InsertFormInteraction, type ConversionFunnel, type InsertConversionFunnel, type FunnelProgression, type InsertFunnelProgression, type UserJourney, type InsertUserJourney, type ConsentSettings, type InsertConsentSettings, type Testimonial, type InsertTestimonial, type CaseStudy, type InsertCaseStudy, type LeadProfile, type InsertLeadProfile, type LeadActivity, type InsertLeadActivity, type LeadScore, type InsertLeadScore, type LeadScoringRule, type InsertLeadScoringRule, type CrmExportLog, type InsertCrmExportLog, type Document, type InsertDocument, type DocumentAnalysis, type InsertDocumentAnalysis, type ContradictionFinding, type InsertContradictionFinding, type DocumentProcessingJob, type InsertDocumentProcessingJob, users, demoRequests, experiments, variants, assignments, events, sessions, pageViews, sectionViews, formInteractions, conversionFunnels, funnelProgression, userJourneys, consentSettings, testimonials, caseStudies, leadProfiles, leadActivities, leadScores, leadScoringRules, crmExportLog, documents, documentAnalysis, contradictionFindings, documentProcessingJobs } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId: string): Promise<User>;
  createDemoRequest(request: InsertDemoRequest): Promise<DemoRequest>;
  
  // A/B Testing methods
  createExperiment(experiment: InsertExperiment): Promise<Experiment>;
  getExperiment(id: string): Promise<Experiment | undefined>;
  getExperimentByKey(key: string): Promise<Experiment | undefined>;
  updateExperimentStatus(id: string, status: string): Promise<Experiment>;
  
  createVariant(variant: InsertVariant): Promise<Variant>;
  getVariantsByExperiment(experimentId: string): Promise<Variant[]>;
  
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignment(visitorId: string, experimentId: string): Promise<Assignment | undefined>;
  
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsByVisitor(visitorId: string): Promise<Event[]>;
  getEventsByExperiment(experimentKey: string): Promise<Event[]>;
  
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  updateSession(sessionId: string, updates: Partial<InsertSession>): Promise<Session>;
  getActiveSessionByVisitor(visitorId: string): Promise<Session | undefined>;
  
  // Page view tracking
  createPageView(pageView: InsertPageView): Promise<PageView>;
  getPageViewsBySession(sessionId: string): Promise<PageView[]>;
  updatePageView(id: string, updates: Partial<InsertPageView>): Promise<PageView>;
  
  // Section view tracking
  createSectionView(sectionView: InsertSectionView): Promise<SectionView>;
  getSectionViewsByPageView(pageViewId: string): Promise<SectionView[]>;
  
  // Form interaction tracking
  createFormInteraction(interaction: InsertFormInteraction): Promise<FormInteraction>;
  getFormInteractionsBySession(sessionId: string): Promise<FormInteraction[]>;
  
  // Conversion funnel management
  createConversionFunnel(funnel: InsertConversionFunnel): Promise<ConversionFunnel>;
  getConversionFunnels(): Promise<ConversionFunnel[]>;
  getActiveFunnels(): Promise<ConversionFunnel[]>;
  
  // Funnel progression tracking
  createFunnelProgression(progression: InsertFunnelProgression): Promise<FunnelProgression>;
  getFunnelProgressionByVisitor(visitorId: string, funnelId: string): Promise<FunnelProgression[]>;
  
  // User journey tracking
  createOrUpdateUserJourney(visitorId: string, updates: Partial<InsertUserJourney>): Promise<UserJourney>;
  getUserJourney(visitorId: string): Promise<UserJourney | undefined>;
  
  // Consent and privacy
  createConsentSettings(consent: InsertConsentSettings): Promise<ConsentSettings>;
  getConsentSettings(visitorId: string): Promise<ConsentSettings | undefined>;
  updateConsentSettings(visitorId: string, updates: Partial<InsertConsentSettings>): Promise<ConsentSettings>;

  // Testimonials management
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getTestimonials(approved?: boolean): Promise<Testimonial[]>;
  getTestimonial(id: string): Promise<Testimonial | undefined>;
  updateTestimonial(id: string, updates: Partial<InsertTestimonial>): Promise<Testimonial>;
  deleteTestimonial(id: string): Promise<void>;
  getFeaturedTestimonials(): Promise<Testimonial[]>;

  // Case studies management
  createCaseStudy(caseStudy: InsertCaseStudy): Promise<CaseStudy>;
  getCaseStudies(published?: boolean): Promise<CaseStudy[]>;
  getCaseStudy(id: string): Promise<CaseStudy | undefined>;
  getCaseStudyBySlug(slug: string): Promise<CaseStudy | undefined>;
  updateCaseStudy(id: string, updates: Partial<InsertCaseStudy>): Promise<CaseStudy>;
  deleteCaseStudy(id: string): Promise<void>;
  getFeaturedCaseStudies(): Promise<CaseStudy[]>;

  // Lead Management and Scoring
  createOrUpdateLeadProfile(visitorId: string, updates: Partial<InsertLeadProfile>): Promise<LeadProfile>;
  getLeadProfile(id: string): Promise<LeadProfile | undefined>;
  getLeadProfileByVisitorId(visitorId: string): Promise<LeadProfile | undefined>;
  getLeadProfileByEmail(email: string): Promise<LeadProfile | undefined>;
  updateLeadProfile(id: string, updates: Partial<InsertLeadProfile>): Promise<LeadProfile>;
  getLeads(filters?: {
    qualification?: string;
    stage?: string;
    isQualified?: boolean;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<LeadProfile[]>;
  getLeadsCount(filters?: {
    qualification?: string;
    stage?: string;
    isQualified?: boolean;
    assignedTo?: string;
  }): Promise<number>;

  // Lead Activity Tracking
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  getLeadActivities(leadProfileId: string, limit?: number): Promise<LeadActivity[]>;
  getLeadActivitiesByVisitor(visitorId: string, limit?: number): Promise<LeadActivity[]>;

  // Lead Scoring
  createLeadScore(score: InsertLeadScore): Promise<LeadScore>;
  getLeadScoreHistory(leadProfileId: string, limit?: number): Promise<LeadScore[]>;
  updateLeadScoreAndQualification(leadProfileId: string, newScore: number, reason: string, activityId?: string): Promise<{
    leadProfile: LeadProfile;
    scoreEntry: LeadScore;
  }>;

  // Lead Scoring Rules
  createLeadScoringRule(rule: InsertLeadScoringRule): Promise<LeadScoringRule>;
  getLeadScoringRules(activeOnly?: boolean): Promise<LeadScoringRule[]>;
  getLeadScoringRule(id: string): Promise<LeadScoringRule | undefined>;
  updateLeadScoringRule(id: string, updates: Partial<InsertLeadScoringRule>): Promise<LeadScoringRule>;
  deleteLeadScoringRule(id: string): Promise<void>;

  // CRM Integration
  createCrmExportLog(log: InsertCrmExportLog): Promise<CrmExportLog>;
  getCrmExportLogs(leadProfileId?: string, limit?: number): Promise<CrmExportLog[]>;
  updateCrmExportLog(id: string, updates: Partial<InsertCrmExportLog>): Promise<CrmExportLog>;
  getLeadsForCrmSync(crmSystem?: string, limit?: number): Promise<LeadProfile[]>;
  markLeadAsSynced(leadProfileId: string, crmContactId: string): Promise<LeadProfile>;

  // Document Processing System
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Document Analysis
  createDocumentAnalysis(analysis: InsertDocumentAnalysis): Promise<DocumentAnalysis>;
  getDocumentAnalysis(id: string): Promise<DocumentAnalysis | undefined>;
  getDocumentAnalysesByDocument(documentId: string): Promise<DocumentAnalysis[]>;
  updateDocumentAnalysis(id: string, updates: Partial<InsertDocumentAnalysis>): Promise<DocumentAnalysis>;
  
  // Contradiction Findings
  createContradictionFinding(finding: InsertContradictionFinding): Promise<ContradictionFinding>;
  getContradictionFinding(id: string): Promise<ContradictionFinding | undefined>;
  getContradictionsByDocument(documentId: string): Promise<ContradictionFinding[]>;
  getContradictionsByAnalysis(analysisId: string): Promise<ContradictionFinding[]>;
  getUserContradictions(userId: string, filters?: {
    severity?: string;
    status?: string;
    contradictionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<ContradictionFinding[]>;
  updateContradictionFinding(id: string, updates: Partial<InsertContradictionFinding>): Promise<ContradictionFinding>;
  resolveContradiction(id: string, userId: string, notes: string): Promise<ContradictionFinding>;
  
  // Processing Jobs
  createDocumentProcessingJob(job: InsertDocumentProcessingJob): Promise<DocumentProcessingJob>;
  getDocumentProcessingJob(id: string): Promise<DocumentProcessingJob | undefined>;
  getProcessingJobsByDocument(documentId: string): Promise<DocumentProcessingJob[]>;
  updateProcessingJob(id: string, updates: Partial<InsertDocumentProcessingJob>): Promise<DocumentProcessingJob>;
  getQueuedJobs(jobType?: string, limit?: number): Promise<DocumentProcessingJob[]>;
}

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId: string): Promise<User> {
    const result = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("User not found");
    }
    
    return result[0];
  }

  async createDemoRequest(insertRequest: InsertDemoRequest): Promise<DemoRequest> {
    const result = await db.insert(demoRequests).values(insertRequest).returning();
    return result[0];
  }

  // A/B Testing methods
  async createExperiment(insertExperiment: InsertExperiment): Promise<Experiment> {
    const result = await db.insert(experiments).values(insertExperiment).returning();
    return result[0];
  }

  async getExperiment(id: string): Promise<Experiment | undefined> {
    const result = await db.select().from(experiments).where(eq(experiments.id, id));
    return result[0];
  }

  async getExperimentByKey(key: string): Promise<Experiment | undefined> {
    const result = await db.select().from(experiments).where(eq(experiments.key, key));
    return result[0];
  }

  async updateExperimentStatus(id: string, status: string): Promise<Experiment> {
    const result = await db
      .update(experiments)
      .set({ status })
      .where(eq(experiments.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Experiment not found");
    }
    
    return result[0];
  }

  async createVariant(insertVariant: InsertVariant): Promise<Variant> {
    const result = await db.insert(variants).values(insertVariant).returning();
    return result[0];
  }

  async getVariantsByExperiment(experimentId: string): Promise<Variant[]> {
    return await db.select().from(variants).where(eq(variants.experimentId, experimentId));
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const result = await db.insert(assignments).values(insertAssignment).returning();
    return result[0];
  }

  async getAssignment(visitorId: string, experimentId: string): Promise<Assignment | undefined> {
    const result = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.visitorId, visitorId), eq(assignments.experimentId, experimentId)));
    return result[0];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values({
      ...insertEvent,
      sessionId: insertEvent.sessionId || null
    }).returning();
    return result[0];
  }

  async getEventsByVisitor(visitorId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.visitorId, visitorId));
  }

  async getEventsByExperiment(experimentKey: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.experimentKey, experimentKey));
  }

  // Session management
  async createSession(insertSession: InsertSession): Promise<Session> {
    const result = await db.insert(sessions).values({
      ...insertSession,
      startedAt: insertSession.startedAt || new Date()
    }).returning();
    return result[0];
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    return result[0];
  }

  async updateSession(sessionId: string, updates: Partial<InsertSession>): Promise<Session> {
    const result = await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, sessionId))
      .returning();
    
    if (!result[0]) {
      throw new Error("Session not found");
    }
    
    return result[0];
  }

  async getActiveSessionByVisitor(visitorId: string): Promise<Session | undefined> {
    const result = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.visitorId, visitorId), eq(sessions.isActive, true)))
      .orderBy(sessions.createdAt)
      .limit(1);
    return result[0];
  }

  // Page view tracking
  async createPageView(insertPageView: InsertPageView): Promise<PageView> {
    const result = await db.insert(pageViews).values(insertPageView).returning();
    return result[0];
  }

  async getPageViewsBySession(sessionId: string): Promise<PageView[]> {
    return await db.select().from(pageViews).where(eq(pageViews.sessionId, sessionId));
  }

  async updatePageView(id: string, updates: Partial<InsertPageView>): Promise<PageView> {
    const result = await db
      .update(pageViews)
      .set(updates)
      .where(eq(pageViews.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Page view not found");
    }
    
    return result[0];
  }

  // Section view tracking
  async createSectionView(insertSectionView: InsertSectionView): Promise<SectionView> {
    const result = await db.insert(sectionViews).values(insertSectionView).returning();
    return result[0];
  }

  async getSectionViewsByPageView(pageViewId: string): Promise<SectionView[]> {
    return await db.select().from(sectionViews).where(eq(sectionViews.pageViewId, pageViewId));
  }

  // Form interaction tracking
  async createFormInteraction(insertInteraction: InsertFormInteraction): Promise<FormInteraction> {
    const result = await db.insert(formInteractions).values(insertInteraction).returning();
    return result[0];
  }

  async getFormInteractionsBySession(sessionId: string): Promise<FormInteraction[]> {
    return await db.select().from(formInteractions).where(eq(formInteractions.sessionId, sessionId));
  }

  // Conversion funnel management
  async createConversionFunnel(insertFunnel: InsertConversionFunnel): Promise<ConversionFunnel> {
    const result = await db.insert(conversionFunnels).values(insertFunnel).returning();
    return result[0];
  }

  async getConversionFunnels(): Promise<ConversionFunnel[]> {
    return await db.select().from(conversionFunnels);
  }

  async getActiveFunnels(): Promise<ConversionFunnel[]> {
    return await db.select().from(conversionFunnels).where(eq(conversionFunnels.isActive, true));
  }

  // Funnel progression tracking
  async createFunnelProgression(insertProgression: InsertFunnelProgression): Promise<FunnelProgression> {
    const result = await db.insert(funnelProgression).values(insertProgression).returning();
    return result[0];
  }

  async getFunnelProgressionByVisitor(visitorId: string, funnelId: string): Promise<FunnelProgression[]> {
    return await db
      .select()
      .from(funnelProgression)
      .where(and(eq(funnelProgression.visitorId, visitorId), eq(funnelProgression.funnelId, funnelId)))
      .orderBy(funnelProgression.stepIndex);
  }

  // User journey tracking
  async createOrUpdateUserJourney(visitorId: string, updates: Partial<InsertUserJourney>): Promise<UserJourney> {
    // Try to find existing journey
    const existing = await db.select().from(userJourneys).where(eq(userJourneys.visitorId, visitorId));
    
    if (existing[0]) {
      // Update existing journey
      const result = await db
        .update(userJourneys)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userJourneys.visitorId, visitorId))
        .returning();
      return result[0];
    } else {
      // Create new journey
      const result = await db.insert(userJourneys).values({
        visitorId,
        ...updates
      }).returning();
      return result[0];
    }
  }

  async getUserJourney(visitorId: string): Promise<UserJourney | undefined> {
    const result = await db.select().from(userJourneys).where(eq(userJourneys.visitorId, visitorId));
    return result[0];
  }

  // Consent and privacy
  async createConsentSettings(insertConsent: InsertConsentSettings): Promise<ConsentSettings> {
    const result = await db.insert(consentSettings).values(insertConsent).returning();
    return result[0];
  }

  async getConsentSettings(visitorId: string): Promise<ConsentSettings | undefined> {
    const result = await db.select().from(consentSettings).where(eq(consentSettings.visitorId, visitorId));
    return result[0];
  }

  async updateConsentSettings(visitorId: string, updates: Partial<InsertConsentSettings>): Promise<ConsentSettings> {
    const result = await db
      .update(consentSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(consentSettings.visitorId, visitorId))
      .returning();
    
    if (!result[0]) {
      throw new Error("Consent settings not found");
    }
    
    return result[0];
  }

  // Testimonials management
  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const result = await db.insert(testimonials).values({
      ...insertTestimonial,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getTestimonials(approved?: boolean): Promise<Testimonial[]> {
    if (approved !== undefined) {
      return await db.select().from(testimonials).where(eq(testimonials.approved, approved));
    }
    return await db.select().from(testimonials);
  }

  async getTestimonial(id: string): Promise<Testimonial | undefined> {
    const result = await db.select().from(testimonials).where(eq(testimonials.id, id));
    return result[0];
  }

  async updateTestimonial(id: string, updates: Partial<InsertTestimonial>): Promise<Testimonial> {
    const result = await db
      .update(testimonials)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(testimonials.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Testimonial not found");
    }
    
    return result[0];
  }

  async deleteTestimonial(id: string): Promise<void> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }

  async getFeaturedTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials)
      .where(and(eq(testimonials.featured, true), eq(testimonials.approved, true)));
  }

  // Case studies management
  async createCaseStudy(insertCaseStudy: InsertCaseStudy): Promise<CaseStudy> {
    const result = await db.insert(caseStudies).values({
      ...insertCaseStudy,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getCaseStudies(published?: boolean): Promise<CaseStudy[]> {
    if (published !== undefined) {
      return await db.select().from(caseStudies).where(eq(caseStudies.published, published));
    }
    return await db.select().from(caseStudies);
  }

  async getCaseStudy(id: string): Promise<CaseStudy | undefined> {
    const result = await db.select().from(caseStudies).where(eq(caseStudies.id, id));
    return result[0];
  }

  async getCaseStudyBySlug(slug: string): Promise<CaseStudy | undefined> {
    const result = await db.select().from(caseStudies).where(eq(caseStudies.slug, slug));
    return result[0];
  }

  async updateCaseStudy(id: string, updates: Partial<InsertCaseStudy>): Promise<CaseStudy> {
    const result = await db
      .update(caseStudies)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(caseStudies.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Case study not found");
    }
    
    return result[0];
  }

  async deleteCaseStudy(id: string): Promise<void> {
    await db.delete(caseStudies).where(eq(caseStudies.id, id));
  }

  async getFeaturedCaseStudies(): Promise<CaseStudy[]> {
    return await db.select().from(caseStudies)
      .where(and(eq(caseStudies.featured, true), eq(caseStudies.published, true)));
  }

  // Lead Management and Scoring implementations
  async createOrUpdateLeadProfile(visitorId: string, updates: Partial<InsertLeadProfile>): Promise<LeadProfile> {
    // Check if lead profile already exists
    const existing = await db.select().from(leadProfiles).where(eq(leadProfiles.visitorId, visitorId));
    
    if (existing[0]) {
      // Update existing profile
      const result = await db
        .update(leadProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(leadProfiles.visitorId, visitorId))
        .returning();
      
      if (!result[0]) {
        throw new Error("Failed to update lead profile");
      }
      
      return result[0];
    } else {
      // Create new profile
      const result = await db.insert(leadProfiles).values({
        visitorId,
        ...updates,
      }).returning();
      
      return result[0];
    }
  }

  async getLeadProfile(id: string): Promise<LeadProfile | undefined> {
    const result = await db.select().from(leadProfiles).where(eq(leadProfiles.id, id));
    return result[0];
  }

  async getLeadProfileByVisitorId(visitorId: string): Promise<LeadProfile | undefined> {
    const result = await db.select().from(leadProfiles).where(eq(leadProfiles.visitorId, visitorId));
    return result[0];
  }

  async getLeadProfileByEmail(email: string): Promise<LeadProfile | undefined> {
    const result = await db.select().from(leadProfiles).where(eq(leadProfiles.email, email));
    return result[0];
  }

  async updateLeadProfile(id: string, updates: Partial<InsertLeadProfile>): Promise<LeadProfile> {
    const result = await db
      .update(leadProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadProfiles.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Lead profile not found");
    }
    
    return result[0];
  }

  async getLeads(filters?: {
    qualification?: string;
    stage?: string;
    isQualified?: boolean;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<LeadProfile[]> {
    let query = db.select().from(leadProfiles);
    
    const conditions = [];
    if (filters?.qualification) {
      conditions.push(eq(leadProfiles.qualification, filters.qualification));
    }
    if (filters?.stage) {
      conditions.push(eq(leadProfiles.stage, filters.stage));
    }
    if (filters?.isQualified !== undefined) {
      conditions.push(eq(leadProfiles.isQualified, filters.isQualified));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(leadProfiles.assignedTo, filters.assignedTo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add limit and offset if provided
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getLeadsCount(filters?: {
    qualification?: string;
    stage?: string;
    isQualified?: boolean;
    assignedTo?: string;
  }): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(leadProfiles);
    
    const conditions = [];
    if (filters?.qualification) {
      conditions.push(eq(leadProfiles.qualification, filters.qualification));
    }
    if (filters?.stage) {
      conditions.push(eq(leadProfiles.stage, filters.stage));
    }
    if (filters?.isQualified !== undefined) {
      conditions.push(eq(leadProfiles.isQualified, filters.isQualified));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(leadProfiles.assignedTo, filters.assignedTo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  // Lead Activity Tracking
  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> {
    const result = await db.insert(leadActivities).values(activity).returning();
    return result[0];
  }

  async getLeadActivities(leadProfileId: string, limit = 50): Promise<LeadActivity[]> {
    const result = await db.select().from(leadActivities)
      .where(eq(leadActivities.leadProfileId, leadProfileId))
      .orderBy(desc(leadActivities.createdAt))
      .limit(limit);
    return result;
  }

  async getLeadActivitiesByVisitor(visitorId: string, limit = 50): Promise<LeadActivity[]> {
    const result = await db.select().from(leadActivities)
      .where(eq(leadActivities.visitorId, visitorId))
      .orderBy(desc(leadActivities.createdAt))
      .limit(limit);
    return result;
  }

  // Lead Scoring
  async createLeadScore(score: InsertLeadScore): Promise<LeadScore> {
    const result = await db.insert(leadScores).values(score).returning();
    return result[0];
  }

  async getLeadScoreHistory(leadProfileId: string, limit = 50): Promise<LeadScore[]> {
    const result = await db.select().from(leadScores)
      .where(eq(leadScores.leadProfileId, leadProfileId))
      .orderBy(desc(leadScores.createdAt))
      .limit(limit);
    return result;
  }

  async updateLeadScoreAndQualification(leadProfileId: string, newScore: number, reason: string, activityId?: string): Promise<{
    leadProfile: LeadProfile;
    scoreEntry: LeadScore;
  }> {
    // Get current lead profile
    const currentProfile = await this.getLeadProfile(leadProfileId);
    if (!currentProfile) {
      throw new Error("Lead profile not found");
    }

    const previousScore = currentProfile.score;
    const scoreChange = newScore - previousScore;

    // Determine qualification based on score
    let qualification = currentProfile.qualification;
    let isQualified = currentProfile.isQualified;
    
    if (newScore >= 200) {
      qualification = 'hot';
      isQualified = true;
    } else if (newScore >= 100) {
      qualification = 'warm';
      isQualified = true;
    } else {
      qualification = 'cold';
      isQualified = false;
    }

    // Update the lead profile
    const updatedProfile = await db
      .update(leadProfiles)
      .set({
        score: newScore,
        qualification,
        isQualified,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leadProfiles.id, leadProfileId))
      .returning();

    // Create score history entry
    const scoreEntry = await db.insert(leadScores).values({
      leadProfileId,
      previousScore,
      newScore,
      scoreChange,
      activityId,
      reason,
    }).returning();

    return {
      leadProfile: updatedProfile[0],
      scoreEntry: scoreEntry[0],
    };
  }

  // Lead Scoring Rules
  async createLeadScoringRule(rule: InsertLeadScoringRule): Promise<LeadScoringRule> {
    const result = await db.insert(leadScoringRules).values(rule).returning();
    return result[0];
  }

  async getLeadScoringRules(activeOnly = true): Promise<LeadScoringRule[]> {
    let query = db.select().from(leadScoringRules);
    
    if (activeOnly) {
      query = query.where(eq(leadScoringRules.isActive, true));
    }
    
    const result = await query.orderBy(leadScoringRules.priority);
    return result;
  }

  async getLeadScoringRule(id: string): Promise<LeadScoringRule | undefined> {
    const result = await db.select().from(leadScoringRules).where(eq(leadScoringRules.id, id));
    return result[0];
  }

  async updateLeadScoringRule(id: string, updates: Partial<InsertLeadScoringRule>): Promise<LeadScoringRule> {
    const result = await db
      .update(leadScoringRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadScoringRules.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Lead scoring rule not found");
    }
    
    return result[0];
  }

  async deleteLeadScoringRule(id: string): Promise<void> {
    await db.delete(leadScoringRules).where(eq(leadScoringRules.id, id));
  }

  // CRM Integration
  async createCrmExportLog(log: InsertCrmExportLog): Promise<CrmExportLog> {
    const result = await db.insert(crmExportLog).values(log).returning();
    return result[0];
  }

  async getCrmExportLogs(leadProfileId?: string, limit = 50): Promise<CrmExportLog[]> {
    let query = db.select().from(crmExportLog);
    
    if (leadProfileId) {
      query = query.where(eq(crmExportLog.leadProfileId, leadProfileId));
    }
    
    const result = await query
      .orderBy(desc(crmExportLog.createdAt))
      .limit(limit);
    return result;
  }

  async updateCrmExportLog(id: string, updates: Partial<InsertCrmExportLog>): Promise<CrmExportLog> {
    const result = await db
      .update(crmExportLog)
      .set(updates)
      .where(eq(crmExportLog.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("CRM export log not found");
    }
    
    return result[0];
  }

  async getLeadsForCrmSync(crmSystem?: string, limit = 100): Promise<LeadProfile[]> {
    let query = db.select().from(leadProfiles)
      .where(eq(leadProfiles.crmSyncStatus, 'pending'));
    
    if (crmSystem) {
      // Additional filtering based on CRM system if needed
      query = query.where(and(
        eq(leadProfiles.crmSyncStatus, 'pending'),
        eq(leadProfiles.isQualified, true)
      ));
    }
    
    const result = await query
      .orderBy(desc(leadProfiles.updatedAt))
      .limit(limit);
    return result;
  }

  async markLeadAsSynced(leadProfileId: string, crmContactId: string): Promise<LeadProfile> {
    const result = await db
      .update(leadProfiles)
      .set({
        crmSyncStatus: 'synced',
        crmContactId,
        crmLastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leadProfiles.id, leadProfileId))
      .returning();
    
    if (!result[0]) {
      throw new Error("Lead profile not found");
    }
    
    return result[0];
  }

  // Document Processing System Implementation
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(insertDocument).returning();
    return result[0];
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
    return result;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document> {
    const result = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Document not found");
    }
    
    return result[0];
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Document Analysis Implementation
  async createDocumentAnalysis(insertAnalysis: InsertDocumentAnalysis): Promise<DocumentAnalysis> {
    const result = await db.insert(documentAnalysis).values(insertAnalysis).returning();
    return result[0];
  }

  async getDocumentAnalysis(id: string): Promise<DocumentAnalysis | undefined> {
    const result = await db.select().from(documentAnalysis).where(eq(documentAnalysis.id, id));
    return result[0];
  }

  async getDocumentAnalysesByDocument(documentId: string): Promise<DocumentAnalysis[]> {
    const result = await db
      .select()
      .from(documentAnalysis)
      .where(eq(documentAnalysis.documentId, documentId))
      .orderBy(desc(documentAnalysis.createdAt));
    return result;
  }

  async updateDocumentAnalysis(id: string, updates: Partial<InsertDocumentAnalysis>): Promise<DocumentAnalysis> {
    const result = await db
      .update(documentAnalysis)
      .set(updates)
      .where(eq(documentAnalysis.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Document analysis not found");
    }
    
    return result[0];
  }

  // Contradiction Findings Implementation
  async createContradictionFinding(insertFinding: InsertContradictionFinding): Promise<ContradictionFinding> {
    const result = await db.insert(contradictionFindings).values(insertFinding).returning();
    return result[0];
  }

  async getContradictionFinding(id: string): Promise<ContradictionFinding | undefined> {
    const result = await db.select().from(contradictionFindings).where(eq(contradictionFindings.id, id));
    return result[0];
  }

  async getContradictionsByDocument(documentId: string): Promise<ContradictionFinding[]> {
    const result = await db
      .select()
      .from(contradictionFindings)
      .where(eq(contradictionFindings.documentId, documentId))
      .orderBy(desc(contradictionFindings.createdAt));
    return result;
  }

  async getContradictionsByAnalysis(analysisId: string): Promise<ContradictionFinding[]> {
    const result = await db
      .select()
      .from(contradictionFindings)
      .where(eq(contradictionFindings.analysisId, analysisId))
      .orderBy(desc(contradictionFindings.createdAt));
    return result;
  }

  async getUserContradictions(userId: string, filters?: {
    severity?: string;
    status?: string;
    contradictionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<ContradictionFinding[]> {
    let query = db
      .select()
      .from(contradictionFindings)
      .innerJoin(documents, eq(contradictionFindings.documentId, documents.id))
      .where(eq(documents.userId, userId));

    if (filters?.severity) {
      query = query.where(eq(contradictionFindings.severity, filters.severity));
    }
    if (filters?.status) {
      query = query.where(eq(contradictionFindings.status, filters.status));
    }
    if (filters?.contradictionType) {
      query = query.where(eq(contradictionFindings.contradictionType, filters.contradictionType));
    }

    query = query.orderBy(desc(contradictionFindings.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const result = await query;
    return result.map((r: any) => r.contradiction_findings);
  }

  async updateContradictionFinding(id: string, updates: Partial<InsertContradictionFinding>): Promise<ContradictionFinding> {
    const result = await db
      .update(contradictionFindings)
      .set(updates)
      .where(eq(contradictionFindings.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Contradiction finding not found");
    }
    
    return result[0];
  }

  async resolveContradiction(id: string, userId: string, notes: string): Promise<ContradictionFinding> {
    const result = await db
      .update(contradictionFindings)
      .set({
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNotes: notes,
      })
      .where(eq(contradictionFindings.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Contradiction finding not found");
    }
    
    return result[0];
  }

  // Processing Jobs Implementation
  async createDocumentProcessingJob(insertJob: InsertDocumentProcessingJob): Promise<DocumentProcessingJob> {
    const result = await db.insert(documentProcessingJobs).values(insertJob).returning();
    return result[0];
  }

  async getDocumentProcessingJob(id: string): Promise<DocumentProcessingJob | undefined> {
    const result = await db.select().from(documentProcessingJobs).where(eq(documentProcessingJobs.id, id));
    return result[0];
  }

  async getProcessingJobsByDocument(documentId: string): Promise<DocumentProcessingJob[]> {
    const result = await db
      .select()
      .from(documentProcessingJobs)
      .where(eq(documentProcessingJobs.documentId, documentId))
      .orderBy(desc(documentProcessingJobs.createdAt));
    return result;
  }

  async updateProcessingJob(id: string, updates: Partial<InsertDocumentProcessingJob>): Promise<DocumentProcessingJob> {
    const result = await db
      .update(documentProcessingJobs)
      .set(updates)
      .where(eq(documentProcessingJobs.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Processing job not found");
    }
    
    return result[0];
  }

  async getQueuedJobs(jobType?: string, limit?: number): Promise<DocumentProcessingJob[]> {
    let query = db
      .select()
      .from(documentProcessingJobs)
      .where(eq(documentProcessingJobs.status, 'queued'));

    if (jobType) {
      query = query.where(eq(documentProcessingJobs.jobType, jobType));
    }

    query = query
      .orderBy(desc(documentProcessingJobs.priority), documentProcessingJobs.createdAt);

    if (limit) {
      query = query.limit(limit);
    }

    const result = await query;
    return result;
  }
}

// Keep MemStorage as backup for development/testing
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private demoRequests: Map<string, DemoRequest>;
  private experiments: Map<string, Experiment>;
  private variants: Map<string, Variant>;
  private assignments: Map<string, Assignment>;
  private events: Map<string, Event>;
  private sessions: Map<string, Session>;
  private pageViews: Map<string, PageView>;
  private sectionViews: Map<string, SectionView>;
  private formInteractions: Map<string, FormInteraction>;
  private conversionFunnels: Map<string, ConversionFunnel>;
  private funnelProgressions: Map<string, FunnelProgression>;
  private userJourneys: Map<string, UserJourney>;
  private consentSettings: Map<string, ConsentSettings>;
  private testimonials: Map<string, Testimonial>;
  private caseStudies: Map<string, CaseStudy>;

  constructor() {
    this.users = new Map();
    this.demoRequests = new Map();
    this.experiments = new Map();
    this.variants = new Map();
    this.assignments = new Map();
    this.events = new Map();
    this.sessions = new Map();
    this.pageViews = new Map();
    this.sectionViews = new Map();
    this.formInteractions = new Map();
    this.conversionFunnels = new Map();
    this.funnelProgressions = new Map();
    this.userJourneys = new Map();
    this.consentSettings = new Map();
    this.testimonials = new Map();
    this.caseStudies = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createDemoRequest(insertRequest: InsertDemoRequest): Promise<DemoRequest> {
    const id = crypto.randomUUID();
    const request: DemoRequest = {
      ...insertRequest,
      id,
      createdAt: new Date()
    };
    this.demoRequests.set(id, request);
    return request;
  }

  // A/B Testing methods
  async createExperiment(insertExperiment: InsertExperiment): Promise<Experiment> {
    const id = crypto.randomUUID();
    const experiment: Experiment = {
      ...insertExperiment,
      id,
      status: insertExperiment.status || "draft",
      allocation: insertExperiment.allocation || 100,
      createdAt: new Date()
    };
    this.experiments.set(id, experiment);
    return experiment;
  }

  async getExperiment(id: string): Promise<Experiment | undefined> {
    return this.experiments.get(id);
  }

  async getExperimentByKey(key: string): Promise<Experiment | undefined> {
    return Array.from(this.experiments.values()).find(
      (experiment) => experiment.key === key
    );
  }

  async updateExperimentStatus(id: string, status: string): Promise<Experiment> {
    const experiment = this.experiments.get(id);
    if (!experiment) {
      throw new Error("Experiment not found");
    }
    
    const updatedExperiment: Experiment = {
      ...experiment,
      status
    };
    
    this.experiments.set(id, updatedExperiment);
    return updatedExperiment;
  }

  async createVariant(insertVariant: InsertVariant): Promise<Variant> {
    const id = crypto.randomUUID();
    const variant: Variant = {
      ...insertVariant,
      id,
      weight: insertVariant.weight || 50,
      createdAt: new Date()
    };
    this.variants.set(id, variant);
    return variant;
  }

  async getVariantsByExperiment(experimentId: string): Promise<Variant[]> {
    return Array.from(this.variants.values()).filter(
      (variant) => variant.experimentId === experimentId
    );
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const assignment: Assignment = {
      ...insertAssignment,
      createdAt: new Date()
    };
    const key = `${assignment.visitorId}-${assignment.experimentId}`;
    this.assignments.set(key, assignment);
    return assignment;
  }

  async getAssignment(visitorId: string, experimentId: string): Promise<Assignment | undefined> {
    const key = `${visitorId}-${experimentId}`;
    return this.assignments.get(key);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = crypto.randomUUID();
    const event: Event = {
      ...insertEvent,
      id,
      experimentKey: insertEvent.experimentKey || null,
      variantKey: insertEvent.variantKey || null,
      props: insertEvent.props || null,
      createdAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async getEventsByVisitor(visitorId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.visitorId === visitorId
    );
  }

  async getEventsByExperiment(experimentKey: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.experimentKey === experimentKey
    );
  }

  // Session management
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = crypto.randomUUID();
    const session: Session = {
      ...insertSession,
      id,
      duration: insertSession.duration || null,
      pageCount: insertSession.pageCount || 0,
      referrer: insertSession.referrer || null,
      userAgent: insertSession.userAgent || null,
      deviceType: insertSession.deviceType || null,
      isActive: insertSession.isActive ?? true,
      endedAt: insertSession.endedAt || null,
      createdAt: new Date()
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }

  async updateSession(sessionId: string, updates: Partial<InsertSession>): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    const updatedSession: Session = {
      ...session,
      ...updates
    };
    
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getActiveSessionByVisitor(visitorId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values())
      .filter(session => session.visitorId === visitorId && session.isActive)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      })[0];
  }

  // Page view tracking
  async createPageView(insertPageView: InsertPageView): Promise<PageView> {
    const id = crypto.randomUUID();
    const pageView: PageView = {
      ...insertPageView,
      id,
      title: insertPageView.title || null,
      referrer: insertPageView.referrer || null,
      duration: insertPageView.duration || null,
      maxScrollDepth: insertPageView.maxScrollDepth || 0,
      exitPage: insertPageView.exitPage || false,
      bounced: insertPageView.bounced || false,
      createdAt: new Date()
    };
    this.pageViews.set(id, pageView);
    return pageView;
  }

  async getPageViewsBySession(sessionId: string): Promise<PageView[]> {
    return Array.from(this.pageViews.values()).filter(
      pageView => pageView.sessionId === sessionId
    );
  }

  async updatePageView(id: string, updates: Partial<InsertPageView>): Promise<PageView> {
    const pageView = this.pageViews.get(id);
    if (!pageView) {
      throw new Error("Page view not found");
    }
    
    const updatedPageView: PageView = {
      ...pageView,
      ...updates
    };
    
    this.pageViews.set(id, updatedPageView);
    return updatedPageView;
  }

  // Section view tracking
  async createSectionView(insertSectionView: InsertSectionView): Promise<SectionView> {
    const id = crypto.randomUUID();
    const sectionView: SectionView = {
      ...insertSectionView,
      id,
      sectionName: insertSectionView.sectionName || null,
      timeVisible: insertSectionView.timeVisible || null,
      scrollDepthOnEntry: insertSectionView.scrollDepthOnEntry || null,
      scrollDepthOnExit: insertSectionView.scrollDepthOnExit || null,
      wasFullyVisible: insertSectionView.wasFullyVisible || false,
      createdAt: new Date()
    };
    this.sectionViews.set(id, sectionView);
    return sectionView;
  }

  async getSectionViewsByPageView(pageViewId: string): Promise<SectionView[]> {
    return Array.from(this.sectionViews.values()).filter(
      sectionView => sectionView.pageViewId === pageViewId
    );
  }

  // Form interaction tracking
  async createFormInteraction(insertInteraction: InsertFormInteraction): Promise<FormInteraction> {
    const id = crypto.randomUUID();
    const interaction: FormInteraction = {
      ...insertInteraction,
      id,
      fieldId: insertInteraction.fieldId || null,
      fieldName: insertInteraction.fieldName || null,
      fieldValue: insertInteraction.fieldValue || null,
      timeSpent: insertInteraction.timeSpent || null,
      completed: insertInteraction.completed || false,
      abandoned: insertInteraction.abandoned || false,
      errors: insertInteraction.errors || null,
      createdAt: new Date()
    };
    this.formInteractions.set(id, interaction);
    return interaction;
  }

  async getFormInteractionsBySession(sessionId: string): Promise<FormInteraction[]> {
    return Array.from(this.formInteractions.values()).filter(
      interaction => interaction.sessionId === sessionId
    );
  }

  // Conversion funnel management
  async createConversionFunnel(insertFunnel: InsertConversionFunnel): Promise<ConversionFunnel> {
    const id = crypto.randomUUID();
    const funnel: ConversionFunnel = {
      ...insertFunnel,
      id,
      description: insertFunnel.description || null,
      isActive: insertFunnel.isActive ?? true,
      createdAt: new Date()
    };
    this.conversionFunnels.set(id, funnel);
    return funnel;
  }

  async getConversionFunnels(): Promise<ConversionFunnel[]> {
    return Array.from(this.conversionFunnels.values());
  }

  async getActiveFunnels(): Promise<ConversionFunnel[]> {
    return Array.from(this.conversionFunnels.values()).filter(
      funnel => funnel.isActive
    );
  }

  // Funnel progression tracking
  async createFunnelProgression(insertProgression: InsertFunnelProgression): Promise<FunnelProgression> {
    const id = crypto.randomUUID();
    const progression: FunnelProgression = {
      ...insertProgression,
      id,
      sessionId: insertProgression.sessionId || null,
      completed: insertProgression.completed ?? true,
      timeToComplete: insertProgression.timeToComplete || null,
      revenue: insertProgression.revenue || null,
      metadata: insertProgression.metadata || null,
      createdAt: new Date()
    };
    this.funnelProgressions.set(id, progression);
    return progression;
  }

  async getFunnelProgressionByVisitor(visitorId: string, funnelId: string): Promise<FunnelProgression[]> {
    return Array.from(this.funnelProgressions.values())
      .filter(progression => progression.visitorId === visitorId && progression.funnelId === funnelId)
      .sort((a, b) => a.stepIndex - b.stepIndex);
  }

  // User journey tracking
  async createOrUpdateUserJourney(visitorId: string, updates: Partial<InsertUserJourney>): Promise<UserJourney> {
    const existing = Array.from(this.userJourneys.values()).find(
      journey => journey.visitorId === visitorId
    );
    
    if (existing) {
      const updatedJourney: UserJourney = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };
      this.userJourneys.set(existing.id, updatedJourney);
      return updatedJourney;
    } else {
      const id = crypto.randomUUID();
      const journey: UserJourney = {
        id,
        visitorId,
        firstVisit: updates.firstVisit || new Date(),
        lastVisit: updates.lastVisit || new Date(),
        totalSessions: updates.totalSessions || 1,
        totalPageViews: updates.totalPageViews || 0,
        totalTimeSpent: updates.totalTimeSpent || 0,
        conversionCount: updates.conversionCount || 0,
        totalRevenue: updates.totalRevenue || 0,
        cohortMonth: updates.cohortMonth || null,
        ltv: updates.ltv || 0,
        status: updates.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.userJourneys.set(id, journey);
      return journey;
    }
  }

  async getUserJourney(visitorId: string): Promise<UserJourney | undefined> {
    return Array.from(this.userJourneys.values()).find(
      journey => journey.visitorId === visitorId
    );
  }

  // Consent and privacy
  async createConsentSettings(insertConsent: InsertConsentSettings): Promise<ConsentSettings> {
    const id = crypto.randomUUID();
    const consent: ConsentSettings = {
      ...insertConsent,
      id,
      analyticsConsent: insertConsent.analyticsConsent ?? true,
      marketingConsent: insertConsent.marketingConsent ?? false,
      personalizationConsent: insertConsent.personalizationConsent ?? false,
      dataRetentionDays: insertConsent.dataRetentionDays || 365,
      optedOutAt: insertConsent.optedOutAt || null,
      consentGivenAt: insertConsent.consentGivenAt || new Date(),
      updatedAt: new Date()
    };
    this.consentSettings.set(id, consent);
    return consent;
  }

  async getConsentSettings(visitorId: string): Promise<ConsentSettings | undefined> {
    return Array.from(this.consentSettings.values()).find(
      settings => settings.visitorId === visitorId
    );
  }

  async updateConsentSettings(visitorId: string, updates: Partial<InsertConsentSettings>): Promise<ConsentSettings> {
    const existing = Array.from(this.consentSettings.values()).find(
      settings => settings.visitorId === visitorId
    );
    
    if (!existing) {
      throw new Error("Consent settings not found");
    }
    
    const updatedSettings: ConsentSettings = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    
    this.consentSettings.set(existing.id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new DrizzleStorage();
