import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firebaseId: text("firebase_id").notNull().unique(),
  email: text("email").notNull().unique(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firebaseId: true,
  email: true,
});

export const insertMealSchema = createInsertSchema(meals).pick({
  userId: true,
  food: true,
  calories: true,
  proteins: true,
  carbs: true,
  fats: true,
  mealType: true,
  timestamp: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).pick({
  userId: true,
  query: true,
  response: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
