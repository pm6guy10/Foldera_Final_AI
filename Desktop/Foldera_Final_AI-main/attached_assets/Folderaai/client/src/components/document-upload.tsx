import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  processingStatus: 'uploaded' | 'extracting' | 'analyzing' | 'completed' | 'failed';
  textExtractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
}

interface UploadedFile extends File {
  id: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
}

const getFileIcon = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'docx':
    case 'doc':
      return '📝';
    case 'txt':
      return '📋';
    default:
      return '📄';
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
      return <Badge variant="outline" className="text-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Extracting</Badge>;
    case 'analyzing':
      return <Badge variant="outline" className="text-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Analyzing</Badge>;
    case 'completed':
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Processing</Badge>;
  }
};

export default function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryParams: { userId: 'demo-user' } // TODO: Replace with actual user auth
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });
      formData.append('userId', 'demo-user'); // TODO: Replace with actual user auth

      // Use direct fetch for file uploads since apiRequest doesn't handle FormData properly
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text() || response.statusText;
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: data.message,
      });
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive",
      });
    },
  });

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (files: File[]) => {
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (!supportedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx?|txt)$/i)) {
        errors.push(`${file.name}: Unsupported file type`);
        return;
      }

      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }

      const uploadFile: UploadedFile = {
        ...file,
        id: `${Date.now()}-${Math.random()}`,
        uploadProgress: 0,
        status: 'pending'
      };

      validFiles.push(uploadFile);
    });

    if (errors.length > 0) {
      toast({
        title: "Invalid Files",
        description: errors.join(', '),
        variant: "destructive",
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      // Convert UploadedFiles back to regular Files for upload
      const filesToUpload = selectedFiles.map(f => new File([f], f.name, { type: f.type }));
      await uploadMutation.mutateAsync(filesToUpload);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsUploading(false);
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

  return (
    <div className="space-y-6" data-testid="document-upload">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-area"
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              {dragActive ? 'Drop files here' : 'Upload your documents'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, Word documents, and text files (max 10MB each)<br/>
              <span className="font-semibold text-primary">Upload dozens of files for cross-document contradiction analysis</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileInput}
              className="hidden"
              data-testid="file-input"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`selected-file-${file.id}`}
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-2xl mr-3">{getFileIcon(file.name?.split('.')?.pop() || 'unknown')}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name || 'Unknown file'}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(file.size || 0)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      data-testid={`remove-file-${file.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  data-testid="upload-button"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Your Documents
            </span>
            {documents && documents.length > 0 && (
              <Badge variant="secondary">{documents.length} documents</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading documents...
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((document: Document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  data-testid={`document-${document.id}`}
                >
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">{getFileIcon(document.fileType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{document.originalName}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>{formatDate(document.createdAt)}</span>
                        {document.processedAt && (
                          <span>Processed: {formatDate(document.processedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(document.processingStatus)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement document view
                        toast({
                          title: "Document View",
                          description: "Document viewing will be implemented next",
                        });
                      }}
                      data-testid={`view-document-${document.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first document to get started with AI-powered contradiction analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}