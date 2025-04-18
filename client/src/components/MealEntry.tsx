import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteMeal } from '@/lib/firebase';

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
      await deleteMeal(userId, id);
      toast({
        title: "Success",
        description: "Meal entry deleted successfully.",
      });
    } catch (error) {
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
