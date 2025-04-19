import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Pizza, UserCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PerplexityMealSuggestionsProps = {
  userId: string;
};

type MealSuggestion = {
  name: string;
  description: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  ingredients: string[];
};

export default function PerplexityMealSuggestions({ userId }: PerplexityMealSuggestionsProps) {
  const { toast } = useToast();
  const [mealType, setMealType] = useState<string>("lunch");
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(userId !== "0");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);

  // Toggle dietary preference
  const togglePreference = (value: string) => {
    setDietaryPreferences(prev => 
      prev.includes(value) 
        ? prev.filter(p => p !== value) 
        : [...prev, value]
    );
  };

  // Fetch meal suggestions
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/perplexity/meal-suggestions', userId, mealType, dietaryPreferences],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('mealType', mealType);
      dietaryPreferences.forEach(pref => {
        params.append('dietaryPreferences', pref);
      });

      const res = await apiRequest('GET', `/api/perplexity/meal-suggestions?${params.toString()}`);
      if (!res.ok) throw new Error('Unable to retrieve suggestions');
      return res.json();
    },
    enabled: !!userId && isUserAuthenticated && false, // Initially disabled, will be activated by the "Generate" button
    refetchOnWindowFocus: false,
  });

  // Mutation to request new suggestions
  const generateMutation = useMutation({
    mutationFn: async () => {
      await queryClient.resetQueries({ 
        queryKey: ['/api/perplexity/meal-suggestions', userId, mealType, dietaryPreferences] 
      });
      return refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Unable to generate suggestions. Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle meal type change
  const handleMealTypeChange = (value: string) => {
    setMealType(value);
  };

  // Generate new suggestions
  const handleGenerate = () => {
    generateMutation.mutate();
  };

  // Check if there are valid suggestions
  const hasSuggestions = data?.meals && Array.isArray(data.meals) && data.meals.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pizza className="h-5 w-5 text-primary" />
          <span>Meal Suggestions with Perplexity AI</span>
        </CardTitle>
        <CardDescription>
          Personalized suggestions based on your profile and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isUserAuthenticated ? (
          <div className="text-center py-10 border rounded-lg">
            <UserCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Sign In to Generate Suggestions</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Sign in or register to receive personalized meal suggestions with Perplexity AI.
            </p>
            <Button onClick={() => {
              toast({
                title: "Authentication Required",
                description: "To use personalized meal suggestions, you need to sign in or register.",
                duration: 5000
              });
            }}>
              Sign In to Unlock
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Meal Type</h3>
                <Select value={mealType} onValueChange={handleMealTypeChange}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Dietary Preferences</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vegetarian" 
                      checked={dietaryPreferences.includes('vegetarian')}
                      onCheckedChange={() => togglePreference('vegetarian')}
                    />
                    <Label htmlFor="vegetarian">Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vegan" 
                      checked={dietaryPreferences.includes('vegan')}
                      onCheckedChange={() => togglePreference('vegan')}
                    />
                    <Label htmlFor="vegan">Vegan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="gluten-free" 
                      checked={dietaryPreferences.includes('gluten-free')}
                      onCheckedChange={() => togglePreference('gluten-free')}
                    />
                    <Label htmlFor="gluten-free">Gluten Free</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="low-carb" 
                      checked={dietaryPreferences.includes('low-carb')}
                      onCheckedChange={() => togglePreference('low-carb')}
                    />
                    <Label htmlFor="low-carb">Low Carb</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="high-protein" 
                      checked={dietaryPreferences.includes('high-protein')}
                      onCheckedChange={() => togglePreference('high-protein')}
                    />
                    <Label htmlFor="high-protein">High Protein</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mediterranean" 
                      checked={dietaryPreferences.includes('mediterranean')}
                      onCheckedChange={() => togglePreference('mediterranean')}
                    />
                    <Label htmlFor="mediterranean">Mediterranean</Label>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleGenerate}
                  disabled={isLoading || generateMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {(isLoading || generateMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-6">
              {isLoading || generateMutation.isPending ? (
                <div className="flex justify-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Perplexity AI is generating your suggestions...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8 space-y-2 mt-4">
                  <p className="text-destructive">An error occurred while generating suggestions.</p>
                  <Button variant="outline" onClick={handleGenerate}>Try Again</Button>
                </div>
              ) : hasSuggestions ? (
                <div className="space-y-6">
                  <ScrollArea className="max-h-[500px]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {data.meals.map((meal: MealSuggestion, index: number) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-lg">{meal.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{meal.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="mb-3">
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Ingredients</h4>
                              <div className="flex flex-wrap gap-1">
                                {meal.ingredients.map((ingredient, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {ingredient}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div className="rounded bg-muted/40 p-2 text-center">
                                <div className="text-xs text-muted-foreground">Calories</div>
                                <div className="font-medium">{meal.calories} kcal</div>
                              </div>
                              <div className="rounded bg-muted/40 p-2 text-center">
                                <div className="text-xs text-muted-foreground">Proteins</div>
                                <div className="font-medium">{meal.proteins}g</div>
                              </div>
                              <div className="rounded bg-muted/40 p-2 text-center">
                                <div className="text-xs text-muted-foreground">Carbs</div>
                                <div className="font-medium">{meal.carbs}g</div>
                              </div>
                              <div className="rounded bg-muted/40 p-2 text-center">
                                <div className="text-xs text-muted-foreground">Fats</div>
                                <div className="font-medium">{meal.fats}g</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4 mt-4 border rounded-lg">
                  <div className="rounded-full w-16 h-16 mx-auto bg-muted flex items-center justify-center">
                    <Pizza className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">No suggestions generated yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Select your preferences and click "Generate Suggestions" to receive
                      personalized meal ideas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}