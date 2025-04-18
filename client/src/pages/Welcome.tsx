import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Bolt } from 'lucide-react';

export default function Welcome() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6">
          <Bolt className="h-20 w-20 text-primary mx-auto" />
          <h1 className="text-4xl font-bold text-primary mt-4">Benvenuto su NutriFacile</h1>
          <p className="text-xl text-gray-600 mt-2 max-w-md mx-auto">
            Monitora la tua nutrizione, raggiungi i tuoi obiettivi e mantieni uno stile di vita sano.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-w-xl w-full mt-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">Traccia i tuoi pasti</h2>
            <p className="text-gray-600 mb-4">Registra facilmente ciò che mangi e monitora le calorie e i nutrienti.</p>
            <Button 
              onClick={() => navigate('/login')} 
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Accedi per iniziare
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">Impara di più</h2>
            <p className="text-gray-600 mb-4">Scopri come NutriFacile può aiutarti a raggiungere i tuoi obiettivi.</p>
            <Button 
              onClick={() => navigate('/info')} 
              variant="outline"
              className="border border-primary text-primary hover:bg-primary/10 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Informazioni
            </Button>
          </div>
        </div>
        
        <div className="mt-8 max-w-xl text-center">
          <p className="text-gray-600">
            NutriFacile ti aiuta a prendere decisioni alimentari consapevoli fornendoti insight dettagliati
            sul valore nutrizionale dei tuoi pasti.
          </p>
        </div>
      </div>
    </div>
  );
}