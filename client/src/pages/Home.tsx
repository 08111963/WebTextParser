import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MealForm from '@/components/MealForm';
import MealList from '@/components/MealList';
import NutritionGoalForm from '@/components/NutritionGoalForm';
import NutritionGoalHistory from '@/components/NutritionGoalHistory';
import NutritionChart from '@/components/NutritionChart';
import UserProfile from '@/components/UserProfile';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Calendar, BarChart, UserRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Helper per trasformare una data stringa in un oggetto Date
function createDate(dateString: string): Date {
  return new Date(dateString);
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Se l'utente non è autenticato, mostriamo un caricamento
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // Fetch dei pasti dell'utente
  const { data: meals, isLoading: mealsLoading, error: mealsError } = useQuery({
    queryKey: ['/api/meals', user.id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meals?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch meals');
      return res.json();
    },
  });

  // Fetch dell'obiettivo nutrizionale attivo
  const { data: activeGoal, isLoading: goalLoading, error: goalError } = useQuery({
    queryKey: ['/api/nutrition-goals/active', user.id],
    queryFn: async () => {
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
  });

  // Gestione degli errori
  useEffect(() => {
    if (mealsError) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i pasti. Riprova più tardi.",
        variant: "destructive",
      });
    }
    if (goalError) {
      toast({
        title: "Errore",
        description: "Impossibile caricare gli obiettivi nutrizionali. Riprova più tardi.",
        variant: "destructive",
      });
    }
  }, [mealsError, goalError, toast]);

  // Calcolo totali nutrizionali
  const todayMeals = meals?.filter((meal: any) => {
    const mealDate = new Date(meal.timestamp);
    const today = new Date();
    return mealDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
  }) || [];

  const totalCalories = todayMeals.reduce((sum: number, meal: any) => sum + meal.calories, 0);
  const totalProteins = todayMeals.reduce((sum: number, meal: any) => sum + meal.proteins, 0);
  const totalCarbs = todayMeals.reduce((sum: number, meal: any) => sum + meal.carbs, 0);
  const totalFats = todayMeals.reduce((sum: number, meal: any) => sum + meal.fats, 0);

  const isLoading = mealsLoading || goalLoading;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Benvenuto, {user.username}!</h1>
          <p className="text-gray-600">Monitora la tua nutrizione e raggiungi i tuoi obiettivi.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="meals">Pasti</TabsTrigger>
            <TabsTrigger value="goals">Obiettivi</TabsTrigger>
            <TabsTrigger value="profile">Profilo</TabsTrigger>
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
                      <CardTitle className="text-sm font-medium">Calorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalCalories} kcal</div>
                      <p className="text-xs text-muted-foreground">
                        {activeGoal ? `${Math.round((totalCalories / activeGoal.calories) * 100)}% dell'obiettivo` : 'Nessun obiettivo impostato'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Proteine</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalProteins}g</div>
                      <p className="text-xs text-muted-foreground">
                        {activeGoal ? `${Math.round((totalProteins / activeGoal.proteins) * 100)}% dell'obiettivo` : 'Nessun obiettivo impostato'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Carboidrati</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalCarbs}g</div>
                      <p className="text-xs text-muted-foreground">
                        {activeGoal ? `${Math.round((totalCarbs / activeGoal.carbs) * 100)}% dell'obiettivo` : 'Nessun obiettivo impostato'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Grassi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalFats}g</div>
                      <p className="text-xs text-muted-foreground">
                        {activeGoal ? `${Math.round((totalFats / activeGoal.fats) * 100)}% dell'obiettivo` : 'Nessun obiettivo impostato'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Pasti Recenti</CardTitle>
                      <CardDescription>Gli ultimi pasti registrati</CardDescription>
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
                                  P: {meal.proteins}g C: {meal.carbs}g G: {meal.fats}g
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Nessun pasto registrato oggi</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setActiveTab('meals')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Pasto
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Obiettivo Nutrizionale</CardTitle>
                      <CardDescription>Il tuo obiettivo attuale</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activeGoal ? (
                        <div className="space-y-2">
                          <p className="font-medium text-xl">{activeGoal.name}</p>
                          {activeGoal.description && (
                            <p className="text-sm text-muted-foreground">{activeGoal.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Calorie</p>
                              <p className="font-bold">{activeGoal.calories} kcal</p>
                            </div>
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Proteine</p>
                              <p className="font-bold">{activeGoal.proteins}g</p>
                            </div>
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Carboidrati</p>
                              <p className="font-bold">{activeGoal.carbs}g</p>
                            </div>
                            <div className="bg-primary/10 p-2 rounded">
                              <p className="text-xs">Grassi</p>
                              <p className="font-bold">{activeGoal.fats}g</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Nessun obiettivo nutrizionale attivo</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setActiveTab('goals')}
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        {activeGoal ? 'Gestisci Obiettivi' : 'Crea Obiettivo'}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Grafico dei valori nutrizionali */}
                <div className="mt-6">
                  <NutritionChart userId={user.id.toString()} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="meals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Form per aggiungere un nuovo pasto */}
              <MealForm userId={user.id.toString()} />
              
              {/* Lista dei pasti */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>I Tuoi Pasti</CardTitle>
                  <CardDescription>Gli ultimi pasti registrati</CardDescription>
                </CardHeader>
                <CardContent>
                  <MealList
                    meals={meals || []}
                    isLoading={mealsLoading}
                    userId={user.id.toString()}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Form per aggiungere un nuovo obiettivo */}
              <NutritionGoalForm userId={user.id.toString()} />
              
              {/* Visualizzazione dell'obiettivo attivo e cronologia */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Obiettivo Attivo</CardTitle>
                  <CardDescription>Il tuo obiettivo nutrizionale attuale</CardDescription>
                </CardHeader>
                <CardContent>
                  {goalLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Obiettivo attivo */}
                      <div>
                        {activeGoal ? (
                          <div className="border rounded-md p-4">
                            <h3 className="text-xl font-semibold">{activeGoal.name}</h3>
                            {activeGoal.description && (
                              <p className="text-muted-foreground mt-1">{activeGoal.description}</p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                              <div className="bg-background p-2 rounded border text-center">
                                <p className="text-xs text-gray-500">Calorie</p>
                                <p className="font-bold">{activeGoal.calories} kcal</p>
                              </div>
                              <div className="bg-background p-2 rounded border text-center">
                                <p className="text-xs text-gray-500">Proteine</p>
                                <p className="font-bold">{activeGoal.proteins}g</p>
                              </div>
                              <div className="bg-background p-2 rounded border text-center">
                                <p className="text-xs text-gray-500">Carboidrati</p>
                                <p className="font-bold">{activeGoal.carbs}g</p>
                              </div>
                              <div className="bg-background p-2 rounded border text-center">
                                <p className="text-xs text-gray-500">Grassi</p>
                                <p className="font-bold">{activeGoal.fats}g</p>
                              </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-500">
                              Data inizio: {new Date(activeGoal.startDate).toLocaleDateString('it-IT')}
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-md p-6 text-center text-muted-foreground">
                            <p>Nessun obiettivo attivo</p>
                            <p className="text-sm mt-1">Crea un nuovo obiettivo dal form a sinistra</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Lista di tutti gli obiettivi */}
                      <div className="mt-8">
                        <NutritionGoalHistory userId={user.id.toString()} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="max-w-4xl mx-auto">
              <UserProfile />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}