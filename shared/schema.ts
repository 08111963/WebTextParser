import { pgTable, text, serial, integer, boolean, timestamp, json, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

// Schema per i profili utente
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  weight: real("weight").notNull(), // in kg
  height: integer("height").notNull(), // in cm
  activityLevel: text("activity_level").notNull().default('moderata'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  food: text("food").notNull(),
  calories: integer("calories").notNull(),
  proteins: integer("proteins").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  mealType: text("meal_type").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  query: text("query").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

// Nuovo schema per gli obiettivi nutrizionali
export const nutritionGoals = pgTable("nutrition_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  calories: integer("calories").notNull(),
  proteins: integer("proteins").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Nuovo schema per il tracciamento dei progressi
export const progressEntries = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  weight: integer("weight"),  // in grammi
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
  });

export const insertMealSchema = createInsertSchema(meals)
  .pick({
    userId: true,
    food: true,
    calories: true,
    proteins: true,
    carbs: true,
    fats: true,
    mealType: true,
    timestamp: true,
  })
  .extend({
    // Utilizziamo z.coerce.number() per convertire automaticamente le stringhe in numeri
    calories: z.coerce.number().min(0).transform(Math.round),
    proteins: z.coerce.number().min(0).transform(Math.round),
    carbs: z.coerce.number().min(0).transform(Math.round),
    fats: z.coerce.number().min(0).transform(Math.round),
  });

export const insertMealPlanSchema = createInsertSchema(mealPlans).pick({
  userId: true,
  query: true,
  response: true,
  timestamp: true,
});

export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals)
  .pick({
    userId: true,
    calories: true,
    proteins: true,
    carbs: true,
    fats: true,
    startDate: true,
    endDate: true,
    isActive: true,
    name: true,
    description: true,
  })
  .extend({
    // Utilizziamo z.coerce.number() per convertire automaticamente le stringhe in numeri e arrotondiamo i valori
    calories: z.coerce.number().min(0).transform(Math.round),
    proteins: z.coerce.number().min(0).transform(Math.round),
    carbs: z.coerce.number().min(0).transform(Math.round),
    fats: z.coerce.number().min(0).transform(Math.round),
  })
  .transform((data) => ({
    ...data,
    // Gestiamo la descrizione null
    description: data.description || null
  }));

export const insertProgressEntrySchema = createInsertSchema(progressEntries).pick({
  userId: true,
  date: true,
  weight: true,
  notes: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles)
  .pick({
    userId: true,
    name: true,
    age: true,
    gender: true,
    weight: true,
    height: true,
    activityLevel: true,
  })
  .extend({
    // Validazione dei dati con conversione di tipo
    age: z.coerce.number().min(1).max(120),
    weight: z.coerce.number().min(20).max(300), // in kg
    height: z.coerce.number().min(50).max(250), // in cm
    gender: z.enum(["maschio", "femmina", "altro"]),
    activityLevel: z.enum(["sedentaria", "leggera", "moderata", "attiva", "molto attiva"]),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;

export type InsertNutritionGoal = z.infer<typeof insertNutritionGoalSchema>;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;

export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type ProgressEntry = typeof progressEntries.$inferSelect;
