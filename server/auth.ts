import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

// Add session store with connection to our PostgreSQL database
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true,
});

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
        const [user] = await db.select().from(users).where(eq(users.username, username));
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
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
      // Verifica se l'utente esiste già
      const [existingUser] = await db.select()
        .from(users)
        .where(eq(users.username, req.body.username));
      
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Crea nuovo utente
      const hashedPassword = await hashPassword(req.body.password);
      const [user] = await db.insert(users)
        .values({
          ...req.body,
          password: hashedPassword,
          firebaseId: null,  // Non usiamo più Firebase
        })
        .returning();

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
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