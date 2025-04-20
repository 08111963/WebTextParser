import { 
  users, type User, type InsertUser, 
  userProfiles, type UserProfile, type InsertUserProfile,
  meals, type Meal, type InsertMeal, 
  mealPlans, type MealPlan, type InsertMealPlan,
  nutritionGoals, type NutritionGoal, type InsertNutritionGoal,
  progressEntries, type ProgressEntry, type InsertProgressEntry,
  registrationLogs, type RegistrationLog, type InsertRegistrationLog,
  userNotifications, type UserNotification, type InsertUserNotification,
  userGracePeriods, type UserGracePeriod, type InsertUserGracePeriod 
} from "@shared/schema";
import { eq, and, gte, lte, desc, isNull, or } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Funzioni per il profilo utente
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
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
  
  // Funzioni per il registro delle registrazioni
  createRegistrationLog(log: InsertRegistrationLog): Promise<RegistrationLog>;
  getRegistrationLogsByEmail(email: string): Promise<RegistrationLog[]>;
  getRegistrationLogsByIpAddress(ipAddress: string): Promise<RegistrationLog[]>;
  
  // Funzioni per le notifiche utente
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  getUserNotificationsByUserId(userId: string): Promise<UserNotification[]>;
  getUserUnreadNotifications(userId: string): Promise<UserNotification[]>;
  markUserNotificationAsRead(id: number): Promise<UserNotification | undefined>;
  deleteUserNotification(id: number): Promise<boolean>;
  
  // Funzioni per i periodi di grazia
  createUserGracePeriod(gracePeriod: InsertUserGracePeriod): Promise<UserGracePeriod>;
  getUserGracePeriodByUserId(userId: string): Promise<UserGracePeriod | undefined>;
  updateUserGracePeriod(userId: string, updates: Partial<InsertUserGracePeriod>): Promise<UserGracePeriod | undefined>;
  deleteUserGracePeriod(userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<string, UserProfile>;
  private meals: Map<number, Meal>;
  private mealPlans: Map<number, MealPlan>;
  private nutritionGoals: Map<number, NutritionGoal>;
  private progressEntries: Map<number, ProgressEntry>;
  private registrationLogs: Map<number, RegistrationLog>;
  private userNotifications: Map<number, UserNotification>;
  private userGracePeriods: Map<string, UserGracePeriod>;
  private currentUserId: number;
  private currentUserProfileId: number;
  private currentMealId: number;
  private currentMealPlanId: number;
  private currentNutritionGoalId: number;
  private currentProgressEntryId: number;
  private currentRegistrationLogId: number;
  private currentUserNotificationId: number;
  private currentUserGracePeriodId: number;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.meals = new Map();
    this.mealPlans = new Map();
    this.nutritionGoals = new Map();
    this.progressEntries = new Map();
    this.registrationLogs = new Map();
    this.userNotifications = new Map();
    this.userGracePeriods = new Map();
    this.currentUserId = 1;
    this.currentUserProfileId = 1;
    this.currentMealId = 1;
    this.currentMealPlanId = 1;
    this.currentNutritionGoalId = 1;
    this.currentProgressEntryId = 1;
    this.currentRegistrationLogId = 1;
    this.currentUserNotificationId = 1;
    this.currentUserGracePeriodId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }



  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Implementazione dei metodi per il profilo utente
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(userId);
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = this.currentUserProfileId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const userProfile: UserProfile = {
      id,
      userId: profile.userId,
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      weight: profile.weight,
      height: profile.height,
      activityLevel: profile.activityLevel,
      createdAt,
      updatedAt
    };
    
    this.userProfiles.set(profile.userId, userProfile);
    return userProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return undefined;
    
    const updatedProfile: UserProfile = { 
      ...profile, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.userProfiles.set(userId, updatedProfile);
    return updatedProfile;
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
    
    // Assicuriamoci che tutti i campi richiesti siano presenti
    const goal: NutritionGoal = { 
      id, 
      userId: insertGoal.userId, 
      calories: insertGoal.calories, 
      proteins: insertGoal.proteins, 
      carbs: insertGoal.carbs, 
      fats: insertGoal.fats, 
      name: insertGoal.name,
      startDate: insertGoal.startDate,
      endDate: insertGoal.endDate || null,
      isActive: insertGoal.isActive !== undefined ? insertGoal.isActive : true,
      description: insertGoal.description || null,
      createdAt
    };
    
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
    
    // Assicuriamoci che tutti i campi richiesti siano presenti
    const entry: ProgressEntry = { 
      id, 
      userId: insertEntry.userId, 
      date: insertEntry.date,
      weight: insertEntry.weight || null,
      notes: insertEntry.notes || null,
      createdAt
    };
    
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
  
  // Implementazione dei metodi per i registri delle registrazioni
  async createRegistrationLog(insertLog: InsertRegistrationLog): Promise<RegistrationLog> {
    const id = this.currentRegistrationLogId++;
    const registeredAt = new Date();
    
    const log: RegistrationLog = {
      id,
      ipAddress: insertLog.ipAddress,
      userAgent: insertLog.userAgent,
      email: insertLog.email,
      username: insertLog.username,
      registeredAt,
      trialEndDate: insertLog.trialEndDate
    };
    
    this.registrationLogs.set(id, log);
    return log;
  }
  
  async getRegistrationLogsByEmail(email: string): Promise<RegistrationLog[]> {
    return Array.from(this.registrationLogs.values())
      .filter(log => log.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
  }
  
  async getRegistrationLogsByIpAddress(ipAddress: string): Promise<RegistrationLog[]> {
    return Array.from(this.registrationLogs.values())
      .filter(log => log.ipAddress === ipAddress)
      .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
  }
  
  // Implementazione dei metodi per le notifiche utente
  async createUserNotification(insertNotification: InsertUserNotification): Promise<UserNotification> {
    const id = this.currentUserNotificationId++;
    const createdAt = new Date();
    
    const notification: UserNotification = {
      id,
      userId: insertNotification.userId,
      title: insertNotification.title,
      message: insertNotification.message,
      isRead: false,
      type: insertNotification.type,
      createdAt,
      actionUrl: insertNotification.actionUrl || null,
      expiresAt: insertNotification.expiresAt || null
    };
    
    this.userNotifications.set(id, notification);
    return notification;
  }
  
  async getUserNotificationsByUserId(userId: string): Promise<UserNotification[]> {
    return Array.from(this.userNotifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserUnreadNotifications(userId: string): Promise<UserNotification[]> {
    return Array.from(this.userNotifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async markUserNotificationAsRead(id: number): Promise<UserNotification | undefined> {
    const notification = this.userNotifications.get(id);
    if (!notification) return undefined;
    
    notification.isRead = true;
    this.userNotifications.set(id, notification);
    return notification;
  }
  
  async deleteUserNotification(id: number): Promise<boolean> {
    return this.userNotifications.delete(id);
  }
  
  // Implementazione dei metodi per i periodi di grazia
  async createUserGracePeriod(insertGracePeriod: InsertUserGracePeriod): Promise<UserGracePeriod> {
    const id = this.currentUserGracePeriodId++;
    const createdAt = new Date();
    
    const gracePeriod: UserGracePeriod = {
      id,
      userId: insertGracePeriod.userId,
      expiresAt: insertGracePeriod.expiresAt,
      active: insertGracePeriod.active !== undefined ? insertGracePeriod.active : true,
      dataRetention: insertGracePeriod.dataRetention !== undefined ? insertGracePeriod.dataRetention : true,
      createdAt
    };
    
    this.userGracePeriods.set(insertGracePeriod.userId, gracePeriod);
    return gracePeriod;
  }
  
  async getUserGracePeriodByUserId(userId: string): Promise<UserGracePeriod | undefined> {
    return this.userGracePeriods.get(userId);
  }
  
  async updateUserGracePeriod(userId: string, updates: Partial<InsertUserGracePeriod>): Promise<UserGracePeriod | undefined> {
    const gracePeriod = this.userGracePeriods.get(userId);
    if (!gracePeriod) return undefined;
    
    const updatedGracePeriod: UserGracePeriod = { ...gracePeriod, ...updates };
    this.userGracePeriods.set(userId, updatedGracePeriod);
    return updatedGracePeriod;
  }
  
  async deleteUserGracePeriod(userId: string): Promise<boolean> {
    return this.userGracePeriods.delete(userId);
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



  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Implementazione dei metodi per il profilo utente
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [userProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return userProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userProfiles.userId, userId))
      .returning();
    
    return updatedProfile;
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
  
  // Implementazione dei metodi per i registri delle registrazioni
  async createRegistrationLog(insertLog: InsertRegistrationLog): Promise<RegistrationLog> {
    const [log] = await db
      .insert(registrationLogs)
      .values(insertLog)
      .returning();
    
    return log;
  }
  
  async getRegistrationLogsByEmail(email: string): Promise<RegistrationLog[]> {
    return await db
      .select()
      .from(registrationLogs)
      .where(eq(registrationLogs.email, email.toLowerCase()))
      .orderBy(desc(registrationLogs.registeredAt));
  }
  
  async getRegistrationLogsByIpAddress(ipAddress: string): Promise<RegistrationLog[]> {
    return await db
      .select()
      .from(registrationLogs)
      .where(eq(registrationLogs.ipAddress, ipAddress))
      .orderBy(desc(registrationLogs.registeredAt));
  }
  
  // Implementazione dei metodi per le notifiche utente
  async createUserNotification(insertNotification: InsertUserNotification): Promise<UserNotification> {
    const [notification] = await db
      .insert(userNotifications)
      .values(insertNotification)
      .returning();
    
    return notification;
  }
  
  async getUserNotificationsByUserId(userId: string): Promise<UserNotification[]> {
    return await db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));
  }
  
  async getUserUnreadNotifications(userId: string): Promise<UserNotification[]> {
    return await db
      .select()
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, false)
        )
      )
      .orderBy(desc(userNotifications.createdAt));
  }
  
  async markUserNotificationAsRead(id: number): Promise<UserNotification | undefined> {
    const [notification] = await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.id, id))
      .returning();
    
    return notification;
  }
  
  async deleteUserNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(userNotifications)
      .where(eq(userNotifications.id, id))
      .returning({ id: userNotifications.id });
    
    return result.length > 0;
  }
  
  // Implementazione dei metodi per i periodi di grazia
  async createUserGracePeriod(insertGracePeriod: InsertUserGracePeriod): Promise<UserGracePeriod> {
    // Prima controlla se esiste già un periodo di grazia per questo utente
    const existingGracePeriod = await this.getUserGracePeriodByUserId(insertGracePeriod.userId);
    
    if (existingGracePeriod) {
      // Se esiste già, aggiorna i valori
      return this.updateUserGracePeriod(insertGracePeriod.userId, insertGracePeriod);
    }
    
    // Altrimenti crea un nuovo periodo di grazia
    const [gracePeriod] = await db
      .insert(userGracePeriods)
      .values(insertGracePeriod)
      .returning();
    
    return gracePeriod;
  }
  
  async getUserGracePeriodByUserId(userId: string): Promise<UserGracePeriod | undefined> {
    const [gracePeriod] = await db
      .select()
      .from(userGracePeriods)
      .where(eq(userGracePeriods.userId, userId));
    
    return gracePeriod;
  }
  
  async updateUserGracePeriod(userId: string, updates: Partial<InsertUserGracePeriod>): Promise<UserGracePeriod | undefined> {
    const [updatedGracePeriod] = await db
      .update(userGracePeriods)
      .set(updates)
      .where(eq(userGracePeriods.userId, userId))
      .returning();
    
    return updatedGracePeriod;
  }
  
  async deleteUserGracePeriod(userId: string): Promise<boolean> {
    const result = await db
      .delete(userGracePeriods)
      .where(eq(userGracePeriods.userId, userId))
      .returning({ id: userGracePeriods.id });
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
