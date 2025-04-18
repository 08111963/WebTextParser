/**
 * Calcola l'indice di massa corporea (BMI)
 * Formula: peso (kg) / (altezza (m) * altezza (m))
 */
export function calculateBMI(weight: number, height: number): number {
  if (!weight || !height) return 0;
  // altezza da cm a metri
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

/**
 * Interpreta il valore BMI secondo le categorie standard dell'OMS
 */
export function interpretBMI(bmi: number): {
  category: string;
  description: string;
  color: string;
} {
  if (bmi <= 0) return { 
    category: "N/A", 
    description: "Dati insufficienti per il calcolo", 
    color: "gray" 
  };
  
  if (bmi < 18.5) return { 
    category: "Sottopeso", 
    description: "Indica un peso inferiore al normale per l'altezza", 
    color: "blue" 
  };
  
  if (bmi < 25) return { 
    category: "Normopeso", 
    description: "Indica un peso sano per l'altezza", 
    color: "green" 
  };
  
  if (bmi < 30) return { 
    category: "Sovrappeso", 
    description: "Indica un peso superiore al normale per l'altezza", 
    color: "orange" 
  };
  
  return { 
    category: "Obesità", 
    description: "Indica un peso significativamente superiore al normale per l'altezza", 
    color: "red" 
  };
}

/**
 * Calcola il metabolismo basale utilizzando la formula di Harris-Benedict
 * Stima le calorie necessarie a riposo in base a sesso, peso, altezza ed età
 */
export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (!weight || !height || !age) return 0;
  
  // Formula Harris-Benedict rivista
  if (gender.toLowerCase() === "maschio" || gender.toLowerCase() === "male") {
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  } else {
    return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
  }
}

/**
 * Calcola il fabbisogno calorico totale giornaliero
 * Moltiplica il BMR per il fattore di attività fisica
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  if (!bmr) return 0;
  
  const activityFactors: Record<string, number> = {
    "sedentario": 1.2, // Attività sedentaria, poco o nessun esercizio
    "sedentary": 1.2,
    "leggero": 1.375, // Esercizio leggero 1-3 volte/settimana
    "light": 1.375,
    "moderato": 1.55, // Esercizio moderato 3-5 volte/settimana
    "moderate": 1.55,
    "attivo": 1.725, // Esercizio intenso 6-7 volte/settimana
    "active": 1.725,
    "molto attivo": 1.9, // Esercizio molto intenso, lavoro fisico o 2x allenamento
    "very active": 1.9
  };
  
  const factor = activityFactors[activityLevel.toLowerCase()] || 1.2;
  return Math.round(bmr * factor);
}

/**
 * Suggerisce distribuzioni di macronutrienti in base all'obiettivo
 */
export function suggestMacroDistribution(goal: string): {
  proteins: number; // percentuale
  carbs: number; // percentuale
  fats: number; // percentuale
} {
  const defaultDistribution = { proteins: 30, carbs: 40, fats: 30 };
  
  if (!goal) return defaultDistribution;
  
  const lowerGoal = goal.toLowerCase();
  
  if (lowerGoal.includes("dimagrimento") || lowerGoal.includes("perdita")) {
    return { proteins: 40, carbs: 30, fats: 30 };
  }
  
  if (lowerGoal.includes("muscolo") || lowerGoal.includes("massa")) {
    return { proteins: 35, carbs: 45, fats: 20 };
  }
  
  if (lowerGoal.includes("mantenimento")) {
    return { proteins: 30, carbs: 40, fats: 30 };
  }
  
  if (lowerGoal.includes("keto") || lowerGoal.includes("chetogenica")) {
    return { proteins: 25, carbs: 5, fats: 70 };
  }
  
  return defaultDistribution;
}