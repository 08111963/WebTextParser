import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type MealPlan = {
  id: number;
  userId: string;
  query: string;
  response: string;
  timestamp: string;
};

type MealPlanProps = {
  userId: string;
};

export default function MealPlan({ userId }: MealPlanProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query per ottenere i piani alimentari
  const { data: mealPlans } = useQuery<MealPlan[]>({
    queryKey: ['/api/mealplans', userId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/mealplans?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch meal plans');
      return res.json();
    }
  });
  
  // Imposta la risposta con il piano pasto più recente quando i dati vengono caricati
  if (mealPlans && mealPlans.length > 0 && !response && mealPlans[0].response) {
    setResponse(mealPlans[0].response);
  }

  // Mutation per creare un nuovo piano pasto
  const createMealPlanMutation = useMutation({
    mutationFn: async (mealPlanData: { userId: string; query: string; response: string }) => {
      const res = await apiRequest('POST', '/api/mealplans', {
        ...mealPlanData,
        timestamp: new Date().toISOString()
      });
      if (!res.ok) throw new Error('Failed to create meal plan');
      return res.json();
    },
    onSuccess: () => {
      // Invalida la query per ricaricare i piani pasto
      queryClient.invalidateQueries({ queryKey: ['/api/mealplans'] });
    },
    onError: (error) => {
      console.error('Error creating meal plan:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare il piano pasto',
        variant: 'destructive'
      });
    }
  });
  
  const generateMealPlan = async () => {
    if (!query.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci una domanda o una richiesta.",
        variant: "destructive"
      });
      return;
    }

    // Imposta lo stato di caricamento e il messaggio
    setIsLoading(true);
    setResponse("Generazione di suggerimenti di pasti in corso...");

    try {
      // Simulazione dell'API con delay
      let mealPlanResponse;
      
      if (query.toLowerCase().includes("protein") || query.toLowerCase().includes("proteine")) {
        mealPlanResponse = `
          <p class="font-medium mb-2">Idee di Pasti ad Alto Contenuto Proteico:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Yogurt greco con frutti di bosco e noci (24g proteine)</li>
            <li>Petto di pollo con quinoa e verdure (38g proteine)</li>
            <li>Salmone con patate dolci e asparagi (32g proteine)</li>
            <li>Frullato proteico con whey, banana e latte di mandorla (30g proteine)</li>
          </ul>
        `;
      } else if (query.toLowerCase().includes("carb") || query.toLowerCase().includes("carboidrati") || query.toLowerCase().includes("keto")) {
        mealPlanResponse = `
          <p class="font-medium mb-2">Idee di Pasti a Basso Contenuto di Carboidrati:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Uova strapazzate con verdure e avocado (6g carboidrati)</li>
            <li>Spaghetti di zucchine con pesto e pollo alla griglia (9g carboidrati)</li>
            <li>Ciotola di riso di cavolfiore con bistecca e verdure (10g carboidrati)</li>
            <li>Insalata di spinaci con salmone alla griglia e condimento all'olio d'oliva (5g carboidrati)</li>
          </ul>
        `;
      } else {
        mealPlanResponse = `
          <p class="font-medium mb-2">Suggerimenti per Pasti Bilanciati:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Overnight oats con yogurt greco e frutti di bosco</li>
            <li>Wrap di tacchino e verdure con hummus</li>
            <li>Pesce al forno con verdure arrostite e quinoa</li>
            <li>Zuppa di lenticchie con insalata e pane integrale</li>
          </ul>
          <p class="mt-2 text-sm text-neutral-medium">Per suggerimenti più specifici, prova a chiedere riguardo particolari obiettivi nutrizionali o preferenze dietetiche.</p>
        `;
      }
      
      // Salva il piano alimentare nel database tramite REST API
      createMealPlanMutation.mutate({
        userId,
        query,
        response: mealPlanResponse
      });
      
      // Aggiorna lo stato con il nuovo piano alimentare
      setResponse(mealPlanResponse);
      setIsLoading(false);
    } catch (error) {
      setResponse("Si è verificato un errore durante la generazione dei suggerimenti per i pasti. Riprova.");
      toast({
        title: "Errore",
        description: "Impossibile generare il piano pasto",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Personalized Meal Plans</h2>
      </div>
      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask for meal suggestions..."
            className="flex-grow"
          />
          <Button 
            onClick={generateMealPlan} 
            variant="secondary"
            disabled={isLoading}
          >
            Ask
          </Button>
        </div>
        <div 
          className="bg-gray-50 p-4 rounded-md text-sm h-32 overflow-y-auto"
          dangerouslySetInnerHTML={{ 
            __html: response || '<span class="text-neutral-medium italic">Your meal plan suggestions will appear here. Try asking something like "Suggest high-protein lunch ideas" or "What\'s a good low-carb breakfast?"</span>' 
          }}
        />
      </div>
    </div>
  );
}
