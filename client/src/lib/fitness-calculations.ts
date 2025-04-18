/**
 * Utility per calcoli relativi a fitness e nutrizione
 */

/**
 * Calcola l'Indice di Massa Corporea (BMI)
 * Formula: peso (kg) / (altezza (m))²
 * @param weight - Peso in kg
 * @param height - Altezza in cm
 * @returns BMI arrotondato a 1 decimale
 */
export function calculateBMI(weight: number, height: number): number {
  // Converti altezza da cm a metri
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10;
}

/**
 * Interpreta il valore BMI secondo le linee guida dell'OMS
 * @param bmi - Indice di massa corporea
 * @param gender - Genere della persona (per considerare lievi differenze nelle interpretazioni)
 * @returns Categoria e descrizione dell'interpretazione
 */
export function interpretBMI(bmi: number): { category: string; description: string } {
  if (bmi < 16.5) {
    return { 
      category: "Sottopeso grave", 
      description: "Rischio molto elevato per la salute" 
    };
  } else if (bmi < 18.5) {
    return { 
      category: "Sottopeso", 
      description: "Rischio moderato per la salute" 
    };
  } else if (bmi < 25) {
    return { 
      category: "Normopeso", 
      description: "Peso ottimale per la salute" 
    };
  } else if (bmi < 30) {
    return { 
      category: "Sovrappeso", 
      description: "Rischio moderato per la salute" 
    };
  } else if (bmi < 35) {
    return { 
      category: "Obesità classe I", 
      description: "Rischio elevato per la salute" 
    };
  } else if (bmi < 40) {
    return { 
      category: "Obesità classe II", 
      description: "Rischio molto elevato per la salute" 
    };
  } else {
    return { 
      category: "Obesità classe III", 
      description: "Rischio estremamente elevato per la salute" 
    };
  }
}

/**
 * Moltiplica il BMR per il fattore di attività fisica
 * @param bmr - Metabolismo basale
 * @param activityLevel - Livello di attività fisica
 * @returns Fabbisogno calorico giornaliero stimato
 */
function adjustBMRForActivity(bmr: number, activityLevel: string): number {
  switch (activityLevel.toLowerCase()) {
    case "sedentaria":
      return bmr * 1.2; // Attività minima
    case "leggera":
      return bmr * 1.375; // Esercizio leggero 1-3 volte/settimana
    case "moderata":
      return bmr * 1.55; // Esercizio moderato 3-5 volte/settimana
    case "attiva":
      return bmr * 1.725; // Esercizio intenso 6-7 volte/settimana
    case "molto attiva":
      return bmr * 1.9; // Esercizio molto intenso, lavoro fisico o allenamento 2 volte/giorno
    default:
      return bmr * 1.55; // Default a moderata
  }
}

/**
 * Calcola il metabolismo basale (BMR) usando la formula Mifflin-St Jeor
 * @param weight - Peso in kg
 * @param height - Altezza in cm
 * @param age - Età in anni
 * @param gender - Genere ("maschio" o "femmina")
 * @param activityLevel - Livello di attività fisica
 * @returns Oggetto con BMR e fabbisogno calorico giornaliero
 */
export function calculateBMR(
  weight: number, 
  height: number, 
  age: number, 
  gender: string,
  activityLevel: string
): { bmr: number; tdee: number } {
  // Formula Mifflin-St Jeor
  let bmr = 0;
  
  if (gender.toLowerCase() === "maschio") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Arrotonda il BMR all'intero più vicino
  bmr = Math.round(bmr);
  
  // Calcola il fabbisogno calorico totale giornaliero (TDEE)
  const tdee = Math.round(adjustBMRForActivity(bmr, activityLevel));
  
  return { bmr, tdee };
}

/**
 * Calcola la distribuzione macronutrienti raccomandata in base al fabbisogno calorico
 * @param tdee - Fabbisogno calorico giornaliero (Total Daily Energy Expenditure)
 * @returns Grammi raccomandati di proteine, carboidrati e grassi
 */
export function calculateMacronutrients(tdee: number): { 
  proteins: number; 
  carbs: number; 
  fats: number;
} {
  // Calcolo bilanciato: 30% proteine, 40% carboidrati, 30% grassi
  // 1g proteine = 4 calorie, 1g carboidrati = 4 calorie, 1g grassi = 9 calorie
  
  const proteinCalories = tdee * 0.3;
  const carbCalories = tdee * 0.4;
  const fatCalories = tdee * 0.3;
  
  const proteins = Math.round(proteinCalories / 4);
  const carbs = Math.round(carbCalories / 4);
  const fats = Math.round(fatCalories / 9);
  
  return { proteins, carbs, fats };
}