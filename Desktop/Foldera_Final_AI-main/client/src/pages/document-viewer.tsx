import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  processingStatus: string;
  textExtractionStatus: string;
  extractionError?: string;
  createdAt: string;
  processedAt?: string;
}

const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'PDF';
    case 'docx':
    case 'doc':
      return 'DOC';
    case 'txt':
      return 'TXT';
    default:
      return 'FILE';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-500';
    case 'analyzing':
    case 'extracting':
      return 'text-blue-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'uploaded':
      return <Badge variant="secondary">Uploaded</Badge>;
    case 'extracting':
      return <Badge variant="outline" className="text-blue-500">Extracting</Badge>;
    case 'analyzing':
      return <Badge variant="outline" className="text-blue-500">Analyzing</Badge>;
    case 'completed':
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Processing</Badge>;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export default function DocumentViewer() {
  const [, params] = useRoute('/document/:id');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const documentId = params?.id;

  // Fetch document data
  const { data: document, isLoading, error } = useQuery({
    queryKey: ['/api/documents', documentId],
    queryFn: () => fetch(`/api/documents/${documentId}`).then(res => {
      if (!res.ok) {
        throw new Error('Document not found');
      }
      return res.json();
    }),
    enabled: !!documentId
  });

  const handleCopyToClipboard = async () => {
    if (!document?.extractedText) {
      toast({
        title: "No text to copy",
        description: "This document has no extracted text available",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(document.extractedText);
      setCopied(true);
      toast({
        title: "Text copied!",
        description: "Document text has been copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading document...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/documents">
              <Button variant="ghost" size="sm" data-testid="back-to-documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="py-20">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
                <p className="text-muted-foreground">
                  The document you're looking for doesn't exist or has been removed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/documents">
            <Button variant="ghost" size="sm" data-testid="back-to-documents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
          
          <Button
            onClick={handleCopyToClipboard}
            disabled={!document.extractedText}
            data-testid="copy-text-button"
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Text
              </>
            )}
          </Button>
        </div>

        {/* Document metadata */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="text-3xl">{getFileIcon(document.fileType)}</span>
              <div className="flex-1">
                <h1 className="text-2xl font-bold" data-testid="document-title">
                  {document.originalName}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span data-testid="document-size">{formatFileSize(document.fileSize)}</span>
                  <span data-testid="document-type">{document.fileType.toUpperCase()}</span>
                  <span data-testid="document-created">Uploaded: {formatDate(document.createdAt)}</span>
                  {document.processedAt && (
                    <span data-testid="document-processed">Processed: {formatDate(document.processedAt)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(document.processingStatus)}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Document content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Extracted Text
              </span>
              {document.extractedText && (
                <Badge variant="secondary">
                  {document.extractedText.length.toLocaleString()} characters
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {document.textExtractionStatus === 'pending' || document.textExtractionStatus === 'extracting' ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="h-6 w-6 animate-pulse mr-2 text-blue-500" />
                <span>Text extraction in progress...</span>
              </div>
            ) : document.textExtractionStatus === 'failed' ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-red-500" />
                <p className="text-red-600 font-semibold">Text Extraction Failed</p>
                {document.extractionError && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {document.extractionError}
                  </p>
                )}
              </div>
            ) : document.extractedText ? (
              <div 
                className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto border"
                data-testid="extracted-text-content"
              >
                {document.extractedText}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p className="text-muted-foreground">No text content available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This document may be empty or text extraction was not successful
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}