import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

export function ViewOnlyRoute({
  component: Component,
}: {
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Questa funzione intercepta e gestisce le azioni che richiedono l'autenticazione
  const requireAuth = (action: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      setPendingAction(action);
      return false; // Impedisce l'azione se non autenticato
    }
    return true; // Permette l'azione se autenticato
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se l'utente non è autenticato, creiamo un utente demo per la visualizzazione
  // Questo è solo per la visualizzazione, non verrà usato per le chiamate API
  const demoUser = {
    id: 0, // ID demo
    username: "Visitatore",
    email: "",
    password: ""
  };

  // Props speciali da passare al componente per gestire autenticazione e interazioni
  const authProps = {
    requireAuth,
    isAuthenticated: !!user,
    user: user || demoUser, // Usa l'utente reale se autenticato, altrimenti l'utente demo
  };

  return (
    <>
      <Component {...authProps} />
      
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accedi per continuare</AlertDialogTitle>
            <AlertDialogDescription>
              Per accedere a questa funzionalità è necessario effettuare l'accesso o registrarsi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLoginPrompt(false)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowLoginPrompt(false);
                const section = pendingAction ? `?redirect=/home?section=${pendingAction}` : '';
                navigate(`/auth${section}`);
              }}
            >
              Accedi o Registrati
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}