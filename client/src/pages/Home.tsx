import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import MealForm from '@/components/MealForm';
import MealList from '@/components/MealList';
import NutritionGoalForm from '@/components/NutritionGoalForm';
import NutritionGoalHistory from '@/components/NutritionGoalHistory';
import NutritionChart from '@/components/NutritionChart';
import UserProfile from '@/components/UserProfile';
import AIRecommendations from '@/components/AIRecommendations';
import AIObjectives from '@/components/AIObjectives';
import PerplexityMealSuggestions from '@/components/PerplexityMealSuggestions';
import PerplexityNutritionalAdvice from '@/components/PerplexityNutritionalAdvice';
import PremiumFeature from '@/components/PremiumFeature';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Calendar, BarChart, UserRound, Sparkles, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Helper per trasformare una data stringa in un oggetto Date
function createDate(dateString: string): Date {
  return new Date(dateString);
}

export default function Home() {
  const { user: authUser } = useAuth();
  const isAuthenticated = !!authUser;
  const [location] = useLocation();
  
  // Controlla se siamo in modalità demo
  const params = location.includes('?') ? location.split('?')[1] : '';
  const urlParams = new URLSearchParams(params);
  const viewMode = urlParams.get('view');
  const sectionParam = urlParams.get('section');
  const isDemoMode = viewMode === 'demo';
  
  // Crea un utente demo se non siamo autenticati o siamo in modalità demo
  const demoUser = { id: 0, username: 'Guest', email: '', password: '' };
  
  // Usa l'utente reale se autenticato, altrimenti usa l'utente demo
  const user = authUser || demoUser;
  
  const { toast } = useToast();
  
  const initialTab = sectionParam && ['dashboard', 'meals', 'goals', 'profile'].includes(sectionParam) 
    ? sectionParam 
    : 'dashboard';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [demoMode, setDemoMode] = useState(isDemoMode);
  
  // Effetto per resettare la posizione di scroll quando cambia la tab
  useEffect(() => {
    // Registriamo che stiamo cambiando tab
    const isChangingTab = true;
    
    // Reset lo scroll della pagina intera in una posizione sicura
    window.scrollTo(0, 0);
    
    // Gestione specifica per le schede con contenuto lungo
    const tabContent = document.querySelector(`[data-state="active"][role="tabpanel"]`);
    if (tabContent) {
      // Forza lo scroll alla posizione 0 in modo che inizi dall'alto
      tabContent.scrollTop = 0;
    }
    
    // Per garantire che lo scroll sia effettivamente a 0, utilizziamo un approccio a più fasi
    setTimeout(() => {
      // Primo tentativo immediato
      if (tabContent) {
        tabContent.scrollTop = 0;
      }
      
      // Secondo tentativo dopo che il DOM si è stabilizzato
      requestAnimationFrame(() => {
        if (tabContent) {
          tabContent.scrollTop = 0;
          
          // Terzo tentativo dopo il render completo
          setTimeout(() => {
            if (tabContent) {
              tabContent.scrollTop = 0;
              
              // Scroll forzato al top della pagina per sicurezza
              window.scrollTo(0, 0);
            }
          }, 50);
        }
      });
    }, 10);
  }, [activeTab]);
  
  // Preparazione per le interazioni che richiedono autenticazione
  const handleInteractionRequiringAuth = (action: string, callback: () => void) => {
    // Se è autenticato, procedi
    if (isAuthenticated) {
      callback();
      return;
    }
    
    // Se è in modalità demo, reindirizza alla pagina di autenticazione
    if (demoMode) {
      // Reindirizza alla pagina di registrazione con un messaggio specifico per l'azione
      let message = "";
      
      if (action === 'meals') {
        message = "register-to-add-meals";
      } else if (action === 'goals') {
        message = "register-to-create-goals";
      } else if (action === 'profile') {
        message = "register-to-complete-profile";
      }
      
      window.location.href = `/auth?action=${message}`;
      return;
    }
    
    // Se non è in modalità demo, mostra la versione demo
    window.location.href = `/home?section=${action}&view=demo`;
  };
  
  // Fetch dei pasti dell'utente (solo se autenticato)
  const { data: meals, isLoading: mealsLoading, error: mealsError } = useQuery({
    queryKey: ['/api/meals', user.id],
    queryFn: async () => {
      // Se l'utente non è autenticato (user.id === 0), restituisci array vuoto 
      if (!isAuthenticated || user.id === 0) {
        return [];
      }
      
      const res = await apiRequest('GET', `/api/meals?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch meals');
      return res.json();
    },
    // Disabilita la query se non siamo autenticati
    enabled: isAuthenticated && user.id !== 0
  });

  // Fetch dell'obiettivo nutrizionale attivo (solo se autenticato)
  const { data: activeGoal, isLoading: goalLoading, error: goalError } = useQuery({
    queryKey: ['/api/nutrition-goals/active', user.id],
    queryFn: async () => {
      // Se l'utente non è autenticato (user.id === 0), restituisci null 
      if (!isAuthenticated || user.id === 0) {
        return null;
      }
      
      try {
        const res = await apiRequest('GET', `/api/nutrition-goals/active?userId=${user.id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch nutrition goal');
        return res.json();
      } catch (error) {
        console.error('Error fetching active goal:', error);
        return null;
      }
    },
    // Disabilita la query se non siamo autenticati
    enabled: isAuthenticated && user.id !== 0
  });

  // Error handling
  useEffect(() => {
    if (mealsError) {
      toast({
        title: "Error",
        description: "Unable to load meals. Please try again later.",
        variant: "destructive",
      });
    }
    if (goalError) {
      toast({
        title: "Error",
        description: "Unable to load nutritional goals. Please try again later.",
        variant: "destructive",
      });
    }
  }, [mealsError, goalError, toast]);

  // Dati demo per utenti non autenticati
  const demoMeals = [
    {
      id: 'd1',
      userId: 0,
      food: 'Grilled Chicken Salad',
      calories: 320,
      proteins: 35,
      carbs: 15,
      fats: 12,
      mealType: 'Lunch',
      timestamp: new Date().toISOString(),
      notes: 'With olive oil dressing'
    },
    {
      id: 'd2',
      userId: 0,
      food: 'Greek Yogurt with Berries',
      calories: 180,
      proteins: 15,
      carbs: 22,
      fats: 5,
      mealType: 'Breakfast',
      timestamp: new Date().toISOString(),
      notes: 'Added honey'
    },
    {
      id: 'd3',
      userId: 0,
      food: 'Salmon with Vegetables',
      calories: 420,
      proteins: 38,
      carbs: 12,
      fats: 22,
      mealType: 'Dinner',
      timestamp: new Date().toISOString(),
      notes: 'Steamed broccoli and carrots'
    }
  ];

  const demoGoal = {
    id: 'dg1',
    userId: 0,
    calories: 2000,
    proteins: 120,
    carbs: 220,
    fats: 65,
    active: true,
    startDate: new Date().toISOString(),
    endDate: null,
    notes: 'Maintenance diet'
  };

  // Calculate nutritional totals
  const displayMeals = demoMode ? demoMeals : meals || [];
  const todayMeals = displayMeals.filter((meal: any) => {
    const mealDate = new Date(meal.timestamp);
    const today = new Date();
    return mealDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
  });

  const displayGoal = demoMode ? demoGoal : activeGoal;

  const totalCalories = todayMeals.reduce((sum: number, meal: any) => sum + meal.calories, 0);
  const totalProteins = todayMeals.reduce((sum: number, meal: any) => sum + meal.proteins, 0);
  const totalCarbs = todayMeals.reduce((sum: number, meal: any) => sum + meal.carbs, 0);
  const totalFats = todayMeals.reduce((sum: number, meal: any) => sum + meal.fats, 0);

  const isLoading = mealsLoading || goalLoading;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-6 pb-16 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Welcome, {demoMode ? 'Guest' : user.username}!</h1>
          <p className="text-gray-600">Track your nutrition and reach your goals.</p>
          
          {demoMode && (
            <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <div className="h-5 w-5 text-blue-600">👁️</div>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">Demo Mode</h3>
                  <p className="text-sm text-blue-600">You are currently in view-only demo mode. To track your own meals and goals, please <a href="/auth" className="text-blue-700 font-semibold hover:underline">register or log in</a>.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            // First update the state
            setActiveTab(value);
            
            // Reset the page scroll
            window.scrollTo(0, 0);
            
            // Reset the tab content scroll
            requestAnimationFrame(() => {
              const tabContent = document.querySelector(`[data-state="active"][role="tabpanel"]`);
              if (tabContent) {
                tabContent.scrollTop = 0;
              }
              
              // Force scroll to 0 for safety
              window.scrollTo(0, 0);
              
              // Try to scroll to the tab's top-marker
              const tabTop = document.getElementById(`${value}-tab-top`);
              if (tabTop) {
                tabTop.scrollIntoView({ behavior: 'auto', block: 'start' });
              }
              
              // Additional attempt after render
              setTimeout(() => {
                if (tabContent) {
                  tabContent.scrollTop = 0;
                }
              }, 100);
            });
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full md:w-auto grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger 
              value="profile" 
              onClick={() => {
                if (demoMode) {
                  // Reindirizza alla pagina di registrazione se in modalità demo
                  window.location.href = '/auth?action=register-to-complete-profile';
                  return;
                }
              }}
            >
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Calories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalCalories} kcal</div>
                      <p className="text-xs text-muted-foreground">
                        {displayGoal ? `${Math.round((totalCalories / displayGoal.calories) * 100)}% of goal` : 'No goal set'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Protein</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalProteins}g</div>
                      <p className="text-xs text-muted-foreground">
                        {displayGoal ? `${Math.round((totalProteins / displayGoal.proteins) * 100)}% of goal` : 'No goal set'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Carbs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalCarbs}g</div>
                      <p className="text-xs text-muted-foreground">
                        {displayGoal ? `${Math.round((totalCarbs / displayGoal.carbs) * 100)}% of goal` : 'No goal set'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Fat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalFats}g</div>
                      <p className="text-xs text-muted-foreground">
                        {displayGoal ? `${Math.round((totalFats / displayGoal.fats) * 100)}% of goal` : 'No goal set'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Recent Meals</CardTitle>
                      <CardDescription>Your latest recorded meals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {todayMeals.length > 0 ? (
                        <div className="space-y-2">
                          {todayMeals.slice(0, 5).map((meal: any) => (
                            <div key={meal.id} className="flex justify-between items-center border-b pb-2">
                              <div>
                                <p className="font-medium">{meal.food}</p>
                                <p className="text-sm text-muted-foreground">{meal.mealType}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{meal.calories} kcal</p>
                                <p className="text-xs text-muted-foreground">
                                  P: {meal.proteins}g C: {meal.carbs}g F: {meal.fats}g
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No meals recorded today</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleInteractionRequiringAuth('meals', () => setActiveTab('meals'))}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Meal
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Nutritional Goal</CardTitle>
                      <CardDescription>Your current goal</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {displayGoal ? (
                        <div className="space-y-2">
                          <p className="font-medium text-xl">{displayGoal.name || "Maintenance Goal"}</p>
                          {displayGoal.description && (
                            <p className="text-sm text-muted-foreground">{displayGoal.description}</p>
                          )}
                          {!displayGoal.description && demoMode && (
                            <p className="text-sm text-muted-foreground">Balanced nutrition for maintaining current weight and supporting overall health.</p>
                          )}
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Calories</p>
                              <p className="font-bold">{displayGoal.calories} kcal</p>
                            </div>
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Protein</p>
                              <p className="font-bold">{displayGoal.proteins}g</p>
                            </div>
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Carbs</p>
                              <p className="font-bold">{displayGoal.carbs}g</p>
                            </div>
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Fat</p>
                              <p className="font-bold">{displayGoal.fats}g</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No active nutritional goal</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleInteractionRequiringAuth('goals', () => setActiveTab('goals'))}
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        {demoMode ? 'View Goals' : (activeGoal ? 'Manage Goals' : 'Create Goal')}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Nutritional values chart */}
                <div className="mt-6">
                  <NutritionChart userId={user.id.toString()} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="meals" className="max-h-[calc(100vh-13rem)] overflow-y-auto">
            {/* Start with an empty div to ensure the page starts at the top */}
            <div id="meals-tab-top" className="h-1"></div>
            
            {/* Separate container for the form and meal list */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Add a New Meal</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  {/* Form to add a new meal */}
                  {isAuthenticated ? (
                    <MealForm userId={user.id.toString()} />
                  ) : (
                    <div className="border rounded-lg p-6 text-center">
                      <p className="text-muted-foreground mb-4">To add meals, please login or register</p>
                      <Button onClick={() => handleInteractionRequiringAuth('meals', () => {})}>
                        Login to Add Meals
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Meal list */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Your Meals</CardTitle>
                    <CardDescription>Your recently recorded meals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MealList
                      meals={demoMode ? demoMeals : (meals || [])}
                      isLoading={mealsLoading && !demoMode}
                      userId={user.id.toString()}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* AI Meal Recommendations Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                AI Meal Recommendations
              </h2>
              <PremiumFeature 
                feature="ai-meal-recommendations" 
                title="AI Meal Recommendations" 
                description="Get personalized meal recommendations powered by AI. Upgrade to Premium to access this feature."
              >
                <AIRecommendations userId={user.id.toString()} />
              </PremiumFeature>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            {/* Start with an empty div to ensure the page starts at the top */}
            <div id="goals-tab-top" className="h-1"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Form and Active Goal */}
              <div className="space-y-8">
                {/* Form Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">Set a New Goal</h2>
                  {isAuthenticated ? (
                    <NutritionGoalForm userId={user.id.toString()} />
                  ) : (
                    <div className="border rounded-lg p-6 text-center">
                      <p className="text-muted-foreground mb-4">To set goals, please login or register</p>
                      <Button onClick={() => handleInteractionRequiringAuth('goals', () => {})}>
                        Login to Set Goals
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Active Goal Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Goal</CardTitle>
                    <CardDescription>Your current nutritional goal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {goalLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div>
                        {/* Active goal */}
                        {activeGoal ? (
                          <div className="border rounded-md p-4">
                            <h3 className="text-xl font-semibold">{activeGoal.name}</h3>
                            {activeGoal.description && (
                              <p className="text-muted-foreground mt-1">{activeGoal.description}</p>
                            )}
                            
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <div className="bg-background p-3 rounded border text-center flex flex-col h-20 justify-between">
                                <p className="text-xs text-gray-500 mt-1">Calories</p>
                                <p className="font-bold text-base">{activeGoal.calories}</p>
                                <p className="text-xs mb-1">kcal</p>
                              </div>
                              <div className="bg-background p-3 rounded border text-center flex flex-col h-20 justify-between">
                                <p className="text-xs text-gray-500 mt-1">Protein</p>
                                <p className="font-bold text-base">{activeGoal.proteins}</p>
                                <p className="text-xs mb-1">grams</p>
                              </div>
                              <div className="bg-background p-3 rounded border text-center flex flex-col h-20 justify-between">
                                <p className="text-xs text-gray-500 mt-1">Carbs</p>
                                <p className="font-bold text-base">{activeGoal.carbs}</p>
                                <p className="text-xs mb-1">grams</p>
                              </div>
                              <div className="bg-background p-3 rounded border text-center flex flex-col h-20 justify-between">
                                <p className="text-xs text-gray-500 mt-1">Fat</p>
                                <p className="font-bold text-base">{activeGoal.fats}</p>
                                <p className="text-xs mb-1">grams</p>
                              </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-500">
                              Start date: {new Date(activeGoal.startDate).toLocaleDateString('en-US')}
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-md p-6 text-center text-muted-foreground">
                            <p>No active goal</p>
                            <p className="text-sm mt-1">Create a new goal using the form above</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column: History and AI Recommendations */}
              <div className="space-y-8">
                {/* Goal History Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">Goal History</h2>
                  <NutritionGoalHistory userId={user.id.toString()} />
                </div>
                
                {/* AI Goal Recommendations Section */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    AI Goal Recommendations
                  </h2>
                  <PremiumFeature 
                    feature="ai-goal-recommendations" 
                    title="AI Goal Recommendations" 
                    description="Get personalized nutrition goal recommendations powered by AI. Upgrade to Premium to access this feature."
                  >
                    <AIObjectives userId={user.id.toString()} />
                  </PremiumFeature>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="max-w-4xl mx-auto">
              {user ? (
                <UserProfile />
              ) : (
                <div className="border rounded-lg p-8 text-center">
                  <p className="text-xl font-semibold mb-2">User Profile</p>
                  <p className="text-muted-foreground mb-6">
                    Login to view and edit your profile, set your physical data, and manage your preferences.
                  </p>
                  <Button onClick={() => handleInteractionRequiringAuth('profile', () => {})}>
                    Login to Your Profile
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}