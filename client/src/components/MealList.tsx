import { useState } from "react";
import { format, subDays } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Trash2, Lock } from "lucide-react";
import { useLocation } from "wouter";

type Meal = {
  id: number;
  userId: string;
  food: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  mealType: string;
  timestamp: string;
};

type MealListProps = {
  meals: Meal[];
  isLoading: boolean;
  userId: string;
};

// Map for meal types
const mealTypeMap: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack"
};

export default function MealList({ meals, isLoading, userId }: MealListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canAccess } = useSubscription();
  const [_, navigate] = useLocation();
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Verifica se l'utente ha accesso alla cronologia illimitata
  const hasFullHistory = canAccess("unlimited-meal-history");

  // Mutation to delete a meal
  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: number) => {
      const res = await apiRequest('DELETE', `/api/meals/${mealId}`);
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
        title: "Meal deleted",
        description: "The meal has been successfully deleted",
      });
      
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Unable to delete the meal: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handles deletion confirmation
  const handleDeleteConfirm = () => {
    if (mealToDelete) {
      deleteMealMutation.mutate(mealToDelete.id);
    }
  };

  // Opens the delete confirmation dialog
  const openDeleteDialog = (meal: Meal) => {
    setMealToDelete(meal);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meals || meals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No meals recorded</p>
      </div>
    );
  }

  // Filtra i pasti in base al piano dell'utente (solo 15 giorni per utenti free)
  const now = new Date();
  const limitDate = subDays(now, 15); // 15 giorni fa

  // Se l'utente non ha accesso alla cronologia completa, mostra solo i pasti degli ultimi 15 giorni
  const filteredMeals = hasFullHistory 
    ? meals 
    : meals.filter(meal => new Date(meal.timestamp) > limitDate);
    
  // Group meals by date
  const mealsByDate = filteredMeals.reduce((acc: Record<string, Meal[]>, meal) => {
    const date = format(new Date(meal.timestamp), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meal);
    return acc;
  }, {});

  // Sort dates from most recent to oldest
  const sortedDates = Object.keys(mealsByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div>
      {!hasFullHistory && (
        <div className="mb-6 p-4 border border-primary/20 rounded-lg bg-primary/5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1">Free Plan Limitation</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your meal history is limited to the last 15 days. Upgrade to Premium to unlock your complete meal history.
              </p>
            </div>
            <Button
              className="whitespace-nowrap w-full md:w-auto"
              onClick={() => navigate("/pricing")}
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      )}
      
      {sortedDates.map((date) => (
        <div key={date} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {format(new Date(date), "EEEE, d MMMM yyyy")}
          </h3>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Food</TableHead>
                  <TableHead className="text-right">Calories</TableHead>
                  <TableHead className="text-right">P/C/F</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mealsByDate[date].map((meal) => (
                  <TableRow key={meal.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {mealTypeMap[meal.mealType] || meal.mealType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{meal.food}</TableCell>
                    <TableCell className="text-right">{meal.calories} kcal</TableCell>
                    <TableCell className="text-right text-sm">
                      {meal.proteins}g / {meal.carbs}g / {meal.fats}g
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer"
                            onClick={() => openDeleteDialog(meal)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Dialog to confirm deletion */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the meal "{mealToDelete?.food}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMealMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMealMutation.isPending}
            >
              {deleteMealMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}