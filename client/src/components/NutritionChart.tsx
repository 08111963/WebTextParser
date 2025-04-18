import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp } from "lucide-react";

type NutritionChartProps = {
  userId: string;
};

type MealData = {
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

type ChartData = {
  date: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

export default function NutritionChart({ userId }: NutritionChartProps) {
  const [period, setPeriod] = useState<"7" | "14" | "30">("7");
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Calcola la data di inizio in base al periodo selezionato
  const calculateStartDate = () => {
    const today = new Date();
    return subDays(today, parseInt(period));
  };

  // Fetch dei pasti per il periodo selezionato
  const { data: meals, isLoading, error } = useQuery<MealData[]>({
    queryKey: ['/api/meals', userId, period],
    queryFn: async () => {
      const startDate = calculateStartDate();
      const endDate = new Date();
      
      const res = await apiRequest(
        'GET',
        `/api/meals?userId=${userId}&startDate=${startOfDay(startDate).toISOString()}&endDate=${endOfDay(endDate).toISOString()}`
      );
      
      if (!res.ok) throw new Error('Impossibile recuperare i dati dei pasti');
      return res.json();
    },
    enabled: !!userId,
  });

  // Prepara i dati per il grafico ogni volta che cambiano i pasti o il periodo
  useEffect(() => {
    if (!meals) return;

    // Crea un map per raggruppare i pasti per data
    const mealsByDate = new Map<string, ChartData>();
    
    // Inizializza le date per il periodo selezionato
    const startDate = calculateStartDate();
    const today = new Date();
    
    // Crea voci vuote per tutte le date nel periodo
    for (let i = 0; i <= parseInt(period); i++) {
      const date = subDays(today, i);
      const dateKey = format(date, "yyyy-MM-dd");
      mealsByDate.set(dateKey, {
        date: format(date, "dd/MM"),
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0
      });
    }
    
    // Aggrega i dati per ogni pasto
    meals.forEach(meal => {
      const mealDate = new Date(meal.timestamp);
      const dateKey = format(mealDate, "yyyy-MM-dd");
      
      if (mealsByDate.has(dateKey)) {
        const existingData = mealsByDate.get(dateKey)!;
        mealsByDate.set(dateKey, {
          ...existingData,
          calories: existingData.calories + meal.calories,
          proteins: existingData.proteins + meal.proteins,
          carbs: existingData.carbs + meal.carbs,
          fats: existingData.fats + meal.fats
        });
      }
    });
    
    // Converti la mappa in un array ordinato per data
    const sortedData = Array.from(mealsByDate.values())
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA.getTime() - dateB.getTime();
      });
    
    setChartData(sortedData);
  }, [meals, period]);

  // Gestisce il cambio di periodo
  const handlePeriodChange = (value: string) => {
    setPeriod(value as "7" | "14" | "30");
  };

  // Personalizzazione del tooltip per il grafico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold mb-1">{`${label}`}</p>
          <div className="space-y-1">
            <p style={{ color: "#8884d8" }}>{`Calorie: ${payload[0].value} kcal`}</p>
            <p style={{ color: "#82ca9d" }}>{`Proteine: ${payload[1].value} g`}</p>
            <p style={{ color: "#ffc658" }}>{`Carboidrati: ${payload[2].value} g`}</p>
            <p style={{ color: "#ff8042" }}>{`Grassi: ${payload[3].value} g`}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Andamento Nutrizionale
          </CardTitle>
          <CardDescription>
            Monitora il tuo consumo nel tempo
          </CardDescription>
        </div>
        <Select
          value={period}
          onValueChange={handlePeriodChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 giorni</SelectItem>
            <SelectItem value="14">14 giorni</SelectItem>
            <SelectItem value="30">30 giorni</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-72">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>Si è verificato un errore nel caricamento dei dati</p>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#888888"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#888888"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  name="Calorie"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="proteins"
                  name="Proteine"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="carbs"
                  name="Carboidrati"
                  stroke="#ffc658"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fats"
                  name="Grassi"
                  stroke="#ff8042"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nessun dato disponibile per il periodo selezionato</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}