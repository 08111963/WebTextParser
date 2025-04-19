import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";

type PremiumFeatureProps = {
  children: ReactNode;
  feature: string;
  title: string;
  description: string;
};

export default function PremiumFeature({ 
  children, 
  feature,
  title,
  description 
}: PremiumFeatureProps) {
  const { canAccess, isPremium } = useSubscription();
  const [_, navigate] = useLocation();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center">
          <Lock className="w-5 h-5 mr-2 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="bg-primary/5 rounded-md p-4 blur-sm pointer-events-none">
          {children}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => navigate("/pricing")}
        >
          Upgrade to Premium
        </Button>
      </CardFooter>
    </Card>
  );
}