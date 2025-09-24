import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Pricing configuration
const PRICING_CONFIG = {
  individual: {
    priceId: process.env.STRIPE_INDIVIDUAL_PRICE_ID || 'price_individual_default',
    amount: 4900, // $49.00
    name: 'Individual Plan',
    features: ['Up to 5 users', 'Basic discrepancy detection', 'Email support', 'Standard integrations']
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_default', 
    amount: 9900, // $99.00
    name: 'Pro Plan',
    features: ['Up to 25 users', 'Advanced AI protection', 'Priority support', 'Custom workflows', 'Audit reporting']
  },
  team: {
    priceId: process.env.STRIPE_TEAM_PRICE_ID || 'price_team_default',
    amount: 39900, // $399.00
    name: 'Team Plan',
    features: ['Up to 100 users', 'Enterprise AI features', 'Dedicated support', 'Advanced integrations', 'SOC 2 compliance']
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan, successUrl, cancelUrl } = body

    if (!plan || !PRICING_CONFIG[plan as keyof typeof PRICING_CONFIG]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const selectedPlan = PRICING_CONFIG[plan as keyof typeof PRICING_CONFIG]

    // Check or create Stripe customer
    let customerId = ''
    
    // First check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id
        }
      })
      
      customerId = customer.id
      
      // Store customer ID in profile
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          stripe_customer_id: customerId
        })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        supabase_user_id: user.id,
        plan: plan
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: plan
        }
      }
    })

    // Log checkout initiation
    const causalityId = crypto.randomUUID()
    await supabase
      .from('audit_log')
      .insert({
        causality_id: causalityId,
        action: 'checkout_initiated',
        details: {
          plan,
          sessionId: session.id,
          amount: selectedPlan.amount,
          customerId
        },
        user_id: user.id
      })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      plan: selectedPlan,
      causalityId
    })

  } catch (error) {
    console.error('Checkout error:', error)
    
    // Log checkout error
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('audit_log')
        .insert({
          causality_id: crypto.randomUUID(),
          action: 'checkout_error',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          user_id: user.id
        })
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// Handle successful checkout webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status === 'paid' && session.metadata?.supabase_user_id) {
      const userId = session.metadata.supabase_user_id
      const plan = session.metadata.plan
      
      // Update user profile with subscription info
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          subscription_status: 'active',
          subscription_plan: plan,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString()
        })

      // Log successful subscription
      await supabase
        .from('audit_log')
        .insert({
          causality_id: crypto.randomUUID(),
          action: 'subscription_activated',
          details: {
            plan,
            sessionId,
            subscriptionId: session.subscription,
            amount: session.amount_total
          },
          user_id: userId
        })

      return NextResponse.json({ 
        success: true,
        plan,
        subscriptionId: session.subscription
      })
    }

    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })

  } catch (error) {
    console.error('Checkout confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
