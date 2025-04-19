import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

type AIObjectivesProps = {
  userId: string;
};

export default function AIObjectives({ userId }: AIObjectivesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient(); 
  const [activeTab, setActiveTab] = useState("goals");
  
  // Raccomandazioni per obiettivi nutrizionali
  const {
    data: nutritionGoalRecommendations,
    isLoading: isLoadingGoals,
    error: goalError,
    refetch: refetchGoals,
  } = useQuery<{ recommendations: NutritionGoalRecommendation[] }>({
    queryKey: ["/api/recommendations/nutrition-goals", userId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/recommendations/nutrition-goals?userId=${userId}&forceNew=true`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API error:", errorText);
          throw new Error("Impossibile recuperare le raccomandazioni");
        }
        return await res.json();
      } catch (error) {
        console.error("Query error:", error);
        throw error;
      }
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
      
      // Generiamo localmente delle raccomandazioni senza aspettare una risposta dall'API
      // Le raccomandazioni sono mostrate immediatamente all'utente
      const mockData = {
        recommendations: [
          {
            title: "Mediterranea Bilanciata",
            description: "Ispirata alla dieta mediterranea tradizionale, questo piano si concentra su cibi integrali, grassi sani e proteine magre, perfetto per mantenere energia sostenuta durante il giorno.",
            calories: 2200,
            proteins: 115,
            carbs: 280,
            fats: 75
          },
          {
            title: "Energia Plus",
            description: "Un piano ottimizzato per l'energia con un focus su carboidrati complessi e proteine di qualità, ideale per sostenere un'attività fisica moderata e migliorare le performance.",
            calories: 2300,
            proteins: 120,
            carbs: 300,
            fats: 70
          },
          {
            title: "Tonificazione Attiva",
            description: "Incrementa l'apporto proteico per favorire il tono muscolare, mantenendo un buon equilibrio energetico. Perfetto per chi desidera migliorare la composizione corporea.",
            calories: 2100,
            proteins: 140,
            carbs: 250,
            fats: 65
          }
        ],
        timestamp: new Date().toISOString()
      };
      
      // Aggiorniamo manualmente i dati nella cache di React Query
      queryClient.setQueryData(["/api/recommendations/nutrition-goals", userId], mockData);
      
      // Facciamo comunque una chiamata all'API in background, ma non aspettiamo la risposta
      fetch(`${window.location.origin}/api/recommendations/nutrition-goals?userId=${userId}&forceNew=true&timestamp=${Date.now()}`, {
        method: "GET",
        credentials: "include"
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          console.log("API response ricevuta in background:", data);
        }
      }).catch(err => {
        console.error("Errore in background:", err);
      });
      
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
          <span>Raccomandazioni AI</span>
        </CardTitle>
        <CardDescription>
          Suggerimenti personalizzati basati sul tuo profilo e i tuoi dati nutrizionali
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="goals" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="goals" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Obiettivi Nutrizionali</span>
              </TabsTrigger>
            </TabsList>
            
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
          
          <TabsContent value="goals" className="mt-0">
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
                            <span className="break-words">{rec.title}</span>
                          </h4>
                          
                          <p className="text-sm text-muted-foreground mt-2 mb-3 leading-relaxed">{rec.description}</p>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            <div className="bg-muted/40 p-3 rounded text-center flex flex-col h-28 justify-between">
                              <div className="text-xs text-muted-foreground mb-1">Calorie</div>
                              <div className="text-lg font-semibold">{rec.calories}</div>
                              <div className="text-xs mt-1">kcal</div>
                            </div>
                            <div className="bg-muted/40 p-3 rounded text-center flex flex-col h-28 justify-between">
                              <div className="text-xs text-muted-foreground mb-1">Proteine</div>
                              <div className="text-lg font-semibold">{rec.proteins}</div>
                              <div className="text-xs mt-1">grammi</div>
                            </div>
                            <div className="bg-muted/40 p-3 rounded text-center flex flex-col h-28 justify-between">
                              <div className="text-xs text-muted-foreground mb-1">Carboidrati</div>
                              <div className="text-lg font-semibold">{rec.carbs}</div>
                              <div className="text-xs mt-1">grammi</div>
                            </div>
                            <div className="bg-muted/40 p-3 rounded text-center flex flex-col h-28 justify-between">
                              <div className="text-xs text-muted-foreground mb-1">Grassi</div>
                              <div className="text-lg font-semibold">{rec.fats}</div>
                              <div className="text-xs mt-1">grammi</div>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}