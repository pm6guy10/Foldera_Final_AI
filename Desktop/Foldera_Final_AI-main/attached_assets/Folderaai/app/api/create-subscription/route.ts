import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2025-08-27.basil",
})

export async function POST(request: NextRequest) {
  try {
    const { email, priceId } = await request.json()
    
    if (!email || !priceId) {
      return NextResponse.json(
        { message: "Email and priceId are required" },
        { status: 400 }
      )
    }

    // For demo purposes, return a mock response if no Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        subscriptionId: 'mock_subscription_id',
        clientSecret: 'mock_client_secret_for_demo',
      })
    }

    // Create or retrieve customer
    const customers = await stripe.customers.list({ email, limit: 1 })
    let customer

    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      customer = await stripe.customers.create({ email })
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating subscription: " + error.message },
      { status: 400 }
    )
  }
}