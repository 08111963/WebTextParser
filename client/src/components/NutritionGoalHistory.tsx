import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NutritionGoal } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpDown, History, Info, Loader2, Trash2, Edit, UserCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NutritionGoalForm from "./NutritionGoalForm";

type NutritionGoalHistoryProps = {
  userId: string;
};

export default function NutritionGoalHistory({ userId }: NutritionGoalHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingGoal, setEditingGoal] = useState<NutritionGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<NutritionGoal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(userId !== "0");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof NutritionGoal | null;
    direction: 'ascending' | 'descending';
  }>({
    key: 'createdAt',
    direction: 'descending'
  });

  // Retrieve all nutrition goals
  const { data: goals, isLoading, error, refetch } = useQuery<NutritionGoal[]>({
    queryKey: ['/api/nutrition-goals', userId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/nutrition-goals?userId=${userId}`);
      if (!res.ok) throw new Error('Unable to retrieve nutrition goals');
      return res.json();
    },
    enabled: !!userId && isUserAuthenticated,
  });

  // Funzione per ordinare gli obiettivi
  const requestSort = (key: keyof NutritionGoal) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Ordina gli obiettivi in base alla configurazione di ordinamento
  const sortedGoals = goals ? [...goals].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    // Gestione speciale per le date
    if (sortConfig.key === 'createdAt' || sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
      aValue = aValue ? new Date(aValue as string).getTime() : 0;
      bValue = bValue ? new Date(bValue as string).getTime() : 0;
    }
    
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  }) : [];

  // Mutazione per eliminare un obiettivo
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const res = await apiRequest('DELETE', `/api/nutrition-goals/${goalId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Errore durante l\'eliminazione dell\'obiettivo');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalida le query per ricaricare gli obiettivi
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-goals/active'] });
      
      toast({
        title: "Obiettivo eliminato",
        description: "L'obiettivo nutrizionale è stato eliminato con successo",
      });
      
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: `Impossibile eliminare l'obiettivo: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Gestisce il click sul pulsante di modifica
  const handleEditClick = (goal: NutritionGoal) => {
    setEditingGoal(goal);
    setEditDialogOpen(true);
  };

  // Apre il dialog di conferma eliminazione
  const openDeleteDialog = (goal: NutritionGoal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  // Gestisce la conferma di eliminazione
  const handleDeleteConfirm = () => {
    if (goalToDelete) {
      deleteGoalMutation.mutate(goalToDelete.id);
    }
  };

  // Callback dopo il salvataggio di un obiettivo
  const handleGoalUpdated = () => {
    setEditDialogOpen(false);
    setEditingGoal(null);
    refetch();
  };

  // Mostra lo stato di caricamento
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Goal History
          </CardTitle>
          <CardDescription>Your nutrition goal history</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading goals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostra un messaggio di autenticazione richiesta
  if (!isUserAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Goal History
          </CardTitle>
          <CardDescription>Your nutrition goal history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 border rounded-lg">
            <UserCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Sign in to View Goals</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Sign in or register to view and manage your nutrition goals.
            </p>
            <Button onClick={() => {
              toast({
                title: "Authentication required",
                description: "To view goal history, you need to sign in or register.",
                duration: 5000
              });
            }}>
              Sign in to Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostra un messaggio di errore
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Goal History
          </CardTitle>
          <CardDescription>Your nutrition goal history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/15 p-4 text-center">
            <p className="text-sm text-destructive">
              An error occurred while loading goals.
              <br />
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostra un messaggio quando non ci sono obiettivi
  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Goal History
          </CardTitle>
          <CardDescription>Your nutrition goal history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-6 text-center">
            <p className="text-muted-foreground">
              You haven't created any nutrition goals yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Goal History
        </CardTitle>
        <CardDescription>Your nutrition goal history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 hover:bg-transparent p-0"
                    onClick={() => requestSort('name')}
                  >
                    Name 
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 hover:bg-transparent p-0"
                    onClick={() => requestSort('calories')}
                  >
                    Calories 
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 hover:bg-transparent p-0"
                    onClick={() => requestSort('startDate')}
                  >
                    Start Date 
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1 hover:bg-transparent p-0"
                    onClick={() => requestSort('endDate')}
                  >
                    Data Fine 
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGoals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell className="font-medium">{goal.name}</TableCell>
                  <TableCell>{goal.calories} kcal</TableCell>
                  <TableCell>{format(new Date(goal.startDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    {goal.endDate ? format(new Date(goal.endDate), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {goal.isActive ? (
                      <Badge variant="default">Attivo</Badge>
                    ) : (
                      <Badge variant="outline">Inattivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">{goal.name}</h3>
                              <p className="text-sm text-muted-foreground">{goal.description || "Nessuna descrizione"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium">Calorie</h4>
                                <p>{goal.calories} kcal</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Proteine</h4>
                                <p>{goal.proteins} g</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Carboidrati</h4>
                                <p>{goal.carbs} g</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Grassi</h4>
                                <p>{goal.fats} g</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium">Data Inizio</h4>
                                <p>{format(new Date(goal.startDate), 'dd/MM/yyyy')}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Data Fine</h4>
                                <p>{goal.endDate ? format(new Date(goal.endDate), 'dd/MM/yyyy') : '-'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Stato</h4>
                              <p>{goal.isActive ? 'Attivo' : 'Inattivo'}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Creato</h4>
                              <p>{format(new Date(goal.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditClick(goal)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifica
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(goal)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Elimina
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Dialog per la modifica dell'obiettivo */}
        {editingGoal && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-xl">
              <NutritionGoalForm 
                userId={userId}
                isEditing={true}
                goalId={editingGoal.id}
                initialValues={{
                  name: editingGoal.name,
                  calories: editingGoal.calories,
                  proteins: editingGoal.proteins,
                  carbs: editingGoal.carbs,
                  fats: editingGoal.fats,
                  startDate: new Date(editingGoal.startDate),
                  endDate: editingGoal.endDate ? new Date(editingGoal.endDate) : undefined,
                  description: editingGoal.description || undefined,
                  isActive: editingGoal.isActive
                }}
                onSuccess={handleGoalUpdated}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog per confermare l'eliminazione */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conferma eliminazione</DialogTitle>
              <DialogDescription>
                Sei sicuro di voler eliminare l'obiettivo nutrizionale "{goalToDelete?.name}"?
                Questa azione non può essere annullata.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteGoalMutation.isPending}
              >
                Annulla
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={deleteGoalMutation.isPending}
              >
                {deleteGoalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminazione...
                  </>
                ) : (
                  "Elimina"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}