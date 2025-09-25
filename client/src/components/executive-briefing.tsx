import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import WaveBackground from '@/components/wave-background';

// Helper function for personalized greeting
function getPersonalizedGreeting() {
  const hour = new Date().getHours();
  const name = "Brandon"; // In real app, get from user context
  
  if (hour < 12) return `Good Morning ${name}`;
  if (hour < 17) return `Good Afternoon ${name}`;
  return `Good Evening ${name}`;
}

// Helper function for date format
function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

export default function ExecutiveBriefing() {
  const [welcomeCardDismissed, setWelcomeCardDismissed] = useState(false);

  return (
    <div className="min-h-screen relative space-y-8 p-6">
      <WaveBackground />
      {/* Header with Personalized Greeting */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold hero-gradient-text">
            {getPersonalizedGreeting()}.
          </h1>
          <p className="text-lg text-muted-foreground">
            Foldera Executive Briefing
          </p>
        </div>
      </div>

      {/* Executive Metrics Bar */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {/* ACTIVE */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">ACTIVE</p>
                <p className="text-3xl font-bold text-white">7</p>
              </div>
            </CardContent>
          </Card>

          {/* VALUE AT RISK */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">VALUE AT RISK</p>
                <p className="text-3xl font-bold text-orange-400">$215,000</p>
              </div>
            </CardContent>
          </Card>

          {/* ACTION ITEMS */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">ACTION ITEMS</p>
                <p className="text-3xl font-bold text-white">3</p>
              </div>
            </CardContent>
          </Card>

          {/* RECENT ACTIVITY */}
          <Card className="metrics-card card-hover-lift">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">RECENT ACTIVITY</p>
                <p className="text-3xl font-bold text-white">2</p>
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

      {/* Executive Briefing Sections */}
      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* LEGAL EXECUTIVE BRIEFING */}
        <div className="space-y-4">
          <div className="border-b border-cyan-400/30 pb-2">
            <h2 className="text-cyan-400 text-sm font-semibold uppercase tracking-wide">LEGAL EXECUTIVE BRIEFING</h2>
            <p className="text-muted-foreground text-sm mt-1">3 urgent items — PRA idle 455d, 9th Circuit on track</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-cyan-400 text-xs uppercase tracking-wide">ACTIVE ITEMS</p>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">King County PRA</span>
              <span className="text-orange-400 text-sm">$6,500 exposure</span>
            </div>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">9th Circuit Appeal</span>
              <span className="text-green-400 text-sm">On track</span>
            </div>
          </div>
        </div>

        {/* GRANTS EXECUTIVE BRIEFING */}
        <div className="space-y-4">
          <div className="border-b border-cyan-400/30 pb-2">
            <h2 className="text-cyan-400 text-sm font-semibold uppercase tracking-wide">GRANTS EXECUTIVE BRIEFING</h2>
            <p className="text-muted-foreground text-sm mt-1">Grant 'STEM Lab' missing budget, timeline slip flagged</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-cyan-400 text-xs uppercase tracking-wide">ACTIVE ITEMS</p>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">Grant: STEM Lab</span>
              <span className="text-yellow-400 text-sm">Missing budget section</span>
            </div>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">Education Initiative</span>
              <span className="text-muted-foreground text-sm">Review pending</span>
            </div>
          </div>
        </div>

        {/* SALES EXECUTIVE BRIEFING */}
        <div className="space-y-4">
          <div className="border-b border-cyan-400/30 pb-2">
            <h2 className="text-cyan-400 text-sm font-semibold uppercase tracking-wide">SALES EXECUTIVE BRIEFING</h2>
            <p className="text-muted-foreground text-sm mt-1">Acme renewal stalled 18d, $150k pipeline at risk</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-cyan-400 text-xs uppercase tracking-wide">ACTIVE ITEMS</p>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">Acme Renewal</span>
              <span className="text-orange-400 text-sm">$150,000 pipeline</span>
            </div>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">TechCorp Partnership</span>
              <span className="text-green-400 text-sm">Contract signed</span>
            </div>
          </div>
        </div>

        {/* ADOPTION EXECUTIVE BRIEFING */}
        <div className="space-y-4">
          <div className="border-b border-cyan-400/30 pb-2">
            <h2 className="text-cyan-400 text-sm font-semibold uppercase tracking-wide">ADOPTION EXECUTIVE BRIEFING</h2>
            <p className="text-muted-foreground text-sm mt-1">Rivera Family eligibility docs pending review</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-cyan-400 text-xs uppercase tracking-wide">ACTIVE ITEMS</p>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">Adoption: Rivera Family</span>
              <span className="text-muted-foreground text-sm">Eligibility docs pending</span>
            </div>
            
            <div className="card-glass p-4 flex justify-between items-center">
              <span className="text-white">Johnson Family</span>
              <span className="text-green-400 text-sm">Home study completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-12 text-center card-glass">
          <div className="space-y-2">
            <p className="text-white text-lg">Drop folders, PDFs, emails to process</p>
            <p className="text-muted-foreground text-sm">Drag and drop files here or click to browse</p>
          </div>
        </div>
      </div>
    </div>
  );
}