import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AIRecommendations from '@/components/AIRecommendations';
import Header from '@/components/Header';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AIMeals() {
  const { user } = useAuth();
  const [, navigate] = useNavigate();
  
  // Se l'utente non è autenticato, mostriamo un caricamento
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-16 flex-1">
        <div className="mb-6 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/home')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Raccomandazioni AI per Pasti</h1>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">
            Qui trovi suggerimenti personalizzati per pasti basati sul tuo profilo e obiettivi.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Suggerimenti Personalizzati</CardTitle>
            <CardDescription>
              Raccomandazioni alimentari generate dall'intelligenza artificiale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIRecommendations userId={user.id.toString()} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}