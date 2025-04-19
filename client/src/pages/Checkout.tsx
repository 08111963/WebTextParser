import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CheckoutForm from "@/components/CheckoutForm";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Create a function to check if the Stripe key is available
const checkStripeKey = () => {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    throw new Error("Missing Stripe public key. Please set VITE_STRIPE_PUBLIC_KEY environment variable.");
  }
  return import.meta.env.VITE_STRIPE_PUBLIC_KEY;
};

// Initialize Stripe outside of the component
let stripePromise: ReturnType<typeof loadStripe> | null = null;
try {
  const key = checkStripeKey();
  stripePromise = loadStripe(key);
} catch (e) {
  console.error(e);
  // We'll handle this error in the component
}

type CheckoutProps = {
  planId?: string;
};

export default function Checkout({ planId = "premium" }: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [_, navigate] = useLocation();

  useEffect(() => {
    if (!stripePromise) {
      setError("Stripe is not properly configured. Missing public key.");
      setLoading(false);
      return;
    }

    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          planId,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment intent");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        setError("Failed to initialize payment. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
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