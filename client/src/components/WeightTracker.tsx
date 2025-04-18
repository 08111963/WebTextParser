import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const weightEntrySchema = z.object({
  date: z.date(),
  weight: z.coerce.number().min(20, "Il peso deve essere maggiore di 20 kg").max(300, "Il peso deve essere minore di 300 kg"),
  notes: z.string().optional()
});

type WeightEntryValues = z.infer<typeof weightEntrySchema>;

type WeightTrackerProps = {
  userId: string;
};

export default function WeightTracker({ userId }: WeightTrackerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [weightEntries, setWeightEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Funzione per recuperare le voci di peso
  const fetchWeightEntries = async () => {
    try {
      setIsLoading(true);
      const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");
      
      const response = await fetch(`/api/progress?userId=${userId}&startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWeightEntries(data || []);
    } catch (err) {
      console.error("Failed to fetch weight entries:", err);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il caricamento dei dati di peso.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carica le voci di peso quando il componente viene montato o cambia userId
  useEffect(() => {
    if (userId) {
      fetchWeightEntries();
    }
  }, [userId]);
  
  // Funzione per creare una voce di peso
  const createWeightEntry = async (values: WeightEntryValues & { userId: string }) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          date: format(values.date, "yyyy-MM-dd"),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      await fetchWeightEntries();
      setDialogOpen(false);
      toast({
        title: "Peso registrato",
        description: "Il tuo peso è stato registrato con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione del peso.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Funzione per eliminare una voce di peso
  const deleteWeightEntry = async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/progress/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      await fetchWeightEntries();
      toast({
        title: "Peso eliminato",
        description: "Il tuo record di peso è stato eliminato con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione del peso.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const form = useForm<WeightEntryValues>({
    resolver: zodResolver(weightEntrySchema),
    defaultValues: {
      date: new Date(),
      weight: undefined,
      notes: ""
    },
  });
  
  const onSubmit = (values: WeightEntryValues) => {
    createWeightEntry({ ...values, userId });
  };
  
  // Format data for the chart
  const chartData = weightEntries
    .filter(entry => entry.weight !== null)
    .map(entry => ({
      date: format(new Date(entry.date), "dd/MM"),
      weight: entry.weight / 1000, // Convert from grams to kg
      id: entry.id
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate min and max for Y axis
  const weights = chartData.map(item => item.weight);
  const minWeight = weights.length ? Math.floor(Math.min(...weights) - 2) : 50;
  const maxWeight = weights.length ? Math.ceil(Math.max(...weights) + 2) : 100;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Tracciamento Peso</CardTitle>
            <CardDescription>Monitora il tuo peso nel tempo</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <PlusCircle className="h-4 w-4 mr-1" />
                Aggiungi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registra il tuo peso</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
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
                              disabled={(date) => date > new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="Es: 75.5" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note (opzionale)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Es: Dopo allenamento" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Salvataggio..." : "Salva"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">Caricamento dati...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">Nessun dato di peso disponibile.</p>
            <p className="text-sm text-muted-foreground">Clicca su "Aggiungi" per registrare il tuo peso.</p>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  domain={[minWeight, maxWeight]}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="font-medium">Data:</div>
                            <div>{payload[0].payload.date}</div>
                            <div className="font-medium">Peso:</div>
                            <div>{payload[0].value} kg</div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => deleteWeightEntry(payload[0].payload.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      {weightEntries.length > 0 && (
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm">
            <span className="font-medium">Ultimo peso: </span>
            <span>
              {weightEntries
                .filter(entry => entry.weight !== null)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.weight / 1000 || '-'} kg
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Registrazioni: </span>
            <span>{weightEntries.filter(entry => entry.weight !== null).length}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}