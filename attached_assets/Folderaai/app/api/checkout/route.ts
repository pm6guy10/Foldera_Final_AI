// Importing necessary modules
import Stripe from 'stripe';

// Initializing the Stripe object with the new API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

// Other code...
