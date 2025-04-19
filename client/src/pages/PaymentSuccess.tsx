import { useEffect, useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Link, RouteComponentProps } from "wouter";

export default function PaymentSuccess(props: RouteComponentProps) {
  const [status, setStatus] = useState<"processing" | "succeeded" | "failed">("processing");
  const [message, setMessage] = useState<string>("");
  const stripe = useStripe();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the "payment_intent_client_secret" query parameter from the URL
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      setStatus("failed");
      setMessage("Payment verification failed. No payment information found.");
      return;
    }

    stripe.retrievePaymentIntent(clientSecret)
      .then(({ paymentIntent }) => {
        if (!paymentIntent) {
          setStatus("failed");
          setMessage("Payment information could not be retrieved.");
          return;
        }

        switch (paymentIntent.status) {
          case "succeeded":
            setStatus("succeeded");
            setMessage("Payment successful! Thank you for your purchase.");
            break;
          case "processing":
            setStatus("processing");
            setMessage("Your payment is processing.");
            break;
          default:
            setStatus("failed");
            setMessage(`Payment failed. Please try again. ${paymentIntent.last_payment_error?.message || ""}`);
            break;
        }
      })
      .catch((err) => {
        setStatus("failed");
        setMessage("An error occurred while verifying your payment.");
        console.error(err);
      });
  }, [stripe]);

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {status === "processing" ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : status === "succeeded" ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-xl font-bold">!</span>
              </div>
            )}
          </div>
          <CardTitle className="text-center">{
            status === "processing" 
              ? "Processing Payment" 
              : status === "succeeded" 
                ? "Payment Successful" 
                : "Payment Failed"
          }</CardTitle>
          <CardDescription className="text-center">
            {status === "processing" 
              ? "Please wait while we confirm your payment..."
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/home">
            <Button>
              {status === "succeeded" ? "Go to Dashboard" : "Return Home"}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}