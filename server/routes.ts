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
      
      // Recupera il profilo utente
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
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
      
      // Genera raccomandazioni personalizzate
      const recommendations = await generateNutritionGoalRecommendations(
        profile, 
        currentGoal, 
        recentMeals
      );
      
      console.log("Generated recommendations:", JSON.stringify(recommendations));
      
      // Creiamo raccomandazioni fittizie se non ce ne sono abbastanza
      let finalRecommendations = recommendations || [];
      
      // Garantiamo che ci siano almeno 3 raccomandazioni
      if (finalRecommendations.length === 0) {
        // Se non ci sono raccomandazioni, creiamo una raccomandazione basata sull'obiettivo attuale
        if (currentGoal) {
          finalRecommendations = [
            {
              title: "Mediterranea Equilibrata",
              description: "Basata sulla tua attività moderata e sul profilo fisico, questa dieta mediterranea equilibrata offre un perfetto bilanciamento di nutrienti per mantenere energia e salute ottimali.",
              calories: currentGoal.calories,
              proteins: currentGoal.proteins,
              carbs: currentGoal.carbs,
              fats: currentGoal.fats
            },
            {
              title: "Energia Plus",
              description: "Incrementa leggermente le calorie e i carboidrati per dare una spinta extra alla tua energia quotidiana, ideale per la tua attività moderata e per affrontare giornate più intense.",
              calories: Math.round(currentGoal.calories * 1.1),
              proteins: currentGoal.proteins,
              carbs: Math.round(currentGoal.carbs * 1.15),
              fats: currentGoal.fats
            },
            {
              title: "Proteica Bilanciata",
              description: "Aumenta l'apporto proteico mantenendo un buon equilibrio generale, perfetto per migliorare il tono muscolare e la sensazione di sazietà durante la giornata.",
              calories: currentGoal.calories,
              proteins: Math.round(currentGoal.proteins * 1.2),
              carbs: Math.round(currentGoal.carbs * 0.9),
              fats: currentGoal.fats
            }
          ];
        } else {
          // Se non c'è un obiettivo corrente, creane uno di default basato sul profilo
          const calcoloBaseCalorie = profile.gender === "maschio" ? 
            (10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5) :
            (10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161);
          
          const calorieDiBase = Math.round(calcoloBaseCalorie * 1.55); // Attività moderata
          
          finalRecommendations = [
            {
              title: "Mediterranea Equilibrata",
              description: "Dieta mediterranea bilanciata che punta sull'equilibrio dei nutrienti e cibi integrali, adatta al tuo profilo fisico e al tuo livello di attività.",
              calories: calorieDiBase,
              proteins: Math.round(calorieDiBase * 0.2 / 4), // 20% delle calorie da proteine
              carbs: Math.round(calorieDiBase * 0.5 / 4),    // 50% delle calorie da carboidrati
              fats: Math.round(calorieDiBase * 0.3 / 9)      // 30% delle calorie da grassi
            },
            {
              title: "Energia Sostenibile",
              description: "Ottimizzata per mantenere livelli di energia costanti durante la giornata, con focus su carboidrati complessi e proteine di qualità.",
              calories: Math.round(calorieDiBase * 1.05),
              proteins: Math.round(calorieDiBase * 0.22 / 4),
              carbs: Math.round(calorieDiBase * 0.53 / 4),
              fats: Math.round(calorieDiBase * 0.25 / 9)
            },
            {
              title: "Proteica Potenziata",
              description: "Incrementa l'apporto proteico per migliorare il recupero muscolare e la composizione corporea, mantenendo un buon apporto energetico generale.",
              calories: calorieDiBase,
              proteins: Math.round(calorieDiBase * 0.25 / 4),
              carbs: Math.round(calorieDiBase * 0.45 / 4),
              fats: Math.round(calorieDiBase * 0.3 / 9)
            }
          ];
        }
      } else if (finalRecommendations.length === 1) {
        // Se c'è una sola raccomandazione, ne creiamo altre due basate su quella
        const rec = finalRecommendations[0];
        finalRecommendations.push(
          {
            title: "Energia Plus",
            description: "Una versione potenziata con più carboidrati per dare energia extra alle tue giornate più intense, mantenendo l'equilibrio generale dei nutrienti.",
            calories: Math.round(rec.calories * 1.1),
            proteins: rec.proteins,
            carbs: Math.round(rec.carbs * 1.15),
            fats: rec.fats
          },
          {
            title: "Proteica Bilanciata",
            description: "Incrementa l'apporto proteico e riduce leggermente i carboidrati per migliorare la sazietà e il supporto al tono muscolare.",
            calories: rec.calories,
            proteins: Math.round(rec.proteins * 1.2),
            carbs: Math.round(rec.carbs * 0.9),
            fats: rec.fats
          }
        );
      } else if (finalRecommendations.length === 2) {
        // Se ci sono due raccomandazioni, ne creiamo una terza
        const rec = finalRecommendations[0];
        finalRecommendations.push({
          title: "Bilanciata Deluxe",
          description: "Perfettamente equilibrata tra energia e nutrienti, questa variante offre un ottimo compromesso per mantenere il peso e l'energia con un focus sulla qualità dei cibi.",
          calories: Math.round((finalRecommendations[0].calories + finalRecommendations[1].calories) / 2),
          proteins: Math.round((finalRecommendations[0].proteins + finalRecommendations[1].proteins) / 2),
          carbs: Math.round((finalRecommendations[0].carbs + finalRecommendations[1].carbs) / 2),
          fats: Math.round((finalRecommendations[0].fats + finalRecommendations[1].fats) / 2)
        });
      }
      
      // Se non ci sono raccomandazioni, restituisci un array vuoto invece di null
      res.json({ 
        recommendations: finalRecommendations,
        timestamp: new Date().toISOString()
      });
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
      
      // Recupera il profilo utente
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Recupera obiettivo nutrizionale attuale se presente
      const nutritionGoal = await storage.getActiveNutritionGoal(userId);
      
      console.log("Generating meal suggestions for user:", userId);
      console.log("User profile:", JSON.stringify(profile));
      console.log("Current goal:", nutritionGoal ? JSON.stringify(nutritionGoal) : "None");
      console.log("Meal type requested:", mealType || "All");
      console.log("Preferences:", preferences || "None");
      
      // Genera suggerimenti personalizzati per i pasti
      const suggestions = await generateMealSuggestions(
        profile, 
        nutritionGoal,
        mealType,
        preferences
      );
      
      console.log("Generated meal suggestions:", JSON.stringify(suggestions));
      
      // Se non ci sono suggerimenti, restituisci un array vuoto invece di null
      res.json({ 
        suggestions: suggestions || [],
        timestamp: new Date().toISOString()
      });
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
    } catch (error) {
      console.error("Error generating AI chat response:", error);
      res.status(500).json({ 
        message: "Failed to generate AI response", 
        error: error instanceof Error ? error.message : String(error),
        answer: "Mi dispiace, si è verificato un errore durante la generazione della risposta. Riprova più tardi."
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
