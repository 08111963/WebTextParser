import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { RouteComponentProps } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess(props: RouteComponentProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Stati per gestire la verifica del pagamento
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Extract session ID and plan from the URL
  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get('session_id');
  const planId = queryParams.get('plan') || 'premium-monthly';
  
  // Determina se l'utente è loggato o meno
  const { user } = useAuth();
  
  useEffect(() => {
    // Verifica il pagamento solo se c'è un ID sessione e l'utente è autenticato
    if (sessionId && user) {
      // Funzione per verificare il pagamento
      const verifyPayment = async () => {
        setIsVerifying(true);
        try {
          const response = await apiRequest("POST", "/api/verify-payment", {
            sessionId,
            planId
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // Pagamento verificato con successo
            setVerificationSuccess(true);
            toast({
              title: "Subscription Activated",
              description: "Your premium plan has been successfully activated!",
              variant: "default",
            });
          } else {
            // Errore nella verifica del pagamento
            setVerificationSuccess(false);
            setErrorMessage(data.message || "Error verifying payment");
            toast({
              title: "Verification Error",
              description: data.message || "There was an error verifying your payment",
              variant: "destructive",
            });
          }
        } catch (error) {
          // Errore nella richiesta
          setVerificationSuccess(false);
          setErrorMessage("Network error during payment verification");
          toast({
            title: "Connection Error",
            description: "There was a problem connecting to our server",
            variant: "destructive",
          });
        } finally {
          setIsVerifying(false);
        }
      };
      
      // Esegui la verifica del pagamento
      verifyPayment();
    } else if (!user && sessionId) {
      // Se l'utente non è autenticato ma ha un ID sessione, mostro un messaggio
      // ma non posso verificare il pagamento
      setVerificationSuccess(null);
      setErrorMessage("Please login to activate your subscription");
    }
  }, [sessionId, user, planId, toast]);

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            {isVerifying ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : verificationSuccess === true ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : verificationSuccess === false ? (
              <XCircle className="h-16 w-16 text-red-500" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-center">
            {isVerifying ? "Verifying Payment..." : 
             verificationSuccess === true ? "Subscription Activated!" : 
             verificationSuccess === false ? "Verification Issue" : 
             "Payment Received"}
          </CardTitle>
          <CardDescription className="text-center">
            {isVerifying ? "Please wait while we verify your payment" : 
             verificationSuccess === true ? "Thank you for subscribing to NutriEasy Premium" : 
             verificationSuccess === false ? errorMessage || "We couldn't verify your payment" : 
             "Thank you for your payment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!isVerifying && (
            <>
              <p className="text-center text-muted-foreground">
                {verificationSuccess === true ? 
                 "Your subscription has been activated. You now have full access to all premium features." : 
                 verificationSuccess === false ? 
                 "There was a problem activating your subscription. Please contact support if this persists." : 
                 "Your payment has been processed successfully."}
              </p>
              
              <div className="flex flex-col gap-2 items-center">
                {user ? (
                  // Utente già autenticato
                  <Button 
                    onClick={() => navigate("/home")}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  // Utente non autenticato, invita a registrarsi o accedere
                  <Button 
                    onClick={() => navigate("/auth?redirect=/home")}
                    className="w-full"
                  >
                    Login to Activate Your Subscription
                  </Button>
                )}
                
                <Button 
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                >
                  Return to Homepage
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}