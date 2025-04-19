/**
 * Calculate Body Mass Index (BMI)
 * Formula: weight (kg) / (height (m) * height (m))
 */
export function calculateBMI(weight: number, height: number): number {
  if (!weight || !height) return 0;
  // height from cm to meters
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

/**
 * Interpret the BMI value according to WHO standard categories
 */
export function interpretBMI(bmi: number): {
  category: string;
  description: string;
  color: string;
} {
  if (bmi <= 0) return { 
    category: "N/A", 
    description: "Insufficient data for calculation", 
    color: "gray" 
  };
  
  if (bmi < 18.5) return { 
    category: "Underweight", 
    description: "Indicates a weight lower than normal for height", 
    color: "blue" 
  };
  
  if (bmi < 25) return { 
    category: "Normal", 
    description: "Indicates a healthy weight for height", 
    color: "green" 
  };
  
  if (bmi < 30) return { 
    category: "Overweight", 
    description: "Indicates a weight higher than normal for height", 
    color: "orange" 
  };
  
  return { 
    category: "Obese", 
    description: "Indicates a weight significantly higher than normal for height", 
    color: "red" 
  };
}

/**
 * Calculate Basal Metabolic Rate using the Harris-Benedict formula
 * Estimates the calories needed at rest based on gender, weight, height, and age
 */
export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (!weight || !height || !age) return 0;
  
  // Revised Harris-Benedict formula
  if (gender.toLowerCase() === "maschio" || gender.toLowerCase() === "male") {
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  } else {
    return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 * Multiplies BMR by the physical activity factor
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  if (!bmr) return 0;
  
  const activityFactors: Record<string, number> = {
    "sedentario": 1.2, // Sedentary activity, little or no exercise
    "sedentary": 1.2,
    "leggero": 1.375, // Light exercise 1-3 times/week
    "light": 1.375,
    "moderato": 1.55, // Moderate exercise 3-5 times/week
    "moderate": 1.55,
    "attivo": 1.725, // Intense exercise 6-7 times/week
    "active": 1.725,
    "molto attivo": 1.9, // Very intense exercise, physical work or 2x training
    "very active": 1.9
  };
  
  const factor = activityFactors[activityLevel.toLowerCase()] || 1.2;
  return Math.round(bmr * factor);
}

/**
 * Suggests macronutrient distributions based on the goal
 */
export function suggestMacroDistribution(goal: string): {
  proteins: number; // percentage
  carbs: number; // percentage
  fats: number; // percentage
} {
  const defaultDistribution = { proteins: 30, carbs: 40, fats: 30 };
  
  if (!goal) return defaultDistribution;
  
  const lowerGoal = goal.toLowerCase();
  
  if (lowerGoal.includes("dimagrimento") || lowerGoal.includes("perdita") || 
      lowerGoal.includes("weight loss") || lowerGoal.includes("fat loss")) {
    return { proteins: 40, carbs: 30, fats: 30 };
  }
  
  if (lowerGoal.includes("muscolo") || lowerGoal.includes("massa") || 
      lowerGoal.includes("muscle") || lowerGoal.includes("mass")) {
    return { proteins: 35, carbs: 45, fats: 20 };
  }
  
  if (lowerGoal.includes("mantenimento") || lowerGoal.includes("maintenance")) {
    return { proteins: 30, carbs: 40, fats: 30 };
  }
  
  if (lowerGoal.includes("keto") || lowerGoal.includes("chetogenica") || 
      lowerGoal.includes("ketogenic")) {
    return { proteins: 25, carbs: 5, fats: 70 };
  }
  
  return defaultDistribution;
}