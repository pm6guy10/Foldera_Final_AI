// Pricing configuration for Foldera
export interface PricingTier {
  id: string;
  name: string;
  price: number; // Price in dollars
  period: 'monthly' | 'one-time';
  stripeProductId?: string; // To be configured in Stripe dashboard
  stripePriceId?: string; // To be configured in Stripe dashboard
  description: string;
  features: string[];
}

// Price IDs will be configured from environment variables in the server
export const PRICING_TIERS: Record<string, PricingTier> = {
  'self-serve': {
    id: 'self-serve',
    name: 'Self-Serve',
    price: 99,
    period: 'monthly',
    stripePriceId: 'price_selfserve_monthly', // Default - will be overridden by env vars in server
    description: 'Perfect for individual professionals who want AI assistance',
    features: [
      'AI-powered document scanning',
      'Basic conflict detection',
      'Email notifications',
      'Monthly reports'
    ]
  },
  'pro': {
    id: 'pro',
    name: 'Pro',
    price: 399,
    period: 'monthly',
    stripePriceId: 'price_pro_monthly', // Default - will be overridden by env vars in server
    description: 'For teams that need comprehensive AI oversight',
    features: [
      'Everything in Self-Serve',
      'Advanced risk analysis',
      'Team collaboration',
      'Priority support',
      'Custom integrations'
    ]
  },
  'pilot': {
    id: 'pilot',
    name: 'Pilot',
    price: 0, // Contact Sales - no price displayed
    period: 'one-time',
    description: 'Contact Sales for enterprise pilot program',
    features: [
      'Full platform access',
      'Dedicated onboarding',
      '90-day pilot program',
      'Custom reporting',
      'Executive briefings'
    ]
  }
};

export function getPricingTier(planId: string): PricingTier | null {
  return PRICING_TIERS[planId] || null;
}

export function isRecurringSubscription(planId: string): boolean {
  const tier = getPricingTier(planId);
  return tier?.period === 'monthly';
}

export function isOneTimePayment(planId: string): boolean {
  const tier = getPricingTier(planId);
  return tier?.period === 'one-time';
}