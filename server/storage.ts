import { type User, type InsertUser, type DemoRequest, type InsertDemoRequest, type Experiment, type InsertExperiment, type Variant, type InsertVariant, type Assignment, type InsertAssignment, type Event, type InsertEvent, type Session, type InsertSession, type PageView, type InsertPageView, type SectionView, type InsertSectionView, type FormInteraction, type InsertFormInteraction, type ConversionFunnel, type InsertConversionFunnel, type FunnelProgression, type InsertFunnelProgression, type UserJourney, type InsertUserJourney, type ConsentSettings, type InsertConsentSettings, users, demoRequests, experiments, variants, assignments, events, sessions, pageViews, sectionViews, formInteractions, conversionFunnels, funnelProgression, userJourneys, consentSettings } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";

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
