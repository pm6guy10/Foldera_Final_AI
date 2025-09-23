import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, AlertTriangle, TrendingDown, Mail, 
  CheckCircle, Eye, Brain, ArrowRight 
} from "lucide-react";

// Animation stages for the demo
enum DemoStage {
  LOADING = 0,
  DOCUMENT_SCAN = 1,
  ANALYSIS = 2,
  FINDINGS = 3,
  EMAIL_DRAFT = 4,
  COMPLETE = 5
}

export default function Demo() {
  const [currentStage, setCurrentStage] = useState<DemoStage>(DemoStage.LOADING);
  const [animatedText, setAnimatedText] = useState("");

  const demoContent = {
    document: "WeWork Lease Agreement - Manhattan Premier Tower\n\nSection 4.2: Base Rent Obligations\nTenant shall pay base rent of $50.00 per square foot annually...\n\nSection 8.1: Subletting Revenue\nWeWork charges sub-tenants $30.00 per square foot monthly rate...",
    finding: "Pays $50/sqft but charges tenants $30/sqft",
    impact: "Annual loss: $500M. Valuation impact: $47B",
    email: `Subject: URGENT - Alert to Board: Unsustainable Unit Economics Detected

Board Members,

Foldera's cross-document analysis has identified a critical financial discrepancy in our real estate portfolio:

🔴 ISSUE DETECTED:
- WeWork pays landlords $50/sqft annually 
- WeWork charges tenants $30/sqft monthly
- Net loss per sqft: $-14/sqft annually

📊 FINANCIAL IMPACT:
- Estimated annual loss: $500M
- Projected valuation impact: $47B decline
- Affects 847 locations globally

⚡ IMMEDIATE ACTION REQUIRED:
1. Emergency board meeting recommended
2. Renegotiate lease terms with landlords
3. Revise tenant pricing model
4. Consider asset divestiture strategy

This analysis was completed in 3.2 seconds using Foldera's cross-document intelligence.

Best regards,
Risk Management Team`
  };

  // Auto-advance through demo stages
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Stage progression timing
    const stageTimings = [
      { stage: DemoStage.DOCUMENT_SCAN, delay: 1000 },
      { stage: DemoStage.ANALYSIS, delay: 3000 },
      { stage: DemoStage.FINDINGS, delay: 5000 },
      { stage: DemoStage.EMAIL_DRAFT, delay: 7000 },
      { stage: DemoStage.COMPLETE, delay: 10000 }
    ];

    stageTimings.forEach(({ stage, delay }) => {
      const timer = setTimeout(() => setCurrentStage(stage), delay);
      timers.push(timer);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  // Typewriter effect for findings
  useEffect(() => {
    if (currentStage === DemoStage.FINDINGS) {
      let i = 0;
      const text = demoContent.finding;
      const interval = setInterval(() => {
        if (i < text.length) {
          setAnimatedText(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [currentStage]);

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-lg border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Eye className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold">Foldera</span>
            </Link>
            <Badge variant="outline" className="text-primary border-primary">
              Live Demo
            </Badge>
          </div>
        </div>
      </nav>

      {/* Main Demo Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              WeWork Analysis
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Watch Foldera detect the $47B valuation error in real-time
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Document Panel */}
            <Card className="min-h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Document: WeWork Lease Agreement
                  {currentStage >= DemoStage.DOCUMENT_SCAN && (
                    <Badge className="ml-2 bg-green-500/20 text-green-400">
                      Scanning
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-6 rounded-lg font-mono text-sm">
                  <div className={`transition-opacity duration-1000 ${
                    currentStage >= DemoStage.DOCUMENT_SCAN ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {demoContent.document}
                  </div>
                  
                  {currentStage >= DemoStage.DOCUMENT_SCAN && currentStage < DemoStage.ANALYSIS && (
                    <div className="mt-4 flex items-center text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Scanning for financial inconsistencies...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Panel */}
            <Card className="min-h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Analysis
                  {currentStage >= DemoStage.ANALYSIS && (
                    <Badge className="ml-2 bg-primary/20 text-primary">
                      Processing
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Analysis Stage */}
                {currentStage >= DemoStage.ANALYSIS && currentStage < DemoStage.FINDINGS && (
                  <div className="space-y-4">
                    <div className="flex items-center text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                      Cross-referencing lease terms with revenue models...
                    </div>
                    <div className="flex items-center text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                      Calculating unit economics across 847 locations...
                    </div>
                    <div className="flex items-center text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
                      Projecting valuation impact...
                    </div>
                  </div>
                )}

                {/* Findings Stage */}
                {currentStage >= DemoStage.FINDINGS && (
                  <div className="space-y-6">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                        <span className="font-semibold text-destructive">Critical Finding</span>
                      </div>
                      <p className="font-mono text-lg">
                        {animatedText}
                      </p>
                    </div>

                    {currentStage >= DemoStage.EMAIL_DRAFT && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <TrendingDown className="h-5 w-5 text-primary mr-2" />
                          <span className="font-semibold text-primary">Financial Impact</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {demoContent.impact}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email Draft Section */}
          {currentStage >= DemoStage.EMAIL_DRAFT && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Generated Alert Email
                  <Badge className="ml-2 bg-green-500/20 text-green-400">
                    Ready to Send
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {demoContent.email}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Section */}
          {currentStage >= DemoStage.COMPLETE && (
            <div className="text-center mt-12 animate-fade-in">
              <div className="mb-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">
                  Analysis Complete
                </h2>
                <p className="text-xl text-muted-foreground">
                  Foldera found the $47B error in 3.2 seconds
                </p>
              </div>
              
              <Link href="/subscribe">
                <Button 
                  size="lg" 
                  className="min-h-[56px] px-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Try with your documents - 14 days free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}