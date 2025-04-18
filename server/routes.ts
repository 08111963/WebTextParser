import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMealSchema, insertMealPlanSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get meals for user
  app.get("/api/meals", async (req, res) => {
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

  // Create meal
  app.post("/api/meals", async (req, res) => {
    try {
      const mealData = insertMealSchema.parse(req.body);
      const meal = await storage.createMeal(mealData);
      res.status(201).json(meal);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  // Delete meal
  app.delete("/api/meals/:id", async (req, res) => {
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

  // Create meal plan
  app.post("/api/mealplans", async (req, res) => {
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

  // Get meal plans for user
  app.get("/api/mealplans", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
