import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Welcome from "@/pages/Welcome";
import Info from "@/pages/Info";
import { listenToAuthState, auth } from "@/lib/firebase";
import { User, getRedirectResult } from "firebase/auth";

function ProtectedRoute({ user, children }: { user: User | null, children: JSX.Element }) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  return user ? children : null;
}

function Router({ user }: { user: User | null }) {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/info" component={Info} />
      <Route path="/login" component={Login} />
      <Route path="/home">
        {() => (
          <ProtectedRoute user={user}>
            <Home user={{ uid: user!.uid, email: user!.email, emailVerified: user!.emailVerified }} />
          </ProtectedRoute>
        )}
      </Route>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Redirect result:", result.user);
          setUser(result.user);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Redirect error:", error);
      });
    
    // Then set up the auth state listener
    const unsubscribe = listenToAuthState((user) => {
      console.log("Auth state changed:", user);
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router user={user} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
