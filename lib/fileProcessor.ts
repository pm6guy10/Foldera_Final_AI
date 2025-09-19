import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createHash } from 'crypto';

interface ProcessedFile {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    size: number;
    hash: string;
    processedAt: Date;
    extractionMethod: 'primary' | 'fallback';
  };
}

async function processPdfFile(file: File): Promise<ProcessedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = createHash('sha256').update(buffer).digest('hex');
  try {
    const data = await pdfParse(buffer);
    return { text: data.text || '', metadata: { fileName: file.name, fileType: 'application/pdf', size: file.size, hash, processedAt: new Date(), extractionMethod: 'primary' } };
  } catch {
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const partialText = textDecoder.decode(buffer).replace(/[^\x20-\x7E\n\r]/g, '').trim();
    return { text: partialText || `[PDF extraction failed for ${file.name}]`, metadata: { fileName: file.name, fileType: 'application/pdf', size: file.size, hash, processedAt: new Date(), extractionMethod: 'fallback' } };
  }
}

async function processDocxFile(file: File): Promise<ProcessedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const hash = createHash('sha256').update(Buffer.from(arrayBuffer)).digest('hex');
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result.value?.trim()) {
      return { text: result.value, metadata: { fileName: file.name, fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: file.size, hash, processedAt: new Date(), extractionMethod: 'primary' } };
    }
    throw new Error('Empty mammoth extraction');
  } catch {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');
    const extractedText = documentXml ? documentXml.replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim() : '';
    return { text: extractedText || `[DOCX fallback extraction for ${file.name}]`, metadata: { fileName: file.name, fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: file.size, hash, processedAt: new Date(), extractionMethod: 'fallback' } };
  }
}

async function processTextFile(file: File): Promise<ProcessedFile> {
  const text = await file.text();
  const hash = createHash('sha256').update(text).digest('hex');
  return { text, metadata: { fileName: file.name, fileType: 'text/plain', size: file.size, hash, processedAt: new Date(), extractionMethod: 'primary' } };
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);
  switch (file.type) {
    case 'application/pdf': return processPdfFile(file);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword': return processDocxFile(file);
    case 'text/plain': return processTextFile(file);
    default:
      if (file.name.match(/\.(txt|csv|json|xml|html|md)$/i)) return processTextFile(file);
      throw new Error(`Unsupported file type: ${file.type}`);
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
  if (!file) return { valid: false, error: 'No file provided' };
  if (file.size > MAX_SIZE) return { valid: false, error: 'File too large' };
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(txt|csv|json|xml|html|md|pdf|docx|doc)$/i)) return { valid: false, error: 'Invalid file type' };
  if (file.name.includes('../') || file.name.includes('..\\')) return { valid: false, error: 'Invalid file name' };
  return { valid: true };
}