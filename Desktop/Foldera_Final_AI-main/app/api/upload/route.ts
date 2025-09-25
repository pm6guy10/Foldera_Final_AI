import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processFile, validateFile } from '@/lib/fileProcessor';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    if (!files.length) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const processedFiles = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) continue;
      const processed = await processFile(file);
      await supabase.from('processed_documents').insert({
        file_name: processed.metadata.fileName,
        file_type: processed.metadata.fileType,
        file_size: processed.metadata.size,
        file_hash: processed.metadata.hash,
        extracted_text: processed.text,
        extraction_method: processed.metadata.extractionMethod,
        processed_at: processed.metadata.processedAt
      });
      processedFiles.push({ fileName: file.name, textLength: processed.text.length });
    }

    return NextResponse.json({ success: true, processed: processedFiles });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}