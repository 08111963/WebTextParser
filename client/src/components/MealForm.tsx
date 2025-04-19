import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { foodItems } from '@/data/foodDatabase';

const mealFormSchema = z.object({
  mealType: z.string().min(1, 'Meal type is required'),
  food: z.string().min(1, 'Food name is required'),
  foodPreset: z.string().optional(),
  calories: z.coerce.number().min(0, 'Calories must be at least 0'),
  proteins: z.coerce.number().min(0, 'Proteins must be at least 0'),
  carbs: z.coerce.number().min(0, 'Carbs must be at least 0'),
  fats: z.coerce.number().min(0, 'Fats must be at least 0'),
});

type MealFormValues = z.infer<typeof mealFormSchema>;

type MealFormProps = {
  userId: string;
};

export default function MealForm({ userId }: MealFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFoodPortion, setSelectedFoodPortion] = useState<string>("");
  
  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      mealType: 'breakfast',
      food: '',
      foodPreset: 'custom',
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
    },
  });

  // Mutation to add a meal
  const addMealMutation = useMutation({
    mutationFn: async (mealData: {
      userId: string;
      food: string;
      calories: number;
      proteins: number;
      carbs: number;
      fats: number;
      mealType: string;
      timestamp: string;
    }) => {
      const res = await apiRequest('POST', '/api/meals', mealData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error adding the meal');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate query to reload meals
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      
      toast({
        title: "Success",
        description: "Meal added successfully",
      });
      
      // Reset form
      form.reset({
        mealType: 'breakfast',
        food: '',
        foodPreset: 'custom',
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      });
      setSelectedFoodPortion("");
    },
    onError: (error: Error) => {
      console.error("Error adding meal:", error);
      toast({
        title: "Error",
        description: `Unable to add meal: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handles preset food selection
  const handleFoodPresetChange = (value: string) => {
    if (value === 'custom') {
      form.setValue('foodPreset', 'custom');
      form.setValue('food', '');
      form.setValue('calories', 0);
      form.setValue('proteins', 0);
      form.setValue('carbs', 0);
      form.setValue('fats', 0);
      setSelectedFoodPortion("");
      return;
    }
    
    const selectedFood = foodItems.find(item => item.id === value);
    
    if (selectedFood) {
      form.setValue('foodPreset', value);
      form.setValue('food', `${selectedFood.name} (${selectedFood.portion})`);
      form.setValue('calories', selectedFood.calories);
      form.setValue('proteins', selectedFood.proteins);
      form.setValue('carbs', selectedFood.carbs);
      form.setValue('fats', selectedFood.fats);
      setSelectedFoodPortion(selectedFood.portion);
    }
  };

  const onSubmit = async (values: MealFormValues) => {
    // Check if user is authenticated
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to add a meal",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data to send
    const mealData = {
      userId,
      food: values.food,
      calories: Math.round(Number(values.calories) || 0),
      proteins: Math.round(Number(values.proteins) || 0),
      carbs: Math.round(Number(values.carbs) || 0),
      fats: Math.round(Number(values.fats) || 0),
      mealType: values.mealType,
      timestamp: new Date().toISOString()
    };
    
    // Send data
    addMealMutation.mutate(mealData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Aggiungi Pasto</h2>
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="foodPreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alimento</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFoodPresetChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un alimento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="custom">Altro (personalizzato)</SelectItem>
                      {foodItems.map((food) => (
                        <SelectItem key={food.id} value={food.id}>
                          {food.name} ({food.portion})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFoodPortion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valori nutrizionali per {selectedFoodPortion}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di pasto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="breakfast">Colazione</SelectItem>
                      <SelectItem value="lunch">Pranzo</SelectItem>
                      <SelectItem value="dinner">Cena</SelectItem>
                      <SelectItem value="snack">Spuntino</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="food"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome alimento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Es: Yogurt greco" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calorie (kcal)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="proteins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proteine (g)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carboidrati (g)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grassi (g)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={addMealMutation.isPending}
            >
              {addMealMutation.isPending ? 'Aggiunta in corso...' : 'Aggiungi Pasto'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}