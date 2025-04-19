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
  // Calculate basal metabolism (calories at rest)
  const bmr = calculateBMR(weight, height, age, gender);
  
  // Calculate total daily caloric requirement
  const tdee = calculateTDEE(bmr, activityLevel);
  
  // Suggest macronutrient distribution based on "maintenance"
  const macros = suggestMacroDistribution("maintenance");
  
  // Activity level translation
  const activityLevelLabel = {
    "sedentario": "Sedentary",
    "sedentary": "Sedentary",
    "leggero": "Light",
    "light": "Light",
    "moderato": "Moderate",
    "moderate": "Moderate",
    "attivo": "Active",
    "active": "Active",
    "molto attivo": "Very Active",
    "very active": "Very Active"
  }[activityLevel?.toLowerCase()] || "Not specified";
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span>Basal Metabolism</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Basal Metabolic Rate (BMR) represents the calories your body burns at rest for vital functions.
                  Total Daily Energy Expenditure (TDEE) also includes daily physical activity.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Calories needed for your body, calculated with the Harris-Benedict formula
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bmr > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 p-3 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Basal Metabolism</div>
                <div className="text-2xl font-bold">{bmr} kcal</div>
                <div className="text-xs text-muted-foreground">At rest</div>
              </div>
              
              <div className="bg-primary/10 p-3 rounded-md text-center">
                <div className="text-sm text-muted-foreground">Total Requirement</div>
                <div className="text-2xl font-bold">{tdee} kcal</div>
                <div className="text-xs text-muted-foreground">Activity level: {activityLevelLabel}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Recommended macronutrient distribution:</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">Protein</div>
                  <div className="font-semibold">{macros.proteins}%</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.round((tdee * macros.proteins / 100) / 4)}g
                  </div>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">Carbohydrates</div>
                  <div className="font-semibold">{macros.carbs}%</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.round((tdee * macros.carbs / 100) / 4)}g
                  </div>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <div className="text-xs text-muted-foreground">Fat</div>
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
            <p>Insufficient data for calculation</p>
            <p className="text-sm mt-1">Make sure you have entered weight, height, age, and gender in your profile</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}