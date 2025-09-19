/**
 * Lead Scoring Service
 * 
 * Automated engine that processes analytics events and calculates lead scores
 * based on configurable rules and user behavior patterns.
 */

import { storage } from './storage';
import type { 
  LeadProfile, 
  LeadScoringRule, 
  LeadActivity, 
  Event,
  PageView,
  FormInteraction
} from '@shared/schema';

export interface ScoringEventData {
  visitorId: string;
  sessionId?: string;
  eventType: string;
  eventName: string;
  props?: Record<string, any>;
  pageUrl?: string;
  timestamp?: Date;
}

export interface ScoringResult {
  pointsAwarded: number;
  totalScore: number;
  qualification: string;
  leadProfile: LeadProfile;
  appliedRules: Array<{
    ruleId: string;
    ruleName: string;
    points: number;
  }>;
}

export class LeadScoringService {
  private scoringRules: LeadScoringRule[] = [];
  private ruleLastLoaded: Date = new Date(0);
  private cacheRefreshInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Process an analytics event and update lead score
   */
  async processAnalyticsEvent(eventData: ScoringEventData): Promise<ScoringResult | null> {
    try {
      // Ensure scoring rules are loaded
      await this.loadScoringRules();

      // Get or create lead profile
      let leadProfile = await storage.getLeadProfileByVisitorId(eventData.visitorId);
      
      if (!leadProfile) {
        // Create new lead profile with initial data
        leadProfile = await this.createInitialLeadProfile(eventData);
      }

      // Find applicable scoring rules
      const applicableRules = await this.findApplicableRules(eventData, leadProfile);
      
      if (applicableRules.length === 0) {
        return null; // No rules apply, no scoring
      }

      // Calculate points from applicable rules
      let totalPointsToAward = 0;
      const appliedRules = [];

      for (const rule of applicableRules) {
        const points = await this.calculateRulePoints(rule, eventData, leadProfile);
        if (points > 0) {
          totalPointsToAward += points;
          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name || 'Unnamed Rule',
            points,
          });
        }
      }

      if (totalPointsToAward === 0) {
        return null; // No points to award
      }

      // Create lead activity record
      const leadActivity = await storage.createLeadActivity({
        leadProfileId: leadProfile.id,
        visitorId: eventData.visitorId,
        activityType: eventData.eventType,
        activityName: eventData.eventName,
        pointsAwarded: totalPointsToAward,
        scoringRuleId: appliedRules[0]?.ruleId, // Primary rule
        pageUrl: eventData.pageUrl,
        sessionId: eventData.sessionId,
        metadata: eventData.props,
      });

      // Update lead score and qualification
      const newScore = (leadProfile.score || 0) + totalPointsToAward;
      const reason = `${eventData.eventType}: ${eventData.eventName} (+${totalPointsToAward} points)`;

      const result = await storage.updateLeadScoreAndQualification(
        leadProfile.id,
        newScore,
        reason,
        leadActivity.id
      );

      // Update engagement metrics
      await this.updateEngagementMetrics(leadProfile.id, eventData);

