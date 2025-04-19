import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMealSchema, 
  insertMealPlanSchema, 
  insertNutritionGoalSchema, 
  insertProgressEntrySchema,
  insertUserProfileSchema 
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateNutritionGoalRecommendations, generateMealSuggestions, generateAIResponse } from "./ai-service";

// Middleware per proteggere le route che richiedono autenticazione
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized, please login first" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configura l'autenticazione
  setupAuth(app);
  // Get meals for user (route protetta)
  app.get("/api/meals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      let meals;
      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        meals = await storage.getMealsByUserIdAndDateRange(userId, startDate, endDate);
      } else {
        meals = await storage.getMealsByUserId(userId);
      }
      
      res.json(meals);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch meals", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create meal (route protetta)
  app.post("/api/meals", isAuthenticated, async (req, res) => {
    try {
      console.log("Meal data received:", JSON.stringify(req.body));
      
      // Pre-processing dei dati per garantire formati corretti
      const processedData = {
        ...req.body,
        // Assicura che tutti i valori numerici siano numeri e arrotondati a interi
        calories: Math.round(Number(req.body.calories) || 0),
        proteins: Math.round(Number(req.body.proteins) || 0),
        carbs: Math.round(Number(req.body.carbs) || 0),
        fats: Math.round(Number(req.body.fats) || 0),
        // Assicura che userId sia una stringa
        userId: String(req.body.userId),
        // Converte il timestamp in Date se c'è, altrimenti usa la data attuale
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
      };
      
      console.log("Processed meal data:", JSON.stringify(processedData));
      
      const mealData = insertMealSchema.parse(processedData);
      const meal = await storage.createMeal(mealData);
      res.status(201).json(meal);
    } catch (error) {
      console.error("Error creating meal:", error);
      
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors));
        return res.status(400).json({ 
          message: "Invalid meal data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create meal", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete meal (route protetta)
  app.delete("/api/meals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteMeal(id);
      
      if (success) {
        res.status(200).json({ message: "Meal deleted successfully" });
      } else {
        res.status(404).json({ message: "Meal not found" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete meal", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create meal plan (route protetta)
  app.post("/api/mealplans", isAuthenticated, async (req, res) => {
    try {
      const mealPlanData = insertMealPlanSchema.parse(req.body);
      const mealPlan = await storage.createMealPlan(mealPlanData);
      res.status(201).json(mealPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid meal plan data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create meal plan", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get meal plans for user (route protetta)
  app.get("/api/mealplans", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const mealPlans = await storage.getMealPlansByUserId(userId);
      res.json(mealPlans);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch meal plans", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // === NUTRITIONAL GOALS ROUTES ===

  // Get all nutritional goals for user (route protetta)
  app.get("/api/nutrition-goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const goals = await storage.getNutritionGoalsByUserId(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch nutritional goals", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get active nutritional goal for user (route protetta)
  app.get("/api/nutrition-goals/active", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const goal = await storage.getActiveNutritionGoal(userId);
      
      if (!goal) {
        return res.status(404).json({ message: "No active nutritional goal found" });
      }
      
      res.json(goal);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch active nutritional goal", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create nutritional goal (route protetta)
  app.post("/api/nutrition-goals", isAuthenticated, async (req, res) => {
    try {
      // Pre-processing dei dati per garantire formati corretti
      const processedData = {
        ...req.body,
        // Assicura che tutti i valori numerici siano numeri e arrotondati a interi
        calories: Math.round(Number(req.body.calories) || 0),
        proteins: Math.round(Number(req.body.proteins) || 0),
        carbs: Math.round(Number(req.body.carbs) || 0),
        fats: Math.round(Number(req.body.fats) || 0),
        // Assicura che userId sia una stringa
        userId: String(req.body.userId)
      };
      
      const goalData = insertNutritionGoalSchema.parse(processedData);
      
      // Se l'utente non ha specificato un valore per isActive, impostiamo come true di default
      if (goalData.isActive === undefined) {
        goalData.isActive = true;
      }
      
      const goal = await storage.createNutritionGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid nutritional goal data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create nutritional goal", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update nutritional goal (route protetta)
  app.patch("/api/nutrition-goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Validazione parziale dei dati
      const updateData = req.body;
      
      const updatedGoal = await storage.updateNutritionGoal(id, updateData);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Nutritional goal not found" });
      }
      
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update nutritional goal", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete nutritional goal (route protetta)
  app.delete("/api/nutrition-goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteNutritionGoal(id);
      
      if (success) {
        res.status(200).json({ message: "Nutritional goal deleted successfully" });
      } else {
        res.status(404).json({ message: "Nutritional goal not found" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete nutritional goal", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // === PROGRESS TRACKING ROUTES ===

  // Get all progress entries for user (route protetta)
  app.get("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      let entries;
      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        entries = await storage.getProgressEntriesByDateRange(userId, startDate, endDate);
      } else {
        entries = await storage.getProgressEntriesByUserId(userId);
      }
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch progress entries", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create progress entry (route protetta)
  app.post("/api/progress", isAuthenticated, async (req, res) => {
    try {
      const entryData = insertProgressEntrySchema.parse(req.body);
      const entry = await storage.createProgressEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid progress entry data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create progress entry", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update progress entry (route protetta)
  app.patch("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Validazione parziale dei dati
      const updateData = req.body;
      
      const updatedEntry = await storage.updateProgressEntry(id, updateData);
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Progress entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update progress entry", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete progress entry (route protetta)
  app.delete("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteProgressEntry(id);
      
      if (success) {
        res.status(200).json({ message: "Progress entry deleted successfully" });
      } else {
        res.status(404).json({ message: "Progress entry not found" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete progress entry", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // === USER PROFILE ROUTES ===

  // Get user profile (route protetta)
  app.get("/api/user-profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user profile", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // === AI RECOMMENDATIONS ROUTES ===
  
  // Genera raccomandazioni per obiettivi nutrizionali personalizzati (route protetta)
  app.get("/api/recommendations/nutrition-goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const forceNewRecommendations = req.query.forceNew === 'true';
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Impostazione del timeout a 30 secondi per evitare attese troppo lunghe
      const TIMEOUT_MS = 30000;
      let isResponseSent = false;
      
      // Timeout per terminare la richiesta se ci vuole troppo tempo
      const timeoutHandle = setTimeout(() => {
        if (!isResponseSent) {
          isResponseSent = true;
          
          // Rispondiamo con un set predefinito di raccomandazioni di fallback
          const fallbackRecommendations = [
            {
              title: "Mediterranea Equilibrata",
              description: "Approccio mediterraneo con equilibrio tra tutti i macronutrienti, ideale per sostenere energia e salute in modo bilanciato.",
              calories: 2200,
              proteins: 120,
              carbs: 270,
              fats: 70
            },
            {
              title: "Proteica Potenziata",
              description: "Un approccio ad alto contenuto proteico per supportare la massa muscolare e migliorare la sazietà durante la giornata.",
              calories: 2300,
              proteins: 150,
              carbs: 250,
              fats: 75
            },
            {
              title: "Low-Carb Naturale",
              description: "Una strategia con carboidrati ridotti e grassi sani aumentati, ideale per stabilizzare i livelli di energia e migliorare il metabolismo.",
              calories: 2000,
              proteins: 125,
              carbs: 180,
              fats: 100
            }
          ];
          
          console.log("API request timed out after 30 seconds, returning fallback recommendations");
          res.json({ 
            recommendations: fallbackRecommendations,
            timestamp: new Date().toISOString(),
            source: "fallback"
          });
        }
      }, TIMEOUT_MS);
      
      // Recupera il profilo utente
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        clearTimeout(timeoutHandle);
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Recupera obiettivo nutrizionale attuale se presente
      const currentGoal = await storage.getActiveNutritionGoal(userId);
      
      // Recupera pasti recenti se disponibili
      const recentMeals = await storage.getMealsByUserId(userId);
      
      console.log("Generating nutrition goal recommendations for user:", userId);
      console.log("User profile:", JSON.stringify(profile));
      console.log("Current goal:", currentGoal ? JSON.stringify(currentGoal) : "None");
      console.log("Recent meals count:", recentMeals.length);
      
      try {
        // Genera raccomandazioni personalizzate
        const recommendations = await generateNutritionGoalRecommendations(
          profile, 
          currentGoal, 
          recentMeals
        );
        
        console.log("Generated recommendations:", JSON.stringify(recommendations));
        
        if (!isResponseSent) {
          isResponseSent = true;
          clearTimeout(timeoutHandle);
          
          // Utilizzare le raccomandazioni genuine dell'AI se esistono e non sono vuote
          if (recommendations && Array.isArray(recommendations) && recommendations.length > 0) {
            // Se abbiamo ricevuto raccomandazioni valide dall'AI, le restituiamo
            res.json({ 
              recommendations: recommendations,
              timestamp: new Date().toISOString(),
              source: "ai"
            });
          } else {
            // Se non abbiamo ricevuto raccomandazioni valide, restituiamo un errore
            console.log("Empty recommendations from API");
            res.status(500).json({
              error: "Non è stato possibile generare raccomandazioni. Riprova più tardi.",
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (generationError: any) {
        console.error("Error in AI generation:", generationError);
        
        if (!isResponseSent) {
          isResponseSent = true;
          clearTimeout(timeoutHandle);
          
          // Usiamo un messaggio di errore generico indipendentemente dal tipo di errore
          let errorMessage = "Si è verificato un problema di connessione nella generazione dei suggerimenti. Riprova più tardi.";
          
          console.log("AI error occurred, returning specific error message:", errorMessage);
          
          res.status(500).json({
            error: errorMessage,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error generating nutrition goal recommendations:", error);
      res.status(500).json({ 
        message: "Failed to generate nutrition goal recommendations", 
        error: error instanceof Error ? error.message : String(error),
        recommendations: [] // Restituisci un array vuoto anche in caso di errore
      });
    }
  });
  
  // Genera suggerimenti per pasti personalizzati (route protetta)
  app.get("/api/recommendations/meals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const mealType = req.query.mealType as string;
      const forceNewSuggestions = req.query.forceNew === 'true';
      const preferences = req.query.preferences 
        ? Array.isArray(req.query.preferences) 
          ? req.query.preferences as string[] 
          : [req.query.preferences as string]
        : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Impostazione del timeout a 30 secondi per evitare attese troppo lunghe
      const TIMEOUT_MS = 30000;
      let isResponseSent = false;
      
      // Timeout per terminare la richiesta se ci vuole troppo tempo
      const timeoutHandle = setTimeout(() => {
        if (!isResponseSent) {
          isResponseSent = true;
          
          // Rispondiamo con un messaggio di timeout
          console.log("Meal suggestions API request timed out after 30 seconds");
          res.status(504).json({ 
            error: "La richiesta ha impiegato troppo tempo. Riprova più tardi.",
            timestamp: new Date().toISOString()
          });
        }
      }, TIMEOUT_MS);
      
      // Recupera il profilo utente
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        clearTimeout(timeoutHandle);
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Recupera obiettivo nutrizionale attuale se presente
      const nutritionGoal = await storage.getActiveNutritionGoal(userId);
      
      console.log("Generating meal suggestions for user:", userId);
      console.log("User profile:", JSON.stringify(profile));
      console.log("Current goal:", nutritionGoal ? JSON.stringify(nutritionGoal) : "None");
      console.log("Meal type requested:", mealType || "All");
      console.log("Preferences:", preferences || "None");
      
      try {
        // Genera suggerimenti personalizzati per i pasti
        const suggestions = await generateMealSuggestions(
          profile, 
          nutritionGoal,
          mealType,
          preferences
        );
        
        console.log("Generated meal suggestions:", JSON.stringify(suggestions));
        
        if (!isResponseSent) {
          isResponseSent = true;
          clearTimeout(timeoutHandle);
          
          // Se non ci sono suggerimenti, restituisci un array vuoto invece di null
          res.json({ 
            suggestions: suggestions || [],
            timestamp: new Date().toISOString(),
            source: "ai"
          });
        }
      } catch (generationError: any) {
        console.error("Error in AI meal generation:", generationError);
        
        if (!isResponseSent) {
          isResponseSent = true;
          clearTimeout(timeoutHandle);
          
          // Usiamo un messaggio di errore generico indipendentemente dal tipo di errore
          let errorMessage = "Si è verificato un problema di connessione nella generazione dei suggerimenti. Riprova più tardi.";
          
          console.log("AI error occurred, returning specific error message:", errorMessage);
          
          res.status(500).json({
            error: errorMessage,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error generating meal suggestions:", error);
      res.status(500).json({ 
        message: "Failed to generate meal suggestions", 
        error: error instanceof Error ? error.message : String(error),
        suggestions: [] // Restituisci un array vuoto anche in caso di errore
      });
    }
  });
  
  // Endpoint per richiedere una risposta al chatbot AI (route protetta)
  app.post("/api/ai-chat", isAuthenticated, async (req, res) => {
    try {
      const { userId, query, chatType } = req.body;
      
      if (!userId || !query) {
        return res.status(400).json({ message: "User ID and query are required" });
      }
      
      // Recupera il profilo utente
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Recupera obiettivo nutrizionale attuale se presente
      const currentGoal = await storage.getActiveNutritionGoal(userId);
      
      // Recupera pasti recenti se disponibili
      const recentMeals = await storage.getMealsByUserId(userId);
      
      console.log("Processing AI chat request for user:", userId);
      console.log("User query:", query);
      console.log("Chat type:", chatType || "general");
      
      // Adatta il prompt in base al tipo di chatbot
      let systemPrompt = "";
      
      if (chatType === "goals") {
        systemPrompt = `Sei un nutrizionista specializzato in obiettivi nutrizionali e metabolismo. 
          Rispondi solo a domande riguardanti obiettivi di salute, obiettivi di peso, 
          macronutrienti, calorie, metabolismo, e strategie per il raggiungimento di obiettivi nutrizionali.
          Se l'utente chiede informazioni su altri argomenti, gentilmente reindirizza la conversazione 
          verso gli obiettivi nutrizionali. Rispondi in italiano in modo dettagliato ma conciso.`;
      } else if (chatType === "meals") {
        systemPrompt = `Sei un esperto di alimentazione e cucina specializzato in pasti, alimenti e ricette.
          Rispondi solo a domande riguardanti alimenti, pasti, ricette, valori nutrizionali dei cibi,
          preparazione di cibo, alternative alimentari, e consigli per pasti specifici.
          Se l'utente chiede informazioni su altri argomenti, gentilmente reindirizza la conversazione 
          verso argomenti di alimentazione e pasti. Rispondi in italiano in modo dettagliato ma conciso.`;
      } else {
        systemPrompt = `Sei un nutrizionista esperto che risponde a domande in italiano sulla nutrizione, alimentazione e salute.
          Hai accesso al profilo dell'utente e ai suoi dati nutrizionali, che dovresti utilizzare per personalizzare le tue risposte.
          Rispondi in modo colloquiale ma professionale, fornendo informazioni accurate ed esaurienti.
          Basa le tue risposte su informazioni scientifiche aggiornate.`;
      }
      
      // Genera risposta personalizzata con il prompt specializzato
      const answer = await generateAIResponse(query, profile, currentGoal, recentMeals, systemPrompt);
      
      res.json({ 
        answer,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error generating AI chat response:", error);
      
      // Usiamo un messaggio di errore generico indipendentemente dal tipo di errore
      let errorMessage = "Si è verificato un problema di connessione nella generazione dei suggerimenti. Riprova più tardi.";
      
      res.status(500).json({ 
        message: "Failed to generate AI response", 
        error: error instanceof Error ? error.message : String(error),
        answer: errorMessage
      });
    }
  });

  // Create user profile (route protetta)
  app.post("/api/user-profile", isAuthenticated, async (req, res) => {
    try {
      // Pre-processing dei dati per garantire formati corretti
      const processedData = {
        ...req.body,
        // Assicura che userId sia una stringa
        userId: String(req.body.userId),
        // Converte i valori numerici
        age: req.body.age ? Number(req.body.age) : null,
        weight: req.body.weight ? Number(req.body.weight) : null,
        height: req.body.height ? Number(req.body.height) : null
      };
      
      const profileData = insertUserProfileSchema.parse(processedData);
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid user profile data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create user profile", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update user profile (route protetta)
  app.patch("/api/user-profile/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Validazione parziale dei dati
      const updateData = req.body;
      
      // Converti i valori numerici se presenti
      if (updateData.age !== undefined) {
        updateData.age = Number(updateData.age);
      }
      
      if (updateData.weight !== undefined) {
        updateData.weight = Number(updateData.weight);
      }
      
      if (updateData.height !== undefined) {
        updateData.height = Number(updateData.height);
      }
      
      const updatedProfile = await storage.updateUserProfile(userId, updateData);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update user profile", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
