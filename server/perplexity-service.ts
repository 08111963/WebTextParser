import { NutritionGoal, UserProfile } from "@shared/schema";

// Verify that the API key is available
if (!process.env.PERPLEXITY_API_KEY) {
  console.warn("The PERPLEXITY_API_KEY environment variable is not set. Perplexity AI features will not work correctly.");
}

// Helper function for Perplexity API calls
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
    console.error("Error calling Perplexity API:", error);
    throw error;
  }
}

/**
 * Generates personalized meal suggestions using Perplexity API
 */
export async function generateMealSuggestionsWithPerplexity(
  profile: UserProfile,
  nutritionGoal?: NutritionGoal,
  mealType?: string,
  dietaryPreferences?: string[]
) {
  console.log("Generating meal suggestions with Perplexity for user:", profile.userId);

  // Create a string representation of dietary preferences
  const dietaryPrefsString = dietaryPreferences && dietaryPreferences.length > 0
    ? `Dietary preferences: ${dietaryPreferences.join(', ')}.`
    : "";

  // Determine the meal type
  const mealTypeDesc = mealType || "a generic meal";

  // Build the prompt for Perplexity
  const systemPrompt = `You are a nutrition expert specializing in personalized meal plans.
    Return 3 detailed suggestions for ${mealTypeDesc} in JSON format.
    Your output must be EXCLUSIVELY in parsable JSON format, without introductory or concluding text.
    JSON schema: { "meals": [ { "name": "Meal name", "description": "Description", "calories": number, "proteins": number, "carbs": number, "fats": number, "ingredients": ["ingredient1", "ingredient2"] } ] }
    All numbers must be integers (no decimals).
    Each meal must have between 5 and 8 main ingredients.
    Write the output in English.`;

  // User information to personalize suggestions
  let userProfileInfo = `User Profile:
    - Age: ${profile.age || 'Not specified'}
    - Gender: ${profile.gender || 'Not specified'}
    - Weight: ${profile.weight ? `${profile.weight} kg` : 'Not specified'}
    - Height: ${profile.height ? `${profile.height} cm` : 'Not specified'}
    - Activity level: ${profile.activityLevel || 'Not specified'}
    ${dietaryPrefsString}`;

  // Add nutritional goals information if available
  if (nutritionGoal) {
    userProfileInfo += `\nCurrent Nutritional Goal:
    - Calories: ${nutritionGoal.calories} kcal
    - Proteins: ${nutritionGoal.proteins} g
    - Carbs: ${nutritionGoal.carbs} g
    - Fats: ${nutritionGoal.fats} g
    - Goal: ${nutritionGoal.name}
    - Description: ${nutritionGoal.description || 'Not specified'}`;
  }

  // Final prompt for the user
  const userPrompt = `Generate 3 suggestions for ${mealTypeDesc} suitable for this profile:
    ${userProfileInfo}
    
    I want creative but practical recipes, with variations inspired by Mediterranean and international cuisine.
    Include nutritional values and main ingredients.
    Each meal should be balanced and provide adequate proteins, carbs, and fats.
    Use seasonal and easily available ingredients.
    ${nutritionGoal ? `Meals must respect the nutritional targets indicated in the goal.` : ''}
    ${dietaryPrefsString ? `Absolutely respect the dietary preferences indicated.` : ''}`;

  try {
    // Call to Perplexity API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await callPerplexityAPI(messages);
    console.log("Perplexity API response:", JSON.stringify(response.choices[0].message));

    // Extract and parse JSON from the response
    const content = response.choices[0].message.content;
    try {
      const parsedContent = JSON.parse(content);
      return parsedContent;
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.log("Invalid response:", content);
      
      // Attempt to extract JSON using regex if parsing fails
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          return JSON.parse(extractedJson);
        } catch (extractError) {
          console.error("Unable to extract valid JSON from response:", extractError);
          throw new Error("Invalid response format from API");
        }
      }
      
      throw new Error("Invalid response format from API");
    }
  } catch (error) {
    console.error("Error generating meal suggestions:", error);
    throw error;
  }
}

/**
 * Generates personalized nutritional advice using Perplexity API
 */
export async function generateNutritionalAdviceWithPerplexity(
  profile: UserProfile,
  userQuery: string
) {
  console.log("Generating nutritional advice with Perplexity for user:", profile.userId);
  console.log("User query:", userQuery);

  // Build the prompt for Perplexity
  const systemPrompt = `You are a nutrition expert who answers questions about nutrition, diet, and health.
    Provide personalized nutritional advice based on the user's profile.
    Answer comprehensively, providing accurate and scientific information.
    Use a professional but accessible style, with clear explanations and practical examples.
    Answer in English.`;

  // User information to personalize advice
  let userProfileInfo = `User Profile:
    - Age: ${profile.age || 'Not specified'}
    - Gender: ${profile.gender || 'Not specified'}
    - Weight: ${profile.weight ? `${profile.weight} kg` : 'Not specified'}
    - Height: ${profile.height ? `${profile.height} cm` : 'Not specified'}
    - Activity level: ${profile.activityLevel || 'Not specified'}`;

  // Calculate BMI if height and weight are available
  if (profile.height && profile.weight) {
    const heightInMeters = profile.height / 100;
    const bmi = Math.round((profile.weight / (heightInMeters * heightInMeters)) * 10) / 10;
    userProfileInfo += `\n- Calculated BMI: ${bmi}`;
  }

  // Final prompt for the user
  const promptWithQuery = `Based on this user profile:
    ${userProfileInfo}
    
    Answer this nutrition question:
    "${userQuery}"
    
    Provide a complete and personalized response, with clear explanations and practical advice.
    Include, when appropriate, references to recent scientific studies and updated nutritional guidelines.`;

  try {
    // Call to Perplexity API
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
    console.error("Error generating nutritional advice:", error);
    throw error;
  }
}