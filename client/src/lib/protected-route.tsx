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
  const isDemoMode = viewMode === 'demo';
  
  if (isDemoMode) {
    // In modalità demo, renderizza direttamente il componente
    // Il componente si occuperà di gestire la modalità demo
    return <Component />;
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
  return <Component />;
}