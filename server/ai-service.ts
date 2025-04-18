import OpenAI from "openai";
import { Meal, NutritionGoal, UserProfile } from "@shared/schema";

// Inizializza OpenAI SDK client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

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
        obiettivi: profile.goals || "Non specificati",
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
    1. Un titolo breve e chiaro
    2. Una breve descrizione che spieghi perché questo obiettivo è adatto all'utente
    3. Calorie giornaliere raccomandate
    4. Distribuzione di macronutrienti (proteine, carboidrati, grassi) in grammi
    
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

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const recommendations = JSON.parse(response.choices[0].message.content);
    
    // Assicurati che i valori siano tutti numeri interi
    const processedRecommendations = Array.isArray(recommendations) 
      ? recommendations.map(rec => ({
          title: rec.title,
          description: rec.description,
          calories: Math.round(Number(rec.calories)),
          proteins: Math.round(Number(rec.proteins)),
          carbs: Math.round(Number(rec.carbs)),
          fats: Math.round(Number(rec.fats))
        }))
      : [];
      
    return processedRecommendations;
  } catch (error) {
    console.error("Error generating nutrition goal recommendations:", error);
    throw new Error(`Failed to generate nutrition goal recommendations: ${error.message}`);
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
        obiettivi: profile.goals || "Non specificati",
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
    
    Genera 3 idee per pasti che:
    ${mealType ? `- Siano adatti per ${mealType}` : '- Siano adatti per qualsiasi pasto'}
    - Rispettino i limiti calorici e i macronutrienti dell'obiettivo nutrizionale (se presente)
    - Tengano conto dell'età, peso, altezza e livello di attività dell'utente
    ${preferences && preferences.length > 0 ? `- Considerino le preferenze: ${preferences.join(', ')}` : ''}
    
    Per ciascun pasto, fornisci:
    1. Un nome breve e appetitoso
    2. Una breve descrizione che includa ingredienti principali e benefici nutrizionali
    3. Il tipo di pasto (colazione, pranzo, cena, spuntino)
    4. Il contenuto calorico e i macronutrienti (proteine, carboidrati, grassi)
    
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

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const suggestions = JSON.parse(response.choices[0].message.content);
    
    // Assicurati che i valori siano tutti numeri interi
    const processedSuggestions = Array.isArray(suggestions) 
      ? suggestions.map(sug => ({
          name: sug.name,
          description: sug.description,
          mealType: sug.mealType,
          calories: Math.round(Number(sug.calories)),
          proteins: Math.round(Number(sug.proteins)),
          carbs: Math.round(Number(sug.carbs)),
          fats: Math.round(Number(sug.fats))
        }))
      : [];
      
    return processedSuggestions;
  } catch (error) {
    console.error("Error generating meal suggestions:", error);
    throw new Error(`Failed to generate meal suggestions: ${error.message}`);
  }
}