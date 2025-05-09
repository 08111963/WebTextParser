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
  name: z.string().min(1, "Name is required"),
  calories: z.coerce.number().min(1, "Calories must be greater than 0"),
  proteins: z.coerce.number().min(0, "Proteins cannot be negative"),
  carbs: z.coerce.number().min(0, "Carbs cannot be negative"),
  fats: z.coerce.number().min(0, "Fats cannot be negative"),
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

// Type for nutrition profile
type NutritionProfile = {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  description: string;
};

// Predefined nutrition profiles
const nutritionProfiles: Record<string, NutritionProfile> = {
  maintenance: { 
    name: "Maintenance", 
    calories: 2000, 
    proteins: 150, 
    carbs: 250, 
    fats: 65,
    description: "Balanced diet to maintain current body weight."
  },
  weightloss: { 
    name: "Weight loss", 
    calories: 1600, 
    proteins: 140, 
    carbs: 170, 
    fats: 50,
    description: "Caloric deficit diet for healthy weight loss."
  },
  muscle_gain: { 
    name: "Muscle gain", 
    calories: 2500, 
    proteins: 190, 
    carbs: 300, 
    fats: 70,
    description: "High-calorie diet to promote muscle growth."
  },
  low_carb: { 
    name: "Low carb", 
    calories: 1800, 
    proteins: 150, 
    carbs: 50, 
    fats: 120,
    description: "Diet with reduced carbohydrate intake."
  },
  keto: { 
    name: "Ketogenic", 
    calories: 1900, 
    proteins: 120, 
    carbs: 30, 
    fats: 140,
    description: "Ketogenic diet with high fat and very low carbohydrates."
  },
  mediterranean: { 
    name: "Mediterranean", 
    calories: 2100, 
    proteins: 110, 
    carbs: 270, 
    fats: 75,
    description: "Traditional Mediterranean diet based on unprocessed foods."
  },
  custom: { 
    name: "Custom", 
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
  
  // Function to apply a predefined profile
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
      
      // Prepare data for the API
      const goalData = {
        ...values,
        userId,
        // Convert dates to ISO format for the API
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };
      
      if (isEditing && goalId) {
        const response = await apiRequest('PATCH', `/api/nutrition-goals/${goalId}`, goalData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error updating the goal');
        }
        
        toast({
          title: "Goal updated",
          description: "Nutrition goal has been updated successfully.",
        });
      } else {
        const response = await apiRequest('POST', '/api/nutrition-goals', goalData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error creating the goal');
        }
        
        toast({
          title: "Goal created",
          description: "New nutrition goal created successfully.",
        });
      }
      
      // Invalidate queries to update data
      queryClient.invalidateQueries({queryKey: ['/api/nutrition-goals']});
      queryClient.invalidateQueries({queryKey: ['/api/nutrition-goals/active']});
      
      // Force refetch of the active goal to immediately update the interface
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
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit" : "Create"} Nutrition Goal</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Modify your nutritional targets" 
            : "Define a new nutrition intake goal"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormItem>
                <FormLabel>Predefined nutrition profile</FormLabel>
                <Select defaultValue="custom" onValueChange={applyNutritionProfile}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a predefined profile" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(nutritionProfiles).map(([key, profile]) => (
                      <SelectItem key={key} value={key}>{profile.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a predefined profile or customize values manually
                </p>
              </FormItem>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Maintenance diet" {...field} />
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
                    <FormLabel>Calories (kcal)</FormLabel>
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
                    <FormLabel>Proteins (g)</FormLabel>
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
                    <FormLabel>Carbs (g)</FormLabel>
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
                    <FormLabel>Fats (g)</FormLabel>
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
                    <FormLabel>Start date</FormLabel>
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
                              <span>Select a date</span>
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
                    <FormLabel>End date (optional)</FormLabel>
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
                              <span>Select a date</span>
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your goal..." 
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
                    <FormLabel>Active goal</FormLabel>
                    <CardDescription>
                      Set this as your current nutritional goal.
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
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create Goal"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}