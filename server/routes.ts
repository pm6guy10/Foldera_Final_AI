import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertDemoRequestSchema, insertEventSchema, insertSessionSchema, insertPageViewSchema, insertSectionViewSchema, insertFormInteractionSchema, insertConversionFunnelSchema, insertFunnelProgressionSchema, insertConsentSettingsSchema, insertTestimonialSchema, insertCaseStudySchema } from "@shared/schema";
import { getPricingTier, isRecurringSubscription, isOneTimePayment } from "@shared/pricing";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Demo request endpoint
  app.post("/api/demo-request", async (req, res) => {
    try {
      const validatedData = insertDemoRequestSchema.parse(req.body);
      const demoRequest = await storage.createDemoRequest(validatedData);
      res.json(demoRequest);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid request data: " + error.message });
    }
  });

  // Analytics tracking endpoint for A/B testing events
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid event data: " + error.message });
    }
  });

  // Session management endpoints
  app.post("/api/analytics/session", async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid session data: " + error.message });
    }
  });

  app.post("/api/analytics/session-end", async (req, res) => {
    try {
      const { sessionId, ...updates } = req.body;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      const session = await storage.updateSession(sessionId, updates);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating session: " + error.message });
    }
  });

  // Page view tracking endpoints
  app.post("/api/analytics/page-view", async (req, res) => {
    try {
      const validatedData = insertPageViewSchema.parse(req.body);
      const pageView = await storage.createPageView(validatedData);
      res.json(pageView);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid page view data: " + error.message });
    }
  });

  app.post("/api/analytics/page-view-update", async (req, res) => {
    try {
      const { id, ...updates } = req.body;
      if (!id) {
        return res.status(400).json({ message: "Page view ID is required" });
      }
      const pageView = await storage.updatePageView(id, updates);
      res.json(pageView);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating page view: " + error.message });
    }
  });

  // Section view tracking endpoint
  app.post("/api/analytics/section-view", async (req, res) => {
    try {
      const validatedData = insertSectionViewSchema.parse(req.body);
      const sectionView = await storage.createSectionView(validatedData);
      res.json(sectionView);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid section view data: " + error.message });
    }
  });

  // Form interaction tracking endpoint
  app.post("/api/analytics/form-interaction", async (req, res) => {
    try {
      const validatedData = insertFormInteractionSchema.parse(req.body);
      const interaction = await storage.createFormInteraction(validatedData);
      res.json(interaction);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid form interaction data: " + error.message });
    }
  });

  // Conversion funnel endpoints
  app.post("/api/analytics/funnel", async (req, res) => {
    try {
      const validatedData = insertConversionFunnelSchema.parse(req.body);
      const funnel = await storage.createConversionFunnel(validatedData);
      res.json(funnel);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid funnel data: " + error.message });
    }
  });

  app.get("/api/analytics/funnels", async (req, res) => {
    try {
      const funnels = await storage.getActiveFunnels();
      res.json(funnels);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching funnels: " + error.message });
    }
  });

  app.post("/api/analytics/funnel-progression", async (req, res) => {
    try {
      const validatedData = insertFunnelProgressionSchema.parse(req.body);
      const progression = await storage.createFunnelProgression(validatedData);
      res.json(progression);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid funnel progression data: " + error.message });
    }
  });

  // User journey endpoint
  app.post("/api/analytics/user-journey", async (req, res) => {
    try {
      const { visitorId, ...updates } = req.body;
      if (!visitorId) {
        return res.status(400).json({ message: "Visitor ID is required" });
      }
      const journey = await storage.createOrUpdateUserJourney(visitorId, updates);
      res.json(journey);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating user journey: " + error.message });
    }
  });

  app.get("/api/analytics/user-journey/:visitorId", async (req, res) => {
    try {
      const { visitorId } = req.params;
      const journey = await storage.getUserJourney(visitorId);
      if (!journey) {
        return res.status(404).json({ message: "User journey not found" });
      }
      res.json(journey);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user journey: " + error.message });
    }
  });

  // Consent and privacy endpoint
  app.post("/api/analytics/consent", async (req, res) => {
    try {
      const validatedData = insertConsentSettingsSchema.parse(req.body);
      const consent = await storage.createConsentSettings(validatedData);
      res.json(consent);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid consent data: " + error.message });
    }
  });

  app.get("/api/analytics/consent/:visitorId", async (req, res) => {
    try {
      const { visitorId } = req.params;
      const consent = await storage.getConsentSettings(visitorId);
      if (!consent) {
        return res.status(404).json({ message: "Consent settings not found" });
      }
      res.json(consent);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching consent settings: " + error.message });
    }
  });

  app.put("/api/analytics/consent/:visitorId", async (req, res) => {
    try {
      const { visitorId } = req.params;
      const updates = req.body;
      const consent = await storage.updateConsentSettings(visitorId, updates);
      res.json(consent);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating consent settings: " + error.message });
    }
  });

  // Unified payment endpoint that handles both subscriptions and one-time payments
  app.post('/api/create-payment', async (req, res) => {
    try {
      const { email, plan, experimentKey, variantKey } = req.body;
      
      if (!email || !plan) {
        return res.status(400).json({ message: "Email and plan are required" });
      }

      const pricingTier = getPricingTier(plan);
      if (!pricingTier) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      // Create or retrieve customer
      const customers = await stripe.customers.list({ email, limit: 1 });
      let customer;
      
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({ email });
      }

      if (isRecurringSubscription(plan)) {
        // Handle monthly subscriptions (Self-Serve and Pro)
        // Use environment variables for price IDs, fallback to defaults
        let stripePriceId = pricingTier.stripePriceId;
        if (plan === 'self-serve' && process.env.STRIPE_PRICE_ID_SELF_SERVE) {
          stripePriceId = process.env.STRIPE_PRICE_ID_SELF_SERVE;
        } else if (plan === 'pro' && process.env.STRIPE_PRICE_ID_PRO) {
          stripePriceId = process.env.STRIPE_PRICE_ID_PRO;
        }

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: stripePriceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        });

        let clientSecret = null;
        
        if (subscription.latest_invoice) {
          const invoice = subscription.latest_invoice as any;
          if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
            clientSecret = (invoice.payment_intent as any).client_secret;
          }
        }

        res.json({
          type: 'subscription',
          subscriptionId: subscription.id,
          clientSecret,
          plan: pricingTier
        });
      } else if (isOneTimePayment(plan)) {
        // Handle one-time payments (Pilot)
        const metadata: Record<string, string> = {
          plan,
          email
        };
        
        // Add experiment metadata if provided
        if (experimentKey) {
          metadata.experimentKey = experimentKey;
        }
        if (variantKey) {
          metadata.variantKey = variantKey;
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(pricingTier.price * 100), // Convert to cents
          currency: "usd",
          customer: customer.id,
          metadata
        });

        res.json({
          type: 'payment',
          clientSecret: paymentIntent.client_secret,
          plan: pricingTier
        });
      } else {
        res.status(400).json({ message: "Invalid payment type for plan" });
      }
    } catch (error: any) {
      res.status(400).json({ message: "Error creating payment: " + error.message });
    }
  });

  // One-time payment endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, experimentKey, variantKey } = req.body;
      
      const metadata: Record<string, string> = {};
      
      // Add experiment metadata if provided
      if (experimentKey) {
        metadata.experimentKey = experimentKey;
      }
      if (variantKey) {
        metadata.variantKey = variantKey;
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Testimonials endpoints
  app.get("/api/testimonials", async (req, res) => {
    try {
      const { approved, featured } = req.query;
      let testimonials;
      
      if (featured === 'true') {
        testimonials = await storage.getFeaturedTestimonials();
      } else {
        testimonials = await storage.getTestimonials(approved === 'true' ? true : approved === 'false' ? false : undefined);
      }
      
      res.json(testimonials);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching testimonials: " + error.message });
    }
  });

  app.get("/api/testimonials/:id", async (req, res) => {
    try {
      const testimonial = await storage.getTestimonial(req.params.id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      res.json(testimonial);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching testimonial: " + error.message });
    }
  });

  app.post("/api/testimonials", async (req, res) => {
    try {
      const validatedData = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(validatedData);
      res.json(testimonial);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid testimonial data: " + error.message });
    }
  });

  app.put("/api/testimonials/:id", async (req, res) => {
    try {
      const validatedData = insertTestimonialSchema.partial().parse(req.body);
      const testimonial = await storage.updateTestimonial(req.params.id, validatedData);
      res.json(testimonial);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating testimonial: " + error.message });
    }
  });

  app.delete("/api/testimonials/:id", async (req, res) => {
    try {
      await storage.deleteTestimonial(req.params.id);
      res.json({ message: "Testimonial deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting testimonial: " + error.message });
    }
  });

  // Case studies endpoints
  app.get("/api/case-studies", async (req, res) => {
    try {
      const { published, featured } = req.query;
      let caseStudies;
      
      if (featured === 'true') {
        caseStudies = await storage.getFeaturedCaseStudies();
      } else {
        caseStudies = await storage.getCaseStudies(published === 'true' ? true : published === 'false' ? false : undefined);
      }
      
      res.json(caseStudies);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching case studies: " + error.message });
    }
  });

  app.get("/api/case-studies/:id", async (req, res) => {
    try {
      const caseStudy = await storage.getCaseStudy(req.params.id);
      if (!caseStudy) {
        return res.status(404).json({ message: "Case study not found" });
      }
      res.json(caseStudy);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching case study: " + error.message });
    }
  });

  app.get("/api/case-studies/slug/:slug", async (req, res) => {
    try {
      const caseStudy = await storage.getCaseStudyBySlug(req.params.slug);
      if (!caseStudy) {
        return res.status(404).json({ message: "Case study not found" });
      }
      res.json(caseStudy);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching case study: " + error.message });
    }
  });

  app.post("/api/case-studies", async (req, res) => {
    try {
      const validatedData = insertCaseStudySchema.parse(req.body);
      const caseStudy = await storage.createCaseStudy(validatedData);
      res.json(caseStudy);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid case study data: " + error.message });
    }
  });

  app.put("/api/case-studies/:id", async (req, res) => {
    try {
      const validatedData = insertCaseStudySchema.partial().parse(req.body);
      const caseStudy = await storage.updateCaseStudy(req.params.id, validatedData);
      res.json(caseStudy);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating case study: " + error.message });
    }
  });

  app.delete("/api/case-studies/:id", async (req, res) => {
    try {
      await storage.deleteCaseStudy(req.params.id);
      res.json({ message: "Case study deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting case study: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
