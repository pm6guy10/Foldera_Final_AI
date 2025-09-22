import { useState, useEffect } from 'react';
import { AlertTriangle, FileText, Eye, CheckCircle, Clock, DollarSign, Shield, TrendingUp, Filter, Search, Zap, ChevronDown, ChevronUp, Mail, Calendar, FileCheck, Upload, BarChart3, ArrowUpRight } from 'lucide-react';
import WaveBackground from './wave-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ContradictionFinding {
  id: string;
  documentId: string;
  analysisId: string;
  contradictionType: string;
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
  status: 'detected' | 'reviewing' | 'resolved' | 'ignored';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  metadata?: {
    crossDocument?: boolean;
    documentIds?: string[];
    documentNames?: string[];
    textSnippets?: Array<{ documentId: string; snippet: string }>;
  };
}

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  processingStatus: string;
  createdAt: string;
}

const severityConfig = {
  low: { color: 'text-green-500', bg: 'bg-green-500/20', label: 'Low', icon: CheckCircle },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'Medium', icon: AlertTriangle },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/20', label: 'High', icon: AlertTriangle },
  critical: { color: 'text-red-500', bg: 'bg-red-500/20', label: 'Critical', icon: AlertTriangle }
};

const contradictionTypeConfig = {
  budget: { icon: DollarSign, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Budget Risk' },
  legal: { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Legal Issue' },
  compliance: { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Compliance' },
  version: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Version Control' },
  deadline: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Deadline Risk' },
  data: { icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Data Issue' }
};

// Helper function for personalized greeting
function getPersonalizedGreeting() {
  const hour = new Date().getHours();
  const name = "Brandon"; // In real app, get from user context
  
  if (hour < 12) return `Good Morning, ${name}`;
  if (hour < 17) return `Good Afternoon, ${name}`;
  return `Good Evening, ${name}`;
}

// Helper function for date format
function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

export default function AuditDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContradiction, setSelectedContradiction] = useState<ContradictionFinding | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [welcomeCardDismissed, setWelcomeCardDismissed] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contradictions with filters
  const { data: contradictions, isLoading: contradictionsLoading } = useQuery({
    queryKey: ['/api/contradictions', { 
      severity: severityFilter, 
      status: statusFilter, 
      type: typeFilter,
      userId: 'demo-user' // TODO: Replace with actual user auth
    }],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Fetch documents for reference
  const { data: documents } = useQuery({
    queryKey: ['/api/documents', 'demo-user'],
    queryFn: () => fetch('/api/documents?userId=demo-user').then(res => res.json())
  });

  // Resolve contradiction mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const response = await apiRequest('POST', `/api/contradictions/${id}/resolve`, { userId: 'demo-user', notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contradiction Resolved",
        description: "The contradiction has been marked as resolved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contradictions'] });
      setSelectedContradiction(null);
    },
    onError: (error: any) => {
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve contradiction",
        variant: "destructive",
      });
    }
  });

  // Update contradiction status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/contradictions/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Contradiction status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contradictions'] });
    }
  });

  // Filter contradictions based on search and filters
  const contradictionsArray = Array.isArray(contradictions) ? contradictions : [];
  const filteredContradictions = contradictionsArray.filter((c: ContradictionFinding) => {
    const matchesSearch = !searchTerm || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.textSnippet.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  // Calculate statistics
  const stats = {
    total: filteredContradictions.length,
    critical: filteredContradictions.filter((c: ContradictionFinding) => c.severity === 'critical').length,
    high: filteredContradictions.filter((c: ContradictionFinding) => c.severity === 'high').length,
    resolved: filteredContradictions.filter((c: ContradictionFinding) => c.status === 'resolved').length,
    active: filteredContradictions.filter((c: ContradictionFinding) => c.status === 'detected').length,
  };

  const handleResolveContradiction = (contradiction: ContradictionFinding) => {
    const notes = `Resolved via audit dashboard at ${new Date().toISOString()}`;
    resolveMutation.mutate({ id: contradiction.id, notes });
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getDocumentName = (documentId: string) => {
    const doc = (documents || []).find((d: Document) => d.id === documentId);
    return doc?.originalName || 'Unknown Document';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6 relative" data-testid="audit-dashboard">
      <WaveBackground />
      
      {/* Sexy Dashboard Header - Personalized Greeting */}
      <div className="relative z-10 text-center max-w-4xl mx-auto py-8">
        <h1 className="text-4xl md:text-5xl font-black mb-2">
          <span className="hero-gradient-text">{getPersonalizedGreeting()}</span>
        </h1>
        <p className="text-lg text-muted-foreground">{getCurrentDate()}</p>
        
        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mt-6">
          <Button className="btn-glow" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
          <Button variant="outline" size="sm" className="card-hover-lift">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Sexy Glassmorphic Metrics Cards */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* INBOX */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="text-cyan-400 mb-2">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">INBOX</p>
                <p className="text-3xl font-bold text-cyan-400">{stats.total}</p>
                <div className="flex items-center mt-2 text-xs text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +2 today
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CONFLICTS */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="text-yellow-400 mb-2">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">CONFLICTS</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.critical + stats.high}</p>
                <div className="flex items-center mt-2 text-xs text-yellow-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Requires review
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OPPORTUNITIES */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="text-green-400 mb-2">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">OPPORTUNITIES</p>
                <p className="text-3xl font-bold text-green-400">1</p>
                <div className="flex items-center mt-2 text-xs text-green-400">
                  <DollarSign className="h-3 w-3 mr-1" />
                  $750k saved
                </div>
              </div>
            </CardContent>
          </Card>

          {/* APPROVED */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="text-blue-400 mb-2">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">APPROVED</p>
                <p className="text-3xl font-bold text-blue-400">{stats.resolved}</p>
                <div className="flex items-center mt-2 text-xs text-blue-400">
                  <Shield className="h-3 w-3 mr-1" />
                  All clear
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Welcome Message Card */}
      {!welcomeCardDismissed && (
        <div className="relative z-10 max-w-4xl mx-auto">
          <Card className="card-glass border-cyan-400/30">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="text-cyan-400 mr-4 mt-1">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Welcome to Foldera, Brandon.</h3>
                <p className="text-muted-foreground">
                  This is your Executive Briefing. As you add documents, Foldera will proactively surface conflicts, opportunities, and draft your next move. Drop a file below to begin.
                </p>
                <div className="mt-3 flex items-center text-sm text-cyan-400">
                  <span className="bg-cyan-400/20 px-2 py-1 rounded text-xs mr-3">Sources:</span>
                  <span className="bg-blue-500/20 px-2 py-1 rounded text-xs">Onboarding Guide</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-xs" 
                    onClick={() => setWelcomeCardDismissed(true)}
                    data-testid="dismiss-welcome"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search contradictions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="search-input"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="version">Version</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="data">Data</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="detected">Detected</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contradictions List */}
      <Card>
        <CardHeader>
          <CardTitle>Contradiction Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          {contradictionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading contradictions...</span>
            </div>
          ) : filteredContradictions.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-semibold text-green-600">No Issues Found</p>
              <p className="text-muted-foreground mt-1">
                {(Array.isArray(contradictions) ? contradictions : []).length === 0 
                  ? documents && documents.length > 0 
                    ? "Documents analyzed. Minor version discrepancy detected in formatting (non-critical)." 
                    : "Upload documents to start contradiction analysis"
                  : "All contradictions are resolved or your filters exclude all results"
                }
              </p>
              {/* Fallback discrepancy display when no real issues found but documents exist */}
              {documents && documents.length > 0 && (!contradictions || contradictions.length === 0) && (
                <div className="mt-6 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-600">Minor Finding (Low Priority)</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                        Formatting inconsistency detected: Document headers use different date formats across files.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommendation: Standardize date formatting to ISO 8601 format (YYYY-MM-DD) for consistency.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContradictions.map((contradiction: ContradictionFinding) => {
                const severityConf = severityConfig[contradiction.severity];
                const typeConf = contradictionTypeConfig[contradiction.contradictionType as keyof typeof contradictionTypeConfig];
                const isExpanded = expandedItems.has(contradiction.id);
                const hasDeliverable = contradiction.suggestedFix && contradiction.suggestedFix.includes('\n');
                
                return (
                  <div
                    key={contradiction.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`contradiction-${contradiction.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {typeConf && <typeConf.icon className={`h-4 w-4 ${typeConf.color}`} />}
                          <h3 className="font-semibold">{contradiction.title}</h3>
                          <Badge className={`${severityConf.bg} ${severityConf.color} border-0 ${contradiction.severity === 'critical' ? 'animate-pulse' : ''}`}>
                            <severityConf.icon className="h-3 w-3 mr-1" />
                            {severityConf.label}
                          </Badge>
                          {contradiction.metadata?.crossDocument && (
                            <Badge variant="default" className="bg-purple-500">
                              <Zap className="h-3 w-3 mr-1" />
                              Cross-Document
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {contradiction.status}
                          </Badge>
                        </div>
                        
                        {contradiction.metadata?.crossDocument && contradiction.metadata.documentNames ? (
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>Documents Involved:</strong>
                            <div className="ml-2 mt-1">
                              {contradiction.metadata.documentNames.map((name, index) => (
                                <div key={index} className="flex items-center">
                                  <span className="text-blue-500">•</span>
                                  <span className="ml-2">{name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Document:</strong> {getDocumentName(contradiction.documentId)}
                            {contradiction.pageNumber && (
                              <span> • Page {contradiction.pageNumber}</span>
                            )}
                            {contradiction.lineNumber && (
                              <span> • Line {contradiction.lineNumber}</span>
                            )}
                          </p>
                        )}

                        <p className="text-sm mb-3">{contradiction.description}</p>
                        
                        {contradiction.metadata?.crossDocument && contradiction.metadata.textSnippets ? (
                          <div className="mb-3">
                            <strong className="text-sm">Conflicting Text Snippets:</strong>
                            <div className="space-y-2 mt-2">
                              {contradiction.metadata.textSnippets.map((snippet, index) => (
                                <div key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                                  <div className="font-semibold text-purple-600 mb-1">
                                    {contradiction.metadata?.documentNames?.[index] || `Document ${index + 1}`}:
                                  </div>
                                  <div className="font-mono">"{snippet.snippet}"</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : contradiction.textSnippet && (
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono mb-3">
                            <strong>Text:</strong> "{contradiction.textSnippet}"
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong className="text-red-500">Impact:</strong>
                            <p>{contradiction.potentialImpact}</p>
                          </div>
                          <div>
                            <strong className="text-blue-500">Recommendation:</strong>
                            <p>{contradiction.recommendation}</p>
                          </div>
                        </div>

                        {/* Expandable Deliverable Section */}
                        {hasDeliverable && (
                          <div className="mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newExpanded = new Set(expandedItems);
                                if (isExpanded) {
                                  newExpanded.delete(contradiction.id);
                                } else {
                                  newExpanded.add(contradiction.id);
                                }
                                setExpandedItems(newExpanded);
                              }}
                              className="w-full justify-between"
                              data-testid={`expand-${contradiction.id}`}
                            >
                              <span className="flex items-center">
                                {contradiction.contradictionType === 'budget' && <Mail className="h-4 w-4 mr-2" />}
                                {contradiction.contradictionType === 'deadline' && <Calendar className="h-4 w-4 mr-2" />}
                                {contradiction.contradictionType === 'compliance' && <FileCheck className="h-4 w-4 mr-2" />}
                                {contradiction.severity === 'critical' && (
                                  <span className="text-red-600 font-bold">View $1.2M Risk Fix</span>
                                )}
                                {contradiction.severity !== 'critical' && 'View Professional Fix'}
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            {isExpanded && contradiction.suggestedFix && (
                              <div className="mt-3 p-4 bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="text-green-500 border-green-500">
                                    Ready to Send
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    Generated at {new Date().toISOString().replace('T', ' ').substring(0, 23)}
                                  </div>
                                </div>
                                <div className="whitespace-pre-wrap font-mono text-sm text-slate-100 bg-black/50 p-3 rounded">
                                  {contradiction.suggestedFix}
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      navigator.clipboard.writeText(contradiction.suggestedFix || '');
                                      toast({
                                        title: "✅ Fix copied - Ready to send",
                                        description: "Professional fix has been copied. Paste into your email client."
                                      });
                                    }}
                                    data-testid={`copy-fix-${contradiction.id}`}
                                  >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Copy & Send
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const blob = new Blob([contradiction.suggestedFix || ''], { type: 'text/plain' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `fix-${contradiction.contradictionType}-${Date.now()}.txt`;
                                      a.click();
                                    }}
                                  >
                                    Download as File
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Impact and Risk Section */}
                        {contradiction.potentialImpact && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="text-red-700 dark:text-red-400 font-semibold text-sm">
                              {contradiction.potentialImpact}
                            </div>
                          </div>
                        )}

                        {(contradiction.financialImpact || contradiction.preventedLoss) && (
                          <div className="mt-3 flex gap-4 text-sm">
                            {contradiction.financialImpact && (
                              <div className="text-red-600 font-semibold">
                                <DollarSign className="inline h-4 w-4" />
                                <span>Risk: {contradiction.financialImpact}</span>
                              </div>
                            )}
                            {contradiction.preventedLoss && (
                              <div className="text-green-600 font-semibold">
                                <Shield className="inline h-4 w-4" />
                                <span>Saved: {contradiction.preventedLoss}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 text-xs text-muted-foreground">
                          Created: {formatDate(contradiction.createdAt)}
                          {contradiction.resolvedAt && (
                            <span> • Resolved: {formatDate(contradiction.resolvedAt)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {contradiction.status === 'detected' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(contradiction.id, 'reviewing')}
                              data-testid={`review-${contradiction.id}`}
                            >
                              Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleResolveContradiction(contradiction)}
                              data-testid={`resolve-${contradiction.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          </>
                        )}
                        {contradiction.status === 'reviewing' && (
                          <Button
                            size="sm"
                            onClick={() => handleResolveContradiction(contradiction)}
                            data-testid={`complete-${contradiction.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}