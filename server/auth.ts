import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";

// Estendi il namespace Express.User per il tipo corretto
declare global {
  namespace Express {
    // Definizione esplicita per evitare ricorsione
    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
    }
  }
}

// Add session store with connection to our PostgreSQL database
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true,
});

// Definiamo il tipo di dati che possono essere salvati nella sessione
declare module 'express-session' {
  interface SessionData {
    subscription?: {
      active: boolean;
      plan: string;
      startDate: string;
      endDate: string;
    };
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configurazione sessione
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "nutritracker-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 settimana
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Tentativo di login per l'utente: ${username}`);
        const [user] = await db.select().from(users).where(eq(users.username, username));
        
        if (!user) {
          console.log(`Utente ${username} non trovato`);
          return done(null, false);
        }
        
        // Log per debugging
        console.log(`Utente trovato: ${JSON.stringify({ id: user.id, username: user.username })}`);
        console.log(`Password fornita: ${password}`);
        console.log(`Password hash nel database: ${user.password.substring(0, 20)}...`);
        
        // Test delle password
        const isPasswordValid = await comparePasswords(password, user.password);
        console.log(`Password valida: ${isPasswordValid}`);
        
        if (!isPasswordValid) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error("Errore durante l'autenticazione:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Registrazione nuovo utente
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validazione dei dati di input
      if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).send("All fields (username, email, and password) are required.");
      }
      
      // Verifica se l'utente esiste già
      const [existingUserByUsername] = await db.select()
        .from(users)
        .where(eq(users.username, req.body.username));
      
      if (existingUserByUsername) {
        return res.status(400).send("This username is already taken. Please choose another one.");
      }
      
      // Verifica se l'email esiste già
      const [existingUserByEmail] = await db.select()
        .from(users)
        .where(eq(users.email, req.body.email));
      
      if (existingUserByEmail) {
        return res.status(400).send("This email is already registered. Please use another email or try to login.");
      }

      // Otteniamo i dati IP e user agent dalla richiesta
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // Importiamo storage per il registro delle registrazioni
      const { storage } = await import('./storage');
      
      // Verifica preliminare di registrazioni recenti con la stessa email o IP
      const emailRegistrations = await storage.getRegistrationLogsByEmail(req.body.email);
      const ipRegistrations = Array.isArray(ipAddress) 
        ? await storage.getRegistrationLogsByIpAddress(ipAddress[0])
        : await storage.getRegistrationLogsByIpAddress(ipAddress as string);
      
      // Verifica se ci sono stati tentativi di registrazione recenti (ultimi 30 giorni)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentEmailRegistrations = emailRegistrations.filter(
        log => new Date(log.registeredAt) >= thirtyDaysAgo
      );
      
      const recentIpRegistrations = ipRegistrations.filter(
        log => new Date(log.registeredAt) >= thirtyDaysAgo
      );
      
      // Impostiamo un limite massimo di 2 registrazioni per email o IP in 30 giorni
      if (recentEmailRegistrations.length >= 2 || recentIpRegistrations.length >= 2) {
        return res.status(400).send("Too many registration attempts. Please try again later or contact support.");
      }

      // Crea nuovo utente
      const hashedPassword = await hashPassword(req.body.password);
      const [user] = await db.insert(users)
        .values({
          ...req.body,
          password: hashedPassword
        })
        .returning();
        
      // Calcola la data di fine del periodo di prova (5 giorni da oggi)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 5);
        
      // Registra il nuovo utente nel log delle registrazioni
      await storage.createRegistrationLog({
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress as string,
        userAgent: userAgent as string,
        email: req.body.email,
        username: req.body.username,
        trialEndDate
      });

      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Invia email di benvenuto
        if (user.email) {
          try {
            // Importa direttamente il servizio email TypeScript
            const { sendWelcomeEmail, emailServiceStatus } = await import('./email-service');
            
            console.log(`[Auth] Stato servizio email: ${JSON.stringify(emailServiceStatus)}`);
            
            const success = await sendWelcomeEmail(user.email, user.username);
            console.log(`[Auth] Email di benvenuto ${success ? 'inviata' : 'non inviata'} a ${user.email}`);
          } catch (emailError) {
            console.error('[Auth] Errore durante l\'invio dell\'email:', emailError);
          }
        }
        
        res.status(201).json(user);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message?.includes("violates unique constraint")) {
        return res.status(400).send("An account with this username or email already exists.");
      }
      next(error);
    }
  });

  // Login with custom callback to handle authentication errors
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        // Return specific error message instead of generic 401
        if (req.body.username) {
          // Check if user exists
          db.select()
            .from(users)
            .where(eq(users.username, req.body.username))
            .then(([existingUser]) => {
              if (!existingUser) {
                return res.status(401).send("User not found. Check your username or password or register a new account.");
              } else {
                return res.status(401).send("User not found. Check your username or password or register a new account.");
              }
            })
            .catch(error => {
              next(error);
            });
        } else {
          return res.status(401).send("User not found. Check your username or password or register a new account.");
        }
        return;
      }
      
      // If we reach here, authentication was successful
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Ottieni utente corrente
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}