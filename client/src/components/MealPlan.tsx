import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addMealPlan, getMealPlans } from '@/lib/firebase';

type MealPlanProps = {
  userId: string;
};

export default function MealPlan({ userId }: MealPlanProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedMealPlans, setSavedMealPlans] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Carica i piani alimentari salvati da Firebase
  useEffect(() => {
    getMealPlans(userId, (mealPlans) => {
      if (mealPlans && mealPlans.length > 0) {
        setSavedMealPlans(mealPlans);
        // Opzionale: mostra l'ultimo piano alimentare
        if (mealPlans[0] && mealPlans[0].response) {
          setResponse(mealPlans[0].response);
        }
      }
    });
  }, [userId]);

  const generateMealPlan = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question or request.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResponse("Generating meal suggestions...");

    try {
      // Simulating API delay
      setTimeout(() => {
        let mealPlanResponse;
        
        if (query.toLowerCase().includes("protein")) {
          mealPlanResponse = `
            <p class="font-medium mb-2">High-Protein Meal Ideas:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Greek yogurt with berries and nuts (24g protein)</li>
              <li>Chicken breast with quinoa and vegetables (38g protein)</li>
              <li>Salmon with sweet potato and asparagus (32g protein)</li>
              <li>Protein smoothie with whey, banana, and almond milk (30g protein)</li>
            </ul>
          `;
        } else if (query.toLowerCase().includes("carb") || query.toLowerCase().includes("keto")) {
          mealPlanResponse = `
            <p class="font-medium mb-2">Low-Carb Meal Ideas:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Egg and vegetable scramble with avocado (6g carbs)</li>
              <li>Zucchini noodles with pesto and grilled chicken (9g carbs)</li>
              <li>Cauliflower rice bowl with steak and vegetables (10g carbs)</li>
              <li>Spinach salad with grilled salmon and olive oil dressing (5g carbs)</li>
            </ul>
          `;
        } else {
          mealPlanResponse = `
            <p class="font-medium mb-2">Balanced Meal Suggestions:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Overnight oats with Greek yogurt and berries</li>
              <li>Turkey and vegetable wrap with hummus</li>
              <li>Baked fish with roasted vegetables and quinoa</li>
              <li>Lentil soup with a side salad and whole grain bread</li>
            </ul>
            <p class="mt-2 text-sm text-neutral-medium">For more specific suggestions, try asking about particular nutritional goals or dietary preferences.</p>
          `;
        }
        
        setResponse(mealPlanResponse);
        
        // Salva il piano alimentare nel database di Firebase
        addMealPlan({
          userId,
          query,
          response: mealPlanResponse
        }).catch(err => {
          console.error("Error saving meal plan:", err);
        });
        
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setResponse("An error occurred while generating meal suggestions. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate meal plan",
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
