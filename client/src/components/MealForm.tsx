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

// Dati nutrizionali predefiniti per i cibi comuni
const commonFoods = {
  'chicken_breast': { name: 'Petto di pollo', calories: 165, proteins: 31, carbs: 0, fats: 3.6 },
  'salmon': { name: 'Salmone', calories: 208, proteins: 20, carbs: 0, fats: 13 },
  'rice': { name: 'Riso bianco', calories: 130, proteins: 2.7, carbs: 28, fats: 0.3 },
  'pasta': { name: 'Pasta', calories: 158, proteins: 5.8, carbs: 31, fats: 0.9 },
  'eggs': { name: 'Uova', calories: 155, proteins: 13, carbs: 1.1, fats: 11 },
  'greek_yogurt': { name: 'Yogurt greco', calories: 59, proteins: 10, carbs: 3.6, fats: 0.4 },
  'apple': { name: 'Mela', calories: 52, proteins: 0.3, carbs: 14, fats: 0.2 },
  'banana': { name: 'Banana', calories: 89, proteins: 1.1, carbs: 23, fats: 0.3 },
  'avocado': { name: 'Avocado', calories: 160, proteins: 2, carbs: 8.5, fats: 14.7 },
  'broccoli': { name: 'Broccoli', calories: 34, proteins: 2.8, carbs: 7, fats: 0.4 },
  'olive_oil': { name: 'Olio d\'oliva', calories: 119, proteins: 0, carbs: 0, fats: 13.5 },
  'bread': { name: 'Pane', calories: 265, proteins: 9, carbs: 49, fats: 3.2 },
  'almond': { name: 'Mandorle', calories: 579, proteins: 21, carbs: 22, fats: 49 },
  'chocolate': { name: 'Cioccolato fondente', calories: 598, proteins: 7.8, carbs: 46, fats: 43 },
  'custom': { name: 'Altro (personalizzato)', calories: 0, proteins: 0, carbs: 0, fats: 0 }
};

const mealFormSchema = z.object({
  mealType: z.string().min(1, 'Tipo di pasto richiesto'),
  food: z.string().min(1, 'Nome del cibo richiesto'),
  foodPreset: z.string().optional(),
  calories: z.coerce.number().min(0, 'Le calorie devono essere almeno 0'),
  proteins: z.coerce.number().min(0, 'Le proteine devono essere almeno 0'),
  carbs: z.coerce.number().min(0, 'I carboidrati devono essere almeno 0'),
  fats: z.coerce.number().min(0, 'I grassi devono essere almeno 0'),
});

type MealFormValues = z.infer<typeof mealFormSchema>;

type MealFormProps = {
  userId: string;
};

export default function MealForm({ userId }: MealFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Mutazione per aggiungere un pasto
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
        throw new Error(errorData.message || 'Errore durante l\'aggiunta del pasto');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalida la query per ricaricare i pasti
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      
      toast({
        title: "Successo",
        description: "Pasto aggiunto con successo",
      });
      
      form.reset({
        mealType: 'breakfast',
        food: '',
        foodPreset: 'custom',
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      });
    },
    onError: (error: Error) => {
      console.error("Errore durante l'aggiunta del pasto:", error);
      toast({
        title: "Errore",
        description: `Impossibile aggiungere il pasto: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Gestisce la selezione di un cibo predefinito
  const handleFoodPresetChange = (value: string) => {
    const selectedFood = commonFoods[value as keyof typeof commonFoods];
    
    if (selectedFood) {
      form.setValue('foodPreset', value);
      
      if (value !== 'custom') {
        form.setValue('food', selectedFood.name);
        form.setValue('calories', selectedFood.calories);
        form.setValue('proteins', selectedFood.proteins);
        form.setValue('carbs', selectedFood.carbs);
        form.setValue('fats', selectedFood.fats);
      }
    }
  };

  const onSubmit = async (values: MealFormValues) => {
    // Verifica che l'utente sia autenticato
    if (!userId) {
      toast({
        title: "Errore",
        description: "Devi effettuare l'accesso per aggiungere un pasto",
        variant: "destructive",
      });
      return;
    }
    
    // Log dei dati prima dell'invio
    console.log("Dati da inviare:", {
      userId,
      food: values.food,
      calories: Number(values.calories) || 0,
      proteins: Number(values.proteins) || 0,
      carbs: Number(values.carbs) || 0,
      fats: Number(values.fats) || 0,
      mealType: values.mealType,
      timestamp: new Date().toISOString()
    });
    
    // Invia i dati al server
    addMealMutation.mutate({
      userId: userId,
      food: values.food,
      calories: Number(values.calories) || 0,  // Assicura che sia un numero
      proteins: Number(values.proteins) || 0,
      carbs: Number(values.carbs) || 0,
      fats: Number(values.fats) || 0,
      mealType: values.mealType,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Aggiungi Nuovo Pasto</h2>
      </div>
      <div className="p-4">
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
                      {Object.entries(commonFoods).map(([key, food]) => (
                        <SelectItem key={key} value={key}>{food.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di Pasto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo di pasto" />
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
                  <FormLabel>Nome Alimento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="es., Insalata di pollo" />
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
                    <FormLabel>Calorie</FormLabel>
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