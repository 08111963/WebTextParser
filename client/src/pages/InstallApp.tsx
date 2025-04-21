import { useState } from "react";
import { Download, Smartphone, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import InstallQRCodes from "@/components/InstallQRCodes";

export default function InstallApp() {
  const [deviceType, setDeviceType] = useState<"mobile" | "desktop">("mobile");
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary mb-4">Install NutriEasy</h1>
        <p className="text-xl text-gray-600 max-w-xl mx-auto">
          Quickly access NutriEasy from your device and enjoy a complete experience even offline.
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
              Mobile Devices
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
            <h2 className="text-2xl font-bold mb-4 text-center">Install on Desktop</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-gray-100 rounded-lg p-6 flex-1">
                <h3 className="font-semibold mb-3">Chrome / Edge</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Look for the installation icon <Download className="h-4 w-4 inline mx-1" /> in the address bar</li>
                  <li>Click on "Install NutriEasy"</li>
                  <li>Confirm by clicking "Install" in the dialog</li>
                </ol>
              </div>
              <div className="bg-gray-100 rounded-lg p-6 flex-1">
                <h3 className="font-semibold mb-3">Firefox / Safari</h3>
                <p className="text-gray-700">
                  Firefox and Safari have limited support for web app installation. For the best experience, we recommend using Chrome or Edge.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-md p-4 mt-6">
              <h3 className="font-semibold text-blue-700 mb-2">Benefits of Installation</h3>
              <ul className="list-disc list-inside text-blue-700">
                <li>Quick access from the application bar or desktop</li>
                <li>Offline functionality when you don't have a connection</li>
                <li>Better performance and full-screen usage</li>
                <li>Improved and faster user experience</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}