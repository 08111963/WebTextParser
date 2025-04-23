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
  const { user } = useAuth();

  // Naviga alla sezione richiesta, in modalità visualizzazione se l'utente non è autenticato
  const navigateTo = (section: string) => {
    // Se l'utente proviene dalla pagina Welcome e sta esplorando features, mostra in modalità visualizzazione
    if (!user && (section === 'meals' || section === 'goals' || section === 'dashboard')) {
      // Naviga alla pagina home in modalità visualizzazione con la sezione specificata
      navigate(`/home?section=${section}&view=demo`);
    } 
    // Se l'utente è autenticato, naviga direttamente
    else if (user) {
      navigate(`/home?section=${section}`);
    } 
    // Per altre sezioni o azioni che richiedono autenticazione
    else {
      // Mostra il prompt di login e salva la sezione per il reindirizzamento successivo
      setShowLoginPrompt(true);
      setPendingSection(section);
    }
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
          <AlertDialogTitle>Login Required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to login or register to access this feature.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Login or Register</AlertDialogAction>
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