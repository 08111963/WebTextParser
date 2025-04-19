import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
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

type ConditionalNavigationProps = {
  /**
   * Sezione a cui navigare nell'app se l'utente è autenticato
   * Ad esempio: "meals", "goals", ecc.
   */
  section: string;
  /**
   * Funzione da chiamare se l'utente non è autenticato
   */
  children: React.ReactNode;
};

export function useConditionalNavigation() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  const navigateTo = (section: string) => {
    if (user) {
      // Se l'utente è già autenticato, naviga direttamente alla sezione
      navigate(`/home?section=${section}`);
    } else {
      // Altrimenti, mostra il dialogo di login/registrazione
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

  return {
    navigateTo,
    LoginPrompt: () => (
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
    )
  };
}