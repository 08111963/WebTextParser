import { useAuth } from "@/hooks/use-auth";
import { useState, createContext, useContext } from "react";
import { useLocation } from "wouter";

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

// Creiamo un Context per la navigazione condizionale
type ConditionalNavContextType = {
  navigateTo: (section: string) => void;
  LoginDialog: () => JSX.Element;
};

const ConditionalNavContext = createContext<ConditionalNavContextType | null>(null);

// Questo componente fornisce il contesto di navigazione e gestisce il dialogo
export function ConditionalNavigationProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  // Naviga direttamente alla sezione in modalità visualizzazione
  const navigateTo = (section: string) => {
    navigate(`/home?section=${section}`);
  };

  const handleCancel = () => {
    setShowLoginPrompt(false);
    setPendingSection(null);
  };

  const handleConfirm = () => {
    setShowLoginPrompt(false);
    // Naviga alla pagina di autenticazione, mantenendo l'informazione sulla sezione
    navigate(`/auth?redirect=${pendingSection ? `/home?section=${pendingSection}` : '/home'}`);
  };

  // Componente per il dialogo di login
  const LoginDialog = () => (
    <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Accedi per continuare</AlertDialogTitle>
          <AlertDialogDescription>
            Per accedere a questa funzionalità è necessario effettuare l'accesso o registrarsi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Accedi o Registrati</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <ConditionalNavContext.Provider value={{ navigateTo, LoginDialog }}>
      {children}
    </ConditionalNavContext.Provider>
  );
}

// Hook di utility per utilizzare il contesto
export function useConditionalNavigation() {
  const context = useContext(ConditionalNavContext);
  if (!context) {
    throw new Error("useConditionalNavigation must be used within a ConditionalNavigationProvider");
  }
  return context;
}