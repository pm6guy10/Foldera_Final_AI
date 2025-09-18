import { type User, type InsertUser, type DemoRequest, type InsertDemoRequest, type Experiment, type InsertExperiment, type Variant, type InsertVariant, type Assignment, type InsertAssignment, type Event, type InsertEvent, users, demoRequests, experiments, variants, assignments, events } from "@shared/schema";
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
    const result = await db.insert(events).values(insertEvent).returning();
    return result[0];
  }

  async getEventsByVisitor(visitorId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.visitorId, visitorId));
  }

  async getEventsByExperiment(experimentKey: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.experimentKey, experimentKey));
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

  constructor() {
    this.users = new Map();
    this.demoRequests = new Map();
    this.experiments = new Map();
    this.variants = new Map();
    this.assignments = new Map();
    this.events = new Map();
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
}

export const storage = new DrizzleStorage();
