import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';

export default function Info() {
  const [, navigate] = useLocation();

  const features = [
    'Traccia pasti e valori nutrizionali',
    'Analizza l\'apporto di calorie, proteine, carboidrati e grassi',
    'Visualizza grafici e statistiche sul tuo consumo',
    'Imposta obiettivi nutrizionali personalizzati',
    'Ricevi suggerimenti per migliorare la tua dieta'
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          className="flex items-center mb-8" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        
        <h1 className="text-3xl font-bold text-primary mb-6">Informazioni su NutriFacile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Perché utilizzare NutriFacile?</h2>
            <p className="text-gray-700 mb-6">
              NutriFacile è un'applicazione completa per il monitoraggio della nutrizione che ti aiuta 
              a tracciare facilmente ciò che mangi, analizzare la tua alimentazione e raggiungere i tuoi 
              obiettivi di salute e fitness. 
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Caratteristiche principali</h2>
            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Check className="h-4 w-4 text-green-600" />
                  </span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={() => navigate('/login')} 
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Inizia ora
            </Button>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Come funziona</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">1. Registra i tuoi pasti</h3>
                <p className="text-gray-600">Inserisci facilmente ciò che mangi con dettagli sui valori nutrizionali.</p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">2. Visualizza le tue statistiche</h3>
                <p className="text-gray-600">Controlla il tuo apporto giornaliero e analizza i trend.</p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">3. Imposta obiettivi</h3>
                <p className="text-gray-600">Definisci i tuoi obiettivi di calorie e nutrienti.</p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-medium mb-1">4. Migliora la tua alimentazione</h3>
                <p className="text-gray-600">Ricevi suggerimenti basati sui tuoi dati per ottimizzare la tua dieta.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}