import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { RouteComponentProps } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function PaymentSuccess(props: RouteComponentProps) {
  const [_, navigate] = useLocation();
  
  // Extract session ID from the URL
  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get('session_id');
  
  useEffect(() => {
    // Log session ID for debugging
    if (sessionId) {
      console.log("Payment successful with session ID:", sessionId);
    }
  }, [sessionId]);
  
  // Determina se l'utente è loggato o meno
  const { user } = useAuth();

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center">Payment Successful!</CardTitle>
          <CardDescription className="text-center">
            Thank you for subscribing to NutriEasy Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            Your subscription has been activated. You now have access to all premium features.
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
                Login or Register to Access Dashboard
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
        </CardContent>
      </Card>
    </div>
  );
}