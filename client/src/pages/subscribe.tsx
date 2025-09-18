import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscribeFormProps {
  planName: string;
  planPrice: string;
}

const SubscribeForm = ({ planName, planPrice }: SubscribeFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}?success=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Foldera! Your subscription is now active.",
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card className="max-w-md mx-auto" data-testid="subscribe-form">
      <CardHeader>
        <CardTitle className="text-center">
          Subscribe to {planName}
        </CardTitle>
        <p className="text-center text-muted-foreground">
          {planPrice}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isProcessing}
            data-testid="button-subscribe"
          >
            {isProcessing ? "Processing..." : `Subscribe to ${planName}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState({
    name: "Pro",
    price: "$399/month",
    priceId: "price_pro_monthly" // This would be set based on the selected plan
  });

  useEffect(() => {
    // Get plan details from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    
    let priceId = "price_pro_monthly"; // Default
    let name = "Pro";
    let price = "$399/month";
    
    if (plan === 'self-serve') {
      priceId = "price_selfserve_monthly";
      name = "Self-Serve";
      price = "$99/month";
    } else if (plan === 'pilot') {
      priceId = "price_pilot_monthly";
      name = "Pilot";
      price = "$5,000/pilot";
    }
    
    setPlanDetails({ name, price, priceId });

    // Create subscription
    apiRequest("POST", "/api/create-subscription", { 
      email: "user@example.com", // In a real app, this would come from auth
      priceId 
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Error creating subscription:", error);
      });
  }, []);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SubscribeForm planName={planDetails.name} planPrice={planDetails.price} />
        </Elements>
      </div>
    </div>
  );
}