      return {
        pointsAwarded: totalPointsToAward,
        totalScore: newScore,
        qualification: result.leadProfile.qualification || 'cold',
        leadProfile: result.leadProfile,
        appliedRules,
      };

    } catch (error) {
      console.error('Error processing analytics event for lead scoring:', error);
      return null;
    }
  }

  /**
   * Process page view for lead scoring
   */
  async processPageView(pageViewData: {
    visitorId: string;
    sessionId: string;
    url: string;
    path: string;
    title?: string;
    duration?: number;
    scrollDepth?: number;
  }): Promise<ScoringResult | null> {
    const eventData: ScoringEventData = {
      visitorId: pageViewData.visitorId,
      sessionId: pageViewData.sessionId,
      eventType: 'page_view',
      eventName: this.getPageEventName(pageViewData.path),
      pageUrl: pageViewData.url,
      props: {
        path: pageViewData.path,
        title: pageViewData.title,
        duration: pageViewData.duration,
        scrollDepth: pageViewData.scrollDepth,
      },
    };

    return this.processAnalyticsEvent(eventData);
  }

  /**
   * Process form interaction for lead scoring
   */
  async processFormInteraction(formData: {
    visitorId: string;
    sessionId: string;
    formId: string;
    action: 'submit' | 'abandon' | 'focus';
    completed?: boolean;
    fieldData?: Record<string, any>;
  }): Promise<ScoringResult | null> {
    const eventData: ScoringEventData = {
      visitorId: formData.visitorId,
      sessionId: formData.sessionId,
      eventType: 'form_interaction',
      eventName: `${formData.formId}_${formData.action}`,
      props: {
        formId: formData.formId,
        action: formData.action,
        completed: formData.completed,
        fieldData: formData.fieldData,
      },
    };

    return this.processAnalyticsEvent(eventData);
  }

  /**
   * Process demo interaction for lead scoring
   */
  async processDemoInteraction(demoData: {
    visitorId: string;
    sessionId: string;
    demoType: string;
    action: 'start' | 'complete' | 'abandon';
    duration?: number;
    completionPercentage?: number;
  }): Promise<ScoringResult | null> {
    const eventData: ScoringEventData = {
      visitorId: demoData.visitorId,
      sessionId: demoData.sessionId,
      eventType: 'demo_interaction',
      eventName: `${demoData.demoType}_${demoData.action}`,
      props: {
        demoType: demoData.demoType,
        action: demoData.action,
        duration: demoData.duration,
        completionPercentage: demoData.completionPercentage,
      },
    };

    return this.processAnalyticsEvent(eventData);
  }

  /**
   * Process Stripe payment event for lead scoring
   */
  async processPaymentEvent(paymentData: {
    visitorId: string;
    sessionId?: string;
    action: 'attempt' | 'success' | 'failed';
    amount?: number;
    currency?: string;
    planType?: string;
  }): Promise<ScoringResult | null> {
    const eventData: ScoringEventData = {
      visitorId: paymentData.visitorId,
      sessionId: paymentData.sessionId,
      eventType: 'payment_event',
      eventName: `stripe_${paymentData.action}`,
      props: {
        action: paymentData.action,
        amount: paymentData.amount,
        currency: paymentData.currency,
        planType: paymentData.planType,
      },
    };

    return this.processAnalyticsEvent(eventData);
  }

  /**
   * Process Calendly booking event for lead scoring
   */
  async processCalendlyEvent(calendlyData: {
    visitorId: string;
    sessionId?: string;
    action: 'booking_created' | 'booking_completed' | 'booking_cancelled';
    meetingType?: string;
    scheduledDate?: Date;
  }): Promise<ScoringResult | null> {
    const eventData: ScoringEventData = {
      visitorId: calendlyData.visitorId,
      sessionId: calendlyData.sessionId,
      eventType: 'calendly_event',
      eventName: `calendly_${calendlyData.action}`,
      props: {
        action: calendlyData.action,
        meetingType: calendlyData.meetingType,
        scheduledDate: calendlyData.scheduledDate,
      },
    };

    return this.processAnalyticsEvent(eventData);
  }

  /**
   * Update lead profile with form data capture
   */
  async updateLeadFromFormData(visitorId: string, formData: Record<string, any>): Promise<LeadProfile | null> {
    try {
      const updates: Partial<LeadProfile> = {};

      // Extract common lead fields
      if (formData.email) updates.email = formData.email;
      if (formData.name || formData.full_name || formData.fullName) {
        updates.name = formData.name || formData.full_name || formData.fullName;
      }
      if (formData.company) updates.company = formData.company;
      if (formData.job_title || formData.jobTitle) {
        updates.jobTitle = formData.job_title || formData.jobTitle;
      }
      if (formData.phone || formData.phone_number) {
        updates.phoneNumber = formData.phone || formData.phone_number;
      }

      if (Object.keys(updates).length === 0) {
        return null; // No relevant data to update
      }

      // Update stage if we now have contact information
      if (updates.email || updates.phoneNumber) {
        updates.stage = 'lead'; // Upgrade from visitor to lead
      }

      const leadProfile = await storage.createOrUpdateLeadProfile(visitorId, updates);
      return leadProfile;

    } catch (error) {
      console.error('Error updating lead from form data:', error);
      return null;
    }
  }

  /**
   * Initialize default scoring rules
   */
  private async initializeDefaultRules(): Promise<void> {
    try {
      const existingRules = await storage.getLeadScoringRules(true);
      
      if (existingRules.length > 0) {
        return; // Rules already exist
      }

      // Create default scoring rules based on the requirements
      const defaultRules = [
        // Page visit rules
        {
          name: 'Pricing Page Visit',
          description: 'User visits pricing page',
          category: 'page_visit',
          conditions: {
            eventType: 'page_view',
            eventName: 'pricing_page',
          },
          pointValue: 20,
          maxPoints: 40, // Max 40 points per day from pricing visits
          timeWindow: 24, // 24 hours
          isActive: true,
          priority: 10,
        },
        {
          name: 'Demo Page Visit',
          description: 'User visits demo page',
          category: 'page_visit',
          conditions: {
            eventType: 'page_view',
            eventName: 'demo_page',
          },
          pointValue: 15,
          maxPoints: 30,
          timeWindow: 24,
          isActive: true,
          priority: 9,
        },
        {
          name: 'Case Study View',
          description: 'User views case studies',
          category: 'page_visit',
          conditions: {
            eventType: 'page_view',
            eventName: 'case_study',
          },
          pointValue: 15,
          maxPoints: 45,
          timeWindow: 24,
          isActive: true,
          priority: 8,
        },
        {
          name: 'General Page Visit',
          description: 'User visits any page',
          category: 'page_visit',
          conditions: {
            eventType: 'page_view',
          },
          pointValue: 1,
          maxPoints: 10,
          timeWindow: 24,
          isActive: true,
          priority: 1,
        },

        // Form interaction rules
        {
          name: 'Demo Request Form Submit',
          description: 'User submits demo request form',
          category: 'form_action',
          conditions: {
            eventType: 'form_interaction',
            eventName: 'demo_form_submit',
          },
          pointValue: 75,
          maxPoints: 75,
          timeWindow: 168, // 1 week
          isActive: true,
          priority: 20,
        },
        {
          name: 'Contact Form Submit',
          description: 'User submits contact form',
          category: 'form_action',
          conditions: {
            eventType: 'form_interaction',
            eventName: 'contact_form_submit',
          },
          pointValue: 50,
          maxPoints: 50,
          timeWindow: 168,
          isActive: true,
          priority: 19,
        },

        // Demo interaction rules
        {
          name: 'Demo Completion',
          description: 'User completes interactive demo',
          category: 'engagement',
          conditions: {
            eventType: 'demo_interaction',
            eventName: 'demo_complete',
          },
          pointValue: 50,
          maxPoints: 100,
          timeWindow: 168,
          isActive: true,
          priority: 18,
        },

        // Payment and high-intent actions
        {
          name: 'Stripe Payment Attempt',
          description: 'User attempts payment',
          category: 'high_intent',
          conditions: {
            eventType: 'payment_event',
            eventName: 'stripe_attempt',
          },
          pointValue: 200,
          maxPoints: 200,
          timeWindow: 720, // 30 days
          isActive: true,
          priority: 30,
        },
        {
          name: 'Calendly Booking',
          description: 'User books meeting via Calendly',
          category: 'high_intent',
          conditions: {
            eventType: 'calendly_event',
            eventName: 'calendly_booking_created',
          },
          pointValue: 100,
          maxPoints: 100,
          timeWindow: 168,
          isActive: true,
          priority: 25,
        },

        // Testimonial and social proof
        {
          name: 'Testimonial Interaction',
          description: 'User interacts with testimonials',
          category: 'engagement',
          conditions: {
            eventType: 'testimonial_interaction',
          },
          pointValue: 10,
          maxPoints: 30,
          timeWindow: 24,
          isActive: true,
          priority: 5,
        },
      ];

      // Create the default rules
      for (const rule of defaultRules) {
        await storage.createLeadScoringRule(rule);
      }

    } catch (error) {
      console.error('Error initializing default scoring rules:', error);
    }
  }

  /**
   * Load scoring rules from database
   */
  private async loadScoringRules(): Promise<void> {
    const now = new Date();
    
    if (now.getTime() - this.ruleLastLoaded.getTime() < this.cacheRefreshInterval) {
      return; // Rules are still fresh
    }

    try {
      this.scoringRules = await storage.getLeadScoringRules(true);
      this.ruleLastLoaded = now;
    } catch (error) {
      console.error('Error loading scoring rules:', error);
    }
  }

  /**
   * Find applicable scoring rules for an event
   */
  private async findApplicableRules(eventData: ScoringEventData, leadProfile: LeadProfile): Promise<LeadScoringRule[]> {
    const applicableRules = [];

    for (const rule of this.scoringRules) {
      if (await this.doesRuleApply(rule, eventData, leadProfile)) {
        applicableRules.push(rule);
      }
    }

    // Sort by priority (higher priority first)
    return applicableRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Check if a rule applies to the current event
   */
  private async doesRuleApply(rule: LeadScoringRule, eventData: ScoringEventData, leadProfile: LeadProfile): Promise<boolean> {
    const conditions = rule.conditions as any;

    // Check event type match
    if (conditions.eventType && conditions.eventType !== eventData.eventType) {
      return false;
    }

    // Check event name match
    if (conditions.eventName && conditions.eventName !== eventData.eventName) {
      return false;
    }

    // Check if rule has reached max points for this lead within time window
    if (rule.maxPoints && rule.timeWindow) {
      const pointsInWindow = await this.getPointsFromRuleInTimeWindow(
        rule.id,
        leadProfile.id,
        rule.timeWindow
      );
      
      if (pointsInWindow >= rule.maxPoints) {
        return false; // Max points reached
      }
    }

    return true;
  }

  /**
   * Calculate points to award for a specific rule
   */
  private async calculateRulePoints(rule: LeadScoringRule, eventData: ScoringEventData, leadProfile: LeadProfile): Promise<number> {
    let points = rule.pointValue;

    // Check if adding these points would exceed the max for this rule
    if (rule.maxPoints && rule.timeWindow) {
      const currentPoints = await this.getPointsFromRuleInTimeWindow(
        rule.id,
        leadProfile.id,
        rule.timeWindow
      );
      
      const maxAdditionalPoints = rule.maxPoints - currentPoints;
      points = Math.min(points, maxAdditionalPoints);
    }

    return Math.max(0, points);
  }

  /**
   * Get points awarded from a specific rule within a time window
   */
  private async getPointsFromRuleInTimeWindow(ruleId: string, leadProfileId: string, timeWindowHours: number): Promise<number> {
    // This would need to be implemented in the storage layer
    // For now, returning 0 as a placeholder
    return 0;
  }

  /**
   * Create initial lead profile from event data
   */
  private async createInitialLeadProfile(eventData: ScoringEventData): Promise<LeadProfile> {
    const profileData = {
      visitorId: eventData.visitorId,
      firstSeenAt: new Date(),
      lastActivityAt: new Date(),
      totalPageViews: eventData.eventType === 'page_view' ? 1 : 0,
      totalSessions: 1,
    };

    return storage.createOrUpdateLeadProfile(eventData.visitorId, profileData);
  }

  /**
   * Update engagement metrics for a lead
   */
  private async updateEngagementMetrics(leadProfileId: string, eventData: ScoringEventData): Promise<void> {
    const updates: any = {
      lastActivityAt: new Date(),
    };

    if (eventData.eventType === 'page_view') {
      const current = await storage.getLeadProfile(leadProfileId);
      if (current) {
        updates.totalPageViews = (current.totalPageViews || 0) + 1;
      }
    }

    await storage.updateLeadProfile(leadProfileId, updates);
  }

  /**
   * Get page event name from URL path
   */
  private getPageEventName(path: string): string {
    if (path.includes('/pricing')) return 'pricing_page';
    if (path.includes('/demo')) return 'demo_page';
    if (path.includes('/case-studies') || path.includes('/case-study')) return 'case_study';
    if (path.includes('/testimonials')) return 'testimonials_page';
    if (path.includes('/contact')) return 'contact_page';
    if (path.includes('/about')) return 'about_page';
    if (path === '/' || path === '') return 'home_page';
    
    return 'general_page';
  }
}

// Export singleton instance
export const leadScoringService = new LeadScoringService();