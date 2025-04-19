import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { RouteComponentProps } from "wouter";

export default function PaymentSuccess(props: RouteComponentProps) {
  const [_, navigate] = useLocation();
  
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
            <Button 
              onClick={() => navigate("/")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={() => navigate("/profile")}
              variant="outline"
              className="w-full"
            >
              View Subscription Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}