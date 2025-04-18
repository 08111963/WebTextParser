import { calculateBMR, calculateMacronutrients } from "@/lib/fitness-calculations";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Flame,
  Apple,
  Beef,
  Cookie,
  CircleDashed
} from "lucide-react";

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
  const { bmr, tdee } = calculateBMR(weight, height, age, gender, activityLevel);
  const { proteins, carbs, fats } = calculateMacronutrients(tdee);
  
  // Livelli di attività in italiano per la visualizzazione
  const activityLevels = {
    sedentaria: "Nessuna attività fisica",
    leggera: "Attività leggera 1-3 volte a settimana",
    moderata: "Attività moderata 3-5 volte a settimana",
    attiva: "Attività intensa 6-7 volte a settimana",
    "molto attiva": "Attività molto intensa o lavoro fisico quotidiano"
  };
  
  const activityDescription = activityLevels[activityLevel as keyof typeof activityLevels] || "Attività moderata";
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Metabolismo e Fabbisogno Calorico
        </CardTitle>
        <CardDescription>
          Basato su età, genere, peso, altezza e livello di attività
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Metabolismo Basale (BMR)</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{bmr}</span>
                <span className="text-muted-foreground text-sm ml-1">kcal/giorno</span>
              </div>
              <p className="text-xs text-muted-foreground">Calorie necessarie a riposo</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fabbisogno Totale (TDEE)</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{tdee}</span>
                <span className="text-muted-foreground text-sm ml-1">kcal/giorno</span>
              </div>
              <p className="text-xs text-muted-foreground">Con attività: {activityDescription}</p>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Distribuzione Macronutrienti Raccomandata</p>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 p-2 rounded">
                <div className="flex items-center gap-1 text-sm font-medium mb-1">
                  <Beef className="h-4 w-4 text-red-500" />
                  <span>Proteine</span>
                </div>
                <p className="text-lg font-bold">{proteins}g</p>
                <p className="text-xs text-muted-foreground">{proteins * 4} kcal - 30%</p>
              </div>
              
              <div className="bg-muted/50 p-2 rounded">
                <div className="flex items-center gap-1 text-sm font-medium mb-1">
                  <Apple className="h-4 w-4 text-green-500" />
                  <span>Carboidrati</span>
                </div>
                <p className="text-lg font-bold">{carbs}g</p>
                <p className="text-xs text-muted-foreground">{carbs * 4} kcal - 40%</p>
              </div>
              
              <div className="bg-muted/50 p-2 rounded">
                <div className="flex items-center gap-1 text-sm font-medium mb-1">
                  <Cookie className="h-4 w-4 text-yellow-500" />
                  <span>Grassi</span>
                </div>
                <p className="text-lg font-bold">{fats}g</p>
                <p className="text-xs text-muted-foreground">{fats * 9} kcal - 30%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}