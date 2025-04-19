import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

import { RouteComponentProps } from "wouter";

type CheckoutProps = RouteComponentProps & {
  planId?: string;
};

export default function Checkout(props: RouteComponentProps) {
  // Extract planId from URL query or use default
  const queryParams = new URLSearchParams(window.location.search);
  const planId = queryParams.get('planId') || "premium-monthly";
  const [error, setError] = useState<string | null>(null);
  const [_, navigate] = useLocation();

  useEffect(() => {
    const redirectToStripeCheckout = async () => {
      try {
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
      }
    };

    redirectToStripeCheckout();
  }, [planId]);

  // Mostra solo la schermata di loading o di errore
  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{error ? "Payment Error" : "Redirecting to Payment"}</CardTitle>
          <CardDescription>
            {error ? "We couldn't initialize the payment process." : "You're being redirected to the secure payment page..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={() => navigate("/pricing")}
                className="text-primary hover:underline"
              >
                Return to pricing
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Preparing secure checkout...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}