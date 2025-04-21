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
import { PlusCircle, X, Download } from "lucide-react";

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
  const [isInstalled, setIsInstalled] = useState(false);

  // Controlla se l'app è già installata
  useEffect(() => {
    // Metodo per individuare se l'app è in modalità standalone (installata)
    const isInStandaloneMode = () => 
      (window.matchMedia('(display-mode: standalone)').matches) || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
    
    setIsInstalled(isInStandaloneMode());
  }, []);

  useEffect(() => {
    // Intercetta l'evento beforeinstallprompt
    window.addEventListener("beforeinstallprompt", (e) => {
      // Impedisce al browser di mostrare automaticamente il prompt
      e.preventDefault();
      // Salva l'evento per mostrarlo in seguito
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Imposta che l'app è installabile
      setInstallable(true);
    });

    // Gestisce quando l'app è stata installata
    window.addEventListener("appinstalled", () => {
      // Nasconde il prompt
      setShowPrompt(false);
      // Pulisce il prompt salvato
      deferredPrompt.current = null;
      // Aggiorna lo stato
      setIsInstalled(true);
      // Registra l'installazione
      console.log("PWA installata con successo!");
    });
  }, []);

  // Funzione per gestire l'installazione
  const handleInstallClick = async () => {
    setShowPrompt(true);
    
    if (!deferredPrompt.current) {
      // Se non abbiamo un prompt di installazione, mostra comunque le istruzioni
      return;
    }

    // Mostra il prompt di installazione del browser
    deferredPrompt.current.prompt();
    
    // Attende la scelta dell'utente
    const choiceResult = await deferredPrompt.current.userChoice;
    
    // Registra la scelta
    if (choiceResult.outcome === "accepted") {
      console.log("L'utente ha accettato di installare la PWA");
      setIsInstalled(true);
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

  // Non mostrare niente se l'app è già installata
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Pulsante fisso in basso a destra */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button 
          onClick={handleInstallClick} 
          className="rounded-full p-3 shadow-lg"
        >
          <Download className="h-6 w-6" />
        </Button>
      </div>

      {/* Dialog per l'installazione */}
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
          {!deferredPrompt.current && (
            <div className="rounded-md bg-amber-50 p-4 text-amber-800 mb-4">
              <p className="text-sm">
                Per installare NutriEasy sul tuo dispositivo:
              </p>
              <ul className="text-sm list-disc pl-5 mt-2">
                <li>Per iOS: tocca l'icona di condivisione, quindi "Aggiungi a Home"</li>
                <li>Per Android: tocca i tre punti nel browser, quindi "Installa app"</li>
                <li>Per Desktop: cerca l'icona di installazione nella barra degli indirizzi</li>
              </ul>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={handleDismiss}>
              <X className="mr-2 h-4 w-4" />
              <span>Non ora</span>
            </Button>
            {deferredPrompt.current ? (
              <Button type="button" onClick={handleInstallClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Installa app</span>
              </Button>
            ) : (
              <Button type="button" onClick={handleDismiss}>
                <span>Ho capito</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PWAInstallPrompt;