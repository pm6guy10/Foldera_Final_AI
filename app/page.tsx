import Link from "next/link";
import { Shield, Eye, TriangleAlert, Settings, CheckCircle, Calendar, Rocket, Gavel, DollarSign, IdCard, Lock, Key, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuditLogVisualization from "@/components/audit-log-visualization";
import DemoForm from "@/components/demo-form";

export default function Home() {
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
              <Link href="/subscribe?plan=pro">
                <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors" data-testid="button-start-trial">
                  Start Trial
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
              The AI That Never{' '}
              <span className="text-primary glow-text">Ghosts</span> You
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed" data-testid="hero-subheadline">
              When other AIs vanish at crunch time, Foldera stands guard.{' '}
              <br className="hidden md:block" />
              Preventing disasters. Protecting careers. <span className="text-destructive font-semibold">Before it's too late.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/subscribe?plan=pro">
                <Button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all ghost-hover" data-testid="button-start-trial-hero">
                  <Rocket className="mr-2 h-5 w-5" />
                  Start Trial
                </Button>
              </Link>
              <Button variant="outline" className="border-border text-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-secondary transition-all" data-testid="button-book-demo">
                <Calendar className="mr-2 h-5 w-5" />
                Book Enterprise Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border" data-testid="trust-bar">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground mb-8 text-sm uppercase tracking-wide">
            Built for teams inside companies like
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="text-center" data-testid="trust-microsoft">
              <div className="text-3xl mb-2">🏢</div>
              <p className="font-semibold">Microsoft</p>
            </div>
            <div className="text-center" data-testid="trust-mckesson">
              <div className="text-3xl mb-2">🏥</div>
              <p className="font-semibold">McKesson</p>
            </div>
            <div className="text-center" data-testid="trust-glean">
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-semibold">Glean</p>
            </div>
            <div className="text-center" data-testid="trust-notion">
              <div className="text-3xl mb-2">📝</div>
              <p className="font-semibold">Notion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card" data-testid="pain-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6" data-testid="pain-headline">
              Your Career Just Went <span className="text-destructive">Code Red</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              One wrong document. One missed conflict. One compliance failure.{' '}
              <br className="hidden md:block" />
              And suddenly you're explaining to the board why everything went sideways.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background border-destructive/20 text-center" data-testid="pain-boardroom">
              <CardContent className="pt-8">
                <Gavel className="mx-auto text-destructive text-4xl mb-4" />
                <h3 className="text-xl font-bold mb-4">The Boardroom Blindside</h3>
                <p className="text-muted-foreground">"Why didn't our AI catch this conflict before we sent it to the client?"</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background border-destructive/20 text-center" data-testid="pain-cfo">
              <CardContent className="pt-8">
                <DollarSign className="mx-auto text-destructive text-4xl mb-4" />
                <h3 className="text-xl font-bold mb-4">The CFO Meltdown</h3>
                <p className="text-muted-foreground">"This compliance failure just cost us the contract. And probably next quarter."</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background border-destructive/20 text-center" data-testid="pain-badge">
              <CardContent className="pt-8">
                <IdCard className="mx-auto text-destructive text-4xl mb-4" />
                <h3 className="text-xl font-bold mb-4">The Badge Disabled</h3>
                <p className="text-muted-foreground">"Your access has been revoked pending investigation into the data breach."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Relief Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="features" data-testid="relief-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6" data-testid="relief-headline">
              <span className="text-primary">Foldera Intercepts</span> Problems
              <br />
              Before They Explode
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              While other AIs ghost you when stakes get high, Foldera stays vigilant.{' '}
              <br className="hidden md:block" />
              Scanning, protecting, and preventing career-ending mistakes 24/7.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center ghost-hover" data-testid="feature-scanning">
              <CardContent className="pt-8">
                <Eye className="mx-auto text-primary text-4xl mb-4" />
                <h3 className="text-xl font-bold mb-4">Real-Time Scanning</h3>
                <p className="text-muted-foreground">Every document, every edit, every risk assessed in real-time before problems surface.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="feature-detection">
              <CardContent className="pt-8">
                <TriangleAlert className="mx-auto text-yellow-500 text-4xl mb-4" />
                <h3 className="text-xl font-bold mb-4">Conflict Detection</h3>
                <p className="text-muted-foreground">Instantly flags contradictions, compliance issues, and potential legal landmines.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center ghost-hover" data-testid="feature-remediation">
              <CardContent className="pt-8">
                <Settings className="mx-auto text-green-500 text-4xl mb-4" />
                <h3 className="text-xl font-bold mb-4">Auto-Remediation</h3>
                <p className="text-muted-foreground">Suggests fixes, applies corrections, and ensures compliance without human intervention.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Audit Log Visualization */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card" data-testid="audit-log-section">
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

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="pricing" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Choose Your <span className="text-primary">Guardian Level</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              From small teams to enterprise fortresses. Foldera scales with your needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Individual */}
            <Card data-testid="pricing-individual">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Individual</h3>
                  <p className="text-muted-foreground mb-4">Perfect for solo professionals</p>
                  <div className="text-4xl font-black mb-2">$49<span className="text-lg text-muted-foreground">/mo</span></div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Up to 5 users</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Basic discrepancy detection</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Email support</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Standard integrations</li>
                </ul>
                <Link href="/subscribe?plan=individual">
                  <Button variant="secondary" className="w-full py-3" data-testid="button-individual">
                    Start Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Pro */}
            <Card className="border-2 border-primary relative" data-testid="pricing-pro">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <p className="text-muted-foreground mb-4">For growing teams</p>
                  <div className="text-4xl font-black mb-2">$99<span className="text-lg text-muted-foreground">/mo</span></div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Up to 25 users</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Advanced AI protection</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Priority support</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Custom workflows</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Audit reporting</li>
                </ul>
                <Link href="/subscribe?plan=pro">
                  <Button className="w-full py-3" data-testid="button-pro">
                    Start Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Team */}
            <Card data-testid="pricing-team">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Team</h3>
                  <p className="text-muted-foreground mb-4">For large organizations</p>
                  <div className="text-4xl font-black mb-2">$399<span className="text-lg text-muted-foreground">/mo</span></div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Up to 100 users</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Enterprise AI features</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Dedicated support</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />Advanced integrations</li>
                  <li className="flex items-center"><CheckCircle className="text-green-500 mr-3 h-4 w-4" />SOC 2 compliance</li>
                </ul>
                <Link href="/subscribe?plan=team">
                  <Button variant="outline" className="w-full py-3" data-testid="button-team">
                    Start Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Form Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card" data-testid="demo-section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              See Foldera <span className="text-primary">Protect</span> Your Team
            </h2>
            <p className="text-xl text-muted-foreground">
              Book a demo and watch Foldera prevent real disasters in real-time
            </p>
          </div>
          
          <DemoForm />
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="security" data-testid="security-section">
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

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-accent/10" data-testid="final-cta">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Stop Waiting for Disaster
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your trial today and let Foldera guard your career while you sleep
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/subscribe?plan=pro">
              <Button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all ghost-hover" data-testid="button-start-trial-final">
                <Rocket className="mr-2 h-5 w-5" />
                Start Trial Now
              </Button>
            </Link>
            <Button variant="outline" className="border-border text-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-secondary transition-all" data-testid="button-view-pricing">
              <Eye className="mr-2 h-5 w-5" />
              View Pricing
            </Button>
          </div>
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
                The AI career guardian that never ghosts you when it matters most.
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
            <p>&copy; 2024 Foldera. All rights reserved. Built to protect, engineered to never ghost.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}