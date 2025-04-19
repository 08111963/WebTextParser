import { NutritionGoal, UserProfile } from "@shared/schema";

// Verifica che la chiave API sia disponibile
if (!process.env.PERPLEXITY_API_KEY) {
  console.warn("La variabile d'ambiente PERPLEXITY_API_KEY non è impostata. Le funzionalità di Perplexity AI non funzioneranno correttamente.");
}

// Funzione helper per le chiamate a Perplexity API
async function callPerplexityAPI(messages: any[]) {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1024,
        search_recency_filter: "month",
        return_images: false,
        return_related_questions: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Errore nella chiamata a Perplexity API:", error);
    throw error;
  }
}

/**
 * Genera suggerimenti personalizzati per pasti usando Perplexity API
 */
export async function generateMealSuggestionsWithPerplexity(
  profile: UserProfile,
  nutritionGoal?: NutritionGoal,
  mealType?: string,
  dietaryPreferences?: string[]
) {
  console.log("Generazione suggerimenti pasti con Perplexity per l'utente:", profile.userId);

  // Crea una rappresentazione stringente delle preferenze dietetiche
  const dietaryPrefsString = dietaryPreferences && dietaryPreferences.length > 0
    ? `Preferenze dietetiche: ${dietaryPreferences.join(', ')}.`
    : "";

  // Determina il tipo di pasto
  const mealTypeDesc = mealType || "un pasto generico";

  // Costruisci il prompt per Perplexity
  const systemPrompt = `Sei un nutrizionista esperto specializzato in piani alimentari personalizzati.
    Restituisci 3 suggerimenti dettagliati per ${mealTypeDesc} in formato JSON.
    Il tuo output deve essere ESCLUSIVAMENTE in formato JSON parsabile, senza testo introduttivo o conclusivo.
    Schema del JSON: { "meals": [ { "name": "Nome del pasto", "description": "Descrizione", "calories": numero, "proteins": numero, "carbs": numero, "fats": numero, "ingredients": ["ingrediente1", "ingrediente2"] } ] }
    Tutti i numeri devono essere interi (senza decimali).
    Ogni pasto deve avere tra 5 e 8 ingredienti principali.
    Scrivi l'output in italiano.`;

  // Informazioni sull'utente per personalizzare i suggerimenti
  let userProfileInfo = `Profilo Utente:
    - Età: ${profile.age || 'Non specificata'}
    - Genere: ${profile.gender || 'Non specificato'}
    - Peso: ${profile.weight ? `${profile.weight} kg` : 'Non specificato'}
    - Altezza: ${profile.height ? `${profile.height} cm` : 'Non specificata'}
    - Livello di attività: ${profile.activityLevel || 'Non specificato'}
    ${dietaryPrefsString}`;

  // Aggiungi informazioni sugli obiettivi nutrizionali se disponibili
  if (nutritionGoal) {
    userProfileInfo += `\nObiettivo Nutrizionale Attuale:
    - Calorie: ${nutritionGoal.calories} kcal
    - Proteine: ${nutritionGoal.proteins} g
    - Carboidrati: ${nutritionGoal.carbs} g
    - Grassi: ${nutritionGoal.fats} g
    - Obiettivo: ${nutritionGoal.title}
    - Descrizione: ${nutritionGoal.description || 'Non specificata'}`;
  }

  // Prompt finale per l'utente
  const userPrompt = `Genera 3 suggerimenti per ${mealTypeDesc} adatti a questo profilo:
    ${userProfileInfo}
    
    Voglio ricette creative ma pratiche, con variazioni ispirate alla cucina mediterranea e internazionale.
    Includi valori nutrizionali e ingredienti principali.
    Ogni pasto deve essere equilibrato e fornire adeguate proteine, carboidrati e grassi.
    Utilizza ingredienti stagionali e facilmente reperibili.
    ${nutritionGoal ? `I pasti devono rispettare i target nutrizionali indicati nell'obiettivo.` : ''}
    ${dietaryPrefsString ? `Rispetta assolutamente le preferenze dietetiche indicate.` : ''}`;

  try {
    // Chiamata a Perplexity API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await callPerplexityAPI(messages);
    console.log("Perplexity API response:", JSON.stringify(response.choices[0].message));

    // Estrai e parsa il JSON dalla risposta
    const content = response.choices[0].message.content;
    try {
      const parsedContent = JSON.parse(content);
      return parsedContent;
    } catch (parseError) {
      console.error("Errore nel parsing della risposta JSON:", parseError);
      console.log("Risposta non valida:", content);
      
      // Tentativo di estrarre il JSON usando regex se il parsing fallisce
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          return JSON.parse(extractedJson);
        } catch (extractError) {
          console.error("Impossibile estrarre JSON valido dalla risposta:", extractError);
          throw new Error("Formato di risposta non valido dall'API");
        }
      }
      
      throw new Error("Formato di risposta non valido dall'API");
    }
  } catch (error) {
    console.error("Errore nella generazione dei suggerimenti pasti:", error);
    throw error;
  }
}

/**
 * Genera consigli nutrizionali personalizzati usando Perplexity API
 */
export async function generateNutritionalAdviceWithPerplexity(
  profile: UserProfile,
  userQuery: string
) {
  console.log("Generazione consigli nutrizionali con Perplexity per l'utente:", profile.userId);
  console.log("Query dell'utente:", userQuery);

  // Costruisci il prompt per Perplexity
  const systemPrompt = `Sei un nutrizionista esperto che risponde a domande sulla nutrizione, alimentazione e salute.
    Fornisci consigli nutrizionali personalizzati basati sul profilo dell'utente.
    Rispondi in modo esauriente, fornendo informazioni accurate e scientifiche.
    Usa uno stile professionale ma accessibile, con spiegazioni chiare ed esempi pratici.
    Rispondi in italiano.`;

  // Informazioni sull'utente per personalizzare i consigli
  let userProfileInfo = `Profilo Utente:
    - Età: ${profile.age || 'Non specificata'}
    - Genere: ${profile.gender || 'Non specificato'}
    - Peso: ${profile.weight ? `${profile.weight} kg` : 'Non specificato'}
    - Altezza: ${profile.height ? `${profile.height} cm` : 'Non specificata'}
    - Livello di attività: ${profile.activityLevel || 'Non specificato'}`;

  // Calcola il BMI se altezza e peso sono disponibili
  if (profile.height && profile.weight) {
    const heightInMeters = profile.height / 100;
    const bmi = Math.round((profile.weight / (heightInMeters * heightInMeters)) * 10) / 10;
    userProfileInfo += `\n- BMI calcolato: ${bmi}`;
  }

  // Prompt finale per l'utente
  const promptWithQuery = `In base a questo profilo utente:
    ${userProfileInfo}
    
    Rispondi a questa domanda sulla nutrizione:
    "${userQuery}"
    
    Fornisci una risposta completa e personalizzata, con spiegazioni chiare e consigli pratici.
    Includi, quando opportuno, riferimenti a studi scientifici recenti e linee guida nutrizionali aggiornate.`;

  try {
    // Chiamata a Perplexity API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: promptWithQuery }
    ];

    const response = await callPerplexityAPI(messages);
    const advice = response.choices[0].message.content;

    return { 
      advice,
      citations: response.citations || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Errore nella generazione dei consigli nutrizionali:", error);
    throw error;
  }
}