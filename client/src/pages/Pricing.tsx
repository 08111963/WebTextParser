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

export default function Pricing() {
  return (
    <div className="py-8">
      <PricingCard pricingData={pricingData} />
    </div>
  );
}