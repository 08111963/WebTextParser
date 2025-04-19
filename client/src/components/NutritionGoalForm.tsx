import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const nutritionGoalSchema = z.object({
  name: z.string().min(1, "Il nome è richiesto"),
  calories: z.coerce.number().min(1, "Le calorie devono essere maggiori di 0"),
  proteins: z.coerce.number().min(0, "Le proteine non possono essere negative"),
  carbs: z.coerce.number().min(0, "I carboidrati non possono essere negativi"),
  fats: z.coerce.number().min(0, "I grassi non possono essere negativi"),
  startDate: z.date(),
  endDate: z.date().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type NutritionGoalValues = z.infer<typeof nutritionGoalSchema>;

type NutritionGoalFormProps = {
  userId: string;
  onSuccess?: () => void;
  initialValues?: Partial<NutritionGoalValues>;
  isEditing?: boolean;
  goalId?: number;
};

// Tipo per il profilo nutrizionale
type NutritionProfile = {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  description: string;
};

// Profili nutrizionali predefiniti
const nutritionProfiles: Record<string, NutritionProfile> = {
  maintenance: { 
    name: "Mantenimento", 
    calories: 2000, 
    proteins: 150, 
    carbs: 250, 
    fats: 65,
    description: "Dieta bilanciata per mantenere il peso corporeo attuale."
  },
  weightloss: { 
    name: "Perdita di peso", 
    calories: 1600, 
    proteins: 140, 
    carbs: 170, 
    fats: 50,
    description: "Dieta con deficit calorico per perdere peso in modo sano."
  },
  muscle_gain: { 
    name: "Aumento massa muscolare", 
    calories: 2500, 
    proteins: 190, 
    carbs: 300, 
    fats: 70,
    description: "Dieta ipercalorica per favorire l'aumento della massa muscolare."
  },
  low_carb: { 
    name: "Low carb", 
    calories: 1800, 
    proteins: 150, 
    carbs: 50, 
    fats: 120,
    description: "Dieta a basso contenuto di carboidrati."
  },
  keto: { 
    name: "Chetogenica", 
    calories: 1900, 
    proteins: 120, 
    carbs: 30, 
    fats: 140,
    description: "Dieta chetogenica con alte quantità di grassi e pochissimi carboidrati."
  },
  mediterranean: { 
    name: "Mediterranea", 
    calories: 2100, 
    proteins: 110, 
    carbs: 270, 
    fats: 75,
    description: "Traditional Mediterranean diet based on unprocessed foods."
  },
  custom: { 
    name: "Personalizzato", 
    calories: 2000, 
    proteins: 150, 
    carbs: 200, 
    fats: 65,
    description: ""
  }
};

export default function NutritionGoalForm({ 
  userId, 
  onSuccess, 
  initialValues, 
  isEditing = false,
  goalId
}: NutritionGoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultValues: Partial<NutritionGoalValues> = {
    name: "",
    calories: 2000,
    proteins: 150,
    carbs: 200,
    fats: 65,
    startDate: new Date(),
    description: "",
    isActive: true,
    ...initialValues
  };
  
  const form = useForm<NutritionGoalValues>({
    resolver: zodResolver(nutritionGoalSchema),
    defaultValues,
  });
  
  // Funzione per applicare un profilo predefinito
  const applyNutritionProfile = (profileKey: string) => {
    if (profileKey === 'custom') return;
    
    const profile = nutritionProfiles[profileKey];
    
    form.setValue('name', profile.name);
    form.setValue('calories', profile.calories);
    form.setValue('proteins', profile.proteins);
    form.setValue('carbs', profile.carbs);
    form.setValue('fats', profile.fats);
    form.setValue('description', profile.description);
  };
  
  const onSubmit = async (values: NutritionGoalValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepara i dati per l'API
      const goalData = {
        ...values,
        userId,
        // Converti le date in formato ISO per l'API
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };
      
      if (isEditing && goalId) {
        const response = await apiRequest('PATCH', `/api/nutrition-goals/${goalId}`, goalData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Errore durante l\'aggiornamento dell\'obiettivo');
        }
        
        toast({
          title: "Obiettivo aggiornato",
          description: "L'obiettivo nutrizionale è stato aggiornato con successo.",
        });
      } else {
        const response = await apiRequest('POST', '/api/nutrition-goals', goalData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Errore durante la creazione dell\'obiettivo');
        }
        
        toast({
          title: "Obiettivo creato",
          description: "Nuovo obiettivo nutrizionale creato con successo.",
        });
      }
      
      // Invalida le query per aggiornare i dati
      queryClient.invalidateQueries({queryKey: ['/api/nutrition-goals']});
      queryClient.invalidateQueries({queryKey: ['/api/nutrition-goals/active']});
      
      // Forza il refetch dell'obiettivo attivo per aggiornare l'interfaccia immediatamente
      queryClient.refetchQueries({queryKey: ['/api/nutrition-goals/active', userId]});
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (!isEditing) {
        form.reset(defaultValues);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Modifica" : "Crea"} Obiettivo Nutrizionale</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Modifica le tue mete nutrizionali" 
            : "Definisci un nuovo obiettivo di assunzione nutrizionale"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormItem>
                <FormLabel>Profilo nutrizionale predefinito</FormLabel>
                <Select defaultValue="custom" onValueChange={applyNutritionProfile}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un profilo predefinito" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(nutritionProfiles).map(([key, profile]) => (
                      <SelectItem key={key} value={key}>{profile.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Scegli un profilo predefinito oppure personalizza i valori manualmente
                </p>
              </FormItem>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome dell'obiettivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Dieta di mantenimento" {...field} />
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data di inizio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Seleziona una data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data di fine (opzionale)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Seleziona una data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => 
                            date < (form.getValues("startDate") || new Date())
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrivi il tuo obiettivo..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Obiettivo attivo</FormLabel>
                    <CardDescription>
                      Imposta questo obiettivo come il tuo obiettivo nutrizionale attuale.
                    </CardDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : isEditing ? "Aggiorna" : "Crea Obiettivo"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}