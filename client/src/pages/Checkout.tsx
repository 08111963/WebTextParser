import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CheckoutForm from "@/components/CheckoutForm";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { STRIPE_PUBLIC_KEY } from "@/lib/stripe-config";

// Initialize Stripe outside of the component
// Nota: Utilizziamo la chiave pubblica (pk_) dal file di configurazione
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

import { RouteComponentProps } from "wouter";

type CheckoutProps = RouteComponentProps & {
  planId?: string;
};

export default function Checkout(props: RouteComponentProps) {
  // Extract planId from URL query or use default
  const queryParams = new URLSearchParams(window.location.search);
  const planId = queryParams.get('planId') || "premium-monthly";
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [_, navigate] = useLocation();

  useEffect(() => {
    const redirectToStripeCheckout = async () => {
      try {
        setLoading(true);
        
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          planId,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create checkout session");
        }
        
        const data = await response.json();
        
        // Redirect to Stripe Checkout page
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned from the server");
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
        setError("Failed to initialize payment. Please try again later.");
        setLoading(false);
      }
    };

    redirectToStripeCheckout();
  }, [planId]);

  if (error) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Payment Error</CardTitle>
            <CardDescription>
              We couldn't initialize the payment process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => navigate("/pricing")}
              className="text-primary hover:underline"
            >
              Return to pricing
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
          <CardDescription>
            Enter your payment details to complete your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stripePromise && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}