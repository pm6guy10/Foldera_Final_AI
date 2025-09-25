import { NextRequest, NextResponse } from 'next/server'
import { insertDemoRequestSchema } from '@shared/schema'
import { z } from 'zod'

// In-memory storage for demo purposes - replace with Supabase later
const demoRequests: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = insertDemoRequestSchema.parse(body)
    
    const demoRequest = {
      id: crypto.randomUUID(),
      ...validatedData,
      createdAt: new Date()
    }
    
    demoRequests.push(demoRequest)
    
    return NextResponse.json(demoRequest)
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Invalid request data: ' + error.message },
      { status: 400 }
    )
  }
}