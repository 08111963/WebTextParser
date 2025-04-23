import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, RouteComponentProps, useLocation } from "wouter";

export function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  
  // Controlla se siamo in modalità demo direttamente dalla URL globale
  const searchParams = new URLSearchParams(window.location.search);
  const viewMode = searchParams.get('view');
  const isDemoMode = viewMode === 'demo';
  
  console.log("DEMO MODE CHECK:", { isDemoMode, viewMode, url: window.location.href });
  
  // In modalità demo, renderizza direttamente il componente senza controlli
  if (isDemoMode) {
    console.log("DEMO MODE ACTIVATED - Bypassing auth");
    return <Component />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verifica se l'utente è autenticato
  if (!user) {
    console.log("NOT AUTHENTICATED - Redirecting to auth");
    return <Redirect to="/auth" />;
  }

  // Utente autenticato - renderizza il componente
  return <Component />;
}