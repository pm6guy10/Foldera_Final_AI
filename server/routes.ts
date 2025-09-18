import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { documentProcessingService } from "./documentProcessingService";
import { insertDemoRequestSchema, insertEventSchema, insertSessionSchema, insertPageViewSchema, insertSectionViewSchema, insertFormInteractionSchema, insertConversionFunnelSchema, insertFunnelProgressionSchema, insertConsentSettingsSchema, insertTestimonialSchema, insertCaseStudySchema, insertLeadScoringRuleSchema, insertCrmExportLogSchema, insertLeadActivitySchema, insertDocumentSchema, insertDocumentAnalysisSchema, insertContradictionFindingSchema, insertDocumentProcessingJobSchema } from "@shared/schema";
import { getPricingTier, isRecurringSubscription, isOneTimePayment } from "@shared/pricing";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Security and middleware utilities
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
function createRateLimit(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    let requestData = rateLimitStore.get(key);
    if (!requestData || now > requestData.resetTime) {
      requestData = { count: 0, resetTime: now + windowMs };
    }
    
    requestData.count++;
    rateLimitStore.set(key, requestData);
    
    if (requestData.count > maxRequests) {
      return res.status(429).json({ 
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
    
    next();
  };
}

// Consent validation middleware
function requireConsent(consentType?: 'analytics' | 'marketing' | 'personalization') {
  return async (req: any, res: any, next: any) => {
    const visitorId = req.body?.visitorId || req.query?.visitorId;
    
    if (!visitorId) {
      return next(); // If no visitor ID, allow request (for initial contact forms)
    }
    
    try {
      const consent = await storage.getConsentSettings(visitorId);
      
      if (consent && consent.optedOutAt) {
        return res.status(403).json({ 
          message: 'User has opted out of data processing',
          optedOutAt: consent.optedOutAt
        });
      }
      
      if (consentType && consent) {
        const hasConsent = consentType === 'analytics' ? consent.analyticsConsent :
                          consentType === 'marketing' ? consent.marketingConsent :
                          consentType === 'personalization' ? consent.personalizationConsent :
                          false;
        
        if (!hasConsent) {
          return res.status(403).json({ 
            message: `${consentType} consent not granted`,
            consentType
          });
        }
      }
      
      next();
    } catch (error) {
      next(); // On error, allow request but log the issue
      console.warn('Consent check failed:', error);
    }
  };
}

// Idempotency middleware for critical operations
const idempotencyStore = new Map<string, { result: any; timestamp: number }>();

function createIdempotencyMiddleware(windowMs: number = 5 * 60 * 1000) {
  return (req: any, res: any, next: any) => {
    const idempotencyKey = req.headers['idempotency-key'];
    
    if (!idempotencyKey) {
      return next(); // Allow request without idempotency key
    }
    
    const now = Date.now();
    const existing = idempotencyStore.get(idempotencyKey);
    
    if (existing && (now - existing.timestamp) < windowMs) {
      return res.json(existing.result);
    }
    
    // Store original json method to capture response
    const originalJson = res.json;
    res.json = function(data: any) {
      idempotencyStore.set(idempotencyKey, {
        result: data,
        timestamp: now
      });
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Only PDF, Word documents, and text files are allowed. Got: ${file.mimetype}`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Document Processing Endpoints
  
  // Upload document(s)
  app.post("/api/documents/upload", 
    createRateLimit(10, 60 * 1000), // 10 uploads per minute
    upload.array('documents', 5), // Max 5 files
    async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const userId = req.body.userId || 'demo-user'; // TODO: Replace with actual user auth
      const uploadedDocuments = [];

      for (const file of req.files as Express.Multer.File[]) {
        // Get file type from extension
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileType = fileExtension.replace('.', '');

        // Create document record
        const documentData = {
          userId,
          fileName: file.filename,
          originalName: file.originalname,
          fileType,
          fileSize: file.size,
          filePath: file.path,
          processingStatus: 'uploaded' as const,
          textExtractionStatus: 'pending' as const
        };

        const document = await storage.createDocument(documentData);
        uploadedDocuments.push(document);

        // Start background processing
        setImmediate(async () => {
          try {
            await documentProcessingService.processDocument(document);
          } catch (error) {
            console.error('Background processing failed for document:', document.id, error);
          }
        });
      }

      res.json({
        message: `${uploadedDocuments.length} document(s) uploaded successfully`,
        documents: uploadedDocuments
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Upload failed: " + error.message });
    }
  });

  // Get user's documents
  app.get("/api/documents", async (req, res) => {
    try {
      const userId = req.query.userId || 'demo-user'; // TODO: Replace with actual user auth
      const documents = await storage.getUserDocuments(userId as string);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch documents: " + error.message });
    }
  });

  // Get specific document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch document: " + error.message });
    }
  });

  // Get document analysis results
  app.get("/api/documents/:id/analysis", async (req, res) => {
    try {
      const analyses = await storage.getDocumentAnalysesByDocument(req.params.id);
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch analysis: " + error.message });
    }
  });

  // Get contradictions for a document
  app.get("/api/documents/:id/contradictions", async (req, res) => {
    try {
      const contradictions = await storage.getContradictionsByDocument(req.params.id);
      res.json(contradictions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch contradictions: " + error.message });
    }
  });

  // Get user's contradictions with filters
  app.get("/api/contradictions", async (req, res) => {
    try {
      const userId = req.query.userId || 'demo-user'; // TODO: Replace with actual user auth
      const filters = {
        severity: req.query.severity as string,
        status: req.query.status as string,
        contradictionType: req.query.type as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const contradictions = await storage.getUserContradictions(userId as string, filters);
      res.json(contradictions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch contradictions: " + error.message });
    }
  });

  // Resolve contradiction
  app.post("/api/contradictions/:id/resolve", async (req, res) => {
    try {
      const userId = req.body.userId || 'demo-user'; // TODO: Replace with actual user auth
      const notes = req.body.notes || '';
      
      const contradiction = await storage.resolveContradiction(req.params.id, userId, notes);
      res.json(contradiction);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to resolve contradiction: " + error.message });
    }
  });

  // Update contradiction status
  app.put("/api/contradictions/:id", async (req, res) => {
    try {
      const updates = req.body;
      const contradiction = await storage.updateContradictionFinding(req.params.id, updates);
      res.json(contradiction);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update contradiction: " + error.message });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete file from filesystem
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn('Failed to delete file:', document.filePath, error);
      }

      // Delete from database
      await storage.deleteDocument(req.params.id);
      
      res.json({ message: "Document deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete document: " + error.message });
    }
  });

  // Demo request endpoint - with rate limiting and idempotency
  app.post("/api/demo-request", 
    createRateLimit(3, 60 * 1000), // 3 requests per minute
    createIdempotencyMiddleware(), 
    async (req, res) => {
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
      // If page view not found, it's likely because the original creation failed
      // Return success instead of error to prevent client retries
      if (error.message === "Page view not found") {
        res.json({ message: "Page view not found, but update acknowledged" });
      } else {
        res.status(400).json({ message: "Error updating page view: " + error.message });
      }
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

  // Lead Scoring and Management API Routes
  
  // Lead profile management
  app.get("/api/leads", async (req, res) => {
    try {
      const { qualification, stage, isQualified, assignedTo, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {};
      if (qualification) filters.qualification = qualification as string;
      if (stage) filters.stage = stage as string;
      if (isQualified !== undefined) filters.isQualified = isQualified === 'true';
      if (assignedTo) filters.assignedTo = assignedTo as string;
      filters.limit = parseInt(limit as string);
      filters.offset = parseInt(offset as string);

      const leads = await storage.getLeads(filters);
      const totalCount = await storage.getLeadsCount(filters);
      
      res.json({
        leads,
        pagination: {
          total: totalCount,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < totalCount
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching leads: " + error.message });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLeadProfile(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching lead: " + error.message });
    }
  });

  app.get("/api/leads/visitor/:visitorId", async (req, res) => {
    try {
      const lead = await storage.getLeadProfileByVisitorId(req.params.visitorId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching lead: " + error.message });
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
    try {
      const updates = req.body;
      const lead = await storage.updateLeadProfile(req.params.id, updates);
      res.json(lead);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating lead: " + error.message });
    }
  });

  // Lead activities and scoring history
  app.get("/api/leads/:id/activities", async (req, res) => {
    try {
      const { limit = '50' } = req.query;
      const activities = await storage.getLeadActivities(req.params.id, parseInt(limit as string));
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching lead activities: " + error.message });
    }
  });

  app.get("/api/leads/:id/score-history", async (req, res) => {
    try {
      const { limit = '50' } = req.query;
      const scores = await storage.getLeadScoreHistory(req.params.id, parseInt(limit as string));
      res.json(scores);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching score history: " + error.message });
    }
  });

  // POST /api/leads/scoring/activity - Manual activity scoring endpoint with security
  app.post("/api/leads/scoring/activity",
    createRateLimit(20, 60 * 1000), // 20 requests per minute
    createIdempotencyMiddleware(),
    requireConsent('analytics'),
    async (req, res) => {
    try {
      const validatedData = insertLeadActivitySchema.parse(req.body);
      
      // Create the activity record
      const activity = await storage.createLeadActivity(validatedData);
      
      // If points are awarded, update the lead score
      if (validatedData.pointsAwarded && validatedData.pointsAwarded > 0) {
        const leadProfile = await storage.getLeadProfile(validatedData.leadProfileId);
        if (leadProfile) {
          const newScore = (leadProfile.score || 0) + validatedData.pointsAwarded;
          const reason = `Manual activity: ${validatedData.activityName} (+${validatedData.pointsAwarded} points)`;
          
          const result = await storage.updateLeadScoreAndQualification(
            validatedData.leadProfileId,
            newScore,
            reason,
            activity.id
          );
          
          res.json({
            activity,
            scoreUpdate: result,
            message: "Lead activity recorded and score updated"
          });
        } else {
          res.status(404).json({ message: "Lead profile not found" });
        }
      } else {
        res.json({
          activity,
          message: "Lead activity recorded"
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: "Invalid activity data: " + error.message });
    }
  });

  // Lead scoring rules management
  app.get("/api/scoring-rules", async (req, res) => {
    try {
      const { activeOnly = 'true' } = req.query;
      const rules = await storage.getLeadScoringRules(activeOnly === 'true');
      res.json(rules);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching scoring rules: " + error.message });
    }
  });

  app.get("/api/scoring-rules/:id", async (req, res) => {
    try {
      const rule = await storage.getLeadScoringRule(req.params.id);
      if (!rule) {
        return res.status(404).json({ message: "Scoring rule not found" });
      }
      res.json(rule);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching scoring rule: " + error.message });
    }
  });

  app.post("/api/scoring-rules", async (req, res) => {
    try {
      const validatedData = insertLeadScoringRuleSchema.parse(req.body);
      const rule = await storage.createLeadScoringRule(validatedData);
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid scoring rule data: " + error.message });
    }
  });

  app.put("/api/scoring-rules/:id", async (req, res) => {
    try {
      const updates = req.body;
      const rule = await storage.updateLeadScoringRule(req.params.id, updates);
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating scoring rule: " + error.message });
    }
  });

  app.delete("/api/scoring-rules/:id", async (req, res) => {
    try {
      await storage.deleteLeadScoringRule(req.params.id);
      res.json({ message: "Scoring rule deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting scoring rule: " + error.message });
    }
  });

  // Lead scoring automation - Event processing endpoint
  app.post("/api/lead-scoring/process-event", async (req, res) => {
    try {
      const { leadScoringService } = await import('./leadScoringService');
      const eventData = req.body;
      
      const result = await leadScoringService.processAnalyticsEvent(eventData);
      
      if (result) {
        res.json(result);
      } else {
        res.json({ message: "No scoring rules applied" });
      }
    } catch (error: any) {
      res.status(400).json({ message: "Error processing scoring event: " + error.message });
    }
  });

  // Enhanced analytics endpoints that trigger lead scoring
  app.post("/api/analytics/page-view-scored", async (req, res) => {
    try {
      const validatedData = insertPageViewSchema.parse(req.body);
      const pageView = await storage.createPageView(validatedData);

      // Trigger lead scoring for page view
      const { leadScoringService } = await import('./leadScoringService');
      const scoringResult = await leadScoringService.processPageView({
        visitorId: validatedData.visitorId,
        sessionId: validatedData.sessionId,
        url: validatedData.url,
        path: validatedData.path,
        title: validatedData.title || undefined,
        duration: validatedData.duration || undefined,
        scrollDepth: validatedData.maxScrollDepth || undefined,
      });

      res.json({
        pageView,
        scoring: scoringResult
      });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid page view data: " + error.message });
    }
  });

  app.post("/api/analytics/form-interaction-scored", async (req, res) => {
    try {
      const validatedData = insertFormInteractionSchema.parse(req.body);
      const interaction = await storage.createFormInteraction(validatedData);

      // Trigger lead scoring for form interaction
      const { leadScoringService } = await import('./leadScoringService');
      const scoringResult = await leadScoringService.processFormInteraction({
        visitorId: validatedData.visitorId,
        sessionId: validatedData.sessionId,
        formId: validatedData.formId,
        action: validatedData.action as any,
        completed: validatedData.completed || undefined,
        fieldData: validatedData.fieldValue ? { [validatedData.fieldName || 'unknown']: validatedData.fieldValue } : undefined,
      });

      // Update lead profile with form data if it's a submission
      if (validatedData.action === 'submit' && validatedData.fieldValue) {
        const formData: any = {};
        if (validatedData.fieldName) {
          formData[validatedData.fieldName] = validatedData.fieldValue;
        }
        await leadScoringService.updateLeadFromFormData(validatedData.visitorId, formData);
      }

      res.json({
        interaction,
        scoring: scoringResult
      });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid form interaction data: " + error.message });
    }
  });

  // CRM Integration endpoints
  app.get("/api/crm/export-ready", async (req, res) => {
    try {
      const { crmSystem, limit = '100' } = req.query;
      const leads = await storage.getLeadsForCrmSync(
        crmSystem as string || undefined,
        parseInt(limit as string)
      );
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching CRM export data: " + error.message });
    }
  });

  app.post("/api/crm/export-log", async (req, res) => {
    try {
      const validatedData = insertCrmExportLogSchema.parse(req.body);
      const log = await storage.createCrmExportLog(validatedData);
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid CRM export log data: " + error.message });
    }
  });

  app.get("/api/crm/export-logs", async (req, res) => {
    try {
      const { leadProfileId, limit = '50' } = req.query;
      const logs = await storage.getCrmExportLogs(
        leadProfileId as string || undefined,
        parseInt(limit as string)
      );
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching CRM export logs: " + error.message });
    }
  });

  app.post("/api/crm/mark-synced", async (req, res) => {
    try {
      const { leadProfileId, crmContactId } = req.body;
      
      if (!leadProfileId || !crmContactId) {
        return res.status(400).json({ message: "Lead profile ID and CRM contact ID are required" });
      }

      const lead = await storage.markLeadAsSynced(leadProfileId, crmContactId);
      res.json(lead);
    } catch (error: any) {
      res.status(400).json({ message: "Error marking lead as synced: " + error.message });
    }
  });

  // Specific CRM system export endpoints
  app.get("/api/crm/hubspot/leads", async (req, res) => {
    try {
      const { limit = '50' } = req.query;
      const leads = await storage.getLeadsForCrmSync('hubspot', parseInt(limit as string));
      
      // Transform data for HubSpot format
      const hubspotLeads = leads.map(lead => ({
        id: lead.id,
        email: lead.email,
        firstname: lead.name?.split(' ')[0] || '',
        lastname: lead.name?.split(' ').slice(1).join(' ') || '',
        company: lead.company,
        jobtitle: lead.jobTitle,
        phone: lead.phoneNumber,
        hubspot_owner_id: lead.assignedTo,
        lead_score: lead.score,
        lead_status: lead.qualification,
        lifecycle_stage: lead.stage === 'customer' ? 'customer' : (lead.isQualified ? 'marketingqualifiedlead' : 'lead'),
        website: lead.website,
        first_conversion_date: lead.firstSeenAt,
        last_activity_date: lead.lastActivityAt,
        foldera_visitor_id: lead.visitorId,
        source: lead.source,
      }));

      res.json({
        leads: hubspotLeads,
        total: hubspotLeads.length,
        nextPageToken: null, // Implement pagination if needed
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching leads for HubSpot export: " + error.message });
    }
  });

  app.get("/api/crm/salesforce/leads", async (req, res) => {
    try {
      const { limit = '50' } = req.query;
      const leads = await storage.getLeadsForCrmSync('salesforce', parseInt(limit as string));
      
      // Transform data for Salesforce format
      const salesforceLeads = leads.map(lead => ({
        Id: lead.crmContactId || undefined,
        FirstName: lead.name?.split(' ')[0] || '',
        LastName: lead.name?.split(' ').slice(1).join(' ') || 'Unknown',
        Email: lead.email,
        Company: lead.company || 'Unknown Company',
        Title: lead.jobTitle,
        Phone: lead.phoneNumber,
        Website: lead.website,
        LeadSource: lead.source || 'Website',
        Status: lead.qualification === 'hot' ? 'Working - Contacted' : 
                lead.qualification === 'warm' ? 'Open - Not Contacted' : 'New',
        Rating: lead.qualification === 'hot' ? 'Hot' : 
                lead.qualification === 'warm' ? 'Warm' : 'Cold',
        LeadScore: lead.score,
        Description: `Foldera lead imported from visitor ID: ${lead.visitorId}`,
        OwnerId: lead.assignedTo,
        // Custom fields
        Foldera_Visitor_ID__c: lead.visitorId,
        Foldera_Lead_ID__c: lead.id,
        Total_Page_Views__c: lead.totalPageViews,
        Total_Sessions__c: lead.totalSessions,
        First_Seen_Date__c: lead.firstSeenAt,
        Last_Activity_Date__c: lead.lastActivityAt,
        Lead_Stage__c: lead.stage,
      }));

      res.json({
        records: salesforceLeads,
        totalSize: salesforceLeads.length,
        done: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching leads for Salesforce export: " + error.message });
    }
  });

  // Lead analytics and reporting
  app.get("/api/leads/analytics/summary", async (req, res) => {
    try {
      const totalLeads = await storage.getLeadsCount();
      const qualifiedLeads = await storage.getLeadsCount({ isQualified: true });
      const hotLeads = await storage.getLeadsCount({ qualification: 'hot' });
      const warmLeads = await storage.getLeadsCount({ qualification: 'warm' });
      const coldLeads = await storage.getLeadsCount({ qualification: 'cold' });

      res.json({
        summary: {
          total: totalLeads,
          qualified: qualifiedLeads,
          hot: hotLeads,
          warm: warmLeads,
          cold: coldLeads,
          qualificationRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching lead analytics: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
