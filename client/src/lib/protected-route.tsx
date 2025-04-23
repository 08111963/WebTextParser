import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, RouteComponentProps, useLocation } from "wouter";

export function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Controlla se siamo in modalità demo
  const params = location.includes('?') ? location.split('?')[1] : '';
  const urlParams = new URLSearchParams(params);
  const viewMode = urlParams.get('view');
  const sectionParam = urlParams.get('section');
  const isDemoMode = viewMode === 'demo';
  
  // Se siamo in modalità demo, usa l'utente demo
  if (isDemoMode) {
    const demoUser = {
      id: 0,
      username: "Guest",
      email: "",
      password: ""
    };
    
    const requireAuth = (action: string) => {
      // In modalità demo, non richiediamo autenticazione ma mostriamo solo un messaggio
      return false;
    };
    
    return <Component user={demoUser} isAuthenticated={false} requireAuth={requireAuth} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verifica se l'utente è autenticato o se è un amministratore
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Passa i props necessari al componente
  return <Component user={user} isAuthenticated={true} />;
}