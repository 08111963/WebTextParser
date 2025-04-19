import OpenAI from "openai";
import { Meal, NutritionGoal, UserProfile } from "@shared/schema";

// Inizializza OpenAI SDK client per obiettivi nutrizionali
const openaiGoals = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_GOALS });

// Inizializza OpenAI SDK client per suggerimenti pasti
const openaiMeals = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_MEALS });

// Inizializza OpenAI SDK client per uso generale (per compatibilità con codice esistente)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_GOALS });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Debug log per verificare se le API key sono presenti
console.log("OpenAI API key for goals exists:", !!process.env.OPENAI_API_KEY_GOALS);
console.log("OpenAI API key for meals exists:", !!process.env.OPENAI_API_KEY_MEALS);

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

    console.log("Sending user query to OpenAI using goals API key:", query);
    
    const response = await openaiGoals.chat.completions.create({
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
    
    // Registriamo l'errore specifico per debug ma lanciamo un messaggio generico all'utente
    if (error.status === 429) {
      console.log("API rate limit exceeded for OpenAI");
    } else if (error.status === 401 || error.status === 403) {
      console.log("Authentication error with OpenAI API");
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.log("Connection issue with OpenAI API", error.code);
    }
    
    // Messaggio generico per l'utente
    throw new Error("Si è verificato un problema nella generazione della risposta. Riprova più tardi.");
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
    
    // Forziamo la creazione di tre obiettivi generando tre prompt separati con stili nutrizionali forzati
    // Questo evita che l'API ritorni un solo suggerimento

    // Primo prompt: Approccio Mediterraneo/Equilibrato
    const prompt1 = `
    Crea UN SOLO obiettivo nutrizionale personalizzato con approccio MEDITERRANEO/EQUILIBRATO per questo utente:
    ${JSON.stringify(userInfo, null, 2)}
    
    Devi fornire:
    1. Un titolo breve e creativo per questo obiettivo MEDITERRANEO (sii originale, usa termini accattivanti)
    2. Una breve descrizione che spieghi perché l'approccio mediterraneo equilibrato è adatto a questo utente
    3. Calorie giornaliere raccomandate per questo approccio
    4. Distribuzione di macronutrienti (proteine, carboidrati, grassi) in grammi
    
    QUERY ID UNICO: ${new Date().getTime().toString() + "-med"} (genera una risposta completamente nuova)
    
    Rispondi SOLO con un oggetto JSON nel seguente formato:
    {
      "title": "Titolo obiettivo mediterraneo",
      "description": "Descrizione e motivazione",
      "calories": numero_calorie,
      "proteins": grammi_proteine,
      "carbs": grammi_carboidrati,
      "fats": grammi_grassi
    }
    `;

    // Secondo prompt: Approccio Proteico/Energetico
    const prompt2 = `
    Crea UN SOLO obiettivo nutrizionale personalizzato con approccio PROTEICO/ENERGETICO per questo utente:
    ${JSON.stringify(userInfo, null, 2)}
    
    Devi fornire:
    1. Un titolo breve e creativo per questo obiettivo PROTEICO (sii originale, usa termini accattivanti)
    2. Una breve descrizione che spieghi perché un approccio ad alto contenuto proteico è adatto a questo utente
    3. Calorie giornaliere raccomandate (più alte del normale per favorire l'energia)
    4. Distribuzione di macronutrienti con PROTEINE ELEVATE (almeno 25-30% delle calorie totali)
    
    QUERY ID UNICO: ${new Date().getTime().toString() + "-prot"} (genera una risposta completamente nuova)
    
    Rispondi SOLO con un oggetto JSON nel seguente formato:
    {
      "title": "Titolo obiettivo proteico",
      "description": "Descrizione e motivazione",
      "calories": numero_calorie,
      "proteins": grammi_proteine_elevate,
      "carbs": grammi_carboidrati,
      "fats": grammi_grassi
    }
    `;

    // Terzo prompt: Approccio Plant-Based/Low-Carb
    const prompt3 = `
    Crea UN SOLO obiettivo nutrizionale personalizzato con approccio PLANT-BASED o LOW-CARB per questo utente:
    ${JSON.stringify(userInfo, null, 2)}
    
    Devi fornire:
    1. Un titolo breve e creativo per questo obiettivo PLANT-BASED o LOW-CARB (sii originale, usa termini accattivanti)
    2. Una breve descrizione che spieghi perché questo approccio è adatto a questo utente
    3. Calorie giornaliere raccomandate (leggermente ridotte rispetto al normale)
    4. Distribuzione di macronutrienti con CARBOIDRATI RIDOTTI e grassi sani aumentati
    
    QUERY ID UNICO: ${new Date().getTime().toString() + "-plant"} (genera una risposta completamente nuova)
    
    Rispondi SOLO con un oggetto JSON nel seguente formato:
    {
      "title": "Titolo obiettivo plant-based/low-carb",
      "description": "Descrizione e motivazione",
      "calories": numero_calorie_ridotte,
      "proteins": grammi_proteine,
      "carbs": grammi_carboidrati_ridotti,
      "fats": grammi_grassi_elevati
    }
    `;

    console.log("Sending multiple nutrition recommendations requests to OpenAI...");
    
    // Eseguiamo tre chiamate separate in parallelo per generare tre obiettivi diversi
    // Utilizziamo openaiGoals per le raccomandazioni sugli obiettivi nutrizionali
    console.log("Using OPENAI_API_KEY_GOALS for nutrition recommendations");
    const [response1, response2, response3] = await Promise.all([
      openaiGoals.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt1 }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
      openaiGoals.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt2 }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
      openaiGoals.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt3 }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      })
    ]);

    console.log("All OpenAI responses received for objectives");
    
    // Processiamo ogni risposta separatamente
    let recommendation1: any = {};
    let recommendation2: any = {};
    let recommendation3: any = {};
    
    try {
      // Parsing della prima risposta (mediterranea)
      const responseContent1 = response1.choices[0].message.content || '{}';
      recommendation1 = JSON.parse(responseContent1);
      console.log("Parsed recommendation 1 (mediterranea):", recommendation1);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response 1:", parseError);
      recommendation1 = {
        title: "Mediterranea Equilibrata",
        description: "Approccio mediterraneo con equilibrio tra tutti i macronutrienti, ideale per sostenere energia e salute in modo bilanciato.",
        calories: 2200,
        proteins: 120,
        carbs: 270,
        fats: 70
      };
    }
    
    try {
      // Parsing della seconda risposta (proteica)
      const responseContent2 = response2.choices[0].message.content || '{}';
      recommendation2 = JSON.parse(responseContent2);
      console.log("Parsed recommendation 2 (proteica):", recommendation2);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response 2:", parseError);
      recommendation2 = {
        title: "Proteica Potenziata",
        description: "Un approccio ad alto contenuto proteico per supportare la massa muscolare e migliorare la sazietà durante la giornata.",
        calories: 2300,
        proteins: 150,
        carbs: 250,
        fats: 75
      };
    }
    
    try {
      // Parsing della terza risposta (plant-based/low-carb)
      const responseContent3 = response3.choices[0].message.content || '{}';
      recommendation3 = JSON.parse(responseContent3);
      console.log("Parsed recommendation 3 (plant-based/low-carb):", recommendation3);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response 3:", parseError);
      recommendation3 = {
        title: "Low-Carb Naturale",
        description: "Una strategia con carboidrati ridotti e grassi sani aumentati, ideale per stabilizzare i livelli di energia e migliorare il metabolismo.",
        calories: 2000,
        proteins: 125,
        carbs: 180,
        fats: 100
      };
    }
    
    // Applicare un leggero offset casuale ai valori numerici di ogni raccomandazione
    // per garantire ancora di più che siano diversi, anche se l'API dovesse rispondere in modo simile
    const applyRandomOffset = (value: number): number => {
      const offsetPercentage = Math.random() * 0.15 - 0.075; // Offset tra -7.5% e +7.5%
      return Math.round(value * (1 + offsetPercentage));
    };
    
    // Applicare l'offset ai valori del primo suggerimento
    recommendation1.calories = applyRandomOffset(recommendation1.calories || 2200);
    recommendation1.proteins = applyRandomOffset(recommendation1.proteins || 110);
    recommendation1.carbs = applyRandomOffset(recommendation1.carbs || 270);
    recommendation1.fats = applyRandomOffset(recommendation1.fats || 70);
    
    // Applicare l'offset ai valori del secondo suggerimento
    recommendation2.calories = applyRandomOffset(recommendation2.calories || 2400);
    recommendation2.proteins = applyRandomOffset(recommendation2.proteins || 150);
    recommendation2.carbs = applyRandomOffset(recommendation2.carbs || 250);
    recommendation2.fats = applyRandomOffset(recommendation2.fats || 80);
    
    // Applicare l'offset ai valori del terzo suggerimento
    recommendation3.calories = applyRandomOffset(recommendation3.calories || 2000);
    recommendation3.proteins = applyRandomOffset(recommendation3.proteins || 125);
    recommendation3.carbs = applyRandomOffset(recommendation3.carbs || 180);
    recommendation3.fats = applyRandomOffset(recommendation3.fats || 100);
    
    // Combiniamo le tre risposte in un array
    const recommendations = [
      recommendation1,
      recommendation2,
      recommendation3
    ];
    
    // Processiamo le tre raccomandazioni normalizzando i valori
    let processedRecommendations = [
      {
        title: recommendation1.title || "Mediterranea Equilibrata",
        description: recommendation1.description || "Approccio mediterraneo ricco di nutrienti essenziali, per mantenere energia e salute in modo bilanciato.",
        calories: Math.round(Number(recommendation1.calories) || 2200),
        proteins: Math.round(Number(recommendation1.proteins) || 110),
        carbs: Math.round(Number(recommendation1.carbs) || 270),
        fats: Math.round(Number(recommendation1.fats) || 70)
      },
      {
        title: recommendation2.title || "Proteica Energetica",
        description: recommendation2.description || "Strategia ad alto contenuto proteico per favorire la massa muscolare e fornire energia duratura durante l'attività fisica.",
        calories: Math.round(Number(recommendation2.calories) || 2400),
        proteins: Math.round(Number(recommendation2.proteins) || 150),
        carbs: Math.round(Number(recommendation2.carbs) || 250),
        fats: Math.round(Number(recommendation2.fats) || 80)
      },
      {
        title: recommendation3.title || "Low-Carb Essenziale",
        description: recommendation3.description || "Piano a basso contenuto di carboidrati che favorisce i grassi sani per fornire energia stabile e costante durante la giornata.",
        calories: Math.round(Number(recommendation3.calories) || 2000),
        proteins: Math.round(Number(recommendation3.proteins) || 130),
        carbs: Math.round(Number(recommendation3.carbs) || 180),
        fats: Math.round(Number(recommendation3.fats) || 110)
      }
    ];
      
    return processedRecommendations;
  } catch (error: any) {
    console.error("Error generating nutrition goal recommendations:", error);
    
    // Registriamo l'errore specifico per debug ma lanciamo un messaggio generico all'utente
    if (error.status === 429) {
      console.log("API rate limit exceeded for nutrition goal recommendations");
    } else if (error.status === 401 || error.status === 403) {
      console.log("Authentication error with OpenAI API for nutrition goals");
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.log("Connection issue with OpenAI API", error.code);
    }
    
    // Messaggio generico per l'utente
    throw new Error("Si è verificato un problema nella generazione delle raccomandazioni. Riprova più tardi.");
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
    
    Genera 3 idee COMPLETAMENTE ORIGINALI per pasti che:
    ${mealType ? `- Siano adatti per ${mealType}` : '- Includano diverse tipologie (colazione, pranzo, cena, spuntino)'}
    - Rispettino i limiti calorici e i macronutrienti dell'obiettivo nutrizionale (se presente)
    - Tengano conto dell'età, peso, altezza e livello di attività dell'utente
    ${preferences && preferences.length > 0 ? `- Considerino le preferenze: ${preferences.join(', ')}` : ''}
    
    QUERY ID UNICO: ${new Date().getTime().toString()} (ignora questo ID, serve solo a garantire che la tua risposta sia sempre diversa)
    
    Per ciascun pasto, fornisci:
    1. Un nome breve, creativo e appetitoso (DEVE ESSERE UNICO e MAI utilizzato prima)
    2. Una breve descrizione chiara e concisa che includa ingredienti principali e benefici nutrizionali (massimo 2-3 frasi)
    3. Il tipo di pasto (colazione, pranzo, cena, spuntino)
    4. Il contenuto calorico e i macronutrienti (proteine, carboidrati, grassi)
    
    IMPORTANTE! REGOLE DA SEGUIRE:
    - Ad ogni chiamata, DEVI fornire idee di pasti COMPLETAMENTE DIVERSE da qualsiasi altra generata in precedenza.
    - NON ripetere MAI piatti precedenti o loro varianti, anche se distanti nel tempo.
    - Sii ESTREMAMENTE creativo con gli ingredienti e le preparazioni.
    - Proponi combinazioni di ingredienti ORIGINALI e diverse culture culinarie.
    - NON suggerire MAI "Tacos di Quinoa" o qualsiasi tipo di tacos.
    
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
    console.log("Using OPENAI_API_KEY_MEALS for meal suggestions");
    
    const response = await openaiMeals.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Temperatura più bilanciata per stabilità
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
    // Se abbiamo un oggetto con proprietà 'suggestions', 'mealIdeas', 'meals', 'pasti' o altra struttura
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
      // Check per la struttura italiana 'pasti'
      else if (suggestions.pasti && Array.isArray(suggestions.pasti)) {
        processedSuggestions = suggestions.pasti.map((sug: any) => ({
          name: sug.name || sug.nome,
          description: sug.description || sug.descrizione,
          mealType: sug.mealType || sug.tipoPasto,
          calories: Math.round(Number(sug.calories || sug.calorie)),
          proteins: Math.round(Number(sug.proteins || sug.proteine)),
          carbs: Math.round(Number(sug.carbs || sug.carboidrati)),
          fats: Math.round(Number(sug.fats || sug.grassi))
        }));
      }
      // Gestisci il caso in cui abbiamo un singolo pasto come oggetto
      else if ((suggestions.name || suggestions.nome) && 
              ((suggestions.calories !== undefined) || (suggestions.calorie !== undefined))) {
        processedSuggestions = [{
          name: suggestions.name || suggestions.nome,
          description: suggestions.description || suggestions.descrizione || "",
          mealType: suggestions.mealType || suggestions.tipoPasto || "Pasto generico",
          calories: Math.round(Number(suggestions.calories || suggestions.calorie)),
          proteins: Math.round(Number(suggestions.proteins || suggestions.proteine)),
          carbs: Math.round(Number(suggestions.carbs || suggestions.carboidrati)),
          fats: Math.round(Number(suggestions.fats || suggestions.grassi))
        }];
      }
    }
      
    return processedSuggestions;
  } catch (error: any) {
    console.error("Error generating meal suggestions:", error);
    
    // Registriamo l'errore specifico per debug ma lanciamo un messaggio generico all'utente
    if (error.status === 429) {
      console.log("API rate limit exceeded for meal suggestions");
    } else if (error.status === 401 || error.status === 403) {
      console.log("Authentication error with OpenAI API for meal suggestions");
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.log("Connection issue with OpenAI API", error.code);
    }
    
    // Messaggio generico per l'utente
    throw new Error("Si è verificato un problema nella generazione dei suggerimenti pasti. Riprova più tardi.");
  }
}