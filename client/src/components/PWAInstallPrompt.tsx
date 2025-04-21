import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Component per mostrare una finestra di dialogo per l'installazione della PWA
const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    // Intercetta l'evento beforeinstallprompt
    window.addEventListener("beforeinstallprompt", (e) => {
      // Impedisce al browser di mostrare automaticamente il prompt
      e.preventDefault();
      // Salva l'evento per mostrarlo in seguito
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Mostra il nostro prompt personalizzato
      setShowPrompt(true);
      setInstallable(true);
    });

    // Gestisce quando l'app è stata installata
    window.addEventListener("appinstalled", () => {
      // Nasconde il prompt
      setShowPrompt(false);
      // Pulisce il prompt salvato
      deferredPrompt.current = null;
      // Registra l'installazione
      console.log("PWA installata con successo!");
    });
  }, []);

  // Funzione per gestire l'installazione
  const handleInstallClick = async () => {
    if (!deferredPrompt.current) {
      return;
    }

    // Mostra il prompt di installazione del browser
    deferredPrompt.current.prompt();
    
    // Attende la scelta dell'utente
    const choiceResult = await deferredPrompt.current.userChoice;
    
    // Registra la scelta
    if (choiceResult.outcome === "accepted") {
      console.log("L'utente ha accettato di installare la PWA");
    } else {
      console.log("L'utente ha rifiutato di installare la PWA");
    }
    
    // Pulisce il prompt
    deferredPrompt.current = null;
    setShowPrompt(false);
  };

  // Funzione per rifiutare l'installazione
  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Installa NutriEasy</DialogTitle>
          <DialogDescription>
            Installa NutriEasy sul tuo dispositivo per avere un accesso più rapido e un'esperienza migliore anche offline.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="rounded-full bg-primary p-2">
            <PlusCircle className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Aggiungi alla Home</p>
            <p className="text-sm text-muted-foreground">
              Usa NutriEasy come un'app nativa sul tuo dispositivo
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={handleDismiss}>
            <X className="mr-2 h-4 w-4" />
            <span>Non ora</span>
          </Button>
          <Button type="button" onClick={handleInstallClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Installa app</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;