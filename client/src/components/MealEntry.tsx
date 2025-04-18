import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Converti l'ID da stringa a numerico
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        throw new Error("Invalid meal ID format");
      }
      
      const response = await fetch(`/api/meals/${numericId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: "Meal entry deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast({
        title: "Error",
        description: "Failed to delete meal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
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
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
