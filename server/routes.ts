import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertDemoRequestSchema, insertEventSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
