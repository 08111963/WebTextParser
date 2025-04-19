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

  // Suggerimenti per pasti
  const {
    data: mealSuggestions,
    isLoading: isLoadingMeals,
    error: mealError,
    refetch: refetchMeals,
  } = useQuery<{ suggestions: MealSuggestion[] }>({
    queryKey: ["/api/recommendations/meals", userId, selectedMealType],
    queryFn: async () => {
      let url = `/api/recommendations/meals?userId=${userId}`;
      if (selectedMealType && selectedMealType !== 'all') {
        url += `&mealType=${selectedMealType}`;
      }
      const res = await apiRequest("GET", url);
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
  
  if (mealError) {
    console.error("Error fetching meal suggestions:", mealError);
  }

  // Funzione per aggiornare le raccomandazioni
  const handleRefresh = async () => {
    try {
      if (activeTab === "goals") {
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
      } else if (activeTab === "meals") {
        toast({
          title: "Aggiornamento",
          description: "Generazione di nuovi suggerimenti in corso...",
        });
        const result = await refetchMeals();
        console.log("Suggerimenti pasti aggiornati:", result.data);
        toast({
          title: "Completato",
          description: "Nuovi suggerimenti generati con successo",
        });
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la generazione. Riprova più tardi.",
        variant: "destructive",
      });
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
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            <span className="font-medium">Idee per Pasti</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoadingMeals}
          >
            {isLoadingMeals ? (
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
              {isLoadingMeals ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                      
                      <p className="text-sm text-muted-foreground mt-2 mb-3 leading-relaxed max-h-24 overflow-y-auto">{meal.description}</p>
                      
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
                    disabled={isLoadingMeals}
                  >
                    {isLoadingMeals ? (
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
      </CardContent>
    </Card>
  );
}