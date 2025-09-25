import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDemoRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, CheckCircle } from "lucide-react";
import { trackConversion } from "@/lib/analytics";
import { getCurrentVisitorId } from "@/lib/ab";
import type { z } from "zod";
import type { Assignment } from "@/lib/ab";

type DemoFormData = z.infer<typeof insertDemoRequestSchema>;

interface DemoFormProps {
  experimentAssignment?: Assignment | null;
}

export default function DemoForm({ experimentAssignment }: DemoFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<DemoFormData>({
    resolver: zodResolver(insertDemoRequestSchema),
    defaultValues: {
      email: "",
      company: "",
      teamSize: "",
    },
  });

  const onSubmit = async (data: DemoFormData) => {
    try {
      // Use WAITLIST_FORM_ACTION if available, fallback to local endpoint
      const endpoint = import.meta.env.VITE_WAITLIST_FORM_ACTION || "/api/demo-request";
      await apiRequest("POST", endpoint, data);
      
      // Track successful demo form submission as conversion
      await trackConversion(
        'demo_form_submit', 
        experimentAssignment, 
        {
          company: data.company,
          teamSize: data.teamSize,
          formType: 'demo_request',
          source: 'website'
        }
      );
      
      setSubmitted(true);
      toast({
        title: "Demo request submitted!",
        description: "We'll be in touch within 24 hours to schedule your demo.",
      });
    } catch (error) {
      toast({
        title: "Error submitting request",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-8" data-testid="demo-form-success">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-2xl font-bold mb-2">Request Submitted!</h3>
        <p className="text-muted-foreground">
          We'll reach out within 24 hours to schedule your personalized demo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="demo-form">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@company.com"
              {...form.register("email")}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="company" className="block text-sm font-medium mb-2">
              Company
            </Label>
            <Input
              id="company"
              type="text"
              placeholder="Your Company"
              {...form.register("company")}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
              data-testid="input-company"
            />
            {form.formState.errors.company && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.company.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="teamSize" className="block text-sm font-medium mb-2">
              Team Size
            </Label>
            <Select onValueChange={(value) => form.setValue("teamSize", value)}>
              <SelectTrigger 
                className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="select-team-size"
              >
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 people</SelectItem>
                <SelectItem value="11-50">11-50 people</SelectItem>
                <SelectItem value="51-200">51-200 people</SelectItem>
                <SelectItem value="200+">200+ people</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.teamSize && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.teamSize.message}
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            disabled={form.formState.isSubmitting}
            data-testid="button-schedule-demo"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting ? "Submitting..." : "Schedule Demo"}
          </Button>
        </form>
      </div>
      
      <div className="bg-background border border-border rounded-lg p-6" data-testid="calendly-placeholder">
        <div className="text-center text-muted-foreground">
          <Calendar className="mx-auto h-16 w-16 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Choose Your Time</h3>
          <p className="text-sm mb-4">Available demo slots this week</p>
          <div className="space-y-2">
            <div className="bg-card p-3 rounded border text-left hover:bg-secondary cursor-pointer transition-colors">
              <span className="text-sm">Tomorrow 2:00 PM EST</span>
            </div>
            <div className="bg-card p-3 rounded border text-left hover:bg-secondary cursor-pointer transition-colors">
              <span className="text-sm">Tomorrow 3:30 PM EST</span>
            </div>
            <div className="bg-card p-3 rounded border text-left hover:bg-secondary cursor-pointer transition-colors">
              <span className="text-sm">Friday 4:00 PM EST</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Calendly integration will be embedded here
          </p>
        </div>
      </div>
    </div>
  );
}
