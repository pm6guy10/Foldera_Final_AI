# Stripe Integration Setup Instructions

## Overview

The Foldera application now supports three pricing tiers with proper Stripe integration:

- **Self-Serve**: $99/month recurring subscription
- **Pro**: $399/month recurring subscription  
- **Pilot**: $5,000 one-time payment

## Required Stripe Configuration

### 1. Create Price Objects in Stripe Dashboard

You need to create the following price objects in your [Stripe Dashboard](https://dashboard.stripe.com/products):

#### Self-Serve Plan ($99/month)
1. Go to Products → Add Product
2. Create a product called "Self-Serve Plan"
3. Add a recurring price of $99 USD monthly
4. Copy the price ID (starts with `price_`) 
5. Set environment variable: `STRIPE_PRICE_ID_SELF_SERVE=price_xxxxx`

#### Pro Plan ($399/month)
1. Go to Products → Add Product
2. Create a product called "Pro Plan" 
3. Add a recurring price of $399 USD monthly
4. Copy the price ID (starts with `price_`)
5. Set environment variable: `STRIPE_PRICE_ID_PRO=price_xxxxx`

#### Pilot Plan (One-time $5,000)
- No price ID needed - handled via PaymentIntent with dynamic amount

### 2. Environment Variables Required

```bash
# Required Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
VITE_STRIPE_PUBLIC_KEY=pk_test_... # or pk_live_... for production

# Optional: Custom Price IDs (use defaults if not set)
STRIPE_PRICE_ID_SELF_SERVE=price_your_selfserve_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_price_id
```

## How the Integration Works

### API Endpoints

**`POST /api/create-payment`**
- Unified endpoint for all payment types
- Body: `{ "email": "user@email.com", "plan": "self-serve" | "pro" | "pilot" }`
- Returns payment session details and client secret

**`POST /api/demo-request`** 
- Existing endpoint for demo requests
- Body: `{ "email", "company", "teamSize" }`

### Client-Side Integration

**Subscribe Page**: `/subscribe?plan={plan_id}`
- Supports plan parameters: `self-serve`, `pro`, `pilot`
- Automatically handles subscription vs one-time payment flows
- Displays plan features and pricing
- Uses Stripe Elements for secure payment processing

### Example URLs

- `/subscribe?plan=self-serve` - $99/month subscription
- `/subscribe?plan=pro` - $399/month subscription  
- `/subscribe?plan=pilot` - $5,000 one-time payment

## Testing Status

✅ **Working:**
- Pilot plan (one-time $5,000 payment) - tested successfully
- Client secret generation
- Payment form rendering
- Error handling

❌ **Requires Stripe Dashboard Setup:**
- Self-Serve and Pro plans need price IDs created in Stripe dashboard
- Set environment variables for custom price IDs

## Security Notes

- All Stripe keys are properly secured via environment variables
- Client secret generation happens server-side
- No sensitive data exposed to client
- Proper error handling for failed payments

## Next Steps

1. Create the price objects in your Stripe Dashboard
2. Set the environment variables with your actual price IDs  
3. Test each pricing tier thoroughly
4. Configure webhooks for payment confirmations (future enhancement)
5. Add user authentication for real customer emails (currently uses placeholder)