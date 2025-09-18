import OpenAI from "openai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";
import path from "path";
import { storage } from "./storage";
import type { Document, InsertDocumentAnalysis, InsertContradictionFinding } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ContradictionAnalysis {
  contradictions: Array<{
    type: 'budget' | 'legal' | 'compliance' | 'version' | 'deadline' | 'data';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    pageNumber?: number;
    lineNumber?: number;
    textSnippet: string;
    potentialImpact: string;
    recommendation: string;
    suggestedFix: string;
    financialImpact?: string;
    preventedLoss?: string;
  }>;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
}

export class DocumentProcessingService {
  private static instance: DocumentProcessingService;
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.initializeUploadDirectory();
  }

  static getInstance(): DocumentProcessingService {
    if (!DocumentProcessingService.instance) {
      DocumentProcessingService.instance = new DocumentProcessingService();
    }
    return DocumentProcessingService.instance;
  }

  private async initializeUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Extract text from uploaded file based on file type
   */
  async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractPdfText(filePath);
        case 'docx':
        case 'doc':
          return await this.extractWordText(filePath);
        case 'txt':
          return await this.extractPlainText(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileType} file:`, error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  private async extractPdfText(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  private async extractWordText(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async extractPlainText(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * Analyze document for contradictions using GPT-5
   */
  async analyzeDocumentForContradictions(
    text: string, 
    documentContext: { fileName: string; fileType: string; userId: string }
  ): Promise<ContradictionAnalysis> {
    const prompt = this.buildAnalysisPrompt(text, documentContext);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        messages: [
          {
            role: "system",
            content: "You are an expert legal and compliance analyst specializing in document review and contradiction detection. Analyze documents for conflicts, inconsistencies, compliance issues, and potential risks. Provide detailed findings with specific locations and actionable recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000,
      });

      const analysisResult = JSON.parse(response.choices[0].message.content);
      return this.validateAndFormatAnalysis(analysisResult);
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(text: string, context: { fileName: string; fileType: string; userId: string }): string {
    return `
Please analyze the following document for contradictions, conflicts, and compliance issues:

DOCUMENT CONTEXT:
- File Name: ${context.fileName}
- File Type: ${context.fileType}
- Purpose: Legal/Compliance review for audit dashboard

DOCUMENT TEXT:
${text}

Please identify and analyze:

1. **Contradictions and Conflicts**:
   - Internal contradictions within the document
   - Version conflicts or outdated information
   - Budget discrepancies or financial inconsistencies
   - Legal or regulatory compliance issues
   - Deadline conflicts or timing inconsistencies
   - Data inconsistencies or calculation errors

2. **Risk Assessment**:
   - Severity level for each issue found
   - Potential financial or legal impact
   - Compliance risks and regulatory implications

3. **Recommendations**:
   - Specific fixes for each contradiction
   - Suggested improvements or clarifications
   - Risk mitigation strategies

Respond with a JSON object in this exact format:
{
  "contradictions": [
    {
      "type": "budget|legal|compliance|version|deadline|data",
      "severity": "low|medium|high|critical",
      "title": "Brief title of the contradiction",
      "description": "Detailed description of the contradiction found",
      "pageNumber": 1,
      "lineNumber": 15,
      "textSnippet": "Exact text where contradiction appears",
      "potentialImpact": "Description of potential consequences",
      "recommendation": "Specific recommendation to resolve",
      "suggestedFix": "Actionable fix or correction",
      "financialImpact": "Estimated financial impact if applicable",
      "preventedLoss": "Potential loss prevented by addressing this"
    }
  ],
  "summary": "Overall summary of document analysis and key findings",
  "riskLevel": "low|medium|high|critical",
  "confidenceScore": 0.95
}

