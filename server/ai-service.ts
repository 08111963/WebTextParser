import OpenAI from "openai";
import { Meal, NutritionGoal, UserProfile } from "@shared/schema";

// Inizializza OpenAI SDK client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Debug log per verificare se l'API key è presente
console.log("OpenAI API key exists:", !!process.env.OPENAI_API_KEY);

/**
 * Genera una risposta tramite AI basata su una domanda diretta dell'utente
 */
export async function generateAIResponse(
  query: string,
  profile: UserProfile,
  currentGoal?: NutritionGoal,
  recentMeals?: Meal[],
  customSystemPrompt?: string
) {
  try {
    // Utilizza il prompt personalizzato se fornito, altrimenti usa quello predefinito
    const systemPrompt = customSystemPrompt || `Sei un nutrizionista esperto che risponde a domande in italiano sulla nutrizione, alimentazione e salute.
    Hai accesso al profilo dell'utente e ai suoi dati nutrizionali, che dovresti utilizzare per personalizzare le tue risposte.
    Rispondi in modo colloquiale ma professionale, fornendo informazioni accurate ed esaurienti.
    Basa le tue risposte su informazioni scientifiche aggiornate.
    Se non sai la risposta a una domanda specifica, non inventare informazioni e indirizza gentilmente l'utente a un professionista.`;
    
    const userInfo = {
      profilo: {
        età: profile.age || "Non specificata",
        peso: profile.weight ? `${profile.weight} kg` : "Non specificato",
        altezza: profile.height ? `${profile.height} cm` : "Non specificata",
        genere: profile.gender || "Non specificato",
        livelloAttività: profile.activityLevel || "Non specificato",
      },
      obiettivoNutrizionale: currentGoal ? {
        nome: currentGoal.name,
        calorie: currentGoal.calories,
        proteine: currentGoal.proteins,
        carboidrati: currentGoal.carbs,
        grassi: currentGoal.fats,
      } : "Nessun obiettivo attualmente impostato",
      pastiRecenti: recentMeals && recentMeals.length > 0 
        ? recentMeals.slice(0, 5).map(m => ({
            cibo: m.food,
            tipo: m.mealType,
            calorie: m.calories,
            proteine: m.proteins,
            carboidrati: m.carbs,
            grassi: m.fats
          }))
        : "Nessun pasto registrato recentemente"
    };
    
    const userPrompt = `
    Tieni in considerazione queste informazioni sull'utente:
    ${JSON.stringify(userInfo, null, 2)}
    
    Domanda dell'utente: ${query}
    
    Fornisci una risposta completa e personalizzata, tenendo conto del profilo dell'utente e dei suoi dati nutrizionali.
    `;

    console.log("Sending user query to OpenAI:", query);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    const answer = response.choices[0].message.content;
    console.log("OpenAI response received:", answer);
    
    return answer || "Mi dispiace, non sono riuscito a elaborare una risposta. Prova a riformulare la tua domanda.";
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    throw new Error(`Failed to generate AI response: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Genera consigli personalizzati per obiettivi nutrizionali basati sul profilo utente
 */
export async function generateNutritionGoalRecommendations(
  profile: UserProfile,
  currentGoal?: NutritionGoal,
  recentMeals?: Meal[]
) {
  try {
    // Calcola BMI per analisi preliminare
    const bmi = profile.weight && profile.height 
      ? Math.round((profile.weight / ((profile.height / 100) * (profile.height / 100))) * 10) / 10
      : null;
      
    // Costruisci un prompt dettagliato con tutte le informazioni disponibili
    const systemPrompt = `Tu sei un esperto nutrizionista che fornisce consigli personalizzati. 
    Esamina il seguente profilo utente e genera 3 diversi obiettivi nutrizionali adatti alle sue caratteristiche. 
    Rispondi in italiano.`;
    
    const userInfo = {
      profilo: {
        età: profile.age || "Non specificata",
        peso: profile.weight ? `${profile.weight} kg` : "Non specificato",
        altezza: profile.height ? `${profile.height} cm` : "Non specificata",
        genere: profile.gender || "Non specificato",
        livelloAttività: profile.activityLevel || "Non specificato",
        bmi: bmi || "Non calcolabile",
      },
      obiettivoAttuale: currentGoal ? {
        nome: currentGoal.name,
        calorie: currentGoal.calories,
        proteine: currentGoal.proteins,
        carboidrati: currentGoal.carbs,
        grassi: currentGoal.fats,
      } : "Nessun obiettivo attualmente impostato",
      pastiRecenti: recentMeals && recentMeals.length > 0 
        ? recentMeals.slice(0, 5).map(m => ({
            cibo: m.food,
            tipo: m.mealType,
            calorie: m.calories,
            proteine: m.proteins,
            carboidrati: m.carbs,
            grassi: m.fats
          }))
        : "Nessun pasto registrato recentemente"
    };
    
    const userPrompt = `
    Analizza queste informazioni sull'utente e genera 3 obiettivi nutrizionali personalizzati:
    ${JSON.stringify(userInfo, null, 2)}
    
    Per ciascun obiettivo nutrizionale, fornisci:
    1. Un titolo breve e creativo (sii originale, usa termini accattivanti)
    2. Una breve descrizione che spieghi perché questo obiettivo è adatto all'utente
    3. Calorie giornaliere raccomandate
    4. Distribuzione di macronutrienti (proteine, carboidrati, grassi) in grammi
    
    Importante: Gli obiettivi devono essere significativamente diversi tra loro, con proposte variegate e originali.
    Ad ogni chiamata, fornisci risposte completamente nuove ed evita formule standardizzate.
    Includi diverse filosofie nutrizionali (mediterranea, plant-based, ecc.) e approcci (perdita peso, energia, massa muscolare, ecc.).
    
    Rispondi con un JSON nel seguente formato:
    [
      {
        "title": "Titolo obiettivo 1",
        "description": "Descrizione e motivazione",
        "calories": numero_calorie,
        "proteins": grammi_proteine,
        "carbs": grammi_carboidrati,
        "fats": grammi_grassi
      },
      ...
    ]
    
    Assicurati che tutti i valori numerici siano ragionevoli e arrotondati all'intero più vicino, e che ciascun obiettivo sia distinto dagli altri.
    Usa il contesto e le informazioni disponibili per generare consigli il più possibile personalizzati.
    `;

    console.log("Sending nutrition recommendations request to OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9, // Aumento della temperatura per maggiore variabilità
    });

    console.log("OpenAI response received:", response.choices[0].message.content);
    
    const responseContent = response.choices[0].message.content || '[]';
    
    // Se la risposta non è un array, crea un array di esempio
    let recommendations: any;
    try {
      recommendations = JSON.parse(responseContent);
      console.log("Parsed recommendations:", recommendations);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      // Restituisci un array vuoto in caso di errore di parsing
      recommendations = [];
    }
    
    // Assicurati che i valori siano tutti numeri interi
    let processedRecommendations = [];
    
    // Se abbiamo un array, usa direttamente quello
    if (Array.isArray(recommendations)) {
      processedRecommendations = recommendations.map(rec => ({
        title: rec.title,
        description: rec.description,
        calories: Math.round(Number(rec.calories)),
        proteins: Math.round(Number(rec.proteins)),
        carbs: Math.round(Number(rec.carbs)),
        fats: Math.round(Number(rec.fats))
      }));
    } 
    // Se abbiamo un oggetto con proprietà 'objectives', 'obiettiviNutrizionali', 'goals' o altra struttura
    else if (recommendations && typeof recommendations === 'object') {
      // Check per varie strutture che OpenAI potrebbe restituire
      if (recommendations.objectives && Array.isArray(recommendations.objectives)) {
        processedRecommendations = recommendations.objectives.map((rec: any) => ({
          title: rec.title,
          description: rec.description,
          calories: Math.round(Number(rec.calories)),
          proteins: Math.round(Number(rec.proteins)),
          carbs: Math.round(Number(rec.carbs)),
          fats: Math.round(Number(rec.fats))
        }));
      }
      // Check per la struttura italiana 'obiettiviNutrizionali'
      else if (recommendations.obiettiviNutrizionali && Array.isArray(recommendations.obiettiviNutrizionali)) {
        processedRecommendations = recommendations.obiettiviNutrizionali.map((rec: any) => ({
          title: rec.title,
          description: rec.description,
          calories: Math.round(Number(rec.calories)),
          proteins: Math.round(Number(rec.proteins)),
          carbs: Math.round(Number(rec.carbs)),
          fats: Math.round(Number(rec.fats))
        }));
      }
      // Check per la struttura 'goals'
      else if (recommendations.goals && Array.isArray(recommendations.goals)) {
        processedRecommendations = recommendations.goals.map((rec: any) => ({
          title: rec.title,
          description: rec.description,
          calories: Math.round(Number(rec.calories)),
          proteins: Math.round(Number(rec.proteins)),
          carbs: Math.round(Number(rec.carbs)),
          fats: Math.round(Number(rec.fats))
        }));
      }
      // Gestisci il caso in cui abbiamo una singola raccomandazione come oggetto
      else if (recommendations.title && recommendations.calories) {
        processedRecommendations = [{
          title: recommendations.title,
          description: recommendations.description || "",
          calories: Math.round(Number(recommendations.calories)),
          proteins: Math.round(Number(recommendations.proteins)),
          carbs: Math.round(Number(recommendations.carbs)),
          fats: Math.round(Number(recommendations.fats))
        }];
      }
    }
      
    return processedRecommendations;
  } catch (error: any) {
    console.error("Error generating nutrition goal recommendations:", error);
    throw new Error(`Failed to generate nutrition goal recommendations: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Genera suggerimenti personalizzati per pasti basati sul profilo utente e obiettivi nutrizionali
 */
export async function generateMealSuggestions(
  profile: UserProfile,
  nutritionGoal?: NutritionGoal,
  mealType?: string,
  preferences?: string[]
) {
  try {
    const systemPrompt = `Tu sei un esperto di nutrizione che suggerisce pasti sani e deliziosi. 
    Esamina il profilo dell'utente e il suo obiettivo nutrizionale, quindi suggerisci pasti adatti.
    Rispondi in italiano.`;
    
    const userInfo = {
      profilo: {
        età: profile.age || "Non specificata",
        peso: profile.weight ? `${profile.weight} kg` : "Non specificato",
        altezza: profile.height ? `${profile.height} cm` : "Non specificata",
        genere: profile.gender || "Non specificato",
        livelloAttività: profile.activityLevel || "Non specificato",
      },
      obiettivoNutrizionale: nutritionGoal ? {
        calorie: nutritionGoal.calories,
        proteine: nutritionGoal.proteins,
        carboidrati: nutritionGoal.carbs,
        grassi: nutritionGoal.fats,
      } : "Obiettivo non impostato",
      tipoPasto: mealType || "Qualsiasi",
      preferenze: preferences && preferences.length > 0 ? preferences : "Nessuna preferenza specificata"
    };
    
    const userPrompt = `
    Analizza queste informazioni sull'utente:
    ${JSON.stringify(userInfo, null, 2)}
    
    Genera 3 idee originali per pasti che:
    ${mealType ? `- Siano adatti per ${mealType}` : '- Siano adatti per qualsiasi pasto'}
    - Rispettino i limiti calorici e i macronutrienti dell'obiettivo nutrizionale (se presente)
    - Tengano conto dell'età, peso, altezza e livello di attività dell'utente
    ${preferences && preferences.length > 0 ? `- Considerino le preferenze: ${preferences.join(', ')}` : ''}
    
    Per ciascun pasto, fornisci:
    1. Un nome breve, creativo e appetitoso (sii originale e proponi piatti diversi ogni volta)
    2. Una breve descrizione che includa ingredienti principali e benefici nutrizionali
    3. Il tipo di pasto (colazione, pranzo, cena, spuntino)
    4. Il contenuto calorico e i macronutrienti (proteine, carboidrati, grassi)
    
    Importante: Ad ogni chiamata, fornisci idee di pasti completamente diverse. 
    Evita piatti standard o ripetitivi. Sii creativo con gli ingredienti e le preparazioni.
    Proponi combinazioni di ingredienti originali e diverse culture culinarie.
    
    Rispondi con un JSON nel seguente formato:
    [
      {
        "name": "Nome del pasto",
        "description": "Descrizione con ingredienti e benefici",
        "mealType": "Tipo di pasto",
        "calories": numero_calorie,
        "proteins": grammi_proteine,
        "carbs": grammi_carboidrati,
        "fats": grammi_grassi
      },
      ...
    ]
    
    Assicurati che tutti i valori numerici siano ragionevoli e arrotondati all'intero più vicino.
    Sii creativo ma realistico, suggerendo pasti che siano effettivamente preparabili e appetitosi.
    `;

    console.log("Sending meal suggestions request to OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.95, // Aumento della temperatura per maggiore variabilità nei pasti
    });

    console.log("OpenAI meal suggestions response received:", response.choices[0].message.content);
    
    const responseContent = response.choices[0].message.content || '[]';
    
    // Se la risposta non è un array, crea un array vuoto
    let suggestions: any;
    try {
      suggestions = JSON.parse(responseContent);
      console.log("Parsed meal suggestions:", suggestions);
    } catch (parseError) {
      console.error("Failed to parse OpenAI meal suggestions response:", parseError);
      suggestions = [];
    }
    
    // Assicurati che i valori siano tutti numeri interi
    let processedSuggestions = [];
    
    // Se abbiamo un array, usa direttamente quello
    if (Array.isArray(suggestions)) {
      processedSuggestions = suggestions.map((sug: any) => ({
        name: sug.name,
        description: sug.description,
        mealType: sug.mealType,
        calories: Math.round(Number(sug.calories)),
        proteins: Math.round(Number(sug.proteins)),
        carbs: Math.round(Number(sug.carbs)),
        fats: Math.round(Number(sug.fats))
      }));
    } 
    // Se abbiamo un oggetto con proprietà 'suggestions', 'mealIdeas', 'meals' o altra struttura
    else if (suggestions && typeof suggestions === 'object') {
      // Check per varie strutture che OpenAI potrebbe restituire
      if (suggestions.suggestions && Array.isArray(suggestions.suggestions)) {
        processedSuggestions = suggestions.suggestions.map((sug: any) => ({
          name: sug.name,
          description: sug.description,
          mealType: sug.mealType,
          calories: Math.round(Number(sug.calories)),
          proteins: Math.round(Number(sug.proteins)),
          carbs: Math.round(Number(sug.carbs)),
          fats: Math.round(Number(sug.fats))
        }));
      }
      // Check per la struttura 'mealIdeas'
      else if (suggestions.mealIdeas && Array.isArray(suggestions.mealIdeas)) {
        processedSuggestions = suggestions.mealIdeas.map((sug: any) => ({
          name: sug.name,
          description: sug.description,
          mealType: sug.mealType,
          calories: Math.round(Number(sug.calories)),
          proteins: Math.round(Number(sug.proteins)),
          carbs: Math.round(Number(sug.carbs)),
          fats: Math.round(Number(sug.fats))
        }));
      }
      // Check per la struttura 'meals'
      else if (suggestions.meals && Array.isArray(suggestions.meals)) {
        processedSuggestions = suggestions.meals.map((sug: any) => ({
          name: sug.name,
          description: sug.description,
          mealType: sug.mealType,
          calories: Math.round(Number(sug.calories)),
          proteins: Math.round(Number(sug.proteins)),
          carbs: Math.round(Number(sug.carbs)),
          fats: Math.round(Number(sug.fats))
        }));
      }
      // Gestisci il caso in cui abbiamo un singolo pasto come oggetto
      else if (suggestions.name && (suggestions.calories !== undefined)) {
        processedSuggestions = [{
          name: suggestions.name,
          description: suggestions.description || "",
          mealType: suggestions.mealType || "Pasto generico",
          calories: Math.round(Number(suggestions.calories)),
          proteins: Math.round(Number(suggestions.proteins)),
          carbs: Math.round(Number(suggestions.carbs)),
          fats: Math.round(Number(suggestions.fats))
        }];
      }
    }
      
    return processedSuggestions;
  } catch (error: any) {
    console.error("Error generating meal suggestions:", error);
    throw new Error(`Failed to generate meal suggestions: ${error?.message || 'Unknown error'}`);
  }
}