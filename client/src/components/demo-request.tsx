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
    message: '',
    preferredTime: ''
  });
  const { toast } = useToast();

  const demoRequestMutation = useMutation({
    mutationFn: async (data: DemoRequestData) => {
      const response = await apiRequest('POST', '/api/demo-request', {
        name: data.name,
        email: data.email,
        company: data.company,
        title: data.title,
        message: data.message,
        preferredTime: data.preferredTime,
        source: 'landing_page',
        type: 'enterprise_demo'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      toast({
        title: "Demo Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your personalized demo.",
      });
      
      // Simulate providing Calendly link (in real implementation, backend would return this)
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({
          name: '',
          email: '',
          company: '',
          title: '',
          message: '',
          preferredTime: ''
        });
        
        // Open actual Calendly link if available
        const calendlyUrl = import.meta.env.VITE_CALENDLY_URL || "https://calendly.com/foldera/enterprise-demo";
        window.open(calendlyUrl, '_blank');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit demo request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Your role"
                  data-testid="input-title"
                />
              </div>
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