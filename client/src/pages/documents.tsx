import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Shield } from 'lucide-react';
import DocumentUpload from '@/components/document-upload';
import ExecutiveBriefing from '@/components/executive-briefing';
import WaveBackground from '@/components/wave-background';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard to show the beautiful briefing

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <div className="max-w-7xl mx-auto p-6">
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Document Upload
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Executive Briefing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="dashboard">
            <ExecutiveBriefing />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}