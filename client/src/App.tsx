import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome";
import Info from "@/pages/Info";
import Pricing from "@/pages/Pricing";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import AuthPage from "@/pages/auth-page";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Guide from "@/pages/Guide";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PWAInstallGuide from "./components/PWAInstallGuide";
import { AuthProvider } from "@/hooks/use-auth";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { ProtectedRoute } from "./lib/protected-route";
import { ViewOnlyRoute } from "./lib/view-only-route";
import { ConditionalNavigationProvider } from "./lib/conditional-route";

function Router() {
  return (
    <Switch>
      {/* La pagina di benvenuto è visibile a tutti */}
      <Route path="/" component={Welcome} />
      <Route path="/info" component={Info} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/guide" component={Guide} />
      
      {/* Proteggiamo le pagine che richiedono autenticazione */}
      <Route path="/home">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/checkout">
        <ProtectedRoute component={Checkout} />
      </Route>
      <Route path="/payment-success">
        <ProtectedRoute component={PaymentSuccess} />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <ConditionalNavigationProvider>
              <div className="flex flex-col min-h-screen">
                <NavBar />
                <main className="flex-grow">
                  <Toaster />
                  <Router />
                </main>
                <div className="fixed bottom-4 right-4 z-[9999]">
                  <Button 
                    onClick={() => {
                      const dialog = document.getElementById('pwa-install-guide');
                      if (dialog) {
                        (dialog as any).showModal();
                      }
                    }}
                    variant="default"
                    size="lg"
                    className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    <span>Install App</span>
                  </Button>
                </div>
                <PWAInstallGuide />
                <Footer />
              </div>
            </ConditionalNavigationProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;