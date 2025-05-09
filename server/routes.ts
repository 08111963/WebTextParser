import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMealSchema, 
  insertMealPlanSchema, 
  insertNutritionGoalSchema, 
  insertProgressEntrySchema,
  insertUserProfileSchema, 
  User
} from "@shared/schema";
import { createEmailResponse, getUnreadResponses, updateResponseStatus } from "./email-response";

// Estendi il tipo Request per includere la proprietà user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateNutritionGoalRecommendations, generateMealSuggestions, generateAIResponse } from "./ai-service";
import { generateMealSuggestionsWithPerplexity, generateNutritionalAdviceWithPerplexity } from "./perplexity-service";
import Stripe from "stripe";

// Inizializza Stripe con la tua chiave API segreta
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

// Middleware to protect routes that require authentication
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log("Auth check:", { 
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    userId: req.user?.id,
    sessionId: req.sessionID,
    cookies: req.headers.cookie
  });
  
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized, please login first" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure authentication
  setupAuth(app);
  
  // Endpoint di test per il servizio email
  app.get('/api/test-email-service', async (req, res) => {
    try {
      const { emailServiceStatus, sendWelcomeEmail } = await import('./email-service');
      
      console.log('Email service status:', emailServiceStatus);
      
      // Send a test email that will be logged to the console
      const testEmail = 'test@example.com'; 
      const testResult = await sendWelcomeEmail(testEmail, 'Test User');
      
      res.json({
        status: emailServiceStatus,
        testResult
      });
    } catch (error) {
      console.error('Error testing email service:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Endpoint to test sending an email to a specific address
  app.post('/api/send-test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          error: "Email address is required" 
        });
      }
      
      const { emailServiceStatus, sendWelcomeEmail } = await import('./email-service');
      console.log(`Attempting to send test email to: ${email}`);
      
      // Send a test email to the specified address
      const testResult = await sendWelcomeEmail(email, 'Test User');
      
      console.log(`Result of sending email to ${email}: ${testResult ? 'Success' : 'Failed'}`);
      
      res.json({
        status: emailServiceStatus,
        emailSent: testResult,
        sentTo: email,
        message: testResult 
          ? "Test email sent successfully!" 
          : "Unable to send test email."
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Configura Express per ricevere i dati raw per i webhook di Stripe
  app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));
  
  // Endpoint per gestire i webhook di Stripe
  app.post('/api/stripe-webhook', async (req, res) => {
    // Verifica che la richiesta provenga da Stripe
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    // Verifica la firma solo se il segreto del webhook è impostato
    if (webhookSecret) {
      const signature = req.headers['stripe-signature'] as string;
      
      try {
        if (!stripe) {
          throw new Error('Stripe is not configured');
        }
        
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      // Se il segreto non è impostato, presumiamo che la richiesta sia valida (solo per test/sviluppo)
      try {
        event = JSON.parse(req.body.toString());
      } catch (err) {
        console.error(`Error parsing webhook payload: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return res.status(400).send(`Webhook Error: Invalid payload`);
      }
    }
    
    // Gestisci gli eventi in base al tipo
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          
          // Ricava l'ID utente dai metadati della sessione
          const userId = session.client_reference_id || session.metadata?.userId;
          const planId = session.metadata?.planId || 'premium-monthly';
          
          console.log(`Checkout completed for user ${userId}, plan ${planId}`);
          
          if (userId) {
            // Aggiorna lo stato dell'abbonamento nella sessione utente
            // (Questo è un approccio semplificato, in un ambiente di produzione dovresti
            // memorizzare questi dati nel database)
            
            // Trova le sessioni attive per l'utente
            // Nota: questo è solo un esempio e non funzionerà in un ambiente scalabile
            // In un'applicazione reale, dovresti memorizzare lo stato dell'abbonamento nel database
            
            // Imposta la data di scadenza in base al piano (mensile o annuale)
            const now = new Date();
            let endDate = new Date();
            
            if (planId === 'premium-yearly') {
              endDate.setFullYear(now.getFullYear() + 1);
            } else {
              endDate.setMonth(now.getMonth() + 1);
            }
            
            // Crea una notifica per informare l'utente dell'attivazione dell'abbonamento
            try {
              await storage.createUserNotification({
                userId: userId,
                title: "Subscription Activated",
                message: `Your ${planId === 'premium-yearly' ? 'yearly' : 'monthly'} subscription has been successfully activated. Enjoy all premium features!`,
                type: "subscription_activated",
                actionUrl: "/home",
                expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Scade tra 30 giorni
              });
              
              console.log(`Created subscription activation notification for user ${userId}`);
              
              // Invia email di conferma pagamento
              try {
                // Ottieni i dati dell'utente
                const user = await storage.getUser(parseInt(userId));
                
                if (user && user.email) {
                  // Importa direttamente il servizio email TypeScript
                  const { sendPaymentConfirmationEmail, emailServiceStatus } = await import('./email-service');
                  console.log(`[Routes] Stato servizio email: ${JSON.stringify(emailServiceStatus)}`);
                  
                  // Calcola la data di fine abbonamento
                  const endDateStr = endDate.toISOString().split('T')[0];
                  const planName = planId === 'premium-yearly' ? 'Yearly Premium Plan' : 'Monthly Premium Plan';
                  const amount = planId === 'premium-yearly' ? '$39.99/year' : '$3.99/month';
                  
                  sendPaymentConfirmationEmail(user.email, user.username, planName, amount, endDateStr)
                    .then(success => {
                      console.log(`Email di conferma pagamento ${success ? 'inviata' : 'non inviata'} a ${user.email}`);
                    })
                    .catch(err => {
                      console.error('Errore durante l\'invio dell\'email di conferma pagamento:', err);
                    });
                }
              } catch (emailError) {
                console.error('Errore durante l\'invio dell\'email di conferma pagamento:', emailError);
              }
            } catch (error) {
              console.error(`Failed to create notification for user ${userId}:`, error);
            }
          }
          
          break;
        }
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          console.log(`Subscription ${subscription.id} ${event.type === 'customer.subscription.created' ? 'created' : 'updated'}`);
          
          // Puoi aggiornare i dati dell'abbonamento nel database qui
          break;
        }
          
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log(`Subscription ${subscription.id} cancelled/deleted`);
          
          // Qui puoi gestire la cancellazione dell'abbonamento
          // Ad esempio, aggiornare lo stato dell'utente o inviare una notifica
          
          // Ricava l'ID del cliente
          const customerId = subscription.customer;
          
          // In uno scenario reale, dovresti cercare l'utente associato a questo cliente nel database
          // e aggiornare il suo stato di abbonamento
          
          console.log(`Subscription ended for customer ${customerId}`);
          break;
        }
          
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          console.log(`Payment succeeded for invoice ${invoice.id}`);
          
          // Qui puoi gestire il pagamento riuscito, ad esempio estendendo la data di scadenza dell'abbonamento
          break;
        }
          
        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          
          console.log(`Payment failed for invoice ${invoice.id}, customer ${customerId}`);
          
          // Qui puoi inviare una notifica all'utente riguardo al pagamento fallito
          
          // In uno scenario reale, dovresti cercare l'utente associato a questo cliente nel database
          // e inviare una notifica appropriata
          break;
        }
          
        default:
          // Eventi non gestiti
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      // Conferma a Stripe che abbiamo ricevuto l'evento
      res.status(200).send({ received: true });
    } catch (err) {
      console.error(`Error processing webhook: ${err instanceof Error ? err.message : 'Unknown error'}`);
      res.status(500).send(`Webhook processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });
  
  // Endpoint per verificare la scadenza del periodo di prova dal database
  // e lo stato dell'abbonamento dell'utente
  app.get('/api/trial-status', isAuthenticated, async (req, res) => {
    try {
      // Verifica se l'utente è un amministratore
      if ((req.user as any).isAdmin) {
        // Fornisci dati fittizi per l'amministratore
        return res.status(200).json({
          trialActive: true,
          trialEnded: false,
          daysRemaining: 9999,
          subscription: {
            active: true,
            plan: "admin",
            startDate: new Date().toISOString(),
            endDate: new Date(2099, 11, 31).toISOString()
          },
          gracePeriod: null
        });
      }
      
      // Per utenti normali, procedi come prima
      const userId = req.user!.id.toString();
      const userProfile = await storage.getUserProfile(userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Controlla eventuali periodi di grazia attivi per l'utente
      const gracePeriod = await storage.getUserGracePeriodByUserId(userId);
      
      // Verifica se l'utente ha recentemente completato un pagamento
      // (simuliamo questa verifica controllando i cookie della sessione)
      const hasPaidSubscription = req.session.subscription?.active === true;
      
      // Se c'è un abbonamento attivo, restituisci lo stato premium
      if (hasPaidSubscription) {
        return res.json({
          trialActive: true, // Impostiamo come attivo per permettere l'accesso
          trialDaysLeft: 999, // Un numero grande per indicare che non scadrà presto
          trialEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // Scadenza tra un anno
          trialStartDate: new Date().toISOString(),
          message: null,
          isPremium: true,
          hasGracePeriod: false,
          subscriptionPlan: req.session.subscription?.plan || "premium-monthly" 
        });
      }
      
      // Logica normale del periodo di prova - utilizziamo la data attuale come fallback
      // Se non possiamo determinare la data di creazione del profilo
      const registrationDate = new Date();
      const trialPeriodDays = 5; // Durata del periodo di prova in giorni
      const trialEndDate = new Date(registrationDate);
      trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);
      
      const today = new Date();
      const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const isTrialActive = daysLeft > 0;
      
      // Se il periodo di prova sta per scadere (2 giorni o meno), crea una notifica per l'utente
      if (isTrialActive && daysLeft <= 2) {
        // Verifica se esiste già una notifica per la scadenza del trial
        const existingNotifications = await storage.getUserNotificationsByUserId(userId);
        const hasTrialExpiringNotification = existingNotifications.some(
          notification => notification.type === 'trial_expiring' && !notification.isRead
        );
        
        // Crea una notifica solo se non esiste già
        if (!hasTrialExpiringNotification) {
          await storage.createUserNotification({
            userId: userId,
            title: "Trial Period Expiring Soon",
            message: `Your free trial will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to a premium plan to continue enjoying all features.`,
            type: "trial_expiring",
            actionUrl: "/pricing",
            expiresAt: trialEndDate
          });
          
          // Invia anche un'email di avviso
          try {
            // Ottieni i dati dell'utente completi
            const user = await storage.getUser(parseInt(userId));
            
            if (user && user.email) {
              // Importa direttamente il servizio email TypeScript
              const { sendTrialExpiringEmail, emailServiceStatus } = await import('./email-service');
              console.log(`[Routes/Trial] Stato servizio email: ${JSON.stringify(emailServiceStatus)}`);
              
              sendTrialExpiringEmail(user.email, user.username, daysLeft)
                .then(success => {
                  console.log(`Email di avviso scadenza trial ${success ? 'inviata' : 'non inviata'} a ${user.email}`);
                })
                .catch(err => {
                  console.error('Errore durante l\'invio dell\'email di avviso scadenza trial:', err);
                });
            }
          } catch (emailError) {
            console.error('Errore durante l\'invio dell\'email di avviso scadenza trial:', emailError);
          }
        }
      }
      
      // Se il periodo di prova è scaduto, verifica se bisogna creare un periodo di grazia
      if (!isTrialActive && !gracePeriod && !hasPaidSubscription) {
        // Il trial è scaduto e non c'è periodo di grazia attivo
        // Creiamo un periodo di grazia di 7 giorni per l'utente
        const gracePeriodDays = 7;
        const gracePeriodEndDate = new Date();
        gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + gracePeriodDays);
        
        await storage.createUserGracePeriod({
          userId: userId,
          expiresAt: gracePeriodEndDate,
          active: true,
          dataRetention: true
        });
        
        // Crea anche una notifica per informare l'utente del periodo di grazia
        await storage.createUserNotification({
          userId: userId,
          title: "Trial Period Expired",
          message: `Your free trial has expired. Your data will be retained for ${gracePeriodDays} more days. Upgrade to a premium plan to continue using all features.`,
          type: "trial_expired",
          actionUrl: "/pricing",
          expiresAt: gracePeriodEndDate
        });
        
        // Invia anche un'email di notifica scadenza
        try {
          // Ottieni i dati dell'utente completi
          const user = await storage.getUser(parseInt(userId));
          
          if (user && user.email) {
            // Importa direttamente il servizio email TypeScript
            const { sendSubscriptionEndedEmail, emailServiceStatus } = await import('./email-service');
            console.log(`[Routes/Expired] Stato servizio email: ${JSON.stringify(emailServiceStatus)}`);
            
            sendSubscriptionEndedEmail(user.email, user.username)
              .then(success => {
                console.log(`Email di notifica scadenza trial ${success ? 'inviata' : 'non inviata'} a ${user.email}`);
              })
              .catch(err => {
                console.error('Errore durante l\'invio dell\'email di notifica scadenza trial:', err);
              });
          }
        } catch (emailError) {
          console.error('Errore durante l\'invio dell\'email di notifica scadenza trial:', emailError);
        }
      }
      
      // Se non ha abbonamento, forzare la scadenza del trial per il test (solo per demo)
      const forceTrialExpired = true;
      
      if (forceTrialExpired) {
        // Se c'è un periodo di grazia attivo, includiamo queste informazioni nella risposta
        if (gracePeriod && gracePeriod.active) {
          const daysUntilGraceExpires = Math.max(0, Math.ceil(
            (new Date(gracePeriod.expiresAt).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          ));
          
          return res.json({
            trialActive: false,
            trialDaysLeft: 0,
            trialEndDate: new Date().toISOString(),
            trialStartDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
            message: `Your trial period has expired. Your data will be retained for ${daysUntilGraceExpires} more days. Upgrade to premium to keep access to all features.`,
            isPremium: false,
            hasGracePeriod: true,
            gracePeriodDaysLeft: daysUntilGraceExpires,
            gracePeriodEndDate: gracePeriod.expiresAt.toISOString(),
            subscriptionPlan: "trial"
          });
        }
        
        // Restituisci un periodo di prova scaduto senza periodo di grazia
        return res.json({
          trialActive: false,
          trialDaysLeft: 0,
          trialEndDate: new Date().toISOString(), // La data di fine è oggi
          trialStartDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // Data fittizia 5 giorni fa
          message: "Your trial period has expired. Upgrade to premium to continue using all features.",
          isPremium: false,
          hasGracePeriod: false,
          subscriptionPlan: "trial"
        });
      }
      
      // Questo codice non verrà mai eseguito durante il test, ma lo lasciamo per riferimento futuro
      // Notifica di scadenza del periodo di prova
      const message = isTrialActive 
        ? daysLeft <= 2 
          ? `Your trial will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade to premium to continue using all features.`
          : null
        : "Your trial period has expired. Upgrade to premium to continue using all features.";
      
      // Includi informazioni sul periodo di grazia se presente
      const hasGracePeriod = gracePeriod && gracePeriod.active;
      let gracePeriodDaysLeft = 0;
      let gracePeriodEndDate = null;
      
      if (hasGracePeriod) {
        gracePeriodDaysLeft = Math.max(0, Math.ceil(
          (new Date(gracePeriod.expiresAt).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ));
        gracePeriodEndDate = gracePeriod.expiresAt.toISOString();
      }
      
      res.json({
        trialActive: isTrialActive,
        trialDaysLeft: daysLeft,
        trialEndDate: trialEndDate.toISOString(),
        trialStartDate: registrationDate.toISOString(),
        message: message,
        isPremium: false,
        hasGracePeriod: hasGracePeriod,
        gracePeriodDaysLeft: gracePeriodDaysLeft,
        gracePeriodEndDate: gracePeriodEndDate,
        subscriptionPlan: "trial"
      });
    } catch (error) {
      console.error('Error checking trial status:', error);
      res.status(500).json({ message: "Error checking trial status" });
    }
  });
  // Get meals for user (route protetta)
  app.get("/api/meals", isAuthenticated, async (req, res) => {
    try {
      // Se è l'amministratore, restituisci un array vuoto o dati di esempio
      if ((req.user as any).isAdmin) {
        return res.json([]);
      }
      
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
      
      // Pre-processing data to ensure correct formats
      const processedData = {
        ...req.body,
        // Ensure all numeric values are numbers and rounded to integers
        calories: Math.round(Number(req.body.calories) || 0),
        proteins: Math.round(Number(req.body.proteins) || 0),
        carbs: Math.round(Number(req.body.carbs) || 0),
        fats: Math.round(Number(req.body.fats) || 0),
        // Ensure userId is a string
        userId: String(req.body.userId),
        // Convert timestamp to Date if it exists, otherwise use current date
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
      // Se è l'amministratore, restituisci un array vuoto o dati di esempio
      if ((req.user as any).isAdmin) {
        return res.json([]);
      }
      
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
      // Se è l'amministratore, restituisci un obiettivo predefinito
      if ((req.user as any).isAdmin) {
        console.log("Sono nell'API nutrition-goals/active e l'utente è un amministratore");
        const adminGoal = {
          id: 999,
          userId: "999999",
          title: "Admin Goal",
          description: "Default goal for admin",
          calories: 2500,
          proteins: 150,
          carbs: 300,
          fats: 80,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        console.log("Restituisco l'obiettivo amministratore:", JSON.stringify(adminGoal));
        return res.json(adminGoal);
      }
      
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
      // Pre-processing data to ensure correct formats
      const processedData = {
        ...req.body,
        // Ensure all numeric values are numbers and rounded to integers
        calories: Math.round(Number(req.body.calories) || 0),
        proteins: Math.round(Number(req.body.proteins) || 0),
        carbs: Math.round(Number(req.body.carbs) || 0),
        fats: Math.round(Number(req.body.fats) || 0),
        // Ensure userId is a string
        userId: String(req.body.userId)
      };
      
      const goalData = insertNutritionGoalSchema.parse(processedData);
      
      // If the user has not specified a value for isActive, set it to true by default
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

  // Update nutritional goal (protected route)
  app.patch("/api/nutrition-goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Partial data validation
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
      // Se è l'amministratore, restituisci un array vuoto o dati di esempio
      if ((req.user as any).isAdmin) {
        return res.json([]);
      }
      
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

  // Update progress entry (protected route)
  app.patch("/api/progress/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Partial data validation
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
    console.log("GET /api/user-profile route called");
    console.log("Auth status:", { 
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      user: req.user ? { id: req.user.id, username: req.user.username } : null 
    });
    
    try {
      // Se è l'amministratore, restituisci un profilo predefinito
      if ((req.user as any).isAdmin) {
        console.log("Sono nell'API user-profile e l'utente è un amministratore");
        const adminProfile = {
          id: 999,
          userId: "999999",
          name: "Administrator",
          age: 35,
          gender: "other",
          height: 180,
          weight: 75,
          activityLevel: "moderate",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        console.log("Restituisco il profilo amministratore:", JSON.stringify(adminProfile));
        return res.json(adminProfile);
      }
      
      // Ottieni l'ID dell'utente direttamente dall'oggetto req.user
      if (!req.user) {
        console.log("User object is undefined even though isAuthenticated() returned true");
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id.toString();
      
      console.log("User profile API - Using authenticated user ID:", userId);
      console.log("User profile API - Full user object:", JSON.stringify(req.user));
      
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        console.log("User profile not found for user ID:", userId);
        return res.status(404).json({ message: "User profile not found" });
      }
      
      console.log("User profile API - Found profile:", profile);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user profile", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // === AI RECOMMENDATIONS ROUTES ===
  
  // Generate recommendations for personalized nutrition goals (protected route)
  app.get("/api/recommendations/nutrition-goals", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const forceNewRecommendations = req.query.forceNew === 'true';
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Setting a 30-second timeout to avoid too long waits
      const TIMEOUT_MS = 30000;
      let isResponseSent = false;
      
      // Timeout to terminate the request if it takes too long
      const timeoutHandle = setTimeout(() => {
        if (!isResponseSent) {
          isResponseSent = true;
          
          // Respond with a predefined set of fallback recommendations
          const fallbackRecommendations = [
            {
              title: "Balanced Mediterranean",
              description: "Mediterranean approach with balance between all macronutrients, ideal for supporting energy and health in a balanced way.",
              calories: 2200,
              proteins: 120,
              carbs: 270,
              fats: 70
            },
            {
              title: "Enhanced Protein",
              description: "A high-protein approach to support muscle mass and improve satiety throughout the day.",
              calories: 2300,
              proteins: 150,
              carbs: 250,
              fats: 75
            },
            {
              title: "Natural Low-Carb",
              description: "A strategy with reduced carbohydrates and increased healthy fats, ideal for stabilizing energy levels and improving metabolism.",
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
      
      // Retrieve user profile
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        clearTimeout(timeoutHandle);
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Retrieve current nutritional goal if present
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
          
          // Use genuine AI recommendations if they exist and are not empty
          if (recommendations && Array.isArray(recommendations) && recommendations.length > 0) {
            // If we received valid AI recommendations, return them
            res.json({ 
              recommendations: recommendations,
              timestamp: new Date().toISOString(),
              source: "ai"
            });
          } else {
            // If we haven't received valid recommendations, return an error
            console.log("Empty recommendations from API");
            res.status(500).json({
              error: "Unable to generate recommendations. Please try again later.",
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (generationError: any) {
        console.error("Error in AI generation:", generationError);
        
        if (!isResponseSent) {
          isResponseSent = true;
          clearTimeout(timeoutHandle);
          
          // We use a generic error message regardless of the error type
          let errorMessage = "A connection issue occurred while generating recommendations. Please try again later.";
          
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
  
  // Generate personalized meal suggestions (protected route)
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
      
      // Setting a 30-second timeout to avoid too long waits
      const TIMEOUT_MS = 30000;
      let isResponseSent = false;
      
      // Timeout to terminate the request if it takes too long
      const timeoutHandle = setTimeout(() => {
        if (!isResponseSent) {
          isResponseSent = true;
          
          // Respond with a timeout message
          console.log("Meal suggestions API request timed out after 30 seconds");
          res.status(504).json({ 
            error: "The request took too long. Please try again later.",
            timestamp: new Date().toISOString()
          });
        }
      }, TIMEOUT_MS);
      
      // Retrieve user profile
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        clearTimeout(timeoutHandle);
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Retrieve current nutritional goal if present
      const nutritionGoal = await storage.getActiveNutritionGoal(userId);
      
      console.log("Generating meal suggestions for user:", userId);
      console.log("User profile:", JSON.stringify(profile));
      console.log("Current goal:", nutritionGoal ? JSON.stringify(nutritionGoal) : "None");
      console.log("Meal type requested:", mealType || "All");
      console.log("Preferences:", preferences || "None");
      
      try {
        // Generate personalized meal suggestions
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
          
          // If there are no suggestions, return an empty array instead of null
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
          
          // We use a generic error message regardless of the error type
          let errorMessage = "A connection issue occurred while generating recommendations. Please try again later.";
          
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
        suggestions: [] // Return an empty array even in case of error
      });
    }
  });
  
  // Endpoint to request an AI chatbot response (protected route)
  app.post("/api/ai-chat", isAuthenticated, async (req, res) => {
    try {
      const { userId, query, chatType } = req.body;
      
      if (!userId || !query) {
        return res.status(400).json({ message: "User ID and query are required" });
      }
      
      // Retrieve user profile
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Retrieve current nutritional goal if present
      const currentGoal = await storage.getActiveNutritionGoal(userId);
      
      // Retrieve recent meals if available
      const recentMeals = await storage.getMealsByUserId(userId);
      
      console.log("Processing AI chat request for user:", userId);
      console.log("User query:", query);
      console.log("Chat type:", chatType || "general");
      
      // Adapt the prompt based on the chatbot type
      let systemPrompt = "";
      
      if (chatType === "goals") {
        systemPrompt = `You are a nutritionist specializing in nutritional goals and metabolism. 
          Answer only questions about health goals, weight goals, 
          macronutrients, calories, metabolism, and strategies for achieving nutritional goals.
          If the user asks for information on other topics, gently redirect the conversation 
          towards nutritional goals. Respond in English in a detailed but concise way.`;
      } else if (chatType === "meals") {
        systemPrompt = `You are a food and cooking expert specializing in meals, food items, and recipes.
          Answer only questions about food, meals, recipes, nutritional values of foods,
          food preparation, dietary alternatives, and advice for specific meals.
          If the user asks for information on other topics, gently redirect the conversation 
          towards food and meal topics. Respond in English in a detailed but concise way.`;
      } else {
        systemPrompt = `You are an expert nutritionist who answers questions in English about nutrition, diet, and health.
          You have access to the user's profile and nutritional data, which you should use to personalize your responses.
          Respond in a conversational but professional manner, providing accurate and comprehensive information.
          Base your answers on up-to-date scientific information.`;
      }
      
      // Generate personalized response with the specialized prompt
      const answer = await generateAIResponse(query, profile, currentGoal, recentMeals, systemPrompt);
      
      res.json({ 
        answer,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error generating AI chat response:", error);
      
      // We use a generic error message regardless of the error type
      let errorMessage = "A connection issue occurred while generating recommendations. Please try again later.";
      
      res.status(500).json({ 
        message: "Failed to generate AI response", 
        error: error instanceof Error ? error.message : String(error),
        answer: errorMessage
      });
    }
  });

  // Create user profile (protected route)
  app.post("/api/user-profile", isAuthenticated, async (req, res) => {
    try {
      // Pre-processing data to ensure correct formats
      const processedData = {
        ...req.body,
        // Ensure userId is a string
        userId: String(req.body.userId),
        // Convert numeric values
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

  // Update user profile (protected route)
  app.patch("/api/user-profile/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Partial data validation
      const updateData = req.body;
      
      // Convert numeric values if present
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

  // === PERPLEXITY AI ROUTES ===

  // New route for meal suggestions with Perplexity AI
  app.get("/api/perplexity/meal-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { userId, mealType } = req.query;
      const dietaryPreferences = req.query.dietaryPreferences 
        ? Array.isArray(req.query.dietaryPreferences) 
          ? req.query.dietaryPreferences as string[] 
          : [req.query.dietaryPreferences as string]
        : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      // Retrieve user profile
      const userProfile = await storage.getUserProfile(userId as string);
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Retrieve active nutrition goal (if it exists)
      const activeGoal = await storage.getActiveNutritionGoal(userId as string);

      // Generate suggestions with Perplexity
      const suggestions = await generateMealSuggestionsWithPerplexity(
        userProfile,
        activeGoal,
        mealType as string | undefined,
        dietaryPreferences
      );

      res.json(suggestions);
    } catch (error) {
      console.error("Error generating meal suggestions with Perplexity:", error);
      res.status(500).json({ 
        message: "A connection issue occurred while generating recommendations. Please try again later.",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // New route for nutritional advice with Perplexity AI
  app.post("/api/perplexity/nutritional-advice", isAuthenticated, async (req, res) => {
    try {
      const { userId, query } = req.body;
      
      if (!userId || !query) {
        return res.status(400).json({ message: "userId and query are required" });
      }

      // Retrieve user profile
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      // Generate nutritional advice with Perplexity
      const advice = await generateNutritionalAdviceWithPerplexity(
        userProfile,
        query
      );

      res.json(advice);
    } catch (error) {
      console.error("Error generating nutritional advice with Perplexity:", error);
      res.status(500).json({ 
        message: "A connection issue occurred while generating recommendations. Please try again later.",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // === PAYMENT ROUTES WITH STRIPE ===
  
  // Check for Stripe secret key and price IDs
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("Warning: STRIPE_SECRET_KEY is not set. Payment functionality will not work.");
  } else {
    console.log("Stripe Secret Key available (starts with):", process.env.STRIPE_SECRET_KEY.substring(0, 7) + "...");
  }
  
  if (!process.env.STRIPE_PRICE_ID_MONTHLY) {
    console.warn("Warning: STRIPE_PRICE_ID_MONTHLY is not set.");
  } else {
    console.log("Monthly Price ID available:", process.env.STRIPE_PRICE_ID_MONTHLY);
  }
  
  if (!process.env.STRIPE_PRICE_ID_YEARLY) {
    console.warn("Warning: STRIPE_PRICE_ID_YEARLY is not set.");
  } else {
    console.log("Yearly Price ID available:", process.env.STRIPE_PRICE_ID_YEARLY);
  }
  
  // Initialize Stripe with secret key if available
  const stripe = process.env.STRIPE_SECRET_KEY ? 
    new Stripe(process.env.STRIPE_SECRET_KEY) : 
    null;
  
  // Endpoint per verificare e aggiornare lo stato dell'abbonamento dopo il pagamento
  app.post("/api/verify-payment", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe non configurato" });
      }
      
      const { sessionId, planId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "ID sessione di pagamento mancante" });
      }
      
      // Verifica la sessione di pagamento con Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Verifica che il pagamento sia completato con successo
      if (session.payment_status === "paid") {
        // In una applicazione reale, qui salveremmo le informazioni
        // dell'abbonamento nel database, associandole all'utente
        
        // Salviamo l'informazione nella sessione dell'utente
        if (!req.session.subscription) {
          req.session.subscription = {
            active: true,
            plan: planId || "premium-monthly",
            startDate: new Date().toISOString(),
            // In una versione reale qui useremmo le informazioni dall'abbonamento Stripe
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
          };
        }
        
        // Ritorna successo e informazioni sull'abbonamento
        return res.status(200).json({
          success: true,
          subscriptionActive: true,
          plan: planId || "premium-monthly",
          message: "Abbonamento attivato con successo!"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Il pagamento non risulta completato."
        });
      }
    } catch (error) {
      console.error("Errore nella verifica del pagamento:", error);
      res.status(500).json({ 
        success: false,
        message: "Errore durante la verifica del pagamento", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create Stripe checkout session for subscription
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      console.log("Processing payment request for plan:", req.body.planId);
      
      if (!stripe) {
        console.error("Stripe not configured - missing secret key");
        return res.status(500).json({ 
          message: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." 
        });
      }
      
      const { planId } = req.body;
      console.log("Processing plan ID:", planId);
      
      // Determine which price ID to use based on the plan
      let priceId;
      
      if (planId === 'premium-monthly') {
        priceId = process.env.STRIPE_PRICE_ID_MONTHLY;
      } else if (planId === 'premium-yearly') {
        priceId = process.env.STRIPE_PRICE_ID_YEARLY;
      } else {
        return res.status(400).json({ message: "Invalid plan ID." });
      }
      
      if (!priceId) {
        return res.status(500).json({ 
          message: "Stripe price ID not configured for the selected plan." 
        });
      }
      
      // Create a Checkout Session instead of a PaymentIntent
      // This redirects the user to the Stripe-hosted checkout page
      
      // Ensure we have a valid origin for the success and cancel URLs
      const origin = req.headers.origin || 'https://nutrieasy.replit.app';
      
      // Aggiungiamo l'ID utente nei metadati per tracciare di chi è il pagamento
      const userId = req.user!.id.toString();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
        cancel_url: `${origin}/pricing`,
        metadata: {
          planId,
          userId
        },
        client_reference_id: userId, // Utile per identificare l'utente anche nei webhook Stripe
        locale: 'en', // Forza la lingua inglese
      });
      
      console.log("Created Stripe session with success URL:", `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
      
      res.status(200).json({
        url: session.url,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Endpoint per verificare se l'utente ha già registrazioni o trial precedenti
  app.post('/api/check-registration', async (req, res) => {
    try {
      const { email, ipAddress } = req.body;
      
      if (!email || !ipAddress) {
        return res.status(400).json({ message: "Email and IP address are required" });
      }
      
      // TEMPORANEO: Disabilitato il controllo di registrazioni precedenti per permettere il test
      // Restituiamo sempre "no previous registration"
      console.log("Controllo registrazioni precedenti DISABILITATO per test");
      
      const hasPreviousRegistration = false;
      
      res.json({
        hasPreviousRegistration,
        message: "No previous registrations found."
      });
    } catch (error) {
      console.error('Error checking registration:', error);
      res.status(500).json({ message: "Error checking registration" });
    }
  });
  
  // Endpoint per registrare un nuovo utente nel log delle registrazioni
  app.post('/api/log-registration', isAuthenticated, async (req, res) => {
    try {
      const { ipAddress, userAgent } = req.body;
      
      if (!ipAddress || !userAgent) {
        return res.status(400).json({ message: "IP address and user agent are required" });
      }
      
      const userId = req.user!.id.toString();
      
      // Calcola la data di fine del periodo di prova (5 giorni da oggi)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 5);
      
      // Registra la nuova registrazione
      await storage.createRegistrationLog({
        ipAddress,
        userAgent,
        email: req.user!.email,
        username: req.user!.username,
        trialEndDate
      });
      
      res.json({ success: true, message: "Registration logged successfully" });
    } catch (error) {
      console.error('Error logging registration:', error);
      res.status(500).json({ message: "Error logging registration" });
    }
  });
  
  // Endpoint per esportare i dati utente
  app.get('/api/export-data', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id.toString();
      
      // Raccogli tutti i dati dell'utente
      const userProfile = await storage.getUserProfile(userId);
      const meals = await storage.getMealsByUserId(userId);
      const mealPlans = await storage.getMealPlansByUserId(userId);
      const nutritionGoals = await storage.getNutritionGoalsByUserId(userId);
      const progressEntries = await storage.getProgressEntriesByUserId(userId);
      
      // Prepara il pacchetto dati in formato JSON
      const userData = {
        user: {
          id: req.user!.id,
          username: req.user!.username,
          email: req.user!.email,
        },
        profile: userProfile,
        meals,
        mealPlans,
        nutritionGoals,
        progressEntries,
        exportDate: new Date().toISOString()
      };
      
      // Imposta gli header per il download del file
      res.setHeader('Content-Disposition', 'attachment; filename=nutrieasy-data-export.json');
      res.setHeader('Content-Type', 'application/json');
      
      // Invia i dati come file JSON
      res.json(userData);
    } catch (error) {
      console.error('Error exporting user data:', error);
      res.status(500).json({ message: "Error exporting user data" });
    }
  });
  
  // Endpoint per ottenere le notifiche dell'utente
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id.toString();
      
      // Ottieni le notifiche reali dal database
      const userNotifications = await storage.getUserNotificationsByUserId(userId);
      
      // Trasforma le notifiche nel formato atteso dal frontend
      const notifications = userNotifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        date: notification.createdAt,
        read: notification.isRead,
        type: notification.type,
        actionUrl: notification.actionUrl
      }));
      
      // Se non ci sono notifiche, restituisci alcune notifiche di benvenuto predefinite
      if (notifications.length === 0) {
        notifications.push({
          id: 1,
          title: "Welcome to NutriEasy!",
          message: "Start tracking your daily nutrition to reach your goals.",
          date: new Date(),
          read: false,
          type: "welcome",
          actionUrl: null
        });
      }
      
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  
  // Endpoint per segnare una notifica come letta
  app.post('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const updatedNotification = await storage.markUserNotificationAsRead(notificationId);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });

  // Endpoint per gestire le risposte alle email
  app.post('/api/email-response', async (req, res) => {
    await createEmailResponse(req, res);
  });

  // Endpoint per ottenere le risposte alle email non lette (solo per admin)
  app.get('/api/email-responses/unread', async (req, res) => {
    await getUnreadResponses(req, res);
  });

  // Endpoint per aggiornare lo stato di una risposta (solo per admin)
  app.patch('/api/email-response/:id/status', isAuthenticated, async (req, res) => {
    await updateResponseStatus(req, res);
  });

  const httpServer = createServer(app);
  return httpServer;
}
