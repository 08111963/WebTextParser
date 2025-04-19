import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, MoreVertical, Trash2 } from "lucide-react";

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
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Mutazione per eliminare un pasto
  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: number) => {
      const res = await apiRequest('DELETE', `/api/meals/${mealId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Errore durante l\'eliminazione del pasto');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalida la query per ricaricare i pasti
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
      
      toast({
        title: "Pasto eliminato",
        description: "Il pasto è stato eliminato con successo",
      });
      
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Impossibile eliminare il pasto: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Gestisce la conferma di eliminazione
  const handleDeleteConfirm = () => {
    if (mealToDelete) {
      deleteMealMutation.mutate(mealToDelete.id);
    }
  };

  // Apre il dialog di conferma eliminazione
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

  // Group meals by date
  const mealsByDate = meals.reduce((acc: Record<string, Meal[]>, meal) => {
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