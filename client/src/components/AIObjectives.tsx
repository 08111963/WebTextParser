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
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(userId !== "0");
  
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
    enabled: !!userId && isUserAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Gestione errori
  if (goalError) {
    console.error("Error fetching nutrition goal recommendations:", goalError);
  }

  // Funzione per aggiornare le raccomandazioni
  const handleRefresh = async () => {
    // Se l'utente non è autenticato, mostra messaggio di login
    if (!isUserAuthenticated) {
      toast({
        title: "Autenticazione richiesta",
        description: "Per utilizzare le raccomandazioni AI personalizzate è necessario accedere o registrarsi.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Aggiornamento",
        description: "Generazione di nuove raccomandazioni in corso...",
      });

      // Facciamo una chiamata diretta all'API per generare nuove raccomandazioni
      const res = await apiRequest("GET", `/api/recommendations/nutrition-goals?userId=${userId}&forceNew=true&timestamp=${Date.now()}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API refresh error:", errorText);
        throw new Error("Impossibile recuperare le raccomandazioni");
      }
      
      const data = await res.json();
      console.log("Raccomandazioni generate dall'API:", data);
      
      // Assicuriamoci che ci siano raccomandazioni valide
      if (!data.recommendations || data.recommendations.length === 0) {
        throw new Error("Nessuna raccomandazione ricevuta dall'API");
      }
      
      // Aggiorniamo la cache di React Query con i risultati reali dall'API
      queryClient.setQueryData(["/api/recommendations/nutrition-goals", userId], data);
      
      // Proviamo anche con una invalidazione esplicita della query per forzare un refresh
      await queryClient.invalidateQueries({
        queryKey: ["/api/recommendations/nutrition-goals", userId]
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
      
      // In caso di errore, forziamo un refresh della UI
      queryClient.invalidateQueries({
        queryKey: ["/api/recommendations/nutrition-goals", userId]
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
        {!isUserAuthenticated ? (
          <div className="text-center py-10 border rounded-lg">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Attiva Raccomandazioni Personalizzate</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Accedi o registrati per sbloccare raccomandazioni personalizzate basate sul tuo profilo e sui tuoi obiettivi nutrizionali.
            </p>
            <Button onClick={() => {
              toast({
                title: "Autenticazione richiesta",
                description: "Per utilizzare le raccomandazioni AI personalizzate è necessario accedere o registrarsi.",
                duration: 5000
              });
            }}>
              Accedi per Sbloccare
            </Button>
          </div>
        ) : (
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
                  <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <span>Obiettivi Nutrizionali Consigliati</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {isLoadingGoals ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : nutritionGoalRecommendations?.recommendations && nutritionGoalRecommendations.recommendations.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {nutritionGoalRecommendations.recommendations.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-6 bg-card shadow-sm">
                            <h4 className="font-medium text-xl mb-3">
                              {rec.title}
                            </h4>
                            
                            <p className="text-base text-muted-foreground mb-5 leading-relaxed border border-gray-200 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
                              {rec.description}
                            </p>
                            
                            <div className="grid grid-cols-4 gap-4 mt-4">
                              <div className="border rounded-lg p-4 text-center">
                                <div className="text-2xl font-medium">{rec.calories}</div>
                                <div className="text-sm text-muted-foreground">kcal</div>
                              </div>
                              <div className="border rounded-lg p-4 text-center bg-red-50 dark:bg-red-900/10">
                                <div className="text-2xl font-medium">{rec.proteins}</div>
                                <div className="text-sm text-muted-foreground">Proteine (g)</div>
                              </div>
                              <div className="border rounded-lg p-4 text-center bg-green-50 dark:bg-green-900/10">
                                <div className="text-2xl font-medium">{rec.carbs}</div>
                                <div className="text-sm text-muted-foreground">Carboidrati (g)</div>
                              </div>
                              <div className="border rounded-lg p-4 text-center bg-yellow-50 dark:bg-yellow-900/10">
                                <div className="text-2xl font-medium">{rec.fats}</div>
                                <div className="text-sm text-muted-foreground">Grassi (g)</div>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" className="text-sm" onClick={() => {
                                toast({
                                  title: "Funzionalità in arrivo",
                                  description: "La creazione automatica di obiettivi sarà disponibile presto!",
                                });
                              }}>
                                <CircleCheck className="h-4 w-4 mr-2" />
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
        )}
      </CardContent>
    </Card>
  );
}