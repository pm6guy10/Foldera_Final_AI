import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getPricingTier, type PricingTier } from "@shared/pricing";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscribeFormProps {
  plan: PricingTier;
  paymentType: 'subscription' | 'payment';
}

const SubscribeForm = ({ plan, paymentType }: SubscribeFormProps) => {
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
      const successMessage = paymentType === 'subscription' 
        ? `Welcome to Foldera! Your ${plan.name} subscription is now active.`
        : `Welcome to Foldera! Your ${plan.name} payment has been processed.`;
      
      toast({
        title: "Payment Successful",
        description: successMessage,
      });
    }

    setIsProcessing(false);
  };

  const actionText = paymentType === 'subscription' ? 'Subscribe to' : 'Purchase';
  const priceDisplay = plan.period === 'monthly' 
    ? `$${plan.price}/month` 
    : `$${plan.price.toLocaleString()} one-time`;

  return (
    <Card className="max-w-md mx-auto" data-testid="subscribe-form">
      <CardHeader>
        <CardTitle className="text-center">
          {actionText} {plan.name}
        </CardTitle>
        <p className="text-center text-muted-foreground text-lg font-semibold">
          {priceDisplay}
        </p>
        <p className="text-center text-sm text-muted-foreground">
          {plan.description}
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Included Features:</h4>
          <ul className="text-sm space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-muted-foreground">
                <span className="mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isProcessing}
            data-testid="button-subscribe"
          >
            {isProcessing ? "Processing..." : `${actionText} ${plan.name}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [pricingTier, setPricingTier] = useState<PricingTier | null>(null);
  const [paymentType, setPaymentType] = useState<'subscription' | 'payment'>('subscription');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get plan details from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan') || 'pro'; // Default to pro
    
    const plan = getPricingTier(planParam);
    if (!plan) {
      setError(`Invalid plan: ${planParam}`);
      return;
    }
    
    setPricingTier(plan);
    setPaymentType(plan.period === 'monthly' ? 'subscription' : 'payment');

    // Create payment using the new unified endpoint
    apiRequest("POST", "/api/create-payment", { 
      email: "user@example.com", // In a real app, this would come from auth
      plan: planParam
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError('Failed to create payment session');
        }
      })
      .catch((error) => {
        console.error("Error creating payment:", error);
        setError('Failed to initialize payment');
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !pricingTier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">
            Setting up your {paymentType === 'subscription' ? 'subscription' : 'payment'}...
          </p>
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
          <SubscribeForm plan={pricingTier} paymentType={paymentType} />
        </Elements>
      </div>
    </div>
  );
}
