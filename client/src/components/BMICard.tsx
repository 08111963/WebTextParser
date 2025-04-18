import { calculateBMI, interpretBMI } from "@/lib/fitness-calculations";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Scale } from "lucide-react";

type BMICardProps = {
  weight: number;
  height: number;
};

export default function BMICard({ weight, height }: BMICardProps) {
  const bmi = calculateBMI(weight, height);
  const { category, description } = interpretBMI(bmi);
  
  // Calcola la percentuale per la barra di progresso
  // Scala da 15 a 40 per la visualizzazione
  const minBMI = 15;
  const maxBMI = 40;
  const progress = Math.min(100, Math.max(0, ((bmi - minBMI) / (maxBMI - minBMI)) * 100));
  
  // Determina il colore in base alla categoria
  let progressColor = "bg-green-500";
  if (category.includes("Sottopeso")) {
    progressColor = "bg-blue-500";
  } else if (category.includes("Sovrappeso")) {
    progressColor = "bg-yellow-500";
  } else if (category.includes("Obesità")) {
    progressColor = "bg-red-500";
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Indice di Massa Corporea (BMI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-3xl font-bold">{bmi}</span>
              <span className="text-muted-foreground ml-1">kg/m²</span>
            </div>
            <div className="text-right">
              <div className="font-medium">{category}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <Progress value={progress} className={progressColor} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sottopeso</span>
              <span>Normopeso</span>
              <span>Sovrappeso</span>
              <span>Obesità</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}