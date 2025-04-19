import { useState } from "react";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
};

type PricingCardProps = {
  pricingData: PricingTier[];
};

export default function PricingCard({ pricingData }: PricingCardProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const toggleBillingCycle = () => {
    setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly");
  };

  const getYearlySavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const yearlyCost = yearly;
    const savings = monthlyCost - yearlyCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return percentage;
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col items-center mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Transparent Pricing</h2>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Choose the perfect plan for your nutrition needs. All plans include core features.
        </p>
        
        <div className="flex items-center justify-center mt-8 space-x-2">
          <Label htmlFor="billing-switch" className={billingCycle === "monthly" ? "font-semibold" : ""}>Monthly</Label>
          <Switch
            id="billing-switch"
            checked={billingCycle === "yearly"}
            onCheckedChange={toggleBillingCycle}
          />
          <Label htmlFor="billing-switch" className={billingCycle === "yearly" ? "font-semibold" : ""}>
            Yearly
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
              Save up to 25%
            </Badge>
          </Label>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    ${billingCycle === "monthly" ? tier.price.monthly : tier.price.yearly}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                
                {billingCycle === "yearly" && (
                  <p className="mt-1 text-sm text-green-600">
                    Save {getYearlySavings(tier.price.monthly, tier.price.yearly)}%
                  </p>
                )}
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
              >
                Get Started
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}