import React from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PWAInstallGuide = () => {
  const closeDialog = () => {
    const dialog = document.getElementById('pwa-install-guide');
    if (dialog) {
      (dialog as any).close();
    }
  };

  return (
    <dialog id="pwa-install-guide" className="p-0 rounded-lg shadow-xl bg-white max-w-xl mx-auto">
      <div className="flex flex-col">
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <Download className="h-6 w-6 mr-2" />
            Install NutriEasy App
          </h2>
          <Button variant="ghost" size="icon" className="text-white hover:bg-primary/90" onClick={closeDialog}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6">
          <p className="mb-6 text-base">
            Install NutriEasy on your device for faster access, offline capabilities, and a better experience. 
            Follow the instructions below for your device:
          </p>
          
          <Tabs defaultValue="mobile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="mobile" className="flex items-center justify-center">
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="desktop" className="flex items-center justify-center">
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="mobile" className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold mb-2">iOS Instructions:</h3>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Tap the <strong>Share</strong> icon in Safari&apos;s browser toolbar</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                  <li>Confirm by tapping <strong>Add</strong> in the top right</li>
                </ol>
                <div className="mt-3 bg-gray-200 p-3 rounded text-sm">
                  <strong>Note:</strong> PWA installation is only supported in Safari on iOS
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold mb-2">Android Instructions:</h3>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Tap the <strong>three-dot menu</strong> in Chrome&apos;s browser toolbar</li>
                  <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
                  <li>Follow the on-screen prompts to complete installation</li>
                </ol>
              </div>
            </TabsContent>
            
            <TabsContent value="desktop" className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold mb-2">Chrome Instructions:</h3>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Look for the <strong>install icon</strong> in the address bar, on the right side</li>
                  <li>Click on <strong>Install NutriEasy</strong></li>
                  <li>Click <strong>Install</strong> in the confirmation dialog</li>
                </ol>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold mb-2">Edge Instructions:</h3>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>Click the <strong>three-dot menu</strong> in the top right corner</li>
                  <li>Select <strong>Apps</strong> and then <strong>Install this site as an app</strong></li>
                  <li>Click <strong>Install</strong> to confirm</li>
                </ol>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-bold mb-2">Firefox/Safari:</h3>
                <p className="text-sm">
                  Firefox and Safari on desktop have limited PWA support. 
                  For the best installation experience, please use Chrome or Edge.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 bg-amber-50 p-4 rounded-lg text-amber-800">
            <h3 className="font-bold mb-2">Benefits of Installing the App:</h3>
            <ul className="list-disc ml-5 space-y-1">
              <li>Faster access - launch directly from your home screen</li>
              <li>Offline capabilities - use the app even without internet</li>
              <li>Better performance and full-screen experience</li>
              <li>Easily track your nutrition without opening a browser</li>
            </ul>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={closeDialog}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default PWAInstallGuide;