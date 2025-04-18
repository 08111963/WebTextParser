import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import MealForm from '@/components/MealForm';
import NutritionSummary from '@/components/NutritionSummary';
import FilterSelect from '@/components/FilterSelect';
import MealEntry from '@/components/MealEntry';
import MealPlan from '@/components/MealPlan';
import ActiveNutritionGoal from '@/components/ActiveNutritionGoal';
import WeightTracker from '@/components/WeightTracker';
import Chart from 'chart.js/auto';

type HomeProps = {
  user: {
    uid: string;
    email: string | null;
    emailVerified: boolean;
  };
};

// Helper per trasformare una data stringa in un oggetto Date
function createDate(dateString: string): Date {
  return new Date(dateString);
}

type Meal = {
  id: string;
  userId: string;
  food: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  mealType: string;
  timestamp: string;
};

export default function Home({ user }: HomeProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filter, setFilter] = useState('week');
  const [total, setTotal] = useState({
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0
  });
  
  const avgChartRef = useRef<HTMLCanvasElement>(null);
  const avgChartInstance = useRef<Chart | null>(null);

  // Load meals based on filter
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        let url = `/api/meals?userId=${user.uid}`;
        
        if (filter !== 'all') {
          const days = filter === 'week' ? 7 : parseInt(filter);
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          
          url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const fetchedMeals = await response.json();
        
        // Trasformiamo i dati per assicurarci che siano nel formato corretto
        const processedMeals = fetchedMeals.map((meal: any) => ({
          ...meal,
          id: meal.id.toString() // Assicuriamoci che l'ID sia una stringa
        }));
        
        setMeals(processedMeals);
      } catch (error) {
        console.error("Error fetching meals:", error);
      }
    };
    
    fetchMeals();
  }, [user.uid, filter]);
  
  // Calculate totals when meals change
  useEffect(() => {
    const newTotal = meals.reduce(
      (acc, meal) => {
        return {
          calories: acc.calories + meal.calories,
          proteins: acc.proteins + meal.proteins,
          carbs: acc.carbs + meal.carbs,
          fats: acc.fats + meal.fats
        };
      },
      { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    );
    
    setTotal(newTotal);
  }, [meals]);
  
  // Update daily average chart
  useEffect(() => {
    if (!avgChartRef.current) return;
    
    // Get unique days count
    const uniqueDays = new Set(
      meals.map(meal => {
        const date = createDate(meal.timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    ).size;
    
    const totalDays = uniqueDays || 1; // Prevent division by zero
    
    // Calcola i valori medi come numeri
    const averageCalories = parseFloat((total.calories / totalDays).toFixed(1));
    const averageProteins = parseFloat((total.proteins / totalDays).toFixed(1));
    const averageCarbs = parseFloat((total.carbs / totalDays).toFixed(1));
    const averageFats = parseFloat((total.fats / totalDays).toFixed(1));
    
    // Destroy existing chart if it exists
    if (avgChartInstance.current) {
      avgChartInstance.current.destroy();
    }
    
    const ctx = avgChartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create new chart with numeric data
    avgChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Calories', 'Proteins', 'Carbs', 'Fats'],
        datasets: [{
          label: 'Daily Average',
          data: [averageCalories, averageProteins, averageCarbs, averageFats] as number[],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { 
            beginAtZero: true 
          }
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (avgChartInstance.current) {
        avgChartInstance.current.destroy();
      }
    };
  }, [total, meals]);
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="md:w-1/3 lg:w-1/4 bg-white p-4 overflow-y-auto h-full md:border-r border-gray-200">
          <MealForm userId={user.uid} />
          
          <NutritionSummary
            totalCalories={total.calories}
            totalProteins={total.proteins}
            totalCarbs={total.carbs}
            totalFats={total.fats}
          />
          
          <div className="mt-4">
            <ActiveNutritionGoal 
              userId={user.uid}
              dailyCalories={total.calories}
              dailyProteins={total.proteins}
              dailyCarbs={total.carbs}
              dailyFats={total.fats}
            />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:w-2/3 lg:w-3/4 p-4 overflow-y-auto bg-gray-50">
          <FilterSelect onFilterChange={setFilter} />
          
          {/* Daily Average Chart */}
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold">Daily Average</h2>
            </div>
            <div className="p-4">
              <canvas ref={avgChartRef} width="100%" height="250"></canvas>
            </div>
          </div>
          
          {/* Meal Entries */}
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold">Meal Entries</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {meals.length > 0 ? (
                meals.map(meal => (
                  <MealEntry
                    key={meal.id}
                    id={meal.id}
                    userId={user.uid}
                    mealType={meal.mealType}
                    food={meal.food}
                    calories={meal.calories}
                    proteins={meal.proteins}
                    carbs={meal.carbs}
                    fats={meal.fats}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No meal entries found. Start by adding a meal.
                </div>
              )}
            </div>
          </div>
          
          <MealPlan userId={user.uid} />
          
          {/* Weight Tracker */}
          <div className="mt-4">
            <WeightTracker userId={user.uid} />
          </div>
        </div>
      </div>
    </div>
  );
}
