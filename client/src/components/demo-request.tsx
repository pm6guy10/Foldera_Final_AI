import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DemoRequestProps {
  buttonText?: string;
  className?: string;
  children?: React.ReactNode;
}

interface DemoRequestData {
  name: string;
  email: string;
  company: string;
  title: string;
  teamSize?: string;
  message?: string;
  preferredTime?: string;
}

export function DemoRequest({ 
  buttonText = "Book Enterprise Demo",
  className = "",
  children 
}: DemoRequestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<DemoRequestData>({
    name: '',
    email: '',
    company: '',
    title: '',
    teamSize: '',
    message: '',
    preferredTime: ''
  });
  const { toast } = useToast();

  const demoRequestMutation = useMutation({
    mutationFn: async (data: DemoRequestData) => {
      // Set timeout to redirect to Calendly after 5 seconds if no response
      const timeoutId = setTimeout(() => {
        window.location.href = "https://calendly.com/foldera/demo";
      }, 5000);

      try {
        const response = await apiRequest('POST', '/api/demo-request', {
          name: data.name,
          email: data.email,
          company: data.company,
          title: data.title,
          teamSize: data.teamSize || '1-5', // Default to 1-5 if not provided
          message: data.message,
          preferredTime: data.preferredTime,
          source: 'landing_page',
          type: 'enterprise_demo'
        });
        clearTimeout(timeoutId);
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Track success event
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('demo_request_success', {
          email: formData.email,
          company: formData.company
        });
      }

      setIsSuccess(true);
      toast({
        title: "Demo Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your personalized demo.",
      });
      
      // Show referral code after success
      const referralCode = btoa(formData.email).substring(0, 8).toUpperCase();
      
      setTimeout(() => {
        toast({
          title: "Share and Save!",
          description: `Get 1 month free for every 3 friends who book a demo with code: ${referralCode}`,
          duration: 10000
        });
        
        // Track referral shown
        if (typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.track('referral_shared', {
            referralCode,
            email: formData.email
          });
        }
      }, 2500);
      
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({
          name: '',
          email: '',
          company: '',
          title: '',
          teamSize: '',
          message: '',
          preferredTime: ''
        });
        
        // Open actual Calendly link if available
        const calendlyUrl = "https://calendly.com/foldera/demo";
        window.open(calendlyUrl, '_blank');
      }, 4000);
    },
    onError: (error: any) => {
      // Track failure event
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('demo_request_fail', {
          error: error.message,
          email: formData.email
        });
      }

      toast({
        title: "Request Failed",
        description: "Redirecting you to our calendar booking page...",
        variant: "destructive",
      });
      
      // Hard redirect to Calendly on error
      setTimeout(() => {
        window.location.href = "https://calendly.com/foldera/demo";
      }, 1500);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company || !formData.title) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Track demo request sent event
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('demo_request_sent', {
        email: formData.email,
        company: formData.company,
        teamSize: formData.teamSize || '1-5'
      });
    }
    
    demoRequestMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof DemoRequestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ? (
          <div className={className}>
            {children}
          </div>
        ) : (
          <Button 
            className={`bg-primary text-primary-foreground hover:bg-primary/90 transition-all ${className}`}
            data-testid="button-demo-request"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md w-full bg-background border-border" data-testid="demo-request-modal">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Request Enterprise Demo
          </DialogTitle>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">Request Submitted!</h3>
              <p className="text-muted-foreground">Opening calendar to schedule your demo...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your name"
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@company.com"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Company name"
                  required
                  data-testid="input-company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Your role"
                  required
                  data-testid="input-title"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <select
                  id="teamSize"
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="select-team-size"
                >
                  <option value="">Select team size</option>
                  <option value="1-5">1-5</option>
                  <option value="6-20">6-20</option>
                  <option value="21-50">21-50</option>
                  <option value="51-100">51-100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Input
                  id="preferredTime"
                  value={formData.preferredTime}
                  onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                  placeholder="e.g., Next Tuesday 2pm EST"
                  data-testid="input-preferred-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us about your use case (optional)"
                rows={3}
                data-testid="input-message"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={demoRequestMutation.isPending}
              data-testid="button-submit-demo-request"
            >
              {demoRequestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Request Demo'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}