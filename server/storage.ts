import { 
  users, type User, type InsertUser, 
  meals, type Meal, type InsertMeal, 
  mealPlans, type MealPlan, type InsertMealPlan,
  nutritionGoals, type NutritionGoal, type InsertNutritionGoal,
  progressEntries, type ProgressEntry, type InsertProgressEntry 
} from "@shared/schema";
import { eq, and, gte, lte, desc, isNull, or } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMealsByUserId(userId: string): Promise<Meal[]>;
  getMealsByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  deleteMeal(id: number): Promise<boolean>;
  
  getMealPlansByUserId(userId: string): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  
  // Nuove funzioni per gli obiettivi nutrizionali
  getNutritionGoalsByUserId(userId: string): Promise<NutritionGoal[]>;
  getActiveNutritionGoal(userId: string): Promise<NutritionGoal | undefined>;
  createNutritionGoal(goal: InsertNutritionGoal): Promise<NutritionGoal>;
  updateNutritionGoal(id: number, goal: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined>;
  deleteNutritionGoal(id: number): Promise<boolean>;
  
  // Nuove funzioni per il tracciamento dei progressi
  getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]>;
  getProgressEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ProgressEntry[]>;
  createProgressEntry(entry: InsertProgressEntry): Promise<ProgressEntry>;
  updateProgressEntry(id: number, entry: Partial<InsertProgressEntry>): Promise<ProgressEntry | undefined>;
  deleteProgressEntry(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private meals: Map<number, Meal>;
  private mealPlans: Map<number, MealPlan>;
  private nutritionGoals: Map<number, NutritionGoal>;
  private progressEntries: Map<number, ProgressEntry>;
  private currentUserId: number;
  private currentMealId: number;
  private currentMealPlanId: number;
  private currentNutritionGoalId: number;
  private currentProgressEntryId: number;

  constructor() {
    this.users = new Map();
    this.meals = new Map();
    this.mealPlans = new Map();
    this.nutritionGoals = new Map();
    this.progressEntries = new Map();
    this.currentUserId = 1;
    this.currentMealId = 1;
    this.currentMealPlanId = 1;
    this.currentNutritionGoalId = 1;
    this.currentProgressEntryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseId === firebaseId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMealsByUserId(userId: string): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter(
      (meal) => meal.userId === userId,
    );
  }

  async getMealsByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter(
      (meal) => 
        meal.userId === userId && 
        meal.timestamp >= startDate && 
        meal.timestamp <= endDate
    );
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const id = this.currentMealId++;
    const meal: Meal = { ...insertMeal, id };
    this.meals.set(id, meal);
    return meal;
  }

  async deleteMeal(id: number): Promise<boolean> {
    return this.meals.delete(id);
  }

  async getMealPlansByUserId(userId: string): Promise<MealPlan[]> {
    return Array.from(this.mealPlans.values()).filter(
      (mealPlan) => mealPlan.userId === userId,
    );
  }

  async createMealPlan(insertMealPlan: InsertMealPlan): Promise<MealPlan> {
    const id = this.currentMealPlanId++;
    const mealPlan: MealPlan = { ...insertMealPlan, id };
    this.mealPlans.set(id, mealPlan);
    return mealPlan;
  }
  
  // Implementazione dei metodi per gli obiettivi nutrizionali
  async getNutritionGoalsByUserId(userId: string): Promise<NutritionGoal[]> {
    return Array.from(this.nutritionGoals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getActiveNutritionGoal(userId: string): Promise<NutritionGoal | undefined> {
    const now = new Date();
    return Array.from(this.nutritionGoals.values())
      .filter(goal => {
        const startDate = new Date(goal.startDate);
        const endDate = goal.endDate ? new Date(goal.endDate) : null;
        
        return goal.userId === userId && 
               goal.isActive && 
               startDate <= now && 
               (!endDate || endDate >= now);
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
  
  async createNutritionGoal(insertGoal: InsertNutritionGoal): Promise<NutritionGoal> {
    // Se il nuovo obiettivo è attivo, disattiviamo gli altri obiettivi attivi
    if (insertGoal.isActive) {
      Array.from(this.nutritionGoals.values())
        .filter(goal => goal.userId === insertGoal.userId && goal.isActive)
        .forEach(goal => {
          goal.isActive = false;
          this.nutritionGoals.set(goal.id, goal);
        });
    }
    
    const id = this.currentNutritionGoalId++;
    const createdAt = new Date();
    const goal: NutritionGoal = { ...insertGoal, id, createdAt };
    this.nutritionGoals.set(id, goal);
    return goal;
  }
  
  async updateNutritionGoal(id: number, updates: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined> {
    const goal = this.nutritionGoals.get(id);
    if (!goal) return undefined;
    
    // Se stiamo attivando questo obiettivo, disattiviamo gli altri
    if (updates.isActive) {
      Array.from(this.nutritionGoals.values())
        .filter(g => g.userId === goal.userId && g.isActive && g.id !== id)
        .forEach(g => {
          g.isActive = false;
          this.nutritionGoals.set(g.id, g);
        });
    }
    
    const updatedGoal: NutritionGoal = { ...goal, ...updates };
    this.nutritionGoals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteNutritionGoal(id: number): Promise<boolean> {
    return this.nutritionGoals.delete(id);
  }
  
  // Implementazione dei metodi per il tracciamento dei progressi
  async getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]> {
    return Array.from(this.progressEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  }
  
  async getProgressEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ProgressEntry[]> {
    return Array.from(this.progressEntries.values())
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.userId === userId && 
               entryDate >= startDate && 
               entryDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }
  
  async createProgressEntry(insertEntry: InsertProgressEntry): Promise<ProgressEntry> {
    const id = this.currentProgressEntryId++;
    const createdAt = new Date();
    const entry: ProgressEntry = { ...insertEntry, id, createdAt };
    this.progressEntries.set(id, entry);
    return entry;
  }
  
  async updateProgressEntry(id: number, updates: Partial<InsertProgressEntry>): Promise<ProgressEntry | undefined> {
    const entry = this.progressEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry: ProgressEntry = { ...entry, ...updates };
    this.progressEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  async deleteProgressEntry(id: number): Promise<boolean> {
    return this.progressEntries.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseId, firebaseId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMealsByUserId(userId: string): Promise<Meal[]> {
    return await db
      .select()
      .from(meals)
      .where(eq(meals.userId, userId));
  }

  async getMealsByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]> {
    return await db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.timestamp, startDate),
          lte(meals.timestamp, endDate)
        )
      );
  }

  async createMeal(insertMeal: InsertMeal): Promise<Meal> {
    const [meal] = await db
      .insert(meals)
      .values(insertMeal)
      .returning();
    return meal;
  }

  async deleteMeal(id: number): Promise<boolean> {
    const result = await db
      .delete(meals)
      .where(eq(meals.id, id))
      .returning({ id: meals.id });
    
    return result.length > 0;
  }

  async getMealPlansByUserId(userId: string): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId));
  }

  async createMealPlan(insertMealPlan: InsertMealPlan): Promise<MealPlan> {
    const [mealPlan] = await db
      .insert(mealPlans)
      .values(insertMealPlan)
      .returning();
    return mealPlan;
  }
  
  // Implementazione dei metodi per gli obiettivi nutrizionali
  async getNutritionGoalsByUserId(userId: string): Promise<NutritionGoal[]> {
    return await db
      .select()
      .from(nutritionGoals)
      .where(eq(nutritionGoals.userId, userId))
      .orderBy(desc(nutritionGoals.createdAt));
  }
  
  async getActiveNutritionGoal(userId: string): Promise<NutritionGoal | undefined> {
    const now = new Date();
    const [goal] = await db
      .select()
      .from(nutritionGoals)
      .where(
        and(
          eq(nutritionGoals.userId, userId),
          eq(nutritionGoals.isActive, true)
        )
      )
      .orderBy(desc(nutritionGoals.createdAt))
      .limit(1);
    
    // Verifichiamo le date manualmente per evitare problemi di tipo
    if (goal) {
      const startDate = new Date(goal.startDate);
      if (startDate > now) {
        return undefined;
      }
      
      if (goal.endDate) {
        const endDate = new Date(goal.endDate);
        if (endDate < now) {
          return undefined;
        }
      }
    }
    
    return goal;
  }
  
  async createNutritionGoal(insertGoal: InsertNutritionGoal): Promise<NutritionGoal> {
    // Se il nuovo obiettivo è attivo, disattiviamo gli altri obiettivi attivi
    if (insertGoal.isActive) {
      await db
        .update(nutritionGoals)
        .set({ isActive: false })
        .where(
          and(
            eq(nutritionGoals.userId, insertGoal.userId),
            eq(nutritionGoals.isActive, true)
          )
        );
    }
    
    const [goal] = await db
      .insert(nutritionGoals)
      .values(insertGoal)
      .returning();
    
    return goal;
  }
  
  async updateNutritionGoal(id: number, updates: Partial<InsertNutritionGoal>): Promise<NutritionGoal | undefined> {
    // Se stiamo attivando questo obiettivo, disattiviamo gli altri
    if (updates.isActive) {
      const [currentGoal] = await db
        .select()
        .from(nutritionGoals)
        .where(eq(nutritionGoals.id, id));
      
      if (currentGoal) {
        await db
          .update(nutritionGoals)
          .set({ isActive: false })
          .where(
            and(
              eq(nutritionGoals.userId, currentGoal.userId),
              eq(nutritionGoals.isActive, true),
              lte(nutritionGoals.id, id)
            )
          );
      }
    }
    
    const [updatedGoal] = await db
      .update(nutritionGoals)
      .set(updates)
      .where(eq(nutritionGoals.id, id))
      .returning();
    
    return updatedGoal;
  }
  
  async deleteNutritionGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(nutritionGoals)
      .where(eq(nutritionGoals.id, id))
      .returning({ id: nutritionGoals.id });
    
    return result.length > 0;
  }
  
  // Implementazione dei metodi per il tracciamento dei progressi
  async getProgressEntriesByUserId(userId: string): Promise<ProgressEntry[]> {
    return await db
      .select()
      .from(progressEntries)
      .where(eq(progressEntries.userId, userId))
      .orderBy(desc(progressEntries.date));
  }
  
  async getProgressEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ProgressEntry[]> {
    // Convertiamo le date in stringhe per evitare problemi di tipo nel confronto
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(progressEntries)
      .where(
        and(
          eq(progressEntries.userId, userId),
          gte(progressEntries.date, startDateStr),
          lte(progressEntries.date, endDateStr)
        )
      )
      .orderBy(progressEntries.date);
  }
  
  async createProgressEntry(insertEntry: InsertProgressEntry): Promise<ProgressEntry> {
    const [entry] = await db
      .insert(progressEntries)
      .values(insertEntry)
      .returning();
    
    return entry;
  }
  
  async updateProgressEntry(id: number, updates: Partial<InsertProgressEntry>): Promise<ProgressEntry | undefined> {
    const [updatedEntry] = await db
      .update(progressEntries)
      .set(updates)
      .where(eq(progressEntries.id, id))
      .returning();
    
    return updatedEntry;
  }
  
  async deleteProgressEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(progressEntries)
      .where(eq(progressEntries.id, id))
      .returning({ id: progressEntries.id });
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
