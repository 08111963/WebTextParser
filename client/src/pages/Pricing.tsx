import PricingCard from "@/components/PricingCard";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

// Durata del periodo di prova in giorni
const TRIAL_PERIOD_DAYS = 5;

export default function Pricing() {
  const { trialActive, trialDaysLeft, trialEndDate } = useSubscription();
  
  const pricingData = [
    {
      id: "trial",
      name: "Free Trial",
      description: `${TRIAL_PERIOD_DAYS}-day trial with full premium access`,
      price: {
        monthly: 0,
        yearly: 0,
      },
      badge: trialActive ? `${trialDaysLeft} days left` : "Expired",
      features: [
        { text: "Basic meal tracking", included: true },
        { text: "BMI calculator", included: true },
        { text: "Metabolic rate calculator", included: true },
        { text: "Unlimited meal history", included: true },
        { text: "Advanced meal suggestions", included: true },
        { text: "AI nutrition chatbot", included: true },
        { text: "Goal tracking & analytics", included: true },
        { text: "Meal plan export", included: true },
        { text: "AI Meal Recommendations", included: true },
        { text: "AI Goal Recommendations", included: true },
      ],
    },
    {
      id: "premium-monthly",
      name: "Premium Monthly",
      description: "Enhanced features for dedicated health enthusiasts",
      price: {
        monthly: 3.99,
        yearly: 3.99,
      },
      highlighted: true,
      badge: "Most Popular",
      features: [
        { text: "Basic meal tracking", included: true },
        { text: "BMI calculator", included: true },
        { text: "Metabolic rate calculator", included: true },
        { text: "Unlimited meal history", included: true },
        { text: "Advanced meal suggestions", included: true },
        { text: "AI nutrition chatbot", included: true },
        { text: "Goal tracking & analytics", included: true },
        { text: "Meal plan export", included: true },
        { text: "Premium customer support", included: true },
        { text: "AI Meal Recommendations", included: true },
        { text: "AI Goal Recommendations", included: true },
        { text: "API access", included: true },
      ],
    },
    {
      id: "premium-yearly",
      name: "Premium Annual",
      description: "Same premium features with annual billing",
      price: {
        monthly: 39.99,
        yearly: 39.99,
      },
      badge: "Best Value",
      features: [
        { text: "Basic meal tracking", included: true },
        { text: "BMI calculator", included: true },
        { text: "Metabolic rate calculator", included: true },
        { text: "Unlimited meal history", included: true },
        { text: "Advanced meal suggestions", included: true },
        { text: "AI nutrition chatbot", included: true },
        { text: "Goal tracking & analytics", included: true },
        { text: "Meal plan export", included: true },
        { text: "Premium customer support", included: true },
        { text: "AI Meal Recommendations", included: true },
        { text: "AI Goal Recommendations", included: true },
        { text: "API access", included: true },
      ],
    },
  ];

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="lg" className="mb-6 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </Link>
        
        {trialActive && (
          <div className="mb-6 p-4 border border-primary/30 rounded-lg bg-primary/5">
            <h3 className="text-lg font-medium mb-1">
              Your free trial is active until {trialEndDate ? new Date(trialEndDate).toLocaleDateString() : ''}
            </h3>
            <p className="text-muted-foreground">
              You have {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining with full access to all premium features.
            </p>
          </div>
        )}
      </div>
      <PricingCard pricingData={pricingData} />
    </div>
  );
}