import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, ArrowRight } from "lucide-react";

export default function CheckoutSuccess() {
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    setSessionId(params.get('session_id'));
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
      <Card className="max-w-2xl w-full text-center" data-testid="checkout-success">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-card/30 rounded-lg p-6 border">
            <h3 className="text-xl font-semibold mb-2">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-muted-foreground">Plan</p>
                <p className="font-medium">{tierDetails.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Price</p>
                <p className="font-medium">{tierDetails.price}/month</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Session ID</p>
                <p className="font-mono text-sm break-all">{sessionId || 'Loading...'}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">What's Next?</h4>
            <ul className="text-left text-sm space-y-1 text-muted-foreground">
              <li>• You'll receive a confirmation email shortly</li>
              <li>• Your subscription is now active</li>
              <li>• Access to all Foldera features is enabled</li>
              <li>• Billing will occur monthly on this date</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/documents">
              <Button className="w-full sm:w-auto" data-testid="button-access-dashboard">
                <ArrowRight className="h-4 w-4 mr-2" />
                Access Your Dashboard
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-download-receipt">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team at{" "}
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