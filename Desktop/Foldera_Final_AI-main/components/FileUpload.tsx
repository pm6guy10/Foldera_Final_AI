'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

interface FileUploadProps {
  onUploadComplete?: (result: any) => void
  maxFiles?: number
}

export default function FileUpload({ onUploadComplete, maxFiles = 10 }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0
    }))
    
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: maxFiles - files.length,
    disabled: isUploading
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to upload files',
          variant: 'destructive'
        })
        return
      }

      // Update all files to uploading status
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const, progress: 0 })))

      // Prepare FormData
      const formData = new FormData()
      files.forEach(({ file }) => {
        formData.append('files', file)
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.status === 'uploading' 
            ? { ...f, progress: Math.min(f.progress + Math.random() * 20, 90) }
            : f
        ))
      }, 500)

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      // Update files to completed status
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'completed' as const, 
        progress: 100 
      })))

      toast({
        title: 'Upload completed!',
        description: `${result.filesProcessed} files processed. ${result.discrepanciesFound} discrepancies detected.`,
      })

      onUploadComplete?.(result)

      // Clear files after 2 seconds
      setTimeout(() => {
        setFiles([])
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      
      // Update files to error status
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed'
      })))

      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />
      case 'uploading':
      case 'processing':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'pending':
        return 'Ready to upload'
      case 'uploading':
        return `Uploading... ${Math.round(file.progress)}%`
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return file.error || 'Error'
    }
  }

  return (
    <div className="space-y-6" data-testid="file-upload-component">
      {/* Drop Zone */}
      <Card className="border-dashed border-2">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-colors ${
              isDragActive ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
            }`}
            data-testid="dropzone"
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-primary">Drop files here</p>
                <p className="text-sm text-muted-foreground">Release to add files</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop documents here, or{' '}
                  <span className="text-primary">browse</span>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, DOCX, and TXT files (up to {maxFiles} files)
                </p>
                <Button variant="outline" type="button" data-testid="browse-button">
                  Choose Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Files to Upload</h3>
              
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`file-item-${file.id}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getStatusText(file)} • {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                    </div>
                  </div>
                  
                  {file.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      data-testid={`remove-file-${file.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {files.some(f => f.status === 'pending') && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading}
                  className="px-8"
                  data-testid="upload-files-button"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Processing...' : `Upload ${files.filter(f => f.status === 'pending').length} Files`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}