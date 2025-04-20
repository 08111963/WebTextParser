import { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Clock, UserRound } from "lucide-react";
import { useLocation } from "wouter";

// Durata del periodo di prova in giorni
const TRIAL_PERIOD_DAYS = 5;

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
  const { canAccess, trialActive, trialDaysLeft, isPremium } = useSubscription();
  const { user, isLoading: authLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Check if user is authenticated and can access the feature
  // based on their subscription or trial status
  // We allow access only if:
  // 1. User is authenticated AND
  // 2. (Trial period is active OR user has an active premium subscription)
  if (user && (trialActive || isPremium)) {
    return <>{children}</>;
  }
  
  // If we're still waiting for authentication, don't show anything
  if (authLoading) {
    return <div className="p-6 flex justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lock className="w-5 h-5 mr-2 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {trialActive && (
            <div className="flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              <Clock className="w-3 h-3 mr-1" />
              <span>{trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left in trial</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <p className="text-muted-foreground mb-2">{description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="bg-primary/10 text-sm px-3 py-1 rounded-full text-primary font-medium">
                <span className="text-xs mr-1">✓</span> Exclusive Content
              </div>
              <div className="bg-primary/10 text-sm px-3 py-1 rounded-full text-primary font-medium">
                <span className="text-xs mr-1">✓</span> AI Powered
              </div>
              <div className="bg-primary/10 text-sm px-3 py-1 rounded-full text-primary font-medium">
                <span className="text-xs mr-1">✓</span> Personalized
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center h-32 w-32 shrink-0 rounded-full bg-primary/5 text-primary">
            <Sparkles className="h-12 w-12 text-primary/60" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50">
        {!user ? (
          // If user is not authenticated, show login button
          <div className="w-full">
            <p className="text-sm text-center mb-2 text-muted-foreground">
              Register or login to access the {TRIAL_PERIOD_DAYS}-day free trial!
            </p>
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              onClick={() => navigate("/auth?redirect=/")}
            >
              <UserRound className="w-4 h-4 mr-2" />
              Login or Register
            </Button>
          </div>
        ) : trialActive ? (
          // If user is authenticated and trial is active (but can't access for other reasons)
          <div className="w-full">
            <p className="text-sm text-center mb-2 text-muted-foreground">
              Enjoy this premium feature free during your {TRIAL_PERIOD_DAYS}-day trial!
            </p>
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              onClick={() => navigate("/pricing")}
            >
              Upgrade Now
            </Button>
          </div>
        ) : (
          // If trial has expired, show option to unlock premium features
          <Button 
            className="w-full bg-primary hover:bg-primary/90" 
            onClick={() => navigate("/pricing")}
          >
            Unlock Premium Features
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}