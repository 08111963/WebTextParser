import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./use-auth";

type SubscriptionPlan = "free" | "premium-monthly" | "premium-yearly" | "unlimited";

type SubscriptionContextType = {
  plan: SubscriptionPlan;
  isPremium: boolean;
  isLoading: boolean;
  // Funzione per verificare se una feature è disponibile nel piano corrente
  canAccess: (feature: string) => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

// Features disponibili per ogni piano
const planFeatures: Record<SubscriptionPlan, string[]> = {
  "free": [
    "basic-meal-tracking",
  ],
  "premium-monthly": [
    "basic-meal-tracking",
    "bmi-calculator",
    "metabolism-calculator",
    "unlimited-meal-history",
    "advanced-meal-suggestions",
    "ai-nutrition-chatbot",
    "goal-tracking",
    "meal-plan-export",
    "premium-support",
    "ai-meal-recommendations",
    "ai-goal-recommendations",
    "api-access"
  ],
  "premium-yearly": [
    "basic-meal-tracking",
    "bmi-calculator",
    "metabolism-calculator",
    "unlimited-meal-history",
    "advanced-meal-suggestions",
    "ai-nutrition-chatbot",
    "goal-tracking",
    "meal-plan-export",
    "premium-support",
    "ai-meal-recommendations",
    "ai-goal-recommendations",
    "api-access"
  ],
  "unlimited": [
    "basic-meal-tracking",
    "bmi-calculator",
    "metabolism-calculator",
    "unlimited-meal-history",
    "advanced-meal-suggestions",
    "ai-nutrition-chatbot",
    "goal-tracking",
    "meal-plan-export",
    "premium-support",
    "ai-meal-recommendations",
    "ai-goal-recommendations",
    "api-access",
    "white-label"
  ]
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Qui in futuro potremmo fare una richiesta API per ottenere
    // lo stato effettivo dell'abbonamento dell'utente
    // Per ora simuliamo che tutti gli utenti sono su piano free
    if (!authLoading) {
      setIsLoading(false);
      // Tutti gli utenti sono su piano free a meno che non abbiano comprato un abbonamento
      setPlan("free");
    }
  }, [user, authLoading]);

  // Funzione per verificare se una feature è disponibile nel piano corrente
  const canAccess = (feature: string): boolean => {
    return planFeatures[plan].includes(feature);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isPremium: plan !== "free",
        isLoading,
        canAccess
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}