import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Shield, AlertTriangle, DollarSign, Calendar, Lock, Mail, Copy, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface Finding {
  id: string;
  type: 'budget' | 'deadline' | 'compliance';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  impact: string;
  risk: string;
  fix: string;
  revealTime: number;
}

const preloadedFindings: Finding[] = [
  {
    id: "sim-1",
    type: "budget",
    severity: "critical",
    title: "⚠ CRITICAL: $2.75M exceeds board-approved budget by $750k",
    description: "Master_Agreement.pdf shows $2.75M commitment vs Amendment_2.pdf board approval of $2M",
    impact: "$1.2M penalty (Section 5.2 liquidated damages)",
    risk: "$1.2M",
    fix: `Subject: URGENT - Budget Variance Requires Immediate Correction

Dear CFO,

Critical discrepancy detected between executed agreement and board approval:

• Master_Agreement.pdf: $2,750,000
• Board Approval: $2,000,000
• Variance: $750,000

Risk: Penalty exposure $1.2M under Section 5.2 liquidated damages clause
Action Required: Emergency finance committee meeting to approve variance or renegotiate

This requires immediate attention to avoid triggering penalty provisions.

Best regards,
Compliance System`,
    revealTime: 8
  },
  {
    id: "sim-2",
    type: "deadline",
    severity: "high",
    title: "📅 HIGH: March 31 deadline conflicts with April 15 amendment",
    description: "FDA filing in Master_Agreement.pdf conflicts with audit in Amendment_2.pdf",
    impact: "$50k/day liquidated damages ($750k total exposure)",
    risk: "$750k",
    fix: `REVISED TIMELINE - Board Deck Update

Slide 47 Revision Required:

ORIGINAL: FDA Submission March 31
CONFLICT: Q1 Audit March 28-April 5

MITIGATION STRATEGY:
• Week 1: File FDA extension request (by March 1)
• Week 2: Complete pre-audit preparation  
• Week 3: Execute audit (March 28-April 2)
• Week 4: Submit FDA filing (April 15 extended)

Revenue Impact: Q2→Q3 shift ($3.2M deferred)
Risk Mitigation: Avoid $750k penalties

Board approval required for timeline adjustment.`,
    revealTime: 12
  },
  {
    id: "sim-3", 
    type: "compliance",
    severity: "medium",
    title: "🔒 MEDIUM: Accenture Corp missing SOC2 attestation",
    description: "Vendor_SOW.pdf requires SOC2 but attestation not on file",
    impact: "Client termination risk + $125k regulatory exposure",
    risk: "Contract termination",
    fix: `Vendor Compliance Request - 24 Hour Deadline

To: procurement@accenture.com
CC: legal@company.com

Re: URGENT - Missing SOC2 Attestation Required

Per Vendor_SOW.pdf Section 8.3, we require immediate submission of:

□ Current SOC2 Type II Report
□ ISO 27001 Certification
□ Penetration Test Results (last 90 days)

Contractual Requirement: Section 8.3 mandates continuous compliance
Deadline: 24 hours (contract suspension if not received)
Risk: Service termination + regulatory penalties

Please upload to: secure.foldera.com/vendor-compliance

Regards,
Compliance Team`,
    revealTime: 16
  }
];

const auditLogs = [
  { time: "13:22:15.926", message: "SCAN_INITIATED: Master_Agreement.pdf, Amendment_2.pdf, Vendor_SOW.pdf", type: "info" },
  { time: "13:22:15.927", message: "PROCESSING: 47 pages across 3 documents", type: "info" },
  { time: "13:22:16.182", message: "EXTRACTING: Financial terms and obligations", type: "info" },
  { time: "13:22:16.451", message: "ANALYZING: Cross-document numeric consistency", type: "info" },
  { time: "13:22:16.823", message: "CRITICAL: Budget variance detected $750,000", type: "critical" },
  { time: "13:22:17.124", message: "CALCULATING: Section 5.2 penalty exposure", type: "warning" },
  { time: "13:22:17.456", message: "HIGH: Timeline conflict March 31 vs April 15", type: "high" },
  { time: "13:22:17.891", message: "MEDIUM: Missing vendor compliance documentation", type: "medium" },
  { time: "13:22:18.234", message: "FIX_GENERATED: 3 professional templates ready", type: "success" },
  { time: "13:22:18.567", message: "COMPLETE: $1.95M total risk exposure identified", type: "complete" }
];

