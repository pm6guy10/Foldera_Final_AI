import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Zap, 
  Shield, 
  Clock, 
  DollarSign,
  TrendingUp,
  Settings,
  Search,
  Brain,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackEvent } from "@/lib/analytics";

// Document types for the demo
interface DemoDocument {
  id: string;
  name: string;
  type: 'contract' | 'compliance' | 'financial' | 'legal';
  size: string;
  status: 'pending' | 'scanning' | 'analyzing' | 'conflicts' | 'fixing' | 'complete';
  conflicts?: Conflict[];
  scanProgress: number;
  analysisResults?: AnalysisResult;
}

interface Conflict {
  id: string;
  type: 'budget' | 'version' | 'deadline' | 'compliance' | 'legal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  autoFixed?: boolean;
  preventedLoss?: string;
}

interface AnalysisResult {
  risksDetected: number;
  complianceScore: number;
  timeToReview: string;
  confidenceLevel: number;
  keyInsights: string[];
}

// Demo scenarios
const demoDocuments: DemoDocument[] = [
  {
    id: 'contract_001',
    name: 'Merger Agreement v3.2.docx',
    type: 'contract',
    size: '2.4 MB',
    status: 'pending',
    scanProgress: 0,
    conflicts: [
      {
        id: 'c1',
        type: 'budget',
        severity: 'critical',
        title: 'Budget Mismatch Detected',
        description: 'Contract assumes $2.8M upfront payment, but client mentioned "cash-strapped until Q2" in recent email',
        impact: 'Deal could fail due to payment timing mismatch',
        recommendation: 'Restructure payment terms with 3-stage milestone approach',
        autoFixed: true,
        preventedLoss: '$2.8M deal at risk'
      },
      {
        id: 'c2',
        type: 'legal',
        severity: 'high',
        title: 'Liability Cap Inconsistency',
        description: 'Section 12.3 caps liability at $500K but section 8.1 references uncapped indemnification',
        impact: 'Unclear liability exposure could lead to disputes',
        recommendation: 'Align liability terms with standard $1M cap across all sections',
        autoFixed: false,
        preventedLoss: 'Undefined liability exposure'
      }
    ],
    analysisResults: {
      risksDetected: 2,
      complianceScore: 87,
      timeToReview: '2 mins',
      confidenceLevel: 94,
      keyInsights: [
        'Payment terms misalignment with client capacity',
        'Liability language needs standardization',
        'Overall structure follows best practices'
      ]
    }
  },
  {
    id: 'compliance_001',
    name: 'SOX_Compliance_Q4_Report.pdf',
    type: 'compliance',
    size: '1.8 MB',
    status: 'pending',
    scanProgress: 0,
    conflicts: [
      {
        id: 'c3',
        type: 'deadline',
        severity: 'critical',
        title: 'Filing Deadline Risk',
        description: 'Report references Q3 data but Q4 filing deadline is in 3 days',
        impact: 'SEC filing could be rejected or delayed',
        recommendation: 'Update all Q3 references to Q4 and verify data accuracy',
        autoFixed: true,
        preventedLoss: 'SEC compliance violation avoided'
      }
    ],
    analysisResults: {
      risksDetected: 1,
      complianceScore: 92,
      timeToReview: '1.5 mins',
      confidenceLevel: 98,
      keyInsights: [
        'Critical deadline approaching',
        'Data references need updating',
        'Compliance framework is solid'
      ]
    }
  },
  {
    id: 'financial_001',
    name: 'Investor_Deck_Series_B.pptx',
    type: 'financial',
    size: '5.1 MB',
    status: 'pending',
    scanProgress: 0,
    conflicts: [
      {
        id: 'c4',
        type: 'version',
        severity: 'high',
        title: 'Outdated Financial Data',
        description: 'Slide 8 shows Q2 revenue of $1.2M but latest reports show $1.7M',
        impact: 'Undervaluing company by $2M+ in investor presentations',
        recommendation: 'Update with latest Q3 financials and growth metrics',
        autoFixed: true,
        preventedLoss: '$2M+ valuation impact'
      }
    ],
    analysisResults: {
      risksDetected: 1,
      complianceScore: 95,
      timeToReview: '3 mins',
      confidenceLevel: 91,
      keyInsights: [
        'Revenue figures need updating',
        'Growth trajectory looks strong',
        'Investor materials are well-structured'
      ]
    }
  }
];

const conflictTypeConfig = {
  budget: { icon: DollarSign, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Budget Risk' },
  version: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Version Control' },
  deadline: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Deadline Risk' },
  compliance: { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Compliance' },
  legal: { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Legal Issue' }
};

const severityConfig = {
  low: { color: 'text-green-500', bg: 'bg-green-500/20', label: 'Low' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'Medium' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/20', label: 'High' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/20', label: 'Critical' }
};

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [documents, setDocuments] = useState<DemoDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DemoDocument | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [showResults, setShowResults] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Demo steps
  const demoSteps = [
    "Upload Documents",
    "AI Scanning & Analysis", 
    "Conflict Detection",
    "Auto-Remediation",
    "Results & Insights"
  ];

  useEffect(() => {
    // Track demo start
    trackEvent({
      type: 'demo',
      name: 'interactive_demo_start',
      props: { step: 'initialization' }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= demoSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, demoSteps.length]);

  // Step-specific effects
  useEffect(() => {
    switch (currentStep) {
      case 0:
        // Upload step
        setDocuments([]);
        setSelectedDoc(null);
        setActiveTab("upload");
        setShowResults(false);
        break;
      case 1:
        // Start scanning
        setDocuments(demoDocuments.map(doc => ({ ...doc, status: 'scanning' as const })));
        setActiveTab("scanning");
        simulateScanning();
        break;
      case 2:
        // Show conflicts
        setActiveTab("conflicts");
        setDocuments(prev => prev.map(doc => ({ 
          ...doc, 
          status: 'conflicts' as const,
          scanProgress: 100 
        })));
        break;
      case 3:
        // Auto-fix
        setActiveTab("fixing");
        simulateAutoFix();
        break;
      case 4:
        // Show results
        setActiveTab("results");
        setShowResults(true);
        setDocuments(prev => prev.map(doc => ({ 
          ...doc, 
          status: 'complete' as const 
        })));
        break;
    }
  }, [currentStep]);

  const simulateScanning = () => {
    const interval = setInterval(() => {
      setDocuments(prev => prev.map(doc => {
        if (doc.scanProgress < 100) {
          const newProgress = Math.min(doc.scanProgress + Math.random() * 25, 100);
          const newStatus = newProgress === 100 ? 'analyzing' : doc.status;
          return { ...doc, scanProgress: newProgress, status: newStatus };
        }
        return doc;
      }));
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setDocuments(prev => prev.map(doc => ({ 
        ...doc, 
        status: 'conflicts' as const,
        scanProgress: 100 
      })));
    }, 2000);
  };

  const simulateAutoFix = () => {
    const autoFixableConflicts = documents.flatMap(doc => 
      doc.conflicts?.filter(c => c.autoFixed) || []
    );

    autoFixableConflicts.forEach((conflict, index) => {
      setTimeout(() => {
        setDocuments(prev => prev.map(doc => ({
          ...doc,
          conflicts: doc.conflicts?.map(c => 
            c.id === conflict.id ? { ...c, autoFixed: true } : c
          )
        })));
      }, index * 800);
    });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    trackEvent({
      type: 'demo',
      name: isPlaying ? 'demo_paused' : 'demo_played',
      props: { currentStep, step: demoSteps[currentStep] }
    });
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
    setIsPlaying(false);
    trackEvent({
      type: 'demo',
      name: 'demo_step_clicked',
      props: { step, stepName: demoSteps[step] }
    });
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    trackEvent({
      type: 'demo',
      name: 'demo_restarted',
      props: {}
    });
  };

  const handleDocumentClick = (doc: DemoDocument) => {
    setSelectedDoc(selectedDoc?.id === doc.id ? null : doc);
    trackEvent({
      type: 'demo',
      name: 'document_clicked',
      props: { documentId: doc.id, documentType: doc.type }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="interactive-demo">
      {/* Demo Header */}
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold mb-4" data-testid="demo-title">
          Experience Foldera in Action
        </h3>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Watch how Foldera's AI analyzes documents, detects conflicts, and prevents disasters before they happen.
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-card rounded-lg p-6 mb-8 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePlayPause}
              variant={isPlaying ? "secondary" : "default"}
              size="lg"
              data-testid="demo-play-button"
            >
              {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
              {isPlaying ? 'Pause Demo' : 'Play Demo'}
            </Button>
            <Button onClick={handleRestart} variant="outline" data-testid="demo-restart-button">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {demoSteps.length}
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="relative">
          <div className="flex justify-between items-center">
            {demoSteps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => handleStepClick(index)}
                data-testid={`demo-step-${index}`}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                    ${index <= currentStep 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-border text-muted-foreground'
                    }
                    group-hover:scale-110`}
                >
                  {index + 1}
                </div>
                <span className={`text-xs mt-2 text-center max-w-20 leading-tight
                  ${index === currentStep ? 'text-primary font-semibold' : 'text-muted-foreground'}
                `}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-border -z-10">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${(currentStep / (demoSteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5" data-testid="demo-tabs">
          <TabsTrigger value="upload" disabled={currentStep < 0}>Upload</TabsTrigger>
          <TabsTrigger value="scanning" disabled={currentStep < 1}>Scanning</TabsTrigger>
          <TabsTrigger value="conflicts" disabled={currentStep < 2}>Conflicts</TabsTrigger>
          <TabsTrigger value="fixing" disabled={currentStep < 3}>Auto-Fix</TabsTrigger>
          <TabsTrigger value="results" disabled={currentStep < 4}>Results</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold mb-2">Ready to Upload Documents</h4>
                <p className="text-muted-foreground mb-4">
                  Foldera will analyze contracts, compliance reports, financial documents, and more
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {demoDocuments.map((doc) => (
                    <div key={doc.id} className="bg-background p-4 rounded-lg border border-border">
                      <FileText className="h-8 w-8 mb-2 text-primary" />
                      <div className="text-sm font-medium">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">{doc.size}</div>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {doc.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scanning Tab */}
        <TabsContent value="scanning" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Document Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-background p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                      <Badge variant={doc.status === 'scanning' ? 'default' : 'secondary'}>
                        {doc.status === 'scanning' ? 'Scanning...' : 'Analyzing...'}
                      </Badge>
                    </div>
                    <Progress value={doc.scanProgress} className="mb-2" />
                    <div className="text-sm text-muted-foreground">
                      {doc.status === 'scanning' 
                        ? `Scanning content and structure... ${Math.round(doc.scanProgress)}%`
                        : 'Analyzing for conflicts, compliance issues, and risks...'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Conflicts Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      <div 
                        className="flex items-center justify-between p-3 bg-background rounded-lg border border-border cursor-pointer hover:bg-secondary/50"
                        onClick={() => handleDocumentClick(doc)}
                        data-testid={`document-${doc.id}`}
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          <span className="font-medium">{doc.name}</span>
                          {doc.conflicts && doc.conflicts.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {doc.conflicts.length} conflicts
                            </Badge>
                          )}
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      {selectedDoc?.id === doc.id && doc.conflicts && (
                        <div className="space-y-3 pl-6 animate-in slide-in-from-top-2">
                          {doc.conflicts.map((conflict) => {
                            const typeConfig = conflictTypeConfig[conflict.type];
                            const severityConfig_ = severityConfig[conflict.severity];
                            
                            return (
                              <Card key={conflict.id} className="border-l-4 border-l-red-500">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <typeConfig.icon className={`h-4 w-4 ${typeConfig.color}`} />
                                      <span className="font-semibold">{conflict.title}</span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`${severityConfig_.bg} ${severityConfig_.color} border-0`}
                                    >
                                      {severityConfig_.label}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {conflict.description}
                                  </p>
                                  
                                  <div className="bg-secondary/50 p-3 rounded-lg space-y-2">
                                    <div>
                                      <span className="text-xs font-semibold text-red-500">Impact:</span>
                                      <p className="text-sm">{conflict.impact}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs font-semibold text-primary">Recommendation:</span>
                                      <p className="text-sm">{conflict.recommendation}</p>
                                    </div>
                                    {conflict.preventedLoss && (
                                      <div>
                                        <span className="text-xs font-semibold text-green-500">Value Protected:</span>
                                        <p className="text-sm">{conflict.preventedLoss}</p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Auto-Fix Tab */}
        <TabsContent value="fixing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Auto-Remediation in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.flatMap(doc => 
                  doc.conflicts?.filter(c => c.autoFixed).map(conflict => (
                    <div key={conflict.id} className="bg-background p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2 text-primary animate-spin" />
                          <span className="font-medium">Fixing: {conflict.title}</span>
                        </div>
                        <Badge variant="default" className="bg-primary">
                          Auto-Fixing
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {conflict.recommendation}
                      </p>
                      <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm font-medium text-green-500">
                            Resolved automatically - {conflict.preventedLoss}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) || []
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-500" />
                  Analysis Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-background p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {documents.reduce((acc, doc) => acc + (doc.conflicts?.length || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Conflicts Detected</div>
                  </div>
                  <div className="bg-background p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-green-500 mb-1">
                      {documents.flatMap(doc => doc.conflicts?.filter(c => c.autoFixed) || []).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Auto-Fixed</div>
                  </div>
                  <div className="bg-background p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-blue-500 mb-1">6.5mins</div>
                    <div className="text-sm text-muted-foreground">Total Review Time</div>
                  </div>
                  <div className="bg-background p-4 rounded-lg border border-border text-center">
                    <div className="text-2xl font-bold text-yellow-500 mb-1">$4.8M+</div>
                    <div className="text-sm text-muted-foreground">Value Protected</div>
                  </div>
                </div>

                {showResults && (
                  <div className="animate-in slide-in-from-bottom-4 duration-700">
                    <h4 className="font-semibold mb-4">Document Analysis Summary</h4>
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="bg-background p-4 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{doc.name}</span>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              <Shield className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          </div>
                          {doc.analysisResults && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Compliance Score:</span>
                                <div className="font-semibold text-green-500">
                                  {doc.analysisResults.complianceScore}%
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Review Time:</span>
                                <div className="font-semibold">{doc.analysisResults.timeToReview}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Confidence:</span>
                                <div className="font-semibold">{doc.analysisResults.confidenceLevel}%</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Risks:</span>
                                <div className="font-semibold">{doc.analysisResults.risksDetected}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      {currentStep >= 4 && (
        <div className="mt-8 text-center animate-in slide-in-from-bottom-4 duration-1000">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h4 className="text-xl font-bold mb-2">Ready to Protect Your Documents?</h4>
              <p className="text-muted-foreground mb-6">
                See how Foldera can prevent costly mistakes in your organization
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" data-testid="demo-cta-trial">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Start Free Trial
                </Button>
                <Button variant="outline" size="lg" data-testid="demo-cta-demo">
                  Book Enterprise Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}