If no contradictions are found, return an empty contradictions array but still provide a summary and confidence score.
    `;
  }

  private validateAndFormatAnalysis(rawAnalysis: any): ContradictionAnalysis {
    // Validate the structure and provide defaults
    const validatedAnalysis: ContradictionAnalysis = {
      contradictions: [],
      summary: rawAnalysis.summary || "Document analysis completed",
      riskLevel: this.validateRiskLevel(rawAnalysis.riskLevel) || 'low',
      confidenceScore: Math.max(0, Math.min(1, rawAnalysis.confidenceScore || 0.8))
    };

    // Validate and format contradictions
    if (Array.isArray(rawAnalysis.contradictions)) {
      validatedAnalysis.contradictions = rawAnalysis.contradictions.map((c: any) => ({
        type: this.validateContradictionType(c.type) || 'data',
        severity: this.validateSeverity(c.severity) || 'medium',
        title: c.title || 'Unspecified issue',
        description: c.description || 'No description provided',
        pageNumber: c.pageNumber || undefined,
        lineNumber: c.lineNumber || undefined,
        textSnippet: c.textSnippet || '',
        potentialImpact: c.potentialImpact || 'Impact assessment needed',
        recommendation: c.recommendation || 'Review required',
        suggestedFix: c.suggestedFix || 'Manual review recommended',
        financialImpact: c.financialImpact,
        preventedLoss: c.preventedLoss
      }));
    }

    return validatedAnalysis;
  }

  private validateContradictionType(type: string): 'budget' | 'legal' | 'compliance' | 'version' | 'deadline' | 'data' | null {
    const validTypes = ['budget', 'legal', 'compliance', 'version', 'deadline', 'data'];
    return validTypes.includes(type) ? type as any : null;
  }

  private validateSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' | null {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    return validSeverities.includes(severity) ? severity as any : null;
  }

  private validateRiskLevel(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' | null {
    const validLevels = ['low', 'medium', 'high', 'critical'];
    return validLevels.includes(riskLevel) ? riskLevel as any : null;
  }

  /**
   * Process a document: extract text and analyze for contradictions
   */
  async processDocument(document: Document): Promise<void> {
    try {
      // Update document status to extracting
      await storage.updateDocument(document.id, { 
        processingStatus: 'extracting',
        textExtractionStatus: 'processing' 
      });

      // Extract text from the document
      const extractedText = await this.extractTextFromFile(document.filePath, document.fileType);
      
      // Update document with extracted text
      await storage.updateDocument(document.id, {
        extractedText,
        textExtractionStatus: 'completed',
        processingStatus: 'analyzing'
      });

      // Create analysis record
      const analysis: InsertDocumentAnalysis = {
        documentId: document.id,
        analysisType: 'contradiction',
        status: 'processing',
        model: 'gpt-5',
        prompt: 'Document contradiction analysis'
      };

      const analysisRecord = await storage.createDocumentAnalysis(analysis);

      // Analyze document for contradictions
      const startTime = Date.now();
      const contradictionAnalysis = await this.analyzeDocumentForContradictions(extractedText, {
        fileName: document.fileName,
        fileType: document.fileType,
        userId: document.userId
      });
      
      const processingTime = Date.now() - startTime;

      // Update analysis with results
      await storage.updateDocumentAnalysis(analysisRecord.id, {
        status: 'completed',
        summary: contradictionAnalysis.summary,
        confidenceScore: contradictionAnalysis.confidenceScore,
        riskLevel: contradictionAnalysis.riskLevel,
        processingTimeMs: processingTime,
        rawResponse: contradictionAnalysis,
        completedAt: new Date()
      });

      // Save contradiction findings
      for (const contradiction of contradictionAnalysis.contradictions) {
        const finding: InsertContradictionFinding = {
          analysisId: analysisRecord.id,
          documentId: document.id,
          contradictionType: contradiction.type,
          severity: contradiction.severity,
          title: contradiction.title,
          description: contradiction.description,
          pageNumber: contradiction.pageNumber,
          lineNumber: contradiction.lineNumber,
          textSnippet: contradiction.textSnippet,
          potentialImpact: contradiction.potentialImpact,
          recommendation: contradiction.recommendation,
          suggestedFix: contradiction.suggestedFix,
          financialImpact: contradiction.financialImpact,
          preventedLoss: contradiction.preventedLoss,
          status: 'detected'
        };

        await storage.createContradictionFinding(finding);
      }

      // Update document status to completed
      await storage.updateDocument(document.id, {
        processingStatus: 'completed',
        processedAt: new Date()
      });

    } catch (error) {
      console.error('Document processing error:', error);
      
      // Update document status to failed
      await storage.updateDocument(document.id, {
        processingStatus: 'failed',
        extractionError: error.message
      });

      throw error;
    }
  }

  /**
   * Get supported file types
   */
  getSupportedFileTypes(): string[] {
    return ['pdf', 'docx', 'doc', 'txt'];
  }

  /**
   * Validate file type
   */
  isFileTypeSupported(fileType: string): boolean {
    return this.getSupportedFileTypes().includes(fileType.toLowerCase());
  }

  /**
   * Get upload directory path
   */
  getUploadDirectory(): string {
    return this.uploadDir;
  }
}

export const documentProcessingService = DocumentProcessingService.getInstance();