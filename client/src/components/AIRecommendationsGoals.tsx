import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Target, 
  Star,
  CircleCheck,
  Loader2,
} from "lucide-react";

import GoalsChatbotSpecialized from "./GoalsChatbotSpecialized";

type NutritionGoalRecommendation = {
  title: string;
  description: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

type AIRecommendationsGoalsProps = {
  userId: string;
};

export default function AIRecommendationsGoals({ userId }: AIRecommendationsGoalsProps) {
  const { toast } = useToast();
  
  // Raccomandazioni per obiettivi nutrizionali
  const {
    data: nutritionGoalRecommendations,
    isLoading: isLoadingGoals,
    error: goalError,
    refetch: refetchGoals,
  } = useQuery<{ recommendations: NutritionGoalRecommendation[] }>({
    queryKey: ["/api/recommendations/nutrition-goals", userId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/recommendations/nutrition-goals?userId=${userId}`);
      return await res.json();
    },
    enabled: !!userId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Gestione errori
  if (goalError) {
    console.error("Error fetching nutrition goal recommendations:", goalError);
  }

  // Funzione per aggiornare le raccomandazioni
  const handleRefresh = async () => {
    try {
      toast({
        title: "Aggiornamento",
        description: "Generazione di nuove raccomandazioni in corso...",
      });
      const result = await refetchGoals();
      console.log("Raccomandazioni aggiornate:", result.data);
      toast({
        title: "Completato",
        description: "Nuove raccomandazioni generate con successo",
      });
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la generazione. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Raccomandazioni AI per Obiettivi</span>
        </CardTitle>
        <CardDescription>
          Suggerimenti personalizzati per obiettivi nutrizionali basati sul tuo profilo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="font-medium">Obiettivi Nutrizionali</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoadingGoals}
          >
            {isLoadingGoals ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Genera Nuovi
          </Button>
        </div>
          
        <div className="space-y-6">
          <div className="mb-2">
            <GoalsChatbotSpecialized userId={userId} />
          </div>
          
          <div className="border-t pt-6 mt-4">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Obiettivi Nutrizionali Consigliati</span>
            </h3>
            
            <div className="space-y-4">
              {isLoadingGoals ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : nutritionGoalRecommendations?.recommendations && nutritionGoalRecommendations.recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nutritionGoalRecommendations.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-card shadow-sm">
                      <h4 className="font-medium flex items-center gap-2 text-base">
                        <span className="break-words truncate">{rec.title}</span>
                      </h4>
                      
                      <p className="text-sm text-muted-foreground mt-2 mb-3 leading-relaxed max-h-24 overflow-y-auto">{rec.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <div className="flex-1 min-w-24 bg-muted/40 p-2 rounded text-center">
                          <div className="text-xs text-muted-foreground">Cal</div>
                          <div className="text-base md:text-lg font-semibold">{rec.calories}</div>
                          <div className="text-xs">kcal</div>
                        </div>
                        <div className="flex-1 min-w-24 bg-muted/40 p-2 rounded text-center">
                          <div className="text-xs text-muted-foreground">Pro</div>
                          <div className="text-base md:text-lg font-semibold">{rec.proteins}</div>
                          <div className="text-xs">g</div>
                        </div>
                        <div className="flex-1 min-w-24 bg-muted/40 p-2 rounded text-center">
                          <div className="text-xs text-muted-foreground">Carb</div>
                          <div className="text-base md:text-lg font-semibold">{rec.carbs}</div>
                          <div className="text-xs">g</div>
                        </div>
                        <div className="flex-1 min-w-24 bg-muted/40 p-2 rounded text-center">
                          <div className="text-xs text-muted-foreground">Gras</div>
                          <div className="text-base md:text-lg font-semibold">{rec.fats}</div>
                          <div className="text-xs">g</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                          toast({
                            title: "Funzionalità in arrivo",
                            description: "La creazione automatica di obiettivi sarà disponibile presto!",
                          });
                        }}>
                          <CircleCheck className="h-3.5 w-3.5 mr-1" />
                          Usa questo obiettivo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4 mt-4">
                  <div className="rounded-full w-16 h-16 mx-auto bg-muted flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Nessuna raccomandazione disponibile</h3>
                    <p className="text-muted-foreground">
                      Clicca "Genera Nuovi" per ricevere raccomandazioni personalizzate per i tuoi obiettivi nutrizionali.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={handleRefresh} 
                    disabled={isLoadingGoals}
                  >
                    {isLoadingGoals ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Genera Raccomandazioni
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}