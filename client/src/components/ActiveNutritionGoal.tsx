import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, CalendarRange, Edit, Info, Loader2 } from "lucide-react";
import NutritionGoalForm from "./NutritionGoalForm";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NutritionGoal } from "@shared/schema";

type ActiveNutritionGoalProps = {
  userId: string;
  dailyCalories?: number;
  dailyProteins?: number;
  dailyCarbs?: number;
  dailyFats?: number;
};

export default function ActiveNutritionGoal({ 
  userId,
  dailyCalories = 0,
  dailyProteins = 0,
  dailyCarbs = 0,
  dailyFats = 0
}: ActiveNutritionGoalProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch active goal data
  const { data: activeGoal, isLoading, error } = useQuery<NutritionGoal | null>({
    queryKey: ['/api/nutrition-goals/active', userId],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/nutrition-goals/active?userId=${userId}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch nutrition goal');
        return res.json();
      } catch (error) {
        console.error('Error fetching active goal:', error);
        return null;
      }
    },
    enabled: !!userId,
  });
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Obiettivo Nutrizionale</CardTitle>
          <CardDescription>Caricamento in corso...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (error || !activeGoal) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Obiettivo Nutrizionale</CardTitle>
          <CardDescription>
            {error 
              ? "Si è verificato un errore nel caricamento dell'obiettivo."
              : "Nessun obiettivo nutrizionale attivo."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Crea un obiettivo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <NutritionGoalForm userId={userId} />
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    );
  }
  
  const caloriePercentage = Math.min(Math.round((dailyCalories / activeGoal.calories) * 100), 100);
  const proteinsPercentage = Math.min(Math.round((dailyProteins / activeGoal.proteins) * 100), 100);
  const carbsPercentage = Math.min(Math.round((dailyCarbs / activeGoal.carbs) * 100), 100);
  const fatsPercentage = Math.min(Math.round((dailyFats / activeGoal.fats) * 100), 100);
  
  const startDate = new Date(activeGoal.startDate);
  const endDate = activeGoal.endDate ? new Date(activeGoal.endDate) : null;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{activeGoal.name}</CardTitle>
            <CardDescription>
              <div className="flex items-center space-x-2">
                <CalendarRange className="h-3.5 w-3.5" />
                <span>
                  {format(startDate, "dd/MM/yyyy")}
                  {endDate && ` - ${format(endDate, "dd/MM/yyyy")}`}
                </span>
              </div>
            </CardDescription>
          </div>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <NutritionGoalForm 
                userId={userId}
                initialValues={{
                  name: activeGoal.name,
                  calories: activeGoal.calories,
                  proteins: activeGoal.proteins,
                  carbs: activeGoal.carbs,
                  fats: activeGoal.fats,
                  startDate: startDate,
                  endDate: endDate || undefined,
                  description: activeGoal.description || "",
                  isActive: activeGoal.isActive
                }}
                isEditing={true}
                goalId={activeGoal.id}
                onSuccess={() => {
                  setEditDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Calorie</span>
              <span className="text-muted-foreground">{dailyCalories} / {activeGoal.calories} kcal</span>
            </div>
            <Progress value={caloriePercentage} className="h-2" 
              color={caloriePercentage > 100 ? "bg-red-500" : ""} />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Proteine</span>
              <span className="text-muted-foreground">{dailyProteins} / {activeGoal.proteins} g</span>
            </div>
            <Progress value={proteinsPercentage} className="h-2 bg-muted" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Carboidrati</span>
              <span className="text-muted-foreground">{dailyCarbs} / {activeGoal.carbs} g</span>
            </div>
            <Progress value={carbsPercentage} className="h-2 bg-muted" />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Grassi</span>
              <span className="text-muted-foreground">{dailyFats} / {activeGoal.fats} g</span>
            </div>
            <Progress value={fatsPercentage} className="h-2 bg-muted" />
          </div>
        </div>
        
        {activeGoal.description && (
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1 font-medium">
              <Info className="h-3.5 w-3.5" />
              <span>Descrizione:</span>
            </div>
            <p className="mt-1">{activeGoal.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}