import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    let query = supabase
      .from('discrepancies')
      .select(`
        *,
        projects!inner (
          user_id,
          name
        )
      `)
      .eq('projects.user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    if (severity) {
      query = query.eq('severity', severity)
    }
    
    if (type) {
      query = query.eq('type', type)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: discrepancies, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Failed to fetch discrepancies' }, { status: 500 })
    }

    // Get counts by severity for summary
    const { data: summaryData } = await supabase
      .from('discrepancies')
      .select('severity, projects!inner(user_id)')
      .eq('projects.user_id', user.id)

    const severityCounts = summaryData?.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Log access
    await supabase
      .from('audit_log')
      .insert({
        causality_id: crypto.randomUUID(),
        action: 'discrepancies_viewed',
        details: {
          filters: { projectId, severity, type },
          resultCount: discrepancies?.length || 0
        },
        user_id: user.id
      })

    return NextResponse.json({
      discrepancies: discrepancies || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary: {
        total: summaryData?.length || 0,
        bySeverity: severityCounts
      }
    })

  } catch (error) {
    console.error('Discrepancies API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
    const { discrepancyId, action, resolution } = body

    // Verify user owns this discrepancy
    const { data: discrepancy } = await supabase
      .from('discrepancies')
      .select(`
        *,
        projects!inner (
          user_id
        )
      `)
      .eq('id', discrepancyId)
      .eq('projects.user_id', user.id)
      .single()

    if (!discrepancy) {
      return NextResponse.json({ error: 'Discrepancy not found' }, { status: 404 })
    }

    // Log the action
    const causalityId = crypto.randomUUID()
    await supabase
      .from('audit_log')
      .insert({
        causality_id: causalityId,
        action: `discrepancy_${action}`,
        details: {
          discrepancyId,
          originalSeverity: discrepancy.severity,
          resolution: resolution || null
        },
        user_id: user.id,
        project_id: discrepancy.project_id
      })

    return NextResponse.json({
      success: true,
      action,
      causalityId
    })

  } catch (error) {
    console.error('Discrepancy action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}