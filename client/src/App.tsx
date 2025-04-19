import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome";
import Info from "@/pages/Info";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { ViewOnlyRoute } from "./lib/view-only-route";
import { ConditionalNavigationProvider } from "./lib/conditional-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/info" component={Info} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/home">
        {() => <ViewOnlyRoute component={Home} />}
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
          <ConditionalNavigationProvider>
            <Toaster />
            <Router />
          </ConditionalNavigationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
