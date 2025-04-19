import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  Utensils,
  Star,
  Scale,
  CircleCheck,
  Loader2,
  Coffee,
  UtensilsCrossed,
  Cookie,
  MessageCircle
} from "lucide-react";

import GoalsChatbotSpecialized from "./GoalsChatbotSpecialized";
import MealsChatbotSpecialized from "./MealsChatbotSpecialized";

type NutritionGoalRecommendation = {
  title: string;
  description: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

type MealSuggestion = {
  name: string;
  description: string;
  mealType: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

// Mappa le tipologie di pasto in italiano
const mealTypeMap: Record<string, string> = {
  "colazione": "Colazione",
  "pranzo": "Pranzo",
  "cena": "Cena",
  "spuntino": "Spuntino",
};

// Icone per le tipologie di pasto
const mealTypeIcons: Record<string, React.ReactNode> = {
  "colazione": <Coffee className="h-4 w-4" />,
  "pranzo": <UtensilsCrossed className="h-4 w-4" />,
  "cena": <Utensils className="h-4 w-4" />,
  "spuntino": <Cookie className="h-4 w-4" />,
};

type AIRecommendationsProps = {
  userId: string;
};

export default function AIRecommendations({ userId }: AIRecommendationsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("goals");
  const [selectedMealType, setSelectedMealType] = useState<string>("all");
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
      const res = await apiRequest("GET", `/api/recommendations/nutrition-goals?userId=${userId}`);
      return await res.json();
    },
    enabled: !!userId && isUserAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Suggerimenti per pasti
  const {
    data: mealSuggestions,
    isLoading: isLoadingMeals,
    error: mealError,
    refetch: refetchMeals,
  } = useQuery<{ suggestions: MealSuggestion[] }>({
    queryKey: ["/api/recommendations/meals", userId, selectedMealType],
    queryFn: async () => {
      try {
        let url = `/api/recommendations/meals?userId=${userId}`;
        if (selectedMealType && selectedMealType !== 'all') {
          url += `&mealType=${selectedMealType}`;
        }
        // url += `&forceNew=true`; // Forza sempre nuove generazioni
        console.log("Fetching meal suggestions from:", url);
        const res = await apiRequest("GET", url);
        const data = await res.json();
        console.log("Meal suggestions response:", data);
        
        // Debug avanzato
        if (data?.suggestions) {
          console.log("Numero di suggerimenti ricevuti:", data.suggestions.length);
          data.suggestions.forEach((sugg: any, i: number) => {
            console.log(`Suggerimento ${i+1}:`, sugg.name, sugg.mealType);
          });
        } else {
          console.warn("Formato risposta non valido:", data);
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching meal suggestions:", error);
        return { suggestions: [] };
      }
    },
    enabled: !!userId && isUserAuthenticated,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Gestione errori
  if (goalError) {
    console.error("Error fetching nutrition goal recommendations:", goalError);
  }
  
  if (mealError) {
    console.error("Error fetching meal suggestions:", mealError);
  }

  // Stato locale per il caricamento manuale
  const [isManualLoading, setIsManualLoading] = useState(false);

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
      // Imposta manualmente lo stato di caricamento
      setIsManualLoading(true);
      
      // Mostra un toast con caricamento in corso
      toast({
        title: "Generazione in corso",
        description: "Stiamo creando nuovi suggerimenti personalizzati in base al tuo profilo",
        duration: 60000, // Lungo a sufficienza per il caricamento completo
      });
      
      // Aggiungiamo timestamp unico e forzaNew=true direttamente nella chiamata API
      const timestamp = new Date().getTime();
      let url = `/api/recommendations/meals?userId=${userId}&forceNew=true&ts=${timestamp}`;
      if (selectedMealType && selectedMealType !== 'all') {
        url += `&mealType=${selectedMealType}`;
      }
      
      console.log("Richiesta generazione nuovi pasti:", url);
      
      // Disabilita temporaneamente la cache per questa richiesta
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        credentials: "same-origin"
      });
      
      if (!res.ok) {
        throw new Error(`Errore durante il fetch: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Nuovi pasti generati:", data);
      
      // Assicuriamoci che ci siano suggerimenti validi
      if (!data.suggestions || data.suggestions.length === 0) {
        throw new Error("Nessun suggerimento ricevuto dall'API");
      }
      
      // Forza l'aggiornamento dei dati con il risultato appena ottenuto
      // Questo usa TanStack Query per aggiornare la cache
      queryClient.setQueryData(["/api/recommendations/meals", userId, selectedMealType], data);
      
      // Invalida esplicitamente la query per forzare un refresh completo
      await queryClient.invalidateQueries({
        queryKey: ["/api/recommendations/meals", userId, selectedMealType]
      });
      
      // Mostra il toast di completamento
      toast({
        title: "Completato",
        description: `${data.suggestions?.length || 0} nuovi suggerimenti generati con successo`,
      });
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la generazione. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      // Imposta lo stato di caricamento a false indipendentemente dal risultato
      setIsManualLoading(false);
    }
  };

  // Cambia tipo di pasto e aggiorna i suggerimenti
  const handleMealTypeChange = (value: string) => {
    setSelectedMealType(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Raccomandazioni AI Personalizzate</span>
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
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <span className="font-medium">Idee per Pasti</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isLoadingMeals || isManualLoading}
              >
                {(isLoadingMeals || isManualLoading) ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Genera Nuovi
              </Button>
            </div>
              
            <div className="space-y-6">
              <div className="mb-2">
                <MealsChatbotSpecialized userId={userId} />
              </div>
          
          <div className="border-t pt-6 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <span>Suggerimenti Pasti Personalizzati</span>
              </h3>
              
              <Select value={selectedMealType} onValueChange={handleMealTypeChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo di pasto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i pasti</SelectItem>
                  <SelectItem value="colazione">Colazione</SelectItem>
                  <SelectItem value="pranzo">Pranzo</SelectItem>
                  <SelectItem value="cena">Cena</SelectItem>
                  <SelectItem value="spuntino">Spuntino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              {isLoadingMeals || isManualLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-center max-w-md">
                    Creazione di nuovi suggerimenti intelligenti in corso...
                  </p>
                </div>
              ) : mealSuggestions?.suggestions && mealSuggestions.suggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mealSuggestions.suggestions.map((meal, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-card shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-base">{meal.name}</h4>
                        <Badge className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap" variant="outline">
                          {mealTypeIcons[meal.mealType.toLowerCase()] || <Utensils className="h-3 w-3" />}
                          {mealTypeMap[meal.mealType.toLowerCase()] || meal.mealType}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 mb-3">
                        <p className="text-sm text-muted-foreground leading-relaxed min-h-[5rem] overflow-auto max-h-[8rem] border border-gray-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                          {meal.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{meal.calories} kcal</Badge>
                        <Badge variant="outline" className="bg-red-100/10">P: {meal.proteins}g</Badge>
                        <Badge variant="outline" className="bg-green-100/10">C: {meal.carbs}g</Badge>
                        <Badge variant="outline" className="bg-yellow-100/10">G: {meal.fats}g</Badge>
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                          toast({
                            title: "Funzionalità in arrivo",
                            description: "L'aggiunta automatica di pasti sarà disponibile presto!",
                          });
                        }}>
                          <ArrowRight className="h-3.5 w-3.5 mr-1" />
                          Aggiungi pasto
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4 mt-4">
                  <div className="rounded-full w-16 h-16 mx-auto bg-muted flex items-center justify-center">
                    <Utensils className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Nessun suggerimento disponibile</h3>
                    <p className="text-muted-foreground">
                      Clicca "Genera Nuovi" per ricevere suggerimenti personalizzati per i tuoi pasti.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={handleRefresh} 
                    disabled={isLoadingMeals || isManualLoading}
                  >
                    {(isLoadingMeals || isManualLoading) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Genera Suggerimenti
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}