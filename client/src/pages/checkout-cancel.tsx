import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";

export default function CheckoutCancel() {
  const [location] = useLocation();
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    setTier(params.get('tier'));
  }, [location]);

  const getTierDetails = (tierNum: string | null) => {
    switch (tierNum) {
      case '99':
        return { name: 'Tier 99', price: '$99', description: 'Entry level tier' };
      case '199':
        return { name: 'Tier 199', price: '$199', description: 'Professional tier' };
      case '299':
        return { name: 'Tier 299', price: '$299', description: 'Premium tier' };
      default:
        return { name: 'Premium Plan', price: 'N/A', description: 'Enterprise tier' };
    }
  };

  const tierDetails = getTierDetails(tier);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full text-center" data-testid="checkout-cancel">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-orange-600">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-card/30 rounded-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">No charges were made</h3>
            <p className="text-muted-foreground">
              Your payment for <strong>{tierDetails.name}</strong> ({tierDetails.price}/month) was cancelled. 
              You have not been charged and no subscription was created.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Why did this happen?</h4>
            <ul className="text-left text-sm space-y-1 text-muted-foreground">
              <li>• You clicked the back button or closed the payment window</li>
              <li>• Your payment method was declined</li>
              <li>• The session timed out</li>
              <li>• You decided not to complete the purchase</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="w-full sm:w-auto" 
              onClick={() => window.location.href = `/api/checkout?tier=${tier}`}
              data-testid="button-retry-payment"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Try Payment Again
            </Button>
            
            <Link href="/#pricing">
              <Button variant="outline" className="w-full sm:w-auto" data-testid="button-view-pricing">
                View All Plans
              </Button>
            </Link>
          </div>

          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Need Help?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              If you're experiencing payment issues or have questions about our plans, we're here to help.
            </p>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" data-testid="button-contact-support">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Questions? Email us at{" "}
              <a href="mailto:support@foldera.com" className="text-primary hover:underline">
                support@foldera.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}