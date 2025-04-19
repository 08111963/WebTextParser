import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { differenceInDays, addDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Modificato da "free" a "trial" per meglio rappresentare il periodo di prova
type SubscriptionPlan = "trial" | "premium-monthly" | "premium-yearly" | "unlimited";

type SubscriptionContextType = {
  plan: SubscriptionPlan;
  isPremium: boolean;
  isLoading: boolean;
  trialActive: boolean;
  trialDaysLeft: number;
  trialEndDate: Date | null;
  // Funzione per verificare se una feature è disponibile nel piano corrente
  canAccess: (feature: string) => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

// Durata del periodo di prova in giorni
const TRIAL_PERIOD_DAYS = 5;

// Features disponibili per ogni piano
const planFeatures: Record<SubscriptionPlan, string[]> = {
  "trial": [
    "basic-meal-tracking",
    "bmi-calculator",
    "metabolism-calculator",
    "unlimited-meal-history",
    "advanced-meal-suggestions",
    "ai-nutrition-chatbot",
    "goal-tracking",
    "meal-plan-export",
    "ai-meal-recommendations",
    "ai-goal-recommendations"
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
  const [plan, setPlan] = useState<SubscriptionPlan>("trial");
  const [isLoading, setIsLoading] = useState(true);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(TRIAL_PERIOD_DAYS);
  const [trialActive, setTrialActive] = useState(true);
  
  // Otteniamo lo stato del periodo di prova direttamente dal server
  const { data: trialStatus, isLoading: trialStatusLoading } = useQuery({
    queryKey: ["/api/trial-status"],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await apiRequest("GET", `/api/trial-status`);
        return await res.json();
      } catch (err) {
        console.error("Error fetching trial status:", err);
        return null;
      }
    },
    enabled: !!user,
    // Aggiorniamo lo stato del periodo di prova ogni minuto
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
      
      // Utilizziamo i dati provenienti dal server per lo stato del trial
      if (trialStatus) {
        // Impostiamo lo stato della prova gratuita
        setTrialActive(trialStatus.trialActive);
        setTrialDaysLeft(trialStatus.trialDaysLeft);
        setTrialEndDate(trialStatus.trialEndDate ? new Date(trialStatus.trialEndDate) : null);
        
        // Imposta il piano in base allo stato della prova
        // In una versione reale, controlleremmo se l'utente ha acquistato un abbonamento
        setPlan(trialStatus.trialActive ? "trial" : "trial"); // Manteniamo "trial" anche dopo la scadenza per la demo
      } else {
        // Fallback in caso di errore nella chiamata API
        setTrialActive(true);
        setTrialDaysLeft(TRIAL_PERIOD_DAYS);
        const today = new Date();
        const fallbackEndDate = addDays(today, TRIAL_PERIOD_DAYS);
        setTrialEndDate(fallbackEndDate);
        setPlan("trial");
      }
    }
  }, [user, authLoading, trialStatus]);

  // Funzione per verificare se una feature è disponibile nel piano corrente
  const canAccess = (feature: string): boolean => {
    // Durante il periodo di prova, tutte le funzionalità premium sono disponibili
    return planFeatures[plan].includes(feature);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isPremium: plan !== "trial" || trialActive, // Durante il trial consideriamo l'utente come premium
        isLoading,
        trialActive,
        trialDaysLeft,
        trialEndDate,
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