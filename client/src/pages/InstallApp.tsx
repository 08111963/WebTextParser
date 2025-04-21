import { useState } from "react";
import { Download, Smartphone, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstallQRCodes from "@/components/InstallQRCodes";

export default function InstallApp() {
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("mobile");
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary mb-4">Installa NutriEasy</h1>
        <p className="text-xl text-gray-600 max-w-xl mx-auto">
          Accedi rapidamente a NutriEasy dal tuo dispositivo e goditi un'esperienza completa anche offline.
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="inline-flex rounded-md shadow-sm mb-6">
            <Button
              variant={deviceType === "mobile" ? "default" : "outline"}
              className="rounded-l-md rounded-r-none"
              onClick={() => setDeviceType("mobile")}
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Dispositivi Mobili
            </Button>
            <Button
              variant={deviceType === "desktop" ? "default" : "outline"}
              className="rounded-r-md rounded-l-none"
              onClick={() => setDeviceType("desktop")}
            >
              <Laptop className="h-5 w-5 mr-2" />
              Desktop
            </Button>
          </div>
        </div>
        
        {deviceType === "mobile" ? (
          <div className="w-full max-w-3xl">
            <InstallQRCodes />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-4 text-center">Installa su Desktop</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-gray-100 rounded-lg p-6 flex-1">
                <h3 className="font-semibold mb-3">Chrome / Edge</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Cerca l'icona di installazione <Download className="h-4 w-4 inline mx-1" /> nella barra degli indirizzi</li>
                  <li>Clicca su "Installa NutriEasy"</li>
                  <li>Conferma cliccando "Installa" nel dialogo</li>
                </ol>
              </div>
              <div className="bg-gray-100 rounded-lg p-6 flex-1">
                <h3 className="font-semibold mb-3">Firefox / Safari</h3>
                <p className="text-gray-700">
                  Firefox e Safari hanno un supporto limitato per l'installazione di app web. Per la migliore esperienza, ti consigliamo di utilizzare Chrome o Edge.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-md p-4 mt-6">
              <h3 className="font-semibold text-blue-700 mb-2">Vantaggi dell'installazione</h3>
              <ul className="list-disc list-inside text-blue-700">
                <li>Accesso rapido dalla barra delle applicazioni o dal desktop</li>
                <li>Funzionalità offline quando non hai connessione</li>
                <li>Migliori prestazioni e utilizzo a schermo intero</li>
                <li>Esperienza utente migliorata e più veloce</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}