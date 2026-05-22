import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import FormulirPage from "@/pages/formulir";
import ArsipPage from "@/pages/arsip";
import PreviewPage from "@/pages/preview";
import LoginPage from "@/pages/login";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/store";

import { initTheme } from "@/components/layout/ThemeToggle";

// Apply theme immediately on app load (before first render)
initTheme();

const queryClient = new QueryClient();

function Router() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route component={() => <Redirect to="/login" />} />
          </Switch>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col print:min-h-0 print:block">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 print:p-0 print:m-0 print:max-w-none">
        <Switch>
          <Route path="/" component={() => <Redirect to="/formulir" />} />
          <Route path="/formulir" component={FormulirPage} />
          <Route path="/arsip" component={ArsipPage} />
          <Route path="/preview/:id" component={PreviewPage} />
          <Route path="/login" component={() => <Redirect to="/" />} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
