import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Bolt, PieChart, Calendar, Plus, BarChart3, User, Lock, UserRound, Shield } from 'lucide-react';
import { useConditionalNavigation } from '@/lib/conditional-route';
import PremiumFeature from '@/components/PremiumFeature';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Welcome() {
  const [location, navigate] = useLocation();
  const { navigateTo, LoginDialog } = useConditionalNavigation();
  const { user, adminAccessMutation } = useAuth();
  const [adminCode, setAdminCode] = useState('');
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [keySequence, setKeySequence] = useState('');
  
  // Gestione dei parametri nella query string
  useEffect(() => {
    // Verifica se ci sono parametri nella query string
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    const viewMode = params.get('view');
    
    // Se c'è un parametro section e viewMode=demo, reindirizza alla pagina Home con i parametri corretti
    if (section && (section === 'meals' || section === 'goals' || section === 'dashboard') && viewMode === 'demo') {
      // Reindirizza alla Home con i parametri per mantenere la modalità demo
      navigate(`/home?section=${section}&view=demo`);
    }
  }, [location, navigate]);
  
  const handleAdminAccess = () => {
    adminAccessMutation.mutate({ code: adminCode });
    setShowAdminDialog(false);
  };

  // Implementazione del rilevamento combinazione tasti segreta
  useEffect(() => {
    const secretCode = 'admin2024';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Aggiungi il tasto premuto alla sequenza
      const updatedSequence = keySequence + e.key;
      
      // Conserva solo gli ultimi n caratteri della sequenza dove n è la lunghezza del codice segreto
      const newSequence = updatedSequence.slice(-secretCode.length);
      setKeySequence(newSequence);
      
      // Verifica se la sequenza corrisponde al codice segreto
      if (newSequence === secretCode) {
        setShowAdminDialog(true);
        setKeySequence('');  // Reset della sequenza dopo l'attivazione
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Pulizia dell'event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keySequence]);

  return (
    <div className="flex flex-col min-h-screen">
      <LoginDialog />
      {/* Header Section */}
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6">
          <Bolt className="h-20 w-20 text-primary mx-auto" />
          <h1 className="text-4xl font-bold text-primary mt-4">Welcome to NutriEasy - Smart Nutrition & Meal Planning</h1>
          <p className="text-xl text-gray-600 mt-2 max-w-md mx-auto">
            Your AI-powered nutrition assistant to track meals, analyze nutrients, and achieve your health goals with personalized meal plans.
          </p>
          <div className="mt-6 space-y-3">
            <div>
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg"
                className="bg-primary border-2 border-primary text-white hover:bg-primary/90 font-bold px-8 py-2 rounded-md"
              >
                Register Now
              </Button>
            </div>
            <div>
              <Button 
                onClick={() => navigate('/guide')} 
                variant="outline"
                className="font-medium"
              >
                Read User Guide
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-w-xl w-full mt-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">Track Your Meals</h2>
            <p className="text-gray-600 mb-4">Easily record what you eat and monitor calories and nutrients.</p>
            <a 
              href="/home?section=meals&view=demo" 
              className="inline-block bg-primary hover:bg-primary/80 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Explore Meals
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">Manage Goals</h2>
            <p className="text-gray-600 mb-4">Set personalized goals and track your progress over time.</p>
            <a 
              href="/home?section=goals&view=demo"
              className="inline-block bg-primary hover:bg-primary/80 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Explore Goals
            </a>
          </div>
        </div>
      </div>

      {/* Sezione rimossa come richiesto */}
      
      {/* Demo Section */}
      <div id="demo-section" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Here's How NutriEasy Works</h2>
          
          {/* Feature 1 - Dashboard */}
          <div className="flex flex-col md:flex-row items-center mb-16">
            <div className="md:w-1/2 p-4">
              <h3 className="text-2xl font-semibold mb-4">Nutritional Dashboard</h3>
              <p className="text-lg text-gray-700 mb-4">
                View your daily calorie and nutrient intake clearly and intuitively with interactive charts.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <PieChart className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-gray-700">Detailed analysis of proteins, carbohydrates, and fats</span>
              </div>
            </div>
            <div className="md:w-1/2 p-6 mt-6 md:mt-0">
              <PremiumFeature
                feature="nutritional-dashboard"
                title="Nutritional Dashboard"
                description="View detailed nutritional insights and track your diet with comprehensive analytics"
              >
                {/* Mock Dashboard UI */}
                <div className="border border-gray-200 rounded-md p-4 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Nutrient Summary</h4>
                    <span className="text-sm text-gray-500">Today</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">1450</div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">85g</div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">120g</div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">45g</div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  </div>
                  <div className="h-36 flex items-end">
                    <div className="w-1/4 h-24 bg-green-200 rounded-t-md mx-1"></div>
                    <div className="w-1/4 h-32 bg-green-300 rounded-t-md mx-1"></div>
                    <div className="w-1/4 h-16 bg-green-400 rounded-t-md mx-1"></div>
                    <div className="w-1/4 h-28 bg-green-500 rounded-t-md mx-1"></div>
                  </div>
                </div>
              </PremiumFeature>
            </div>
          </div>
          
          {/* Feature 2 - Meal Tracking */}
          <div className="flex flex-col md:flex-row-reverse items-center mb-16">
            <div className="md:w-1/2 p-4">
              <h3 className="text-2xl font-semibold mb-4">Simple Meal Tracking</h3>
              <p className="text-lg text-gray-700 mb-4">
                Easily add your meals with a simple interface. Enter nutritional details or search among common foods.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-gray-700">Record breakfast, lunch, dinner, and snacks</span>
              </div>
            </div>
            <div className="md:w-1/2 p-6 mt-6 md:mt-0">
              <PremiumFeature
                feature="meal-tracking"
                title="Meal Tracking"
                description="Easily log your meals and track nutritional content with our intuitive meal tracker"
              >
                {/* Mock Meal Entry UI */}
                <div className="border border-gray-200 rounded-md p-4 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Add Meal</h4>
                    <span className="text-sm text-primary">Lunch</span>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="p-2 border border-gray-200 rounded-md">
                      <div className="font-medium">Chicken salad</div>
                      <div className="text-sm text-gray-600 flex justify-between">
                        <span>320 kcal</span>
                        <span>32g protein</span>
                        <span>12g fat</span>
                      </div>
                    </div>
                    <div className="p-2 border border-gray-200 rounded-md">
                      <div className="font-medium">Whole grain bread</div>
                      <div className="text-sm text-gray-600 flex justify-between">
                        <span>80 kcal</span>
                        <span>3g protein</span>
                        <span>15g carbs</span>
                      </div>
                    </div>
                    <div className="p-2 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center text-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Add food</span>
                    </div>
                  </div>
                  <button className="w-full bg-primary text-white py-2 rounded-md">Save Meal</button>
                </div>
              </PremiumFeature>
            </div>
          </div>
          
          {/* Feature 3 - Progress */}
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 p-4">
              <h3 className="text-2xl font-semibold mb-4">Track Your Progress</h3>
              <p className="text-lg text-gray-700 mb-4">
                View your progress over time with detailed charts and statistics that show your eating habits.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-gray-700">Analyze weekly and monthly trends</span>
              </div>
            </div>
            <div className="md:w-1/2 p-6 mt-6 md:mt-0">
              <PremiumFeature
                feature="progress-tracking"
                title="Progress Tracking"
                description="Track your nutritional progress over time with detailed charts and statistics"
              >
                {/* Mock Progress Charts */}
                <div className="border border-gray-200 rounded-md p-4 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Weekly Statistics</h4>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">Calories</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">Protein</span>
                    </div>
                  </div>
                  <div className="h-48 flex items-end space-x-1">
                    {[60, 75, 45, 90, 65, 80, 70].map((height, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-primary/80 rounded-t-sm" 
                          style={{height: `${height}%`}}
                        ></div>
                        <div className="text-xs mt-1">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Weekly average: 1820 calories
                  </div>
                </div>
              </PremiumFeature>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Access Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Administrator Access
            </DialogTitle>
            <DialogDescription>
              This special access is reserved for administrators. Please enter your access code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="admin-code">Admin Access Code</Label>
              <Input
                id="admin-code"
                type="password"
                placeholder="Enter your admin code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleAdminAccess}
              disabled={!adminCode || adminAccessMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {adminAccessMutation.isPending ? (
                <>Loading...</>
              ) : (
                <>Access System</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call to Action */}
      <div className="bg-primary text-white py-12 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Register now and start tracking your nutrition to achieve your health goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="bg-white border-2 border-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-md text-lg"
            >
              Register
            </Button>
            <a 
              href="/home?section=dashboard&view=demo" 
              className="inline-block bg-white border-2 border-white text-primary hover:bg-gray-100 font-bold py-3 px-8 rounded-md text-lg"
            >
              {user ? "Explore Demo" : "Try with Free Account"}
            </a>
          </div>
          
          {/* Nascosto, senza pulsante visibile */}
        </div>
      </div>
    </div>
  );
}