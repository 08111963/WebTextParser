import { Download } from 'lucide-react';

const SimpleInstallInstructions = () => {
  return (
    <div className="mx-auto max-w-3xl p-6 bg-white rounded-lg shadow-lg border border-gray-200 my-8">
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Install NutriEasy App</h2>
      </div>
      
      <p className="mb-6">
        Install NutriEasy on your device for faster access and better offline experience.
      </p>
      
      <div className="bg-amber-50 p-5 rounded-lg mb-6">
        <h3 className="font-bold text-lg mb-2 text-amber-800">How to install:</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* iOS */}
          <div className="border bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-bold mb-2">iOS</h4>
            <ol className="list-decimal ml-5 space-y-1 text-sm">
              <li>Tap the <strong>Share</strong> icon in Safari</li>
              <li>Scroll and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> to confirm</li>
            </ol>
          </div>
          
          {/* Android */}
          <div className="border bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-bold mb-2">Android</h4>
            <ol className="list-decimal ml-5 space-y-1 text-sm">
              <li>Tap the <strong>three dots</strong> menu in Chrome</li>
              <li>Select <strong>Install app</strong></li>
              <li>Tap <strong>Install</strong> to confirm</li>
            </ol>
          </div>
          
          {/* Desktop */}
          <div className="border bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-bold mb-2">Desktop</h4>
            <ol className="list-decimal ml-5 space-y-1 text-sm">
              <li>Look for the <strong>install icon</strong> in the address bar</li>
              <li>Click <strong>Install</strong></li>
              <li>Click <strong>Install</strong> again to confirm</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">Benefits:</h3>
        <ul className="list-disc ml-5 text-sm text-blue-800 grid grid-cols-1 md:grid-cols-2 gap-2">
          <li>Faster access from your home screen</li>
          <li>Works offline or with poor connections</li>
          <li>Full-screen experience without browser controls</li>
          <li>Better performance and user experience</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleInstallInstructions;