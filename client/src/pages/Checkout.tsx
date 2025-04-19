import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { RouteComponentProps } from "wouter";

type CheckoutProps = RouteComponentProps & {
  planId?: string;
};

export default function Checkout(props: RouteComponentProps) {
  // Verifica autenticazione
  const { user, isLoading } = useAuth();
  
  // Extract planId from URL query or use default
  const queryParams = new URLSearchParams(window.location.search);
  const planId = queryParams.get('planId') || "premium-monthly";
  const [error, setError] = useState<string | null>(null);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [_, navigate] = useLocation();
  
  // Reindirizza alla pagina di autenticazione se l'utente non è autenticato
  if (!isLoading && !user) {
    return <Redirect to={`/auth?redirect=/checkout?planId=${planId}`} />;
  }

  useEffect(() => {
    const redirectToStripeCheckout = async () => {
      try {
        console.log("Starting checkout process for plan:", planId);
        
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          planId,
        });
        
        console.log("Server response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          throw new Error(errorData.message || "Failed to create checkout session");
        }
        
        const data = await response.json();
        console.log("Server response data:", data);
        
        // Redirect to Stripe Checkout page
        if (data.url) {
          console.log("Redirecting to Stripe URL:", data.url);
          
          // Prima proviamo ad aprire in una nuova finestra
          const newWindow = window.open(data.url, '_blank');
          
          // Se il blocco popup impedisce l'apertura, forniamo un pulsante per aprire manualmente
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.log("Popup blocked or failed to open. Using fallback.");
            setStripeUrl(data.url);
          }
        } else {
          console.error("No URL in response data");
          throw new Error("No checkout URL returned from the server");
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
        setError("Failed to initialize payment. Please try again later.");
      }
    };

    redirectToStripeCheckout();
  }, [planId]);

  // Mostra errore, URL di Stripe o schermata di caricamento
  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            {error 
              ? "Payment Error" 
              : stripeUrl 
                ? "Checkout Ready" 
                : "Preparing Checkout"
            }
          </CardTitle>
          <CardDescription>
            {error 
              ? "We couldn't initialize the payment process." 
              : stripeUrl 
                ? "Click the button below to continue to secure payment" 
                : "Please wait while we prepare your secure checkout..."
            }
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
          ) : stripeUrl ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <a 
                href={stripeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full">
                  Continue to Secure Checkout
                </Button>
              </a>
              <button 
                onClick={() => navigate("/pricing")}
                className="text-primary hover:underline text-sm"
              >
                Cancel and return to pricing
              </button>
            </div>
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