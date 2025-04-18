import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateBMR, calculateTDEE, suggestMacroDistribution } from "@/lib/fitness-calculations";
import { CircleHelp, Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type MetabolismCardProps = {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
};

export default function MetabolismCard({ 
  weight, 
  height, 
  age, 
  gender, 
  activityLevel 
}: MetabolismCardProps) {
  // Calcola metabolismo basale (calorie a riposo)
  const bmr = calculateBMR(weight, height, age, gender);
  
  // Calcola fabbisogno calorico giornaliero totale
  const tdee = calculateTDEE(bmr, activityLevel);
  
  // Suggerisce distribuzione macronutrienti basata sul "mantenimento"
  const macros = suggestMacroDistribution("mantenimento");
  
  // Traduzione livello attività
  const activityLevelLabel = {
    "sedentario": "Sedentario",
    "sedentary": "Sedentario",
    "leggero": "Leggero",
    "light": "Leggero",
    "moderato": "Moderato",
    "moderate": "Moderato",
    "attivo": "Attivo",
    "active": "Attivo",
    "molto attivo": "Molto attivo",
    "very active": "Molto attivo"
  }[activityLevel?.toLowerCase()] || "Non specificato";
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span>Metabolismo Basale</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Il Metabolismo Basale (BMR) rappresenta le calorie che il corpo consuma a riposo per le funzioni vitali.
                  Il Fabbisogno Energetico Totale (TDEE) include anche l'attività fisica quotidiana.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Calorie necessarie per il tuo corpo, calcolate con formula Harris-Benedict
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bmr > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 p-3 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Metabolismo Basale</div>
                <div className="text-2xl font-bold">{bmr} kcal</div>
                <div className="text-xs text-muted-foreground">A riposo</div>
              </div>
              
              <div className="bg-primary/10 p-3 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Fabbisogno Totale</div>
                <div className="text-2xl font-bold">{tdee} kcal</div>
                <div className="text-xs text-muted-foreground">Liv. attività: {activityLevelLabel}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Distribuzione macronutrienti consigliata:</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">Proteine</div>
                  <div className="font-semibold">{macros.proteins}%</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.round((tdee * macros.proteins / 100) / 4)}g
                  </div>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">Carboidrati</div>
                  <div className="font-semibold">{macros.carbs}%</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.round((tdee * macros.carbs / 100) / 4)}g
                  </div>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">Grassi</div>
                  <div className="font-semibold">{macros.fats}%</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.round((tdee * macros.fats / 100) / 9)}g
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Dati insufficienti per il calcolo</p>
            <p className="text-sm mt-1">Assicurati di aver inserito peso, altezza, età e genere nel tuo profilo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}