import { useState, useRef } from 'react';
import Header from '@/components/Header';
import MealForm from '@/components/MealForm';
import NutritionSummary from '@/components/NutritionSummary';
import FilterSelect from '@/components/FilterSelect';
import MealEntry from '@/components/MealEntry';
import MealPlan from '@/components/MealPlan';
import ActiveNutritionGoal from '@/components/ActiveNutritionGoal';
import WeightTracker from '@/components/WeightTracker';
import Chart from 'chart.js/auto';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

// Helper per trasformare una data stringa in un oggetto Date
function createDate(dateString: string): Date {
  return new Date(dateString);
}

// Versione temporanea semplificata di Home
export default function Home() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('week');
  
  // Se l'utente non è autenticato, mostriamo un caricamento
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // Per ora mostriamo una versione semplificata dell'interfaccia
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Benvenuto, {user.username}!</h1>
          <p className="text-gray-600">
            Il sistema è in fase di migrazione da Firebase a PostgreSQL.
            Presto tutte le funzionalità saranno nuovamente disponibili.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Riepilogo Account</h2>
            <div className="space-y-2">
              <p><strong>ID Utente:</strong> {user.id}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Stato Migrazione</h2>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Autenticazione con PostgreSQL
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Protezione route API
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Migrazione dati pasti in corso...
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Migrazione obiettivi nutrizionali in corso...
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