export default function SimulationPage() {
  const [stage, setStage] = useState<'idle' | 'uploading' | 'analyzing' | 'revealing' | 'complete'>('idle');
  const [visibleFindings, setVisibleFindings] = useState<Finding[]>([]);
  const [visibleLogs, setVisibleLogs] = useState<typeof auditLogs>([]);
  const [progress, setProgress] = useState(0);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [expandedFix, setExpandedFix] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-start simulation after 1 second
    const timer = setTimeout(() => startSimulation(), 1000);
    return () => clearTimeout(timer);
  }, []);

  const startSimulation = () => {
    setStage('uploading');
    setVisibleFindings([]);
    setVisibleLogs([]);
    setProgress(0);
    
    // Stage 1: Uploading (0-3s)
    setTimeout(() => {
      setStage('analyzing');
      setProgress(20);
    }, 3000);

    // Stage 2: Analyzing with audit logs (3-8s)
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < auditLogs.length && stage !== 'idle') {
        setVisibleLogs(prev => [...prev, auditLogs[logIndex]]);
        setProgress(20 + (logIndex * 7));
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 500);

    // Stage 3: Reveal findings sequentially
    setTimeout(() => {
      setStage('revealing');
      clearInterval(logInterval);
    }, 8000);

    // Reveal each finding
    preloadedFindings.forEach((finding) => {
      setTimeout(() => {
        setVisibleFindings(prev => [...prev, finding]);
        setProgress(60 + (finding.revealTime * 2));
      }, finding.revealTime * 1000);
    });

    // Stage 4: Complete and show email capture
    setTimeout(() => {
      setStage('complete');
      setProgress(100);
      setTimeout(() => setShowEmailCapture(true), 2000);
    }, 24000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    toast({
      title: "✅ Access Granted!",
      description: "Check your inbox for your free compliance analysis.",
    });

    setEmailSubmitted(true);
  };

  const copyFix = (fix: string) => {
    navigator.clipboard.writeText(fix);
    toast({
      title: "✅ Fix copied - Ready to send",
      description: "Professional fix copied to clipboard. Paste into your email client.",
    });
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLogs]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <a className="flex items-center gap-2 text-2xl font-bold" data-testid="link-home">
              <Shield className="h-8 w-8 text-cyan-500" />
              <span>Foldera</span>
            </a>
          </Link>
          <Badge variant="outline" className="text-green-500 border-green-500">
            LIVE DEMO
          </Badge>
        </div>

        {/* Progress Section */}
        {stage !== 'idle' && (
          <Card className="mb-6 border-slate-700 bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  {stage === 'uploading' && "Uploading documents..."}
                  {stage === 'analyzing' && "Analyzing 47 pages across 3 documents..."}
                  {stage === 'revealing' && "Detecting critical issues..."}
                  {stage === 'complete' && "Analysis complete!"}
                </div>
                <span className="text-sm font-mono">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Audit Log Terminal */}
        {visibleLogs.length > 0 && (
          <Card className="mb-6 border-slate-700 bg-black">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-green-500 font-mono">AUDIT LOG</div>
                <div className="text-xs text-green-500">LIVE</div>
              </div>
              <div className="font-mono text-xs space-y-1 max-h-40 overflow-y-auto" ref={logsEndRef}>
                {visibleLogs.map((log, i) => (
                  <div key={i} className={`
                    ${log.type === 'critical' ? 'text-red-500' : ''}
                    ${log.type === 'high' ? 'text-orange-500' : ''}
                    ${log.type === 'medium' ? 'text-yellow-500' : ''}
                    ${log.type === 'success' ? 'text-green-500' : ''}
                    ${log.type === 'complete' ? 'text-cyan-500 font-bold' : ''}
                    ${log.type === 'info' ? 'text-slate-400' : ''}
                  `}>
                    [{log.time}] {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Findings Display */}
        {visibleFindings.length > 0 && (
          <div className="space-y-4 mb-6">
            {visibleFindings.map((finding, index) => (
              <Card 
                key={finding.id} 
                className={`border-slate-700 bg-slate-900/50 animate-slide-in`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`
                          ${finding.severity === 'critical' ? 'bg-red-600 animate-pulse' : ''}
                          ${finding.severity === 'high' ? 'bg-orange-600' : ''}
                          ${finding.severity === 'medium' ? 'bg-yellow-600' : ''}
                        `}>
                          {finding.severity.toUpperCase()}
                        </Badge>
                        <span className="text-lg font-semibold">{finding.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                      <div className="p-3 bg-red-950/30 border border-red-800 rounded-lg">
                        <div className="text-red-400 font-semibold text-sm">
                          💰 Impact: {finding.impact}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-500">{finding.risk}</div>
                      <div className="text-xs text-muted-foreground">At Risk</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setExpandedFix(expandedFix === finding.id ? null : finding.id)}
                    data-testid={`view-fix-${finding.id}`}
                  >
                    {expandedFix === finding.id ? 'Hide Fix' : 'View Professional Fix'}
                    <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${expandedFix === finding.id ? 'rotate-90' : ''}`} />
                  </Button>

                  {expandedFix === finding.id && (
                    <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          Ready to Send
                        </Badge>
                        <div className="text-xs text-muted-foreground font-mono">
                          Generated {new Date().toISOString().substring(0, 19)}
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap font-mono text-xs text-slate-100 bg-black p-3 rounded">
                        {finding.fix}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => copyFix(finding.fix)}
                          data-testid={`copy-fix-${finding.id}`}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy & Send
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const blob = new Blob([finding.fix], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `fix-${finding.type}-${Date.now()}.txt`;
                            a.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {stage === 'complete' && (
          <Card className="mb-6 border-red-600 bg-red-950/20 animate-pulse-slow">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">
                3 Critical Issues Detected
              </div>
              <div className="text-xl text-red-400">
                $1.95M Total Risk Exposure
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Capture Overlay */}
        {showEmailCapture && !emailSubmitted && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <Card className="max-w-md w-full border-cyan-500">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Get Your Free Analysis</h2>
                <p className="text-muted-foreground mb-6">
                  See how Foldera can protect your organization from costly compliance failures.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-submit">
                    <Mail className="h-4 w-4 mr-2" />
                    Get Free Analysis
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success State */}
        {emailSubmitted && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Foldera!</h2>
                <p className="text-muted-foreground mb-6">
                  Check your inbox for your personalized compliance analysis.
                </p>
                <Link href="/">
                  <Button className="w-full" data-testid="button-explore">
                    Explore Foldera
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}