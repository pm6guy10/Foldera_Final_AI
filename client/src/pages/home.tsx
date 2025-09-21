import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { 
  Shield, Eye, CheckCircle, Calendar, FileText, AlertTriangle, 
  Lock, Brain, Zap, Target, ChevronRight,
  TrendingUp, ShieldCheck, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoRequest } from "../components/demo-request";
import { Badge } from "@/components/ui/badge";

// Typewriter animation component for audit logs
function TypewriterLog({ log, delay = 0 }: { log: string; delay?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < log.length) {
          setDisplayText(log.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 30);
      
      return () => clearInterval(typingInterval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [log, delay]);
  
  return (
    <div className="font-mono text-sm text-green-400 mb-2 min-h-[24px]">
      {displayText}
      {isTyping && <span className="animate-pulse text-green-400">|</span>}
    </div>
  );
}

// Audit Log Section Component
function AuditLogSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const logs = [
    "[07:18:42] Scanning /Client/contracts/proposal.docx",
    "[07:18:43] Conflict detected → Drafting counter-offer",
    "[07:18:44] Risk neutralized",
    "[07:19:15] Reviewing /Board/Q4_financials.pptx"
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % logs.length);
    }, 6000); // Cycle through logs every 6 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8" data-testid="audit-log-section">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Glass-Box Audit Log
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every output comes with receipts. Every move logged.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-black border border-green-500/30 rounded-lg p-8 font-mono relative z-10">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <span className="text-sm text-green-400">LIVE MONITORING</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {logs.map((log, idx) => (
                <TypewriterLog 
                  key={`${currentIndex}-${idx}`}
                  log={log} 
                  delay={idx * 1500}
                />
              ))}
            </div>
            
            <div className="mt-6 flex items-center text-sm text-green-400">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Real-time monitoring and full audit trail
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-foreground font-sans antialiased min-h-screen relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-lg border-b border-border z-50" data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold">Foldera</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="#features" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" 
                data-testid="nav-features"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" 
                data-testid="nav-pricing"
              >
                Pricing
              </a>
              <a 
                href="#security" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer" 
                data-testid="nav-security"
              >
                Security
              </a>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-foreground p-2"
                data-testid="mobile-menu-toggle"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a 
                  href="#features" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Pricing
                </a>
                <a 
                  href="#security" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Security
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Catch <span className="text-primary glow-text">$750k Errors</span> Before Coffee
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed max-w-3xl mx-auto">
              Your contracts have landmines. Board decks conflict with budgets. 
              Compliance docs contradict amendments. You just haven't found them yet.
            </p>
            <p className="text-lg md:text-xl text-foreground mb-10 max-w-3xl mx-auto font-medium">
              Foldera scans everything. Catches catastrophic conflicts. 
              Delivers board-ready fixes before someone asks "did you check this?"
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/simulation">
                <Button 
                  size="lg" 
                  className="min-h-[48px] px-10 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg" 
                  data-testid="hero-primary-cta"
                  onClick={() => {
                    // Track hero CTA click
                    if (typeof window !== 'undefined' && (window as any).analytics) {
                      (window as any).analytics.track('hero_cta_click');
                    }
                  }}
                >
                  Watch 20s Demo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              1,287 operators already protected
            </p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-card/50" data-testid="problem-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Built for Elite Operators
            </h2>
            <p className="text-xl text-muted-foreground">
              Trusted by professionals at organizations like McKinsey, Deloitte, and Fortune 500 companies.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-background/50 border border-border rounded-lg p-8">
              <ul className="space-y-4 text-lg">
                <li className="flex items-start">
                  <span className="text-destructive mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Find latest P&L numbers… wait, not those ones.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Does the proposal mention the Q3 budget cap?</span>
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Re-remind the AI about the client's NDA.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">Draft email to legal. No, check compliance doc first.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">What did Sarah say on that call last Tuesday?</span>
                </li>
                <li className="flex items-start">
                  <span className="text-destructive mr-3 mt-1">•</span>
                  <span className="text-muted-foreground">The deck still has the old logo.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8" id="features" data-testid="solution-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Where <span className="text-primary glow-text">Gen 2 AI</span> Shows Up
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real protection. Real-time scanning. Board-ready fixes before someone asks.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center ghost-hover" data-testid="feature-scanning">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">1. It Sees Everything</h3>
                <p className="text-muted-foreground">
                  Scans every doc, transcript, and draft.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="feature-detection">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">2. It Connects Dots</h3>
                <p className="text-muted-foreground">
                  Flags contradictions, risks, and silent landmines before they explode.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="feature-action">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">3. It Makes Moves</h3>
                <p className="text-muted-foreground">
                  The counter-offer, the fixed deck, the compliant filing. You just hit approve.
                </p>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </section>

      {/* Results Section - Three Landmines */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-card/50" data-testid="results-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Three Landmines. Three Deliverables.{' '}
              <span className="text-primary">All Before Coffee</span>.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="ghost-hover" data-testid="landmine-budget">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="text-xl font-bold mb-2">Budget Bomb Neutralized</h3>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    Proposal assumed $180K upfront. Client said "cash-strapped until Q2."
                  </p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary mb-1">Deliverable:</p>
                  <p className="text-sm">Pre-written staged payment plan email.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="ghost-hover" data-testid="landmine-version">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="text-xl font-bold mb-2">Version Grenade Disarmed</h3>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    Deck was about to ship with outdated P&L.
                  </p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary mb-1">Deliverable:</p>
                  <p className="text-sm">Corrected investor deck with live data.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="ghost-hover" data-testid="landmine-deadline">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="text-xl font-bold mb-2">Deadline Landmine Flagged</h3>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    Critical compliance filing buried in 200+ emails.
                  </p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary mb-1">Deliverable:</p>
                  <p className="text-sm">Filing submitted 3 days early.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Audit Log Section with Typewriter Animation */}
      <AuditLogSection />

      {/* Why It Matters Section */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-card/50" data-testid="why-it-matters-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Why It Matters
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Nobody gets fired for wasting 9 hours a week searching folders. 
              Careers end when the wrong number slips through. Foldera is the guardrail.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center ghost-hover">
              <CardContent className="pt-8">
                <Target className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">In the Trench</h3>
                <p className="text-sm text-muted-foreground">
                  Verifies every critical number.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover">
              <CardContent className="pt-8">
                <TrendingUp className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">Boardroom-Proof</h3>
                <p className="text-sm text-muted-foreground">
                  Surfaces conflicts before the CFO asks.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover">
              <CardContent className="pt-8">
                <ShieldCheck className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">Compliance Shield</h3>
                <p className="text-sm text-muted-foreground">
                  Flags risky language against your library.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover">
              <CardContent className="pt-8">
                <ClipboardCheck className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-bold mb-2">Audit Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Hands you the binder before they knock.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8" id="pricing" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Pricing — Choose Your Guardian
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Self-Serve Tier */}
            <Card className="relative ghost-hover flex flex-col min-h-[500px]">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-2xl">Self-Serve</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">Small teams getting started</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 pt-0">
                <ul className="space-y-3 flex-1 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Up to 5 users</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Conflict detection</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Basic audit logging</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Standard security</span>
                  </li>
                </ul>
                <Link href="/subscribe">
                  <Button className="w-full min-h-[48px] font-semibold py-3" variant="outline">
                    Start Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tier - Most Popular */}
            <Card className="relative ghost-hover border-primary flex flex-col min-h-[500px]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$399</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">For growing organizations</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 pt-0">
                <ul className="space-y-3 flex-1 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Up to 50 users</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Advanced scanning and alerts</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">SOC 2 security</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Link href="/subscribe">
                  <Button className="w-full min-h-[48px] font-semibold py-3 bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="relative ghost-hover flex flex-col min-h-[500px]">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-2xl">Enterprise Pilot</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Contact Sales</span>
                </div>
                <p className="text-muted-foreground mt-2">Critical operations</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 pt-0">
                <ul className="space-y-3 flex-1 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Unlimited users</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Custom AI training</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">Full compliance suite</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">24/7 support</span>
                  </li>
                </ul>
                <DemoRequest buttonText="Book Enterprise Demo">
                  <Button className="w-full min-h-[48px] font-semibold py-3" variant="outline">
                    Book Enterprise Demo
                  </Button>
                </DemoRequest>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-card/50" id="security" data-testid="security-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Enterprise-Grade Security
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <Shield className="h-6 w-6 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">SOC 2 Type II certified</h3>
                      <p className="text-sm text-muted-foreground">
                        Independently audited security controls
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <Lock className="h-6 w-6 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">GDPR and HIPAA ready</h3>
                      <p className="text-sm text-muted-foreground">
                        Compliant with global privacy regulations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <ShieldCheck className="h-6 w-6 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Zero-trust architecture</h3>
                      <p className="text-sm text-muted-foreground">
                        Never trust, always verify
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <Lock className="h-6 w-6 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">End-to-end encryption</h3>
                      <p className="text-sm text-muted-foreground">
                        Your data is encrypted at rest and in transit
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <Eye className="h-6 w-6 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Continuous monitoring</h3>
                      <p className="text-sm text-muted-foreground">
                        24/7 threat detection and response
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <Shield className="h-6 w-6 text-primary mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Pen testing and incident response</h3>
                      <p className="text-sm text-muted-foreground">
                        Regular security assessments and rapid response
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8" data-testid="footer-cta-section">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Never Get Ghosted Again
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Join teams who trust Foldera to protect their most critical moments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/documents">
              <Button 
                size="lg" 
                className="min-h-[48px] px-8 text-base font-semibold"
                data-testid="footer-primary-cta"
              >
                Show Me My First Briefing
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <DemoRequest buttonText="Book a Security-Cleared Demo">
              <Button 
                variant="outline" 
                size="lg" 
                className="min-h-[48px] px-8 text-base font-semibold border-primary/50 hover:bg-primary/10"
                data-testid="footer-secondary-cta"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book a Security-Cleared Demo
              </Button>
            </DemoRequest>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border" data-testid="footer">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Foldera, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}