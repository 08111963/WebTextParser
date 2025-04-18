import OpenAI from 'openai';
import { User, UserProfile, NutritionGoal, Meal } from '@shared/schema';

// Inizializza il client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera consigli personalizzati per obiettivi nutrizionali basati sul profilo utente
 */
export async function generateNutritionGoalRecommendations(
  profile: UserProfile,
  currentGoal?: NutritionGoal,
  recentMeals?: Meal[],
) {
  try {
    // Calcola attività fisica in italiano
    const activityLevelMap: Record<string, string> = {
      'sedentaria': 'livello di attività sedentario (poco o nessun esercizio)',
      'leggera': 'attività fisica leggera (esercizio 1-3 volte/settimana)',
      'moderata': 'attività fisica moderata (esercizio 3-5 volte/settimana)',
      'attiva': 'attività fisica attiva (esercizio intenso 6-7 volte/settimana)',
      'molto attiva': 'attività fisica molto intensa (esercizio o lavoro fisico quotidiano)',
    };

    // Costruisci il prompt con il profilo utente
    const userContext = `
Profilo utente:
- Nome: ${profile.name}
- Età: ${profile.age} anni
- Genere: ${profile.gender}
- Peso: ${profile.weight} kg
- Altezza: ${profile.height} cm
- Attività fisica: ${activityLevelMap[profile.activityLevel] || profile.activityLevel}
`;

    // Aggiungi informazioni sugli obiettivi correnti se disponibili
    let currentGoalContext = '';
    if (currentGoal) {
      currentGoalContext = `
Obiettivo nutrizionale attuale:
- Calorie giornaliere: ${currentGoal.calories} kcal
- Proteine: ${currentGoal.proteins}g
- Carboidrati: ${currentGoal.carbs}g
- Grassi: ${currentGoal.fats}g
`;
    }

    // Aggiungi informazioni sui pasti recenti se disponibili
    let recentMealsContext = '';
    if (recentMeals && recentMeals.length > 0) {
      recentMealsContext = `
Pasti recenti (ultimi ${Math.min(recentMeals.length, 5)}):
${recentMeals.slice(0, 5).map(meal => `- ${meal.food} (${meal.calories} kcal, ${meal.proteins}g proteine, ${meal.carbs}g carboidrati, ${meal.fats}g grassi)`).join('\n')}
`;
    }

    // Costruisci il prompt completo
    const prompt = `
Sei un esperto nutrizionista che deve fornire raccomandazioni personalizzate per obiettivi alimentari. Scrivi in italiano. 
${userContext}
${currentGoalContext}
${recentMealsContext}

Basandoti su queste informazioni, genera 3 possibili obiettivi nutrizionali personalizzati per questo utente. Per ciascun obiettivo, fornisci:
1. Un titolo descrittivo conciso
2. Un apporto calorico giornaliero consigliato
3. Una distribuzione macronutriente raccomandata (proteine, carboidrati, grassi in grammi)
4. Una breve spiegazione di come questo obiettivo aiuterà l'utente a migliorare la sua salute e benessere

Ogni obiettivo dovrebbe seguire uno dei seguenti scenari:
- Mantenimento del peso attuale
- Perdita di peso graduale e salutare
- Aumento della massa muscolare

Fornisci la risposta in formato JSON che rispetti questa struttura:
{
  "recommendations": [
    {
      "title": "Titolo dell'obiettivo",
      "description": "Breve descrizione",
      "calories": 0000,
      "proteins": 000,
      "carbs": 000,
      "fats": 000
    },
    // altri obiettivi...
  ]
}
`;

    // Chiamata a OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "Sei un esperto nutrizionista che fornisce consigli personalizzati." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Nessuna risposta ricevuta dall'AI");
    }

    // Analizza la risposta JSON
    const data = JSON.parse(responseContent);
    return data.recommendations;
  } catch (error) {
    console.error("Errore nella generazione delle raccomandazioni:", error);
    throw new Error("Impossibile generare raccomandazioni nutrizionali");
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
    // Costruisci il prompt con il profilo utente
    const userContext = `
Profilo utente:
- Nome: ${profile.name}
- Età: ${profile.age} anni
- Genere: ${profile.gender}
- Peso: ${profile.weight} kg
- Altezza: ${profile.height} cm
- Attività fisica: ${profile.activityLevel}
`;

    // Aggiungi obiettivi nutrizionali se disponibili
    let nutritionGoalContext = '';
    if (nutritionGoal) {
      nutritionGoalContext = `
Obiettivo nutrizionale:
- Calorie giornaliere: ${nutritionGoal.calories} kcal
- Proteine: ${nutritionGoal.proteins}g
- Carboidrati: ${nutritionGoal.carbs}g
- Grassi: ${nutritionGoal.fats}g
`;
    }

    // Aggiungi il tipo di pasto se specificato
    let mealTypeContext = '';
    if (mealType) {
      mealTypeContext = `Tipo di pasto richiesto: ${mealType}`;
    } else {
      mealTypeContext = 'Genera suggerimenti per colazione, pranzo e cena.';
    }

    // Aggiungi preferenze alimentari se specificate
    let preferencesContext = '';
    if (preferences && preferences.length > 0) {
      preferencesContext = `Preferenze alimentari: ${preferences.join(', ')}`;
    }

    // Costruisci il prompt completo
    const prompt = `
Sei un esperto chef nutrizionista che deve fornire suggerimenti per pasti sani e gustosi. Scrivi in italiano.
${userContext}
${nutritionGoalContext}
${mealTypeContext}
${preferencesContext}

Basandoti su queste informazioni, genera 3 idee di pasti personalizzati. Per ciascun pasto, fornisci:
1. Nome del piatto
2. Breve descrizione
3. Valori nutrizionali stimati (calorie, proteine, carboidrati, grassi)
4. Indicazione del pasto (colazione, pranzo, cena o spuntino)

Assicurati che i pasti:
- Siano adatti al profilo fisico dell'utente
- Rispettino gli obiettivi nutrizionali, se specificati
- Siano pratici da preparare
- Utilizzino ingredienti comuni e facilmente reperibili
- Rispettino le eventuali preferenze alimentari indicate

Fornisci la risposta in formato JSON che rispetti questa struttura:
{
  "suggestions": [
    {
      "name": "Nome del piatto",
      "description": "Breve descrizione e ingredienti principali",
      "mealType": "colazione/pranzo/cena/spuntino",
      "calories": 000,
      "proteins": 00,
      "carbs": 00,
      "fats": 00
    },
    // altri pasti...
  ]
}
`;

    // Chiamata a OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "Sei un esperto chef nutrizionista che fornisce suggerimenti per pasti sani e gustosi." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Nessuna risposta ricevuta dall'AI");
    }

    // Analizza la risposta JSON
    const data = JSON.parse(responseContent);
    return data.suggestions;
  } catch (error) {
    console.error("Errore nella generazione dei suggerimenti per i pasti:", error);
    throw new Error("Impossibile generare suggerimenti per i pasti");
  }
}