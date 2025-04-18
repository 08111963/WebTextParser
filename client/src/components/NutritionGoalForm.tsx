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
import { CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

export default function NutritionGoalForm({ 
  userId, 
  onSuccess, 
  initialValues, 
  isEditing = false,
  goalId
}: NutritionGoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
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
  
  const onSubmit = async (values: NutritionGoalValues) => {
    try {
      setIsSubmitting(true);
      
      // Formattiamo le date come stringhe
      const formattedValues = {
        ...values,
        userId,
        startDate: format(values.startDate, "yyyy-MM-dd"),
        endDate: values.endDate ? format(values.endDate, "yyyy-MM-dd") : undefined
      };
      
      if (isEditing && goalId) {
        await apiRequest(`/api/nutrition-goals/${goalId}`, {
          method: "PATCH",
          body: JSON.stringify(formattedValues),
        });
        toast({
          title: "Obiettivo aggiornato",
          description: "L'obiettivo nutrizionale è stato aggiornato con successo.",
        });
      } else {
        await apiRequest("/api/nutrition-goals", {
          method: "POST",
          body: JSON.stringify(formattedValues),
        });
        toast({
          title: "Obiettivo creato",
          description: "Nuovo obiettivo nutrizionale creato con successo.",
        });
      }
      
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
        description: "Si è verificato un errore. Riprova più tardi.",
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