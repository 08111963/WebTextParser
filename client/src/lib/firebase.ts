import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAeEnYe0lkPs1ctVwQbg6q9CTMkfOd67Zc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nutrifacile-a686e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nutrifacile-a686e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nutrifacile-a686e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "647152474961",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:647152474961:web:2cd0a058b60c36077d1170",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WWZWJFWZH6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user);
  return userCredential;
};

export const signOut = () => {
  return firebaseSignOut(auth);
};

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Meal functions
export const addMeal = async (meal: {
  userId: string,
  food: string,
  calories: number,
  proteins: number, 
  carbs: number,
  fats: number,
  mealType: string
}) => {
  const mealWithTimestamp = {
    ...meal,
    timestamp: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, "users", meal.userId, "meals"), mealWithTimestamp);
  return { id: docRef.id, ...mealWithTimestamp };
};

export const getMeals = (userId: string, callback: (meals: any[]) => void) => {
  return onSnapshot(
    collection(db, "users", userId, "meals"),
    (snapshot) => {
      const meals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(meals);
    }
  );
};

export const getMealsByDateRange = (userId: string, startDate: Date, endDate: Date, callback: (meals: any[]) => void) => {
  const q = query(
    collection(db, "users", userId, "meals"),
    where("timestamp", ">=", Timestamp.fromDate(startDate)),
    where("timestamp", "<=", Timestamp.fromDate(endDate)),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const meals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(meals);
  });
};

export const deleteMeal = (userId: string, mealId: string) => {
  return deleteDoc(doc(db, "users", userId, "meals", mealId));
};

// Meal plan functions
export const addMealPlan = async (mealPlan: {
  userId: string,
  query: string,
  response: string
}) => {
  const mealPlanWithTimestamp = {
    ...mealPlan,
    timestamp: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, "users", mealPlan.userId, "mealPlans"), mealPlanWithTimestamp);
  return { id: docRef.id, ...mealPlanWithTimestamp };
};

export const getMealPlans = (userId: string, callback: (mealPlans: any[]) => void) => {
  return onSnapshot(
    collection(db, "users", userId, "mealPlans"),
    (snapshot) => {
      const mealPlans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(mealPlans);
    }
  );
};

// Helper function to convert Firestore timestamp to Date
export const convertTimestampToDate = (timestamp: Timestamp) => {
  return timestamp.toDate();
};

// Auth state listener
export const listenToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Nutrition Goal functions
export const addNutritionGoal = async (goal: {
  userId: string,
  name: string,
  calories: number,
  proteins: number,
  carbs: number,
  fats: number,
  startDate: Date,
  endDate?: Date | null,
  description?: string | null,
  isActive: boolean
}) => {
  const goalWithTimestamp = {
    ...goal,
    timestamp: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, "users", goal.userId, "nutritionGoals"), goalWithTimestamp);
  return { id: docRef.id, ...goalWithTimestamp };
};

export const getNutritionGoals = (userId: string, callback: (goals: any[]) => void) => {
  return onSnapshot(
    collection(db, "users", userId, "nutritionGoals"),
    (snapshot) => {
      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(goals);
    }
  );
};

export const getActiveNutritionGoal = (userId: string, callback: (goal: any | null) => void) => {
  const q = query(
    collection(db, "users", userId, "nutritionGoals"),
    where("isActive", "==", true)
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    // Get the first active goal
    const doc = snapshot.docs[0];
    callback({
      id: doc.id,
      ...doc.data()
    });
  });
};

export const updateNutritionGoal = async (userId: string, goalId: string, updates: any) => {
  return await setDoc(doc(db, "users", userId, "nutritionGoals", goalId), updates, { merge: true });
};

export const deleteNutritionGoal = (userId: string, goalId: string) => {
  return deleteDoc(doc(db, "users", userId, "nutritionGoals", goalId));
};

// Progress (Weight) Entry functions
export const addProgressEntry = async (entry: {
  userId: string,
  weight: number,
  date: Date,
  notes?: string
}) => {
  const entryWithTimestamp = {
    ...entry,
    timestamp: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, "users", entry.userId, "progress"), entryWithTimestamp);
  return { id: docRef.id, ...entryWithTimestamp };
};

export const getProgressEntries = (userId: string, callback: (entries: any[]) => void) => {
  return onSnapshot(
    query(
      collection(db, "users", userId, "progress"),
      orderBy("date", "desc")
    ),
    (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(entries);
    }
  );
};

export const getProgressEntriesByDateRange = (userId: string, startDate: Date, endDate: Date, callback: (entries: any[]) => void) => {
  const q = query(
    collection(db, "users", userId, "progress"),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(entries);
  });
};

export const deleteProgressEntry = (userId: string, entryId: string) => {
  return deleteDoc(doc(db, "users", userId, "progress", entryId));
};

export { auth, db, Timestamp };
