import { useState } from "react";
import { Link } from "wouter";
import { Shield, Eye, TriangleAlert, Settings, CheckCircle, Calendar, Rocket, Gavel, DollarSign, IdCard, Lock, Key, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuditLogVisualization from "@/components/audit-log-visualization";
import { CalendlyModalButton } from "../components/calendly-widget";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-foreground font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b border-border z-50" data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold">Foldera</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a>
              <Link href="#pricing">
                <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors" data-testid="button-start-trial">
                  Join Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight" data-testid="hero-headline">
              Stop Babysitting the AI{' '}
              <span className="text-primary glow-text">Productivity Ghost</span>.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed" data-testid="hero-subheadline">
              You don't prompt it. You don't pray it remembers.{' '}
              <br className="hidden md:block" />
              Foldera works while you sleep — <span className="text-primary font-semibold">fixing chaos before it explodes.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="#pricing">
                <Button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all ghost-hover" data-testid="button-start-trial-hero">
                  ➡️ Show Me My First Briefing
                </Button>
              </Link>
              <CalendlyModalButton 
                url="https://calendly.com/foldera/enterprise-demo"
                buttonText="Book Enterprise Demo"
                className="px-8 py-4 rounded-lg font-semibold text-lg"
              >
                <Button variant="outline" className="border-border text-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-secondary transition-all" data-testid="button-book-demo">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Enterprise Demo
                </Button>
              </CalendlyModalButton>
              <p className="text-sm text-muted-foreground">🔥 1,292 professionals already joined.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border" data-testid="trust-bar">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground mb-8 text-sm uppercase tracking-wide">
            Trusted by professionals at
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
            <div className="text-center" data-testid="trust-mckinsey">
              <div className="text-3xl mb-2">🏢</div>
              <p className="font-semibold">McKinsey</p>
            </div>
            <div className="text-center" data-testid="trust-notion">
              <div className="text-3xl mb-2">📝</div>
              <p className="font-semibold">Notion</p>
            </div>
            <div className="text-center" data-testid="trust-pwc">
              <div className="text-3xl mb-2">📊</div>
              <p className="font-semibold">PwC</p>
            </div>
            <div className="text-center" data-testid="trust-accenture">
              <div className="text-3xl mb-2">⚡</div>
              <p className="font-semibold">Accenture</p>
            </div>
            <div className="text-center" data-testid="trust-deloitte">
              <div className="text-3xl mb-2">🔵</div>
              <p className="font-semibold">Deloitte</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card" data-testid="pain-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6" data-testid="pain-headline">
              📉 You Were Promised a <span className="text-primary">Partner</span>.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Instead, you got a goldfish with amnesia. Gen‑1 AI dumps the thinking back on your plate.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background border-border text-center" data-testid="pain-time">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-muted-foreground text-lg">"I spend more time reminding my AI than using it."</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background border-border text-center" data-testid="pain-summaries">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-muted-foreground text-lg">"Summaries are worthless. I need decisions."</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background border-border text-center" data-testid="pain-goldfish">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">🐠</div>
                <p className="text-muted-foreground text-lg">"It's like talking to a goldfish."</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-xl text-muted-foreground">
              🧠 Foldera fixes what other AI forgets — and acts before you even know it's broken.
            </p>
          </div>
        </div>
      </section>

      {/* Relief Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="features" data-testid="relief-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6" data-testid="relief-headline">
              From Chaos to <span className="text-primary">Counter-Moves</span>.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Foldera doesn't summarize — it strategizes. You wake up to a battle-ready briefing with clear, immediate moves.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center ghost-hover" data-testid="feature-scanning">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">👁️</div>
                <h3 className="text-xl font-bold mb-4">1. It Sees Everything</h3>
                <p className="text-muted-foreground">Foldera ingests your chaos. Every doc, transcript, and draft is scanned, compared, and remembered.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="feature-detection">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-xl font-bold mb-4">2. It Connects Dots</h3>
                <p className="text-muted-foreground">Contradictions, risks, and silent landmines? It flags them before they explode.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="feature-remediation">
              <CardContent className="pt-8">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-bold mb-4">3. It Makes Moves</h3>
                <p className="text-muted-foreground">The counter-offer. The fixed deck. The compliant filing. You just hit approve.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Three Landmines Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card" data-testid="three-landmines-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              ☕ Three Landmines. Three Deliverables. <span className="text-primary">All Before Coffee</span>.
            </h2>
            <p className="text-xl text-muted-foreground">
              Foldera doesn't alert you. It neutralizes threats and leaves the receipts.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="ghost-hover" data-testid="landmine-budget">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">💥</div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Budget Bomb Neutralized</h3>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">Proposal assumed $180K upfront. Client said "cash-strapped 'til Q2."</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary mb-1">Deliverable:</p>
                  <p className="text-sm">Pre-written staged payment plan email.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="ghost-hover" data-testid="landmine-version">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">🔥</div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Version Grenade Disarmed</h3>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">Deck was about to ship with outdated P&L.</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-primary mb-1">Deliverable:</p>
                  <p className="text-sm">Corrected investor deck with live data.</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="ghost-hover" data-testid="landmine-deadline">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">⏰</div>
                  <h3 className="text-xl font-bold text-destructive mb-2">Deadline Landmine Flagged</h3>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">Critical compliance filing buried in 200+ emails.</p>
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
      
      {/* Comparison Table Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="comparison-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              🔍 Every Other AI Is a <span className="text-destructive">Black Box</span>.
            </h2>
            <p className="text-xl text-muted-foreground">
              Foldera is proactive, transparent, and battle-tested.
            </p>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-6 font-semibold text-muted-foreground"></th>
                      <th className="text-center p-6 font-semibold text-muted-foreground">Black-Box AI Tools</th>
                      <th className="text-center p-6 font-semibold text-primary">Foldera</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-6 font-semibold">Memory</td>
                      <td className="p-6 text-center text-muted-foreground">Forgets everything</td>
                      <td className="p-6 text-center text-primary font-semibold">Remembers everything</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-6 font-semibold">Strategy</td>
                      <td className="p-6 text-center text-muted-foreground">Makes you decide</td>
                      <td className="p-6 text-center text-primary font-semibold">Makes decisions for you</td>
                    </tr>
                    <tr>
                      <td className="p-6 font-semibold">Trust</td>
                      <td className="p-6 text-center text-muted-foreground">Hallucinates, hides sources</td>
                      <td className="p-6 text-center text-primary font-semibold">Glass-box audit log</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-8">
            <p className="text-xl text-muted-foreground">
              Others summarize. <span className="text-primary font-semibold">Foldera acts</span>. Every output comes with receipts. Every move logged.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card" data-testid="trust-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              🛡️ Why Professionals <span className="text-primary">Trust Foldera</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Used by operators at McKinsey, Notion, Accenture, and Deloitte.
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto mb-12">
            <CardContent className="p-8 text-center">
              <p className="text-xl italic text-muted-foreground mb-4">
                "AI search feels like a goldfish. Foldera feels like a general."
              </p>
              <p className="text-sm text-muted-foreground">— Early Beta User</p>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="text-center ghost-hover">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-bold mb-4">Battle-Hardened</h3>
                <p className="text-muted-foreground">Forged in high-stakes workflows where a single miss = millions lost.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-4">Glass-Box Trust</h3>
                <p className="text-muted-foreground">Every move traced. Every source logged. No black box. No hallucinations.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Audit Log Visualization */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="audit-log-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Watch Foldera <span className="text-primary">Work</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See how Foldera scans, detects, and protects in real-time
            </p>
          </div>
          
          <AuditLogVisualization />
        </div>
      </section>

      {/* Demo Booking Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="pricing" data-testid="demo-section">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              ⚡ Stop Babysitting. <span className="text-primary">Start Winning</span>.
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              See Foldera in action. Book a personalized demo and watch it prevent disasters in real-time.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Waitlist Card */}
            <Card className="border-2 border-primary/50">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold mb-4">Join the Waitlist</h3>
                  <p className="text-muted-foreground">
                    Get early access when we launch publicly.
                  </p>
                </div>
                
                <Button className="w-full py-4 text-lg font-semibold mb-4" data-testid="button-join-waitlist">
                  ➡️ Join Waitlist
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  No spam. No sales calls. Just early access notification.
                </p>
              </CardContent>
            </Card>
            
            {/* Enterprise Demo Card */}
            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🛡️</div>
                  <h3 className="text-2xl font-bold mb-4">Enterprise Demo</h3>
                  <p className="text-muted-foreground">
                    See Foldera protect your team in a live demonstration.
                  </p>
                </div>
                
                <CalendlyModalButton 
                  url="https://calendly.com/foldera/enterprise-demo"
                  buttonText="Book Enterprise Demo"
                  className="w-full"
                >
                  <Button className="w-full py-4 text-lg font-semibold mb-4" data-testid="button-book-enterprise-demo">
                    📅 Book Enterprise Demo
                  </Button>
                </CalendlyModalButton>
                
                <p className="text-sm text-muted-foreground">
                  30-minute personalized demonstration with our team.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card" id="security" data-testid="security-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="text-primary">Enterprise-Grade</span> Security
            </h2>
            <p className="text-xl text-muted-foreground">
              Built to meet the highest security and compliance standards
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Card className="text-center ghost-hover" data-testid="security-soc2">
              <CardContent className="p-6">
                <Shield className="mx-auto text-green-500 text-3xl mb-4" />
                <h3 className="font-bold mb-2">SOC 2 Type II</h3>
                <p className="text-sm text-muted-foreground">Certified & audited</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="security-hipaa">
              <CardContent className="p-6">
                <div className="mx-auto text-blue-500 text-3xl mb-4">🏥</div>
                <h3 className="font-bold mb-2">HIPAA</h3>
                <p className="text-sm text-muted-foreground">Healthcare ready</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="security-gdpr">
              <CardContent className="p-6">
                <div className="mx-auto text-purple-500 text-3xl mb-4">⚖️</div>
                <h3 className="font-bold mb-2">GDPR</h3>
                <p className="text-sm text-muted-foreground">Privacy compliant</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="security-audit">
              <CardContent className="p-6">
                <CheckCircle className="mx-auto text-yellow-500 text-3xl mb-4" />
                <h3 className="font-bold mb-2">Audit Ready</h3>
                <p className="text-sm text-muted-foreground">Complete trails</p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-16" data-testid="security-features">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <Lock className="mx-auto text-primary text-2xl mb-3" />
                  <h4 className="font-semibold mb-2">End-to-End Encryption</h4>
                  <p className="text-sm text-muted-foreground">AES-256 encryption at rest and in transit</p>
                </div>
                <div>
                  <Key className="mx-auto text-primary text-2xl mb-3" />
                  <h4 className="font-semibold mb-2">Zero-Trust Architecture</h4>
                  <p className="text-sm text-muted-foreground">Every request verified and authenticated</p>
                </div>
                <div>
                  <History className="mx-auto text-primary text-2xl mb-3" />
                  <h4 className="font-semibold mb-2">Complete Audit Logs</h4>
                  <p className="text-sm text-muted-foreground">Every action tracked and immutable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-card border-t border-border py-16 px-4 sm:px-6 lg:px-8" data-testid="footer">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="text-primary text-2xl mr-2" />
                <span className="text-xl font-bold">Foldera</span>
              </div>
              <p className="text-muted-foreground text-sm">
                The AI that fixes chaos before it explodes. Built for professionals who can't afford to be ghosted.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-about">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors" data-testid="link-security">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Data Processing</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Foldera. All rights reserved. The AI productivity partner that never ghosts you.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
