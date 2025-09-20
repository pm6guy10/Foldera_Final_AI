import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Shield, CheckCircle, Loader2, ChevronRight, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface AuditLogEntry {
  time: string;
  message: string;
  type: 'scanning' | 'analyzing' | 'conflict' | 'resolved' | 'complete';
  progress: number;
}

const auditLogScript: AuditLogEntry[] = [
  { time: "00:01", message: "Initializing Foldera AI Engine...", type: "scanning", progress: 5 },
  { time: "00:02", message: "Connecting to document repository...", type: "scanning", progress: 10 },
  { time: "00:03", message: "Scanning /Contracts/Q4/vendor-agreement-draft.docx", type: "scanning", progress: 15 },
  { time: "00:04", message: "Extracting terms and conditions...", type: "analyzing", progress: 20 },
  { time: "00:05", message: "⚠️ Conflict detected: Payment terms mismatch (30 days vs 45 days)", type: "conflict", progress: 25 },
  { time: "00:06", message: "Cross-referencing with /Finance/payment-policy.pdf", type: "analyzing", progress: 30 },
  { time: "00:07", message: "Generating resolution recommendation...", type: "analyzing", progress: 35 },
  { time: "00:08", message: "✓ Suggested: Align to standard 30-day payment terms", type: "resolved", progress: 40 },
  { time: "00:10", message: "Scanning /Legal/NDA/partner-nda-2025.docx", type: "scanning", progress: 45 },
  { time: "00:11", message: "Analyzing confidentiality clauses...", type: "analyzing", progress: 50 },
  { time: "00:12", message: "✓ No conflicts found", type: "resolved", progress: 55 },
  { time: "00:14", message: "Scanning /Board/Minutes/Q3-board-meeting.pdf", type: "scanning", progress: 60 },
  { time: "00:15", message: "Extracting strategic decisions...", type: "analyzing", progress: 65 },
  { time: "00:16", message: "⚠️ Conflict: Budget allocation discrepancy detected", type: "conflict", progress: 70 },
  { time: "00:17", message: "Comparing with /Finance/Q3-budget-approved.xlsx", type: "analyzing", progress: 75 },
  { time: "00:18", message: "✓ Flagged for executive review", type: "resolved", progress: 80 },
  { time: "00:19", message: "Scanning /Compliance/SOC2/audit-checklist.pdf", type: "scanning", progress: 85 },
  { time: "00:20", message: "Validating compliance requirements...", type: "analyzing", progress: 90 },
  { time: "00:21", message: "✓ All compliance checks passed", type: "resolved", progress: 95 },
  { time: "00:22", message: "🎯 Audit complete: 247 documents analyzed, 2 conflicts resolved", type: "complete", progress: 100 }
];

export default function SimulationPage() {
  const [currentLogIndex, setCurrentLogIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Track simulation page view
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('simulation_page_view');
    }
  }, []);

  const startSimulation = () => {
    setIsRunning(true);
    setCurrentLogIndex(-1);
    setProgress(0);
    
    // Track simulation start
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('simulation_start');
    }

    // Run through the script
    const runScript = () => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < auditLogScript.length) {
          setCurrentLogIndex(index);
          setProgress(auditLogScript[index].progress);
          index++;
        } else {
          clearInterval(interval);
          setIsRunning(false);
          setShowEmailCapture(true);
          
          // Track simulation complete
          if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('simulation_complete');
          }
        }
      }, 1000); // Each log entry appears after 1 second
    };

    runScript();
  };

  useEffect(() => {
    // Scroll to bottom when new logs appear
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentLogIndex]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Track email capture
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('simulation_email_captured', { email });
    }

    toast({
      title: "Welcome to Foldera!",
      description: "Check your inbox for exclusive early access details.",
    });

    setEmailSubmitted(true);
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'conflict':
        return 'text-yellow-500';
      case 'resolved':
        return 'text-green-500';
      case 'complete':
        return 'text-primary font-bold';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl border-primary/20">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Foldera AI Audit Simulation</h1>
                <p className="text-muted-foreground">Experience real-time document intelligence</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">Back to Home</Button>
            </Link>
          </div>

          {/* Simulation Area */}
          {!isRunning && currentLogIndex === -1 && !showEmailCapture && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Ready to see Foldera in action?</h2>
              <p className="text-muted-foreground mb-6">
                Watch how our AI analyzes documents, detects conflicts, and provides instant resolutions.
              </p>
              <Button 
                onClick={startSimulation}
                size="lg"
                className="min-h-[48px] px-8"
                data-testid="button-start-simulation"
              >
                Start Live Simulation
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Running Simulation */}
          {(isRunning || currentLogIndex >= 0) && !showEmailCapture && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Audit Progress</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="mb-6" />
              
              <div className="bg-card/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm space-y-2 border border-primary/10">
                {auditLogScript.slice(0, currentLogIndex + 1).map((entry, index) => (
                  <div 
                    key={index}
                    className={`flex items-start space-x-2 ${index === currentLogIndex ? 'animate-pulse' : ''}`}
                  >
                    <span className="text-primary/60 whitespace-nowrap">[{entry.time}]</span>
                    {getLogTypeIcon(entry.type)}
                    <span className={getLogTypeColor(entry.type)}>{entry.message}</span>
                  </div>
                ))}
                {isRunning && (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-muted-foreground">Processing...</span>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* Email Capture */}
          {showEmailCapture && !emailSubmitted && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Simulation Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Foldera analyzed 247 documents and resolved 2 critical conflicts in just 22 seconds.
              </p>
              
              <Card className="max-w-md mx-auto p-6 bg-primary/5 border-primary/20">
                <h3 className="text-lg font-bold mb-2">Get Early Access</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be first to transform your document management with AI
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="min-h-[48px]"
                      data-testid="input-simulation-email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full min-h-[48px]"
                    data-testid="button-get-access"
                  >
                    Get Early Access
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {/* Success State */}
          {emailSubmitted && (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
              <p className="text-muted-foreground mb-6">
                We'll send you exclusive early access details soon.
              </p>
              <div className="space-y-4">
                <Link href="/">
                  <Button size="lg" className="min-h-[48px]">
                    Return to Homepage
                  </Button>
                </Link>
                <div className="text-sm text-muted-foreground">
                  or
                </div>
                <Link href="/#pricing">
                  <Button variant="outline" size="lg" className="min-h-[48px]">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}