import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Calendar, BarChart } from 'lucide-react';
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
      const res = await fetch(`/api/meals?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch meals');
      return res.json();
    },
  });

  // Fetch dell'obiettivo nutrizionale attivo
  const { data: activeGoal, isLoading: goalLoading, error: goalError } = useQuery({
    queryKey: ['/api/nutrition-goals/active', user.id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/nutrition-goals/active?userId=${user.id}`);
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

  // Calcolo totali nutrizionali (ultimi 7 giorni)
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
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="meals">Pasti</TabsTrigger>
            <TabsTrigger value="goals">Obiettivi</TabsTrigger>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="meals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Form per aggiungere un nuovo pasto */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Aggiungi Pasto</CardTitle>
                  <CardDescription>Registra un nuovo pasto</CardDescription>
                </CardHeader>
                <CardContent>
                  <form 
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      
                      try {
                        // Verifica che l'utente sia definito
                        if (!user) {
                          throw new Error('Utente non autenticato. Effettua il login per aggiungere un pasto.');
                        }
                        
                        // Se è stato selezionato "Altro" e c'è un valore personalizzato, usa quello
                        let foodName = formData.get('food') as string;
                        const customFood = formData.get('customFood') as string;
                        
                        if (foodName === "Altro (personalizzato)" && customFood && customFood.trim() !== '') {
                          foodName = customFood.trim();
                        }
                        
                        const mealData = {
                          userId: user.id.toString(),
                          mealType: formData.get('mealType') as string,
                          food: foodName,
                          calories: parseInt(formData.get('calories') as string),
                          proteins: parseInt(formData.get('proteins') as string),
                          carbs: parseInt(formData.get('carbs') as string),
                          fats: parseInt(formData.get('fats') as string),
                          timestamp: new Date().toISOString()
                        };
                        
                        // Validazione base
                        if (!mealData.food || mealData.food.trim() === '') {
                          throw new Error('Inserisci il nome dell\'alimento');
                        }
                        
                        const response = await apiRequest('POST', '/api/meals', mealData);
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Errore durante l\'aggiunta del pasto');
                        }
                        
                        toast({
                          title: "Successo",
                          description: "Pasto aggiunto correttamente",
                        });
                        
                        // Reset del form
                        e.currentTarget.reset();
                        
                        // Invalidare la query per ricaricare i pasti
                        queryClient.invalidateQueries({queryKey: ['/api/meals', user.id]});
                      } catch (error) {
                        toast({
                          title: "Errore",
                          description: error instanceof Error ? error.message : 'Si è verificato un errore',
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <label htmlFor="mealType" className="text-sm font-medium">
                        Tipo di Pasto
                      </label>
                      <select 
                        name="mealType" 
                        id="mealType"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        defaultValue="breakfast"
                      >
                        <option value="breakfast">Colazione</option>
                        <option value="lunch">Pranzo</option>
                        <option value="dinner">Cena</option>
                        <option value="snack">Spuntino</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="food" className="text-sm font-medium">
                        Alimento
                      </label>
                      <select
                        name="food"
                        id="food"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        onChange={(e) => {
                          // Preset valori in base all'alimento selezionato
                          const formEl = e.target.form;
                          if (!formEl) return;
                          
                          const selectedValue = e.target.value;
                          const caloriesInput = formEl.querySelector('#calories') as HTMLInputElement;
                          const proteinsInput = formEl.querySelector('#proteins') as HTMLInputElement;
                          const carbsInput = formEl.querySelector('#carbs') as HTMLInputElement;
                          const fatsInput = formEl.querySelector('#fats') as HTMLInputElement;
                          
                          // Preimpostazioni per i vari alimenti
                          switch(selectedValue) {
                            case "Pizza Margherita (1 fetta)":
                              caloriesInput.value = "285";
                              proteinsInput.value = "12";
                              carbsInput.value = "39";
                              fatsInput.value = "10";
                              break;
                            case "Pasta al pomodoro (100g)":
                              caloriesInput.value = "180";
                              proteinsInput.value = "7";
                              carbsInput.value = "35";
                              fatsInput.value = "2";
                              break;
                            case "Insalata mista (100g)":
                              caloriesInput.value = "20";
                              proteinsInput.value = "1";
                              carbsInput.value = "3";
                              fatsInput.value = "0";
                              break;
                            case "Pollo alla griglia (100g)":
                              caloriesInput.value = "165";
                              proteinsInput.value = "31";
                              carbsInput.value = "0";
                              fatsInput.value = "3";
                              break;
                            case "Salmone (100g)":
                              caloriesInput.value = "208";
                              proteinsInput.value = "22";
                              carbsInput.value = "0";
                              fatsInput.value = "13";
                              break;
                            case "Uova (1 uovo)":
                              caloriesInput.value = "70";
                              proteinsInput.value = "6";
                              carbsInput.value = "1";
                              fatsInput.value = "5";
                              break;
                            case "Pane integrale (1 fetta)":
                              caloriesInput.value = "80";
                              proteinsInput.value = "3";
                              carbsInput.value = "15";
                              fatsInput.value = "1";
                              break;
                            case "Yogurt greco (150g)":
                              caloriesInput.value = "150";
                              proteinsInput.value = "15";
                              carbsInput.value = "6";
                              fatsInput.value = "7";
                              break;
                            case "Mela (1 media)":
                              caloriesInput.value = "72";
                              proteinsInput.value = "0";
                              carbsInput.value = "19";
                              fatsInput.value = "0";
                              break;
                            case "Banana (1 media)":
                              caloriesInput.value = "105";
                              proteinsInput.value = "1";
                              carbsInput.value = "27";
                              fatsInput.value = "0";
                              break;
                            case "Avocado (1/2)":
                              caloriesInput.value = "160";
                              proteinsInput.value = "2";
                              carbsInput.value = "8";
                              fatsInput.value = "15";
                              break;
                            case "Cioccolato fondente (30g)":
                              caloriesInput.value = "160";
                              proteinsInput.value = "2";
                              carbsInput.value = "13";
                              fatsInput.value = "11";
                              break;
                            case "Patate al forno (100g)":
                              caloriesInput.value = "130";
                              proteinsInput.value = "3";
                              carbsInput.value = "30";
                              fatsInput.value = "0";
                              break;
                            case "Formaggio (30g)":
                              caloriesInput.value = "110";
                              proteinsInput.value = "7";
                              carbsInput.value = "1";
                              fatsInput.value = "9";
                              break;
                            case "Riso bianco (100g cotto)":
                              caloriesInput.value = "130";
                              proteinsInput.value = "3";
                              carbsInput.value = "28";
                              fatsInput.value = "0";
                              break;
                            case "Altro (personalizzato)":
                              // Lascia i valori di default o resetta
                              caloriesInput.value = "0";
                              proteinsInput.value = "0";
                              carbsInput.value = "0";
                              fatsInput.value = "0";
                              break;
                          }
                        }}
                        required
                      >
                        <option value="">Seleziona un alimento</option>
                        <option value="Pizza Margherita (1 fetta)">Pizza Margherita (1 fetta)</option>
                        <option value="Pasta al pomodoro (100g)">Pasta al pomodoro (100g)</option>
                        <option value="Insalata mista (100g)">Insalata mista (100g)</option>
                        <option value="Pollo alla griglia (100g)">Pollo alla griglia (100g)</option>
                        <option value="Salmone (100g)">Salmone (100g)</option>
                        <option value="Uova (1 uovo)">Uova (1 uovo)</option>
                        <option value="Pane integrale (1 fetta)">Pane integrale (1 fetta)</option>
                        <option value="Yogurt greco (150g)">Yogurt greco (150g)</option>
                        <option value="Mela (1 media)">Mela (1 media)</option>
                        <option value="Banana (1 media)">Banana (1 media)</option>
                        <option value="Avocado (1/2)">Avocado (1/2)</option>
                        <option value="Cioccolato fondente (30g)">Cioccolato fondente (30g)</option>
                        <option value="Patate al forno (100g)">Patate al forno (100g)</option>
                        <option value="Formaggio (30g)">Formaggio (30g)</option>
                        <option value="Riso bianco (100g cotto)">Riso bianco (100g cotto)</option>
                        <option value="Altro (personalizzato)">Altro (personalizzato)</option>
                      </select>
                      <input 
                        type="text" 
                        name="customFood" 
                        id="customFood"
                        placeholder="Inserisci qui se hai selezionato 'Altro'"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2"
                        onFocus={() => {
                          const foodSelect = document.querySelector('#food') as HTMLSelectElement;
                          if (foodSelect && foodSelect.value !== "Altro (personalizzato)") {
                            foodSelect.value = "Altro (personalizzato)";
                            foodSelect.dispatchEvent(new Event('change'));
                          }
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label htmlFor="calories" className="text-sm font-medium">
                          Calorie
                        </label>
                        <input 
                          type="number" 
                          name="calories" 
                          id="calories"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          defaultValue="0"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="proteins" className="text-sm font-medium">
                          Proteine (g)
                        </label>
                        <input 
                          type="number" 
                          name="proteins" 
                          id="proteins"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          defaultValue="0"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="carbs" className="text-sm font-medium">
                          Carboidrati (g)
                        </label>
                        <input 
                          type="number" 
                          name="carbs" 
                          id="carbs"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          defaultValue="0"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="fats" className="text-sm font-medium">
                          Grassi (g)
                        </label>
                        <input 
                          type="number" 
                          name="fats" 
                          id="fats"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          defaultValue="0"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Pasto
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Lista pasti */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>I Tuoi Pasti</CardTitle>
                  <CardDescription>Gli ultimi pasti registrati</CardDescription>
                </CardHeader>
                <CardContent>
                  {mealsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : meals && meals.length > 0 ? (
                    <div className="space-y-4">
                      {meals.map((meal: any) => (
                        <div 
                          key={meal.id} 
                          className="flex justify-between items-center border p-3 rounded-md hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{meal.food}</p>
                            <div className="flex items-center text-sm text-muted-foreground space-x-2">
                              <span>{meal.mealType === 'breakfast' ? 'Colazione' : 
                                      meal.mealType === 'lunch' ? 'Pranzo' : 
                                      meal.mealType === 'dinner' ? 'Cena' : 'Spuntino'}</span>
                              <span>•</span>
                              <span>{new Date(meal.timestamp).toLocaleString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{meal.calories} kcal</p>
                            <p className="text-xs text-muted-foreground">
                              P: {meal.proteins}g | C: {meal.carbs}g | G: {meal.fats}g
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <p>Nessun pasto registrato</p>
                      <p className="text-sm mt-1">Aggiungi il tuo primo pasto dal modulo a sinistra</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Form per aggiungere un nuovo obiettivo */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Crea Obiettivo</CardTitle>
                  <CardDescription>Imposta un nuovo obiettivo nutrizionale</CardDescription>
                </CardHeader>
                <CardContent>
                  <form 
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      
                      try {
                        // Verifica che l'utente sia definito
                        if (!user) {
                          throw new Error('Utente non autenticato. Effettua il login per creare un obiettivo.');
                        }
                        
                        const goalData = {
                          userId: user.id.toString(),
                          name: formData.get('name') as string,
                          calories: parseInt(formData.get('calories') as string),
                          proteins: parseInt(formData.get('proteins') as string),
                          carbs: parseInt(formData.get('carbs') as string),
                          fats: parseInt(formData.get('fats') as string),
                          startDate: new Date().toISOString().split('T')[0],
                          isActive: true,
                          description: formData.get('description') as string || null
                        };
                        
                        // Validazione base
                        if (!goalData.name || goalData.name.trim() === '') {
                          throw new Error('Inserisci un nome per l\'obiettivo');
                        }
                        
                        const response = await apiRequest('POST', '/api/nutrition-goals', goalData);
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Errore durante la creazione dell\'obiettivo');
                        }
                        
                        toast({
                          title: "Successo",
                          description: "Obiettivo nutrizionale creato correttamente",
                        });
                        
                        // Reset del form
                        e.currentTarget.reset();
                        
                        // Invalidare le query per ricaricare gli obiettivi
                        // A questo punto sappiamo che user è definito perché l'abbiamo controllato prima
                        queryClient.invalidateQueries({queryKey: ['/api/nutrition-goals', user.id]});
                        queryClient.invalidateQueries({queryKey: ['/api/nutrition-goals/active', user.id]});
                      } catch (error) {
                        toast({
                          title: "Errore",
                          description: error instanceof Error ? error.message : 'Si è verificato un errore',
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Nome obiettivo
                      </label>
                      <select 
                        name="name" 
                        id="name"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        onChange={(e) => {
                          // Preset valori in base all'obiettivo selezionato
                          const formEl = e.target.form;
                          if (!formEl) return;
                          
                          const selectedValue = e.target.value;
                          const caloriesInput = formEl.querySelector('#calories') as HTMLInputElement;
                          const proteinsInput = formEl.querySelector('#proteins') as HTMLInputElement;
                          const carbsInput = formEl.querySelector('#carbs') as HTMLInputElement;
                          const fatsInput = formEl.querySelector('#fats') as HTMLInputElement;
                          const descriptionTextarea = formEl.querySelector('#description') as HTMLTextAreaElement;
                          
                          // Preimpostazioni per i vari obiettivi
                          switch(selectedValue) {
                            case "Perdita di peso":
                              caloriesInput.value = "1800";
                              proteinsInput.value = "150";
                              carbsInput.value = "150";
                              fatsInput.value = "50";
                              descriptionTextarea.value = "Obiettivo di perdita di peso con deficit calorico moderato e alta percentuale di proteine.";
                              break;
                            case "Mantenimento":
                              caloriesInput.value = "2200";
                              proteinsInput.value = "120";
                              carbsInput.value = "220";
                              fatsInput.value = "70";
                              descriptionTextarea.value = "Obiettivo di mantenimento del peso con distribuzione equilibrata dei macronutrienti.";
                              break;
                            case "Aumento massa muscolare":
                              caloriesInput.value = "2800";
                              proteinsInput.value = "180";
                              carbsInput.value = "320";
                              fatsInput.value = "70";
                              descriptionTextarea.value = "Obiettivo di aumento della massa muscolare con surplus calorico e alta percentuale di proteine e carboidrati.";
                              break;
                            case "Keto / Low-carb":
                              caloriesInput.value = "2000";
                              proteinsInput.value = "150";
                              carbsInput.value = "50";
                              fatsInput.value = "150";
                              descriptionTextarea.value = "Dieta chetogenica con basso apporto di carboidrati, moderato apporto di proteine e alto apporto di grassi.";
                              break;
                            case "Mediterranea":
                              caloriesInput.value = "2200";
                              proteinsInput.value = "100";
                              carbsInput.value = "260";
                              fatsInput.value = "80";
                              descriptionTextarea.value = "Dieta mediterranea con moderato apporto calorico, ricca di carboidrati complessi e grassi sani.";
                              break;
                            case "Vegana / Vegetariana":
                              caloriesInput.value = "2000";
                              proteinsInput.value = "80";
                              carbsInput.value = "300";
                              fatsInput.value = "60";
                              descriptionTextarea.value = "Alimentazione a base vegetale con un buon apporto di carboidrati e moderato apporto di proteine.";
                              break;
                            case "Personalizzato":
                              // Lascia i valori di default già presenti
                              caloriesInput.value = "2000";
                              proteinsInput.value = "120";
                              carbsInput.value = "200";
                              fatsInput.value = "65";
                              descriptionTextarea.value = "";
                              break;
                          }
                        }}
                        required
                      >
                        <option value="">Seleziona un obiettivo</option>
                        <option value="Perdita di peso">Perdita di peso</option>
                        <option value="Mantenimento">Mantenimento</option>
                        <option value="Aumento massa muscolare">Aumento massa muscolare</option>
                        <option value="Keto / Low-carb">Keto / Low-carb</option>
                        <option value="Mediterranea">Dieta Mediterranea</option>
                        <option value="Vegana / Vegetariana">Vegana / Vegetariana</option>
                        <option value="Personalizzato">Personalizzato</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">
                        Descrizione (opzionale)
                      </label>
                      <textarea 
                        name="description" 
                        id="description"
                        placeholder="Dettagli aggiuntivi sul tuo obiettivo..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
                      ></textarea>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="calories" className="text-sm font-medium">
                        Calorie giornaliere
                      </label>
                      <input 
                        type="number" 
                        name="calories" 
                        id="calories"
                        min="0"
                        placeholder="0"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        defaultValue="2000"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <label htmlFor="proteins" className="text-sm font-medium">
                          Proteine (g)
                        </label>
                        <input 
                          type="number" 
                          name="proteins" 
                          id="proteins"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          defaultValue="120"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="carbs" className="text-sm font-medium">
                          Carboidrati (g)
                        </label>
                        <input 
                          type="number" 
                          name="carbs" 
                          id="carbs"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          defaultValue="200"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="fats" className="text-sm font-medium">
                          Grassi (g)
                        </label>
                        <input 
                          type="number" 
                          name="fats" 
                          id="fats"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          defaultValue="65"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full">
                      <BarChart className="h-4 w-4 mr-2" />
                      Crea Obiettivo
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Lista obiettivi */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>I Tuoi Obiettivi</CardTitle>
                    <CardDescription>Gestisci i tuoi obiettivi nutrizionali</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {goalLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div>
                      {/* Obiettivo attivo */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Obiettivo Attivo</h3>
                        {activeGoal ? (
                          <div className="border rounded-md p-4 bg-primary/5 relative">
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              Attivo
                            </div>
                            <h4 className="font-medium text-lg">{activeGoal.name}</h4>
                            {activeGoal.description && (
                              <p className="text-sm text-gray-600 mt-1 mb-3">{activeGoal.description}</p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                              <div className="bg-background p-2 rounded border text-center">
                                <p className="text-xs text-gray-500">Calorie</p>
                                <p className="font-bold">{activeGoal.calories}</p>
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
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Cronologia Obiettivi</h3>
                        <div className="text-center py-8 text-muted-foreground">
                          <p>La cronologia degli obiettivi sarà disponibile prossimamente</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
