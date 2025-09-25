import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Shield } from 'lucide-react';
import DocumentUpload from '@/components/document-upload';
import AuditDashboard from '@/components/audit-dashboard';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Document Intelligence</h1>
          <p className="text-muted-foreground text-lg">
            Upload documents and get real-time AI-powered contradiction analysis for compliance and risk management
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Document Upload
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="dashboard">
            <AuditDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}