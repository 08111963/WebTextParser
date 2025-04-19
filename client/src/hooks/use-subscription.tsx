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
  
  // In un'applicazione reale, questi dati proverrebbero dal database
  // Per ora, simuliamo che ogni utente ha un periodo di prova di 5 giorni dalla data di registrazione
  const { data: userProfile } = useQuery({
    queryKey: ["/api/user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await apiRequest("GET", `/api/user-profile?userId=${user.id}`);
        return await res.json();
      } catch (err) {
        return null;
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
      
      // In una versione reale, verificheremmo il piano dell'utente dal database
      // Per ora, assumiamo che tutti gli utenti iniziano con un periodo di prova
      
      // Simuliamo la data di registrazione come la data di creazione del profilo o oggi
      const registrationDate = userProfile?.createdAt 
        ? new Date(userProfile.createdAt) 
        : new Date();
      
      // Calcoliamo la data di fine prova (5 giorni dopo la registrazione)
      const calculatedTrialEndDate = addDays(registrationDate, TRIAL_PERIOD_DAYS);
      setTrialEndDate(calculatedTrialEndDate);
      
      // Calcoliamo i giorni rimanenti di prova
      const today = new Date();
      const daysLeft = differenceInDays(calculatedTrialEndDate, today);
      setTrialDaysLeft(Math.max(0, daysLeft));
      
      // Determiniamo se la prova è ancora attiva
      const isTrialActive = daysLeft > 0;
      setTrialActive(isTrialActive);
      
      // Imposta il piano in base allo stato della prova
      // In una versione reale, controlleremmo se l'utente ha acquistato un abbonamento
      setPlan(isTrialActive ? "trial" : "trial"); // Manteniamo "trial" anche dopo la scadenza per la demo
    }
  }, [user, authLoading, userProfile]);

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