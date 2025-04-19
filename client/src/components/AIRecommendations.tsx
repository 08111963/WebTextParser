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

// Map meal types in English
const mealTypeMap: Record<string, string> = {
  "colazione": "Breakfast",
  "pranzo": "Lunch",
  "cena": "Dinner",
  "spuntino": "Snack",
};

// Icons for meal types
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

  // Local state for manual loading
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Function to update recommendations
  const handleRefresh = async () => {
    // If user is not authenticated, show login message
    if (!isUserAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "To use personalized AI recommendations, you need to sign in or register.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Manually set loading state
      setIsManualLoading(true);
      
      // Show a toast with loading progress
      toast({
        title: "Generation in Progress",
        description: "We're creating new personalized suggestions based on your profile",
        duration: 60000, // Long enough for complete loading
      });
      
      // Add unique timestamp and forceNew=true directly in the API call
      const timestamp = new Date().getTime();
      let url = `/api/recommendations/meals?userId=${userId}&forceNew=true&ts=${timestamp}`;
      if (selectedMealType && selectedMealType !== 'all') {
        url += `&mealType=${selectedMealType}`;
      }
      
      console.log("Requesting new meal generation:", url);
      
      // Temporarily disable cache for this request
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
        throw new Error(`Error during fetch: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("New meals generated:", data);
      
      // Make sure there are valid suggestions
      if (!data.suggestions || data.suggestions.length === 0) {
        throw new Error("No suggestions received from the API");
      }
      
      // Force data update with the newly obtained result
      // This uses TanStack Query to update the cache
      queryClient.setQueryData(["/api/recommendations/meals", userId, selectedMealType], data);
      
      // Explicitly invalidate the query to force a complete refresh
      await queryClient.invalidateQueries({
        queryKey: ["/api/recommendations/meals", userId, selectedMealType]
      });
      
      // Show completion toast
      toast({
        title: "Completed",
        description: `${data.suggestions?.length || 0} new suggestions successfully generated`,
      });
    } catch (error) {
      console.error("Error during update:", error);
      toast({
        title: "Error",
        description: "An error occurred during generation. Please try again later.",
        variant: "destructive",
      });
    } finally {
      // Set loading state to false regardless of result
      setIsManualLoading(false);
    }
  };

  // Change meal type and update suggestions
  const handleMealTypeChange = (value: string) => {
    setSelectedMealType(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Personalized AI Recommendations</span>
        </CardTitle>
        <CardDescription>
          Custom suggestions based on your profile and nutritional data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isUserAuthenticated ? (
          <div className="text-center py-10 border rounded-lg">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Activate Personalized Recommendations</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Sign in or register to unlock personalized recommendations based on your profile and nutritional goals.
            </p>
            <Button onClick={() => {
              toast({
                title: "Authentication Required",
                description: "To use personalized AI recommendations, you need to sign in or register.",
                duration: 5000
              });
            }}>
              Sign In to Unlock
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <span className="font-medium">Meal Ideas</span>
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
                Generate New
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
                    <span>Personalized Meal Suggestions</span>
                  </h3>
                  
                  <Select value={selectedMealType} onValueChange={handleMealTypeChange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All meals</SelectItem>
                      <SelectItem value="colazione">Breakfast</SelectItem>
                      <SelectItem value="pranzo">Lunch</SelectItem>
                      <SelectItem value="cena">Dinner</SelectItem>
                      <SelectItem value="spuntino">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  {isLoadingMeals || isManualLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground text-center max-w-md">
                        Creating new intelligent suggestions in progress...
                      </p>
                    </div>
                  ) : mealSuggestions?.suggestions && mealSuggestions.suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {mealSuggestions.suggestions.map((meal, index) => (
                        <div key={index} className="border rounded-lg p-6 bg-card shadow-sm">
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <h4 className="font-medium text-xl">{meal.name}</h4>
                            <Badge className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap text-base py-1.5 px-3" variant="outline">
                              {mealTypeIcons[meal.mealType.toLowerCase()] || <Utensils className="h-4 w-4" />}
                              {mealTypeMap[meal.mealType.toLowerCase()] || meal.mealType}
                            </Badge>
                          </div>
                          
                          <div className="mt-2 mb-4">
                            <p className="text-base text-muted-foreground leading-relaxed border border-gray-200 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
                              {meal.description}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="border rounded-lg p-4 text-center">
                              <div className="text-2xl font-medium">{meal.calories}</div>
                              <div className="text-sm text-muted-foreground">kcal</div>
                            </div>
                            <div className="border rounded-lg p-4 text-center bg-red-50 dark:bg-red-900/10">
                              <div className="text-2xl font-medium">{meal.proteins}</div>
                              <div className="text-sm text-muted-foreground">Protein (g)</div>
                            </div>
                            <div className="border rounded-lg p-4 text-center bg-green-50 dark:bg-green-900/10">
                              <div className="text-2xl font-medium">{meal.carbs}</div>
                              <div className="text-sm text-muted-foreground">Carbs (g)</div>
                            </div>
                            <div className="border rounded-lg p-4 text-center bg-yellow-50 dark:bg-yellow-900/10">
                              <div className="text-2xl font-medium">{meal.fats}</div>
                              <div className="text-sm text-muted-foreground">Fat (g)</div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button variant="outline" className="text-sm" onClick={() => {
                              toast({
                                title: "Coming Soon",
                                description: "Automatic meal addition will be available soon!",
                              });
                            }}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Add Meal
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-center mt-6">
                        <Button 
                          className="px-6 py-6 text-md" 
                          onClick={handleRefresh} 
                          disabled={isLoadingMeals || isManualLoading}
                        >
                          {(isLoadingMeals || isManualLoading) ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-5 w-5 mr-2" />
                          )}
                          Generate New Meals
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-4 mt-4">
                      <div className="rounded-full w-16 h-16 mx-auto bg-muted flex items-center justify-center">
                        <Utensils className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-1">No suggestions available</h3>
                        <p className="text-muted-foreground">
                          Click "Generate New" to receive personalized meal suggestions.
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
                        Generate Suggestions
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