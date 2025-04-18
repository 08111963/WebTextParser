import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMealSchema, 
  insertMealPlanSchema, 
  insertNutritionGoalSchema, 
  insertProgressEntrySchema 
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

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
        // Assicura che tutti i valori numerici siano numeri
        calories: Number(req.body.calories) || 0,
        proteins: Number(req.body.proteins) || 0,
        carbs: Number(req.body.carbs) || 0,
        fats: Number(req.body.fats) || 0,
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
      const goalData = insertNutritionGoalSchema.parse(req.body);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
