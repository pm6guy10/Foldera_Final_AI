// Discrepancy Detection Engine for MVP Rules

export interface DiscrepancyResult {
  type: 'date' | 'entity' | 'amount'
  fileA: string
  valueA: string
  fileB: string
  valueB: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ParsedDocument {
  filename: string
  content: string
  entities: string[]
  dates: string[]
  amounts: string[]
}

// Extract entities (names, organizations) from text
function extractEntities(text: string): string[] {
  // Simple regex patterns for entities
  const patterns = [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Names like "John Smith"
    /\b[A-Z][a-z]+ (?:Inc|LLC|Corp|Corporation|Ltd|Limited)\b/g, // Company names
    /\b[A-Z]{2,}\b/g // Acronyms
  ]
  
  const entities = new Set<string>()
  patterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    matches.forEach(match => entities.add(match.trim()))
  })
  
  return Array.from(entities)
}

// Extract dates from text
function extractDates(text: string): string[] {
  const patterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
    /\b\d{4}\/\d{1,2}\/\d{1,2}\b/g, // YYYY/MM/DD
    /\b\d{1,2}-\d{1,2}-\d{4}\b/g, // MM-DD-YYYY
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g, // YYYY-MM-DD
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g // Month DD, YYYY
  ]
  
  const dates = new Set<string>()
  patterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    matches.forEach(match => dates.add(match.trim()))
  })
  
  return Array.from(dates)
}

// Extract amounts/numbers from text
function extractAmounts(text: string): string[] {
  const patterns = [
    /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g, // Currency: $1,000.00
    /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)\b/gi, // Written currency
    /\b\d+(?:\.\d+)?%/g, // Percentages
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g // Large numbers
  ]
  
  const amounts = new Set<string>()
  patterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    matches.forEach(match => amounts.add(match.trim()))
  })
  
  return Array.from(amounts)
}

// Parse document and extract structured data
export function parseDocument(filename: string, content: string): ParsedDocument {
  return {
    filename,
    content,
    entities: extractEntities(content),
    dates: extractDates(content),
    amounts: extractAmounts(content)
  }
}

// Compare two documents for discrepancies
function compareDocuments(docA: ParsedDocument, docB: ParsedDocument): DiscrepancyResult[] {
  const discrepancies: DiscrepancyResult[] = []

  // Date mismatches
  docA.dates.forEach(dateA => {
    docB.dates.forEach(dateB => {
      if (dateA !== dateB && areSimilarDates(dateA, dateB)) {
        discrepancies.push({
          type: 'date',
          fileA: docA.filename,
          valueA: dateA,
          fileB: docB.filename,
          valueB: dateB,
          severity: 'high'
        })
      }
    })
  })

  // Entity mismatches (similar names with different spellings)
  docA.entities.forEach(entityA => {
    docB.entities.forEach(entityB => {
      if (entityA !== entityB && areSimilarEntities(entityA, entityB)) {
        discrepancies.push({
          type: 'entity',
          fileA: docA.filename,
          valueA: entityA,
          fileB: docB.filename,
          valueB: entityB,
          severity: 'medium'
        })
      }
    })
  })

  // Amount mismatches
  docA.amounts.forEach(amountA => {
    docB.amounts.forEach(amountB => {
      if (amountA !== amountB && areSimilarAmounts(amountA, amountB)) {
        discrepancies.push({
          type: 'amount',
          fileA: docA.filename,
          valueA: amountA,
          fileB: docB.filename,
          valueB: amountB,
          severity: 'critical'
        })
      }
    })
  })

  return discrepancies
}

// Helper functions for similarity detection
function areSimilarDates(dateA: string, dateB: string): boolean {
  // Convert dates to standardized format and compare
  const normA = normalizeDateString(dateA)
  const normB = normalizeDateString(dateB)
  return normA === normB && dateA !== dateB
}

function areSimilarEntities(entityA: string, entityB: string): boolean {
  // Simple Levenshtein distance check
  const distance = levenshteinDistance(entityA.toLowerCase(), entityB.toLowerCase())
  const maxLength = Math.max(entityA.length, entityB.length)
  return distance > 0 && distance <= maxLength * 0.3 // 30% similarity threshold
}

function areSimilarAmounts(amountA: string, amountB: string): boolean {
  // Extract numeric values and compare
  const numA = extractNumericValue(amountA)
  const numB = extractNumericValue(amountB)
  if (numA && numB) {
    const diff = Math.abs(numA - numB) / Math.max(numA, numB)
    return diff < 0.05 // 5% difference threshold
  }
  return false
}

// Utility functions
function normalizeDateString(date: string): string {
  // Attempt to parse and normalize date formats
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? date : parsed.toISOString().split('T')[0]
}

function extractNumericValue(text: string): number | null {
  const match = text.match(/[\d,]+(?:\.\d+)?/)
  if (match) {
    const cleaned = match[0].replace(/,/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }
  return null
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i] + 1, // deletion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Main discrepancy detection function
export function detectDiscrepancies(documents: ParsedDocument[]): DiscrepancyResult[] {
  const allDiscrepancies: DiscrepancyResult[] = []
  
  // Compare each document pair
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const discrepancies = compareDocuments(documents[i], documents[j])
      allDiscrepancies.push(...discrepancies)
    }
  }
  
  return allDiscrepancies
}