import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

type NutritionSummaryProps = {
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
};

export default function NutritionSummary({ 
  totalCalories, 
  totalProteins, 
  totalCarbs, 
  totalFats 
}: NutritionSummaryProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Proteins', 'Carbs', 'Fats'],
        datasets: [{
          data: [totalProteins, totalCarbs, totalFats],
          backgroundColor: ['#4CAF50', '#2196F3', '#FF9800']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [totalProteins, totalCarbs, totalFats]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Nutrition Summary</h2>
      </div>
      <div className="p-4">
        <div className="space-y-2 mb-4">
          <p className="font-medium">Total Calories: {totalCalories}</p>
          <p className="font-medium">Total Proteins: {totalProteins}g</p>
          <p className="font-medium">Total Carbs: {totalCarbs}g</p>
          <p className="font-medium">Total Fats: {totalFats}g</p>
        </div>
        <div>
          <canvas ref={chartRef} width="100%" height="200"></canvas>
        </div>
      </div>
    </div>
  );
}
