import { useState } from "react";
import { InlineWidget, PopupModal, useCalendlyEventListener } from "react-calendly";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, X, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackConversion, trackClick } from "@/lib/analytics";
import type { Assignment } from "@/lib/ab";

interface CalendlyWidgetProps {
  url: string;
  mode?: "inline" | "popup" | "modal";
  buttonText?: string;
  className?: string;
  children?: React.ReactNode;
  experimentAssignment?: Assignment | null;
}

export function CalendlyWidget({ 
  url, 
  mode = "modal", 
  buttonText = "Book Enterprise Demo",
  className = "",
  children,
  experimentAssignment 
}: CalendlyWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const { toast } = useToast();

  // Set up Calendly event listeners
  useCalendlyEventListener({
    onProfilePageViewed: () => {
      setIsLoading(false);
    },
    onDateAndTimeSelected: () => {
      console.log("Date and time selected");
    },
    onEventScheduled: (e) => {
      console.log("Event scheduled:", e.data.payload);
      
      // Track Calendly booking as conversion
      const eventData = e.data.payload;
      trackConversion(
        'calendly_booking',
        experimentAssignment,
        {
          eventUri: eventData.event?.uri || 'unknown',
          inviteeUri: eventData.invitee?.uri || 'unknown',
          eventType: 'enterprise_demo', // Static since we don't have access to full event data
          source: 'calendly_widget',
          mode: mode
        }
      );
      
      setIsScheduled(true);
      toast({
        title: "Demo Scheduled Successfully!",
        description: "You'll receive a confirmation email shortly with the meeting details.",
      });
      // Close modal after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setIsScheduled(false);
      }, 2000);
    },
    onPageHeightResize: (e) => {
      console.log("Page height resized:", e.data.payload.height);
    },
  });

  const handleOpenModal = () => {
    // Track button click
    trackClick(
      'calendly_button_click',
      experimentAssignment,
      {
        buttonText,
        mode,
        url
      }
    );
    
    setIsLoading(true);
    setIsOpen(true);
  };

  // Inline widget mode
  if (mode === "inline") {
    return (
      <Card className="bg-background border-border" data-testid="calendly-inline">
        <CardContent className="p-0">
          <InlineWidget
            url={url}
            styles={{
              height: '700px',
              width: '100%'
            }}
            utm={{
              utmSource: 'foldera_website',
              utmCampaign: 'enterprise_demo'
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // Popup modal mode (recommended for better UX)
  if (mode === "popup") {
    return (
      <>
        <PopupModal
          url={url}
          onModalClose={() => setIsOpen(false)}
          open={isOpen}
          rootElement={document.getElementById("root") || document.body}
        />
        {children ? (
          <div onClick={handleOpenModal} className={className}>
            {children}
          </div>
        ) : (
          <Button 
            onClick={handleOpenModal}
            className={`bg-primary text-primary-foreground hover:bg-primary/90 transition-all ${className}`}
            data-testid="button-calendly-popup"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {buttonText}
          </Button>
        )}
      </>
    );
  }

  // Modal mode (using shadcn Dialog component for consistent styling)
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
            data-testid="button-calendly-modal"
          >
            <Calendar className="mr-2 h-5 w-5" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[80vh] bg-background border-border" data-testid="calendly-modal">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Schedule Your Enterprise Demo
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            </div>
          )}
          
          {isScheduled && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center space-y-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h3 className="text-2xl font-bold text-foreground">Demo Scheduled!</h3>
                <p className="text-muted-foreground">Check your email for confirmation details.</p>
              </div>
            </div>
          )}
          
          <div className="h-full rounded-lg overflow-hidden">
            <InlineWidget
              url={url}
              styles={{
                height: '100%',
                width: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              utm={{
                utmSource: 'foldera_website',
                utmCampaign: 'enterprise_demo'
              }}
              prefill={{
                name: '',
                email: ''
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export individual components for flexibility
export const CalendlyInlineWidget = ({ url, className = "" }: { url: string; className?: string }) => (
  <CalendlyWidget url={url} mode="inline" className={className} />
);

export const CalendlyPopupButton = ({ 
  url, 
  buttonText = "Book Enterprise Demo", 
  className = "" 
}: { 
  url: string; 
  buttonText?: string; 
  className?: string; 
}) => (
  <CalendlyWidget url={url} mode="popup" buttonText={buttonText} className={className} />
);

export const CalendlyModalButton = ({ 
  url, 
  buttonText = "Book Enterprise Demo", 
  className = "",
  children 
}: { 
  url: string; 
  buttonText?: string; 
  className?: string;
  children?: React.ReactNode;
}) => (
  <CalendlyWidget url={url} mode="modal" buttonText={buttonText} className={className}>
    {children}
  </CalendlyWidget>
);

export default CalendlyWidget;