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
              <CardTitle className="text-green-600">Install on iOS</CardTitle>
              <CardDescription>
                Scan this QR code with the camera of your iOS device, then follow the instructions to install the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img 
                src="/qrcodes/ios_install_qrcode.png"
                alt="QR Code for iOS installation" 
                className="w-64 h-64 mb-4 border border-green-600 p-2 rounded-md"
              />
              <p className="text-xs text-green-700 mb-2">URL del QR code: 
                <a href="https://e5161ddc-3fdb-46b4-9043-35a26088e9e2-00-ol0p5x6c7mqn.spock.replit.dev" 
                   target="_blank" 
                   className="underline ml-1">
                  Apri direttamente
                </a>
              </p>
              <div className="text-sm text-center mt-4 max-w-md">
                <p className="font-semibold mb-2 text-green-600">To install the app on iOS:</p>
                <ol className="list-decimal list-inside text-left">
                  <li>Scan the QR code with your camera</li>
                  <li>Open the site in Safari browser</li>
                  <li>Tap the "Share" icon in the toolbar</li>
                  <li>Select "Add to Home Screen"</li>
                  <li>Confirm by tapping "Add"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="android">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Install on Android</CardTitle>
              <CardDescription>
                Scan this QR code with the camera of your Android device, then follow the instructions to install the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img 
                src="/qrcodes/android_install_qrcode.png"
                alt="QR Code for Android installation" 
                className="w-64 h-64 mb-4 border border-green-600 p-2 rounded-md"
              />
              <p className="text-xs text-green-700 mb-2">URL del QR code: 
                <a href="https://e5161ddc-3fdb-46b4-9043-35a26088e9e2-00-ol0p5x6c7mqn.spock.replit.dev" 
                   target="_blank" 
                   className="underline ml-1">
                  Apri direttamente
                </a>
              </p>
              <div className="text-sm text-center mt-4 max-w-md">
                <p className="font-semibold mb-2 text-green-600">To install the app on Android:</p>
                <ol className="list-decimal list-inside text-left">
                  <li>Scan the QR code with your camera</li>
                  <li>Open the site in Chrome</li>
                  <li>Tap the menu with three dots in the top right</li>
                  <li>Select "Install app" or "Add to Home screen"</li>
                  <li>Confirm by tapping "Install"</li>
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