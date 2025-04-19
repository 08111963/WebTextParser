import fetch from 'node-fetch';
import type { UserProfile, NutritionGoal } from "@shared/schema";

const API_KEY = process.env.PERPLEXITY_API_KEY;
const MODEL = "llama-3.1-sonar-small-128k-online";

/**
 * Genera suggerimenti personalizzati per pasti usando Perplexity API
 */
export async function generateMealSuggestionsWithPerplexity(
  profile: UserProfile,
  nutritionGoal?: NutritionGoal,
  mealType?: string,
  dietaryPreferences?: string[]
): Promise<any> {
  try {
    // Costruisci il prompt basato sui dati dell'utente e sulle preferenze
    const dietaryPrefsText = dietaryPreferences && dietaryPreferences.length > 0 
      ? `Le preferenze dietetiche dell'utente includono: ${dietaryPreferences.join(', ')}.` 
      : "";
    
    const goalText = nutritionGoal 
      ? `L'utente ha un obiettivo nutrizionale di ${nutritionGoal.calories} calorie, ${nutritionGoal.proteins}g di proteine, ${nutritionGoal.carbs}g di carboidrati e ${nutritionGoal.fats}g di grassi al giorno.` 
      : "";
    
    const mealTypeText = mealType 
      ? `L'utente sta cercando suggerimenti per ${mealType}.` 
      : "L'utente sta cercando suggerimenti per i pasti della giornata.";
    
    const profileText = `L'utente è ${profile.gender}, ha ${profile.age} anni, pesa ${profile.weight}kg, è alto ${profile.height}cm e ha un livello di attività ${profile.activityLevel}.`;
    
    const prompt = `
    In qualità di nutrizionista esperto di cucina italiana, fornisci suggerimenti personalizzati per pasti sani ed equilibrati.
    
    ${profileText}
    ${goalText}
    ${mealTypeText}
    ${dietaryPrefsText}
    
    Fornisci 3 suggerimenti specifici di pasti con le seguenti informazioni per ciascuno:
    1. Nome del piatto (breve e descrittivo)
    2. Breve descrizione (massimo 30 parole)
    3. Valori nutrizionali stimati (calorie, proteine, carboidrati, grassi)
    4. Ingredienti principali (solo elenco, non quantità)
    
    Rispondi in formato JSON con questo schema:
    {
      "meals": [
        {
          "name": "Nome del piatto",
          "description": "Descrizione breve",
          "calories": numero,
          "proteins": numero (grammi),
          "carbs": numero (grammi),
          "fats": numero (grammi),
          "ingredients": ["ingrediente1", "ingrediente2", ...]
        },
        ...
      ]
    }
    
    Fornisci valori nutrizionali realistici e precisi basati sugli ingredienti e sulla porzione.
    `;

    // Chiamata all'API Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Sei un esperto nutrizionista italiano specializzato in piani alimentari personalizzati. Rispondi sempre in italiano e con informazioni precise, basate sui dati forniti. Usa sempre il formato JSON richiesto."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore API Perplexity:', errorText);
      throw new Error(`Errore nell'API Perplexity: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse della risposta JSON
    try {
      const mealSuggestions = JSON.parse(content);
      return mealSuggestions;
    } catch (e) {
      console.error('Errore nel parsing della risposta JSON:', e);
      throw new Error('Formato di risposta non valido');
    }
  } catch (error) {
    console.error('Errore nella generazione dei suggerimenti per i pasti:', error);
    throw error;
  }
}

/**
 * Genera consigli nutrizionali personalizzati usando Perplexity API
 */
export async function generateNutritionalAdviceWithPerplexity(
  profile: UserProfile,
  query: string
): Promise<any> {
  try {
    // Costruisci il prompt basato sui dati dell'utente e sulla query
    const profileText = `L'utente è ${profile.gender}, ha ${profile.age} anni, pesa ${profile.weight}kg, è alto ${profile.height}cm e ha un livello di attività ${profile.activityLevel}.`;
    
    const prompt = `
    In qualità di nutrizionista esperto, fornisci consigli nutrizionali personalizzati per la seguente richiesta:
    
    Richiesta dell'utente: "${query}"
    
    Dati profilo: ${profileText}
    
    Fornisci una risposta dettagliata ma concisa, con consigli pratici e scientificamente validi.
    Se la richiesta è relativa a valori nutrizionali o calorie, includi numeri specifici e riferimenti.
    Includi sempre almeno un consiglio pratico che l'utente può implementare immediatamente.
    
    Rispondi in italiano usando un tono professionale ma accessibile.
    `;

    // Chiamata all'API Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Sei un esperto nutrizionista italiano specializzato in consulenza personalizzata. Rispondi sempre in italiano e con informazioni precise, basate sui dati forniti e ricerche scientifiche attuali."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore API Perplexity:', errorText);
      throw new Error(`Errore nell'API Perplexity: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return { advice: content };
  } catch (error) {
    console.error('Errore nella generazione dei consigli nutrizionali:', error);
    throw error;
  }
}