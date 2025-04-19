import { Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type PricingTier = {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    text: string;
    included: boolean;
  }[];
  highlighted?: boolean;
  badge?: string;
  buttonText?: string;
  disableButton?: boolean;
};

type PricingCardProps = {
  pricingData: PricingTier[];
};

export default function PricingCard({ pricingData }: PricingCardProps) {
  const [_, navigate] = useLocation();
  const { user } = useAuth();

  const handleGetStarted = (planId: string) => {
    // Se l'utente non è autenticato, reindirizza alla pagina di login/registrazione
    // con un parametro che indica dove tornare dopo l'autenticazione
    if (!user) {
      navigate(`/auth?redirect=/checkout?planId=${planId}`);
    } else {
      // Se l'utente è già autenticato, procedi direttamente al checkout
      navigate(`/checkout?planId=${planId}`);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col items-center mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Transparent Pricing</h2>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Choose the perfect plan for your nutrition needs. All plans include core features.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {pricingData.map((tier) => (
          <Card 
            key={tier.id} 
            className={`flex flex-col ${tier.highlighted ? 'border-primary shadow-md' : ''}`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </div>
                {tier.badge && (
                  <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/20">
                    {tier.badge}
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">
                    ${tier.price.monthly}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    {tier.id === "premium-yearly" ? "/year" : tier.id === "free" ? "" : "/month"}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span className={!feature.included ? "text-muted-foreground" : ""}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="pt-4">
              <Button
                className={`w-full ${tier.highlighted ? 'bg-primary hover:bg-primary/90' : 'bg-card hover:bg-muted'}`}
                variant={tier.highlighted ? "default" : "outline"}
                onClick={() => handleGetStarted(tier.id)}
                disabled={tier.disableButton}
              >
                {tier.buttonText || (tier.id === 'free' ? 'Start Free' : 'Subscribe Now')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}