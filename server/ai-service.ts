import OpenAI from "openai";
import { Meal, NutritionGoal, UserProfile } from "@shared/schema";

// Initialize OpenAI SDK client for nutritional goals
const openaiGoals = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_GOALS });

// Initialize OpenAI SDK client for meal suggestions
const openaiMeals = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_MEALS });

// Initialize OpenAI SDK client for general use (for compatibility with existing code)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_GOALS });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Debug log to verify if API keys are present
console.log("OpenAI API key for goals exists:", !!process.env.OPENAI_API_KEY_GOALS);
console.log("OpenAI API key for meals exists:", !!process.env.OPENAI_API_KEY_MEALS);

/**
 * Generates an AI response based on a direct user question
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
    throw new Error("A connection issue occurred while generating recommendations. Please try again later.");
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
      
    // Build a detailed prompt with all available information
    const systemPrompt = `You are an expert nutritionist providing personalized advice. 
    Examine the following user profile and generate 3 different nutritional goals suitable for their characteristics. 
    Answer in English.`;
    
    const userInfo = {
      profile: {
        age: profile.age || "Not specified",
        weight: profile.weight ? `${profile.weight} kg` : "Not specified",
        height: profile.height ? `${profile.height} cm` : "Not specified",
        gender: profile.gender || "Not specified",
        activityLevel: profile.activityLevel || "Not specified",
        bmi: bmi || "Not calculable",
      },
      currentGoal: currentGoal ? {
        name: currentGoal.name,
        calories: currentGoal.calories,
        proteins: currentGoal.proteins,
        carbs: currentGoal.carbs,
        fats: currentGoal.fats,
      } : "No goal currently set",
      recentMeals: recentMeals && recentMeals.length > 0 
        ? recentMeals.slice(0, 5).map(m => ({
            food: m.food,
            type: m.mealType,
            calories: m.calories,
            proteins: m.proteins,
            carbs: m.carbs,
            fats: m.fats
          }))
        : "No recently recorded meals"
    };
    
    // Force the creation of three goals by generating three separate prompts with forced nutritional styles
    // This prevents the API from returning only one suggestion

    // First prompt: Mediterranean/Balanced Approach
    const prompt1 = `
    Create ONLY ONE personalized nutritional goal with a MEDITERRANEAN/BALANCED approach for this user:
    ${JSON.stringify(userInfo, null, 2)}
    
    You must provide:
    1. A short, creative title for this MEDITERRANEAN goal (be original, use engaging terms)
    2. A brief description explaining why the balanced Mediterranean approach is suitable for this user
    3. Recommended daily calories for this approach
    4. Macronutrient distribution (proteins, carbs, fats) in grams
    
    UNIQUE QUERY ID: ${new Date().getTime().toString() + "-med"} (generate a completely new response)
    
    Respond ONLY with a JSON object in the following format:
    {
      "title": "Mediterranean goal title",
      "description": "Description and motivation",
      "calories": calories_number,
      "proteins": protein_grams,
      "carbs": carbs_grams,
      "fats": fat_grams
    }
    `;

    // Second prompt: Protein/Energy Approach
    const prompt2 = `
    Create ONLY ONE personalized nutritional goal with a PROTEIN/ENERGY approach for this user:
    ${JSON.stringify(userInfo, null, 2)}
    
    You must provide:
    1. A short, creative title for this PROTEIN goal (be original, use engaging terms)
    2. A brief description explaining why a high-protein approach is suitable for this user
    3. Recommended daily calories (higher than normal to promote energy)
    4. Macronutrient distribution with HIGH PROTEIN (at least 25-30% of total calories)
    
    UNIQUE QUERY ID: ${new Date().getTime().toString() + "-prot"} (generate a completely new response)
    
    Respond ONLY with a JSON object in the following format:
    {
      "title": "Protein goal title",
      "description": "Description and motivation",
      "calories": calories_number,
      "proteins": high_protein_grams,
      "carbs": carbs_grams,
      "fats": fat_grams
    }
    `;

    // Third prompt: Plant-Based/Low-Carb Approach
    const prompt3 = `
    Create ONLY ONE personalized nutritional goal with a PLANT-BASED or LOW-CARB approach for this user:
    ${JSON.stringify(userInfo, null, 2)}
    
    You must provide:
    1. A short, creative title for this PLANT-BASED or LOW-CARB goal (be original, use engaging terms)
    2. A brief description explaining why this approach is suitable for this user
    3. Recommended daily calories (slightly reduced from normal)
    4. Macronutrient distribution with REDUCED CARBS and increased healthy fats
    
    UNIQUE QUERY ID: ${new Date().getTime().toString() + "-plant"} (generate a completely new response)
    
    Respond ONLY with a JSON object in the following format:
    {
      "title": "Plant-based/low-carb goal title",
      "description": "Description and motivation",
      "calories": reduced_calories_number,
      "proteins": protein_grams,
      "carbs": reduced_carbs_grams,
      "fats": increased_fat_grams
    }
    `;

    console.log("Sending multiple nutrition recommendations requests to OpenAI...");
    
    // Execute three separate calls in parallel to generate three different goals
    // We use openaiGoals for nutritional goal recommendations
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
    
    // Process each response separately
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
        title: "Balanced Mediterranean",
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
    
    // Apply a slight random offset to the numerical values of each recommendation
    // to ensure even more that they are different, even if the API should respond similarly
    const applyRandomOffset = (value: number): number => {
      const offsetPercentage = Math.random() * 0.15 - 0.075; // Offset between -7.5% and +7.5%
      return Math.round(value * (1 + offsetPercentage));
    };
    
    // Apply offset to the values of the first suggestion
    recommendation1.calories = applyRandomOffset(recommendation1.calories || 2200);
    recommendation1.proteins = applyRandomOffset(recommendation1.proteins || 110);
    recommendation1.carbs = applyRandomOffset(recommendation1.carbs || 270);
    recommendation1.fats = applyRandomOffset(recommendation1.fats || 70);
    
    // Apply offset to the values of the second suggestion
    recommendation2.calories = applyRandomOffset(recommendation2.calories || 2400);
    recommendation2.proteins = applyRandomOffset(recommendation2.proteins || 150);
    recommendation2.carbs = applyRandomOffset(recommendation2.carbs || 250);
    recommendation2.fats = applyRandomOffset(recommendation2.fats || 80);
    
    // Apply offset to the values of the third suggestion
    recommendation3.calories = applyRandomOffset(recommendation3.calories || 2000);
    recommendation3.proteins = applyRandomOffset(recommendation3.proteins || 125);
    recommendation3.carbs = applyRandomOffset(recommendation3.carbs || 180);
    recommendation3.fats = applyRandomOffset(recommendation3.fats || 100);
    
    // Combine the three responses in an array
    const recommendations = [
      recommendation1,
      recommendation2,
      recommendation3
    ];
    
    // Process the three recommendations normalizing the values
    let processedRecommendations = [
      {
        title: recommendation1.title || "Balanced Mediterranean",
        description: recommendation1.description || "Mediterranean approach rich in essential nutrients, to maintain energy and health in a balanced way.",
        calories: Math.round(Number(recommendation1.calories) || 2200),
        proteins: Math.round(Number(recommendation1.proteins) || 110),
        carbs: Math.round(Number(recommendation1.carbs) || 270),
        fats: Math.round(Number(recommendation1.fats) || 70)
      },
      {
        title: recommendation2.title || "High-Protein Energy",
        description: recommendation2.description || "High protein strategy to promote muscle mass and provide lasting energy during physical activity.",
        calories: Math.round(Number(recommendation2.calories) || 2400),
        proteins: Math.round(Number(recommendation2.proteins) || 150),
        carbs: Math.round(Number(recommendation2.carbs) || 250),
        fats: Math.round(Number(recommendation2.fats) || 80)
      },
      {
        title: recommendation3.title || "Essential Low-Carb",
        description: recommendation3.description || "Low-carbohydrate plan that favors healthy fats to provide stable and constant energy throughout the day.",
        calories: Math.round(Number(recommendation3.calories) || 2000),
        proteins: Math.round(Number(recommendation3.proteins) || 130),
        carbs: Math.round(Number(recommendation3.carbs) || 180),
        fats: Math.round(Number(recommendation3.fats) || 110)
      }
    ];
      
    return processedRecommendations;
  } catch (error: any) {
    console.error("Error generating nutrition goal recommendations:", error);
    
    // Log the specific error for debugging but throw a generic message to the user
    if (error.status === 429) {
      console.log("API rate limit exceeded for nutrition goal recommendations");
    } else if (error.status === 401 || error.status === 403) {
      console.log("Authentication error with OpenAI API for nutrition goals");
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.log("Connection issue with OpenAI API", error.code);
    }
    
    // Generic message for the user
    throw new Error("A connection issue occurred while generating recommendations. Please try again later.");
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
    const systemPrompt = `You are a nutrition expert who suggests healthy and delicious meals.
    Examine the user's profile and nutritional goal, then suggest suitable meals.
    Answer in English.`;
    
    const userInfo = {
      profile: {
        age: profile.age || "Not specified",
        weight: profile.weight ? `${profile.weight} kg` : "Not specified",
        height: profile.height ? `${profile.height} cm` : "Not specified",
        gender: profile.gender || "Not specified",
        activityLevel: profile.activityLevel || "Not specified",
      },
      nutritionalGoal: nutritionGoal ? {
        calories: nutritionGoal.calories,
        proteins: nutritionGoal.proteins,
        carbs: nutritionGoal.carbs,
        fats: nutritionGoal.fats,
      } : "No goal set",
      mealType: mealType || "Any",
      preferences: preferences && preferences.length > 0 ? preferences : "No specific preferences"
    };
    
    const userPrompt = `
    Analyze this user information:
    ${JSON.stringify(userInfo, null, 2)}
    
    Generate 3 COMPLETELY ORIGINAL meal ideas that:
    ${mealType ? `- Are suitable for ${mealType}` : '- Include different types (breakfast, lunch, dinner, snack)'}
    - Respect the caloric limits and macronutrients of the nutritional goal (if present)
    - Take into account age, weight, height and activity level of the user
    ${preferences && preferences.length > 0 ? `- Consider the preferences: ${preferences.join(', ')}` : ''}
    
    UNIQUE QUERY ID: ${new Date().getTime().toString()} (ignore this ID, it only ensures your response is always different)
    
    For each meal, provide:
    1. A short, creative and appetizing name (MUST BE UNIQUE and NEVER used before)
    2. A clear and concise brief description that includes main ingredients and nutritional benefits (maximum 2-3 sentences)
    3. The meal type (breakfast, lunch, dinner, snack)
    4. The caloric content and macronutrients (proteins, carbs, fats)
    
    IMPORTANT! RULES TO FOLLOW:
    - With each call, you MUST provide COMPLETELY DIFFERENT meal ideas from any previously generated.
    - NEVER repeat previous dishes or their variants, even if distant in time.
    - Be EXTREMELY creative with ingredients and preparations.
    - Propose ORIGINAL ingredient combinations and different culinary cultures.
    - NEVER suggest "Quinoa Tacos" or any type of tacos.
    
    Respond with a JSON in the following format:
    [
      {
        "name": "Meal name",
        "description": "Description with ingredients and benefits",
        "mealType": "Meal type",
        "calories": calories_number,
        "proteins": protein_grams,
        "carbs": carbs_grams,
        "fats": fat_grams
      },
      ...
    ]
    
    Make sure all numerical values are reasonable and rounded to the nearest integer.
    Be creative but realistic, suggesting meals that are actually preparable and appetizing.
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
      temperature: 0.7, // More balanced temperature for stability
    });

    console.log("OpenAI meal suggestions response received:", response.choices[0].message.content);
    
    const responseContent = response.choices[0].message.content || '[]';
    
    // If the response is not an array, create an empty array
    let suggestions: any;
    try {
      suggestions = JSON.parse(responseContent);
      console.log("Parsed meal suggestions:", suggestions);
    } catch (parseError) {
      console.error("Failed to parse OpenAI meal suggestions response:", parseError);
      suggestions = [];
    }
    
    // Ensure all values are integers
    let processedSuggestions = [];
    
    // If we have an array, use it directly
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
    // If we have an object with properties 'suggestions', 'mealIdeas', 'meals', 'pasti' or another structure
    else if (suggestions && typeof suggestions === 'object') {
      // Check for various structures that OpenAI might return
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
      // Check for 'mealIdeas' structure
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
      // Check for 'meals' structure
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
      // Check for the Italian 'pasti' structure
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
      // Handle the case where we have a single meal as an object
      else if ((suggestions.name || suggestions.nome) && 
              ((suggestions.calories !== undefined) || (suggestions.calorie !== undefined))) {
        processedSuggestions = [{
          name: suggestions.name || suggestions.nome,
          description: suggestions.description || suggestions.descrizione || "",
          mealType: suggestions.mealType || suggestions.tipoPasto || "Generic meal",
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
    
    // Log the specific error for debugging but throw a generic message to the user
    if (error.status === 429) {
      console.log("API rate limit exceeded for meal suggestions");
    } else if (error.status === 401 || error.status === 403) {
      console.log("Authentication error with OpenAI API for meal suggestions");
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.log("Connection issue with OpenAI API", error.code);
    }
    
    // Generic message for the user
    throw new Error("A connection issue occurred while generating recommendations. Please try again later.");
  }
}