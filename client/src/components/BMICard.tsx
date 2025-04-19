import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateBMI, interpretBMI } from "@/lib/fitness-calculations";
import { CircleHelp, Scale } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type BMICardProps = {
  weight: number;
  height: number;
};

export default function BMICard({ weight, height }: BMICardProps) {
  const bmi = calculateBMI(weight, height);
  const interpretation = interpretBMI(bmi);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span>Body Mass Index (BMI)</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Body Mass Index (BMI) is an indicator that relates weight and height.
                  Formula: weight (kg) / height² (m). The assessment should always be contextualised with other clinical parameters.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Weight-to-height ratio according to WHO standards
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bmi > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="text-4xl font-bold">{bmi}</div>
            </div>
            
            <div 
              className="text-center font-semibold py-1 px-2 rounded-full text-sm mx-auto w-fit"
              style={{
                backgroundColor: `${interpretation.color}20`,
                color: interpretation.color,
                borderColor: interpretation.color,
                borderWidth: "1px"
              }}
            >
              {interpretation.category}
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              {interpretation.description}
            </div>
            
            <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground pt-2 border-t">
              <div>Underweight: &lt;18.5</div>
              <div>Normal: 18.5-24.9</div>
              <div>Overweight: 25-29.9</div>
              <div>Obese: ≥30</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Insufficient data for calculation</p>
            <p className="text-sm mt-1">Make sure you have entered weight and height in your profile</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}