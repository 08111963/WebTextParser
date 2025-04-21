import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Smartphone } from "lucide-react";

const InstallQRCodes = () => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Tabs defaultValue="ios" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="ios" className="flex items-center justify-center">
            <Apple className="h-4 w-4 mr-2" />
            iOS
          </TabsTrigger>
          <TabsTrigger value="android" className="flex items-center justify-center">
            <Smartphone className="h-4 w-4 mr-2" />
            Android
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ios">
          <Card>
            <CardHeader>
              <CardTitle>Installa su iOS</CardTitle>
              <CardDescription>
                Scansiona questo QR code con la fotocamera del tuo dispositivo iOS, poi segui le istruzioni per installare l'app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img 
                src="/qrcodes/ios_install_qrcode.png" 
                alt="QR Code per installazione su iOS" 
                className="w-64 h-64 mb-4"
              />
              <div className="text-sm text-center mt-4 max-w-md">
                <p className="font-semibold mb-2">Per installare l'app su iOS:</p>
                <ol className="list-decimal list-inside text-left">
                  <li>Scansiona il QR code con la fotocamera</li>
                  <li>Apri il sito nel browser Safari</li>
                  <li>Tocca l'icona "Condividi" nella barra degli strumenti</li>
                  <li>Seleziona "Aggiungi a Home"</li>
                  <li>Conferma toccando "Aggiungi"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="android">
          <Card>
            <CardHeader>
              <CardTitle>Installa su Android</CardTitle>
              <CardDescription>
                Scansiona questo QR code con la fotocamera del tuo dispositivo Android, poi segui le istruzioni per installare l'app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img 
                src="/qrcodes/android_install_qrcode.png" 
                alt="QR Code per installazione su Android" 
                className="w-64 h-64 mb-4"
              />
              <div className="text-sm text-center mt-4 max-w-md">
                <p className="font-semibold mb-2">Per installare l'app su Android:</p>
                <ol className="list-decimal list-inside text-left">
                  <li>Scansiona il QR code con la fotocamera</li>
                  <li>Apri il sito in Chrome</li>
                  <li>Tocca il menu con i tre puntini in alto a destra</li>
                  <li>Seleziona "Installa app" o "Aggiungi a schermata Home"</li>
                  <li>Conferma toccando "Installa"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstallQRCodes;