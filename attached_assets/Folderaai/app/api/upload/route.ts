import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDocument, detectDiscrepancies } from '@/lib/discrepancy'
import { v4 as uuidv4 } from 'uuid'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const projectId = uuidv4()
    const causalityId = uuidv4()
    
    // Create project record
    const { error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        name: `Upload ${new Date().toLocaleDateString()}`,
        user_id: user.id
      })

    if (projectError) {
      console.error('Project creation error:', projectError)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // Log upload start
    await supabase
      .from('audit_log')
      .insert({
        causality_id: causalityId,
        action: 'file_upload_started',
        details: {
          fileCount: files.length,
          filenames: files.map(f => f.name)
        },
        user_id: user.id,
        project_id: projectId
      })

    const parsedDocuments = []
    
    // Process each file
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer()
        let content = ''
        
        // Parse based on file type
        if (file.type === 'application/pdf') {
          const pdfData = await pdfParse(Buffer.from(buffer))
          content = pdfData.text
        } else if (file.name.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
          content = result.value
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          content = new TextDecoder().decode(buffer)
        } else {
          throw new Error(`Unsupported file type: ${file.type}`)
        }

        // Store file in Supabase storage
        const fileName = `${projectId}/${uuidv4()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, buffer, {
            contentType: file.type,
            metadata: {
              originalName: file.name,
              projectId: projectId
            }
          })

        if (uploadError) {
          console.error('File upload error:', uploadError)
          continue
        }

        // Parse document for discrepancies
        const parsedDoc = parseDocument(file.name, content)
        parsedDocuments.push(parsedDoc)

        // Log individual file processing
        await supabase
          .from('audit_log')
          .insert({
            causality_id: causalityId,
            action: 'file_processed',
            details: {
              filename: file.name,
              contentLength: content.length,
              entitiesCount: parsedDoc.entities.length,
              datesCount: parsedDoc.dates.length,
              amountsCount: parsedDoc.amounts.length
            },
            user_id: user.id,
            project_id: projectId
          })

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        // Log processing error
        await supabase
          .from('audit_log')
          .insert({
            causality_id: causalityId,
            action: 'file_processing_error',
            details: {
              filename: file.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            user_id: user.id,
            project_id: projectId
          })
      }
    }

    // Detect discrepancies across all documents
    const discrepancies = detectDiscrepancies(parsedDocuments)
    
    // Store discrepancies in database
    if (discrepancies.length > 0) {
      const discrepancyRecords = discrepancies.map(d => ({
        type: d.type,
        file_a: d.fileA,
        value_a: d.valueA,
        file_b: d.fileB,
        value_b: d.valueB,
        severity: d.severity,
        project_id: projectId
      }))

      const { error: discrepancyError } = await supabase
        .from('discrepancies')
        .insert(discrepancyRecords)

      if (discrepancyError) {
        console.error('Discrepancy storage error:', discrepancyError)
      }
    }

    // Log completion with results
    await supabase
      .from('audit_log')
      .insert({
        causality_id: causalityId,
        action: 'upload_completed',
        details: {
          projectId,
          filesProcessed: parsedDocuments.length,
          discrepanciesFound: discrepancies.length,
          severityBreakdown: discrepancies.reduce((acc, d) => {
            acc[d.severity] = (acc[d.severity] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        },
        user_id: user.id,
        project_id: projectId
      })

    return NextResponse.json({
      success: true,
      projectId,
      filesProcessed: parsedDocuments.length,
      discrepanciesFound: discrepancies.length,
      discrepancies: discrepancies.slice(0, 10), // Return first 10 for preview
      causalityId
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}