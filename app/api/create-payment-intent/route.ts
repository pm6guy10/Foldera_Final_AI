import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2025-08-27.basil",
})

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()
    
    // For demo purposes, return a mock response if no Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        clientSecret: 'mock_client_secret_for_demo',
      })
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
    })
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating payment intent: " + error.message },
      { status: 500 }
    )
  }
}