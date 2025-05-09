
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type MealEntryProps = {
  id: string;
  userId: string;
  mealType: string;
  food: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

export default function MealEntry({ id, userId, mealType, food, calories, proteins, carbs, fats }: MealEntryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create a mutation to delete a meal
  const deleteMealMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/meals/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error while deleting the meal');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the query to reload meals
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      
      toast({
        title: "Success",
        description: "Meal successfully deleted",
      });
    },
    onError: (error: Error) => {
      console.error("Error during meal deletion:", error);
      toast({
        title: "Error",
        description: `Unable to delete the meal: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleDelete = () => {
    // Execute the mutation to delete the meal
    deleteMealMutation.mutate();
  };

  return (
    <div className="p-4 meal-entry border-b border-gray-100 odd:bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium text-primary">{mealType.toUpperCase()}</span> - {food}:
          <span className="ml-1">{calories} kcal, {proteins}g pro, {carbs}g carb, {fats}g fat</span>
        </div>
        <Button 
          variant="destructive" 
          size="sm" 
          className="text-sm bg-red-50 hover:bg-red-100 text-red-600 py-1 px-3 rounded-md transition"
          onClick={handleDelete}
          disabled={deleteMealMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
