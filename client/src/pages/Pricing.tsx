import PricingCard from "@/components/PricingCard";

const pricingData = [
  {
    id: "free",
    name: "Free",
    description: "Basic nutrition tracking for individuals",
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      { text: "Basic meal tracking", included: true },
      { text: "BMI calculator", included: true },
      { text: "Metabolic rate calculator", included: true },
      { text: "Limited meal history (15 days)", included: true },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Enhanced features for dedicated health enthusiasts",
    price: {
      monthly: 3.99,
      yearly: 339.99,
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
    id: "unlimited",
    name: "Unlimited",
    description: "Complete solution for professional nutrition management",
    price: {
      monthly: 19.99,
      yearly: 179.99,
    },
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
      { text: "API access", included: true },
      { text: "White-label options", included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <div className="py-8">
      <PricingCard pricingData={pricingData} />
    </div>
  );
}