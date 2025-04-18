import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Bolt, PieChart, Calendar, Plus, BarChart3, User } from 'lucide-react';

export default function Welcome() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
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
              onClick={() => navigate('/auth')} 
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Accedi per iniziare
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">Esplora l'App</h2>
            <p className="text-gray-600 mb-4">Guarda come l'app può aiutarti a raggiungere i tuoi obiettivi nutrizionali.</p>
            <Button 
              onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })} 
              variant="outline"
              className="border border-primary text-primary hover:bg-primary/10 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Vedi Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo-section" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Ecco come funziona NutriFacile</h2>
          
          {/* Feature 1 - Dashboard */}
          <div className="flex flex-col md:flex-row items-center mb-16">
            <div className="md:w-1/2 p-4">
              <h3 className="text-2xl font-semibold mb-4">Dashboard Nutrizionale</h3>
              <p className="text-lg text-gray-700 mb-4">
                Visualizza in modo chiaro e intuitivo il tuo apporto giornaliero di calorie e nutrienti con grafici interattivi.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <PieChart className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-gray-700">Analisi dettagliata di proteine, carboidrati e grassi</span>
              </div>
            </div>
            <div className="md:w-1/2 p-6 bg-white rounded-lg shadow-lg mt-6 md:mt-0">
              {/* Mock Dashboard UI */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Riepilogo Nutrienti</h4>
                  <span className="text-sm text-gray-500">Oggi</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">1450</div>
                    <div className="text-sm text-gray-600">Calorie</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">85g</div>
                    <div className="text-sm text-gray-600">Proteine</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">120g</div>
                    <div className="text-sm text-gray-600">Carboidrati</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">45g</div>
                    <div className="text-sm text-gray-600">Grassi</div>
                  </div>
                </div>
                <div className="h-36 flex items-end">
                  <div className="w-1/4 h-24 bg-green-200 rounded-t-md mx-1"></div>
                  <div className="w-1/4 h-32 bg-green-300 rounded-t-md mx-1"></div>
                  <div className="w-1/4 h-16 bg-green-400 rounded-t-md mx-1"></div>
                  <div className="w-1/4 h-28 bg-green-500 rounded-t-md mx-1"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature 2 - Meal Tracking */}
          <div className="flex flex-col md:flex-row-reverse items-center mb-16">
            <div className="md:w-1/2 p-4">
              <h3 className="text-2xl font-semibold mb-4">Registrazione Pasti Semplice</h3>
              <p className="text-lg text-gray-700 mb-4">
                Aggiungi facilmente i tuoi pasti con una semplice interfaccia. Inserisci i dettagli nutrizionali o cerca negli alimenti comuni.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-gray-700">Registra colazione, pranzo, cena e spuntini</span>
              </div>
            </div>
            <div className="md:w-1/2 p-6 bg-white rounded-lg shadow-lg mt-6 md:mt-0">
              {/* Mock Meal Entry UI */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Aggiungi Pasto</h4>
                  <span className="text-sm text-primary">Pranzo</span>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="p-2 border border-gray-200 rounded-md">
                    <div className="font-medium">Insalata di pollo</div>
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>320 kcal</span>
                      <span>32g proteine</span>
                      <span>12g grassi</span>
                    </div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded-md">
                    <div className="font-medium">Pane integrale</div>
                    <div className="text-sm text-gray-600 flex justify-between">
                      <span>80 kcal</span>
                      <span>3g proteine</span>
                      <span>15g carboidrati</span>
                    </div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center text-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Aggiungi alimento</span>
                  </div>
                </div>
                <button className="w-full bg-primary text-white py-2 rounded-md">Salva Pasto</button>
              </div>
            </div>
          </div>
          
          {/* Feature 3 - Progress */}
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 p-4">
              <h3 className="text-2xl font-semibold mb-4">Monitora i Tuoi Progressi</h3>
              <p className="text-lg text-gray-700 mb-4">
                Visualizza i tuoi progressi nel tempo con grafici dettagliati e statistiche che mostrano le tue abitudini alimentari.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-gray-700">Analizza i trend settimanali e mensili</span>
              </div>
            </div>
            <div className="md:w-1/2 p-6 bg-white rounded-lg shadow-lg mt-6 md:mt-0">
              {/* Mock Progress Charts */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Statistiche Settimanali</h4>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">Calorie</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Proteine</span>
                  </div>
                </div>
                <div className="h-48 flex items-end space-x-1">
                  {[60, 75, 45, 90, 65, 80, 70].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary/80 rounded-t-sm" 
                        style={{height: `${height}%`}}
                      ></div>
                      <div className="text-xs mt-1">{['L', 'M', 'M', 'G', 'V', 'S', 'D'][index]}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                  Media settimanale: 1820 calorie
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary text-white py-12 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Pronto per iniziare?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Registrati ora e inizia subito a tracciare la tua nutrizione per raggiungere i tuoi obiettivi di salute.
          </p>
          <Button 
            onClick={() => navigate('/login')} 
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-md text-lg"
          >
            Inizia Gratis
          </Button>
        </div>
      </div>
    </div>
  );
}