import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import Trades from "@/pages/Trades";
import Reviews from "@/pages/Reviews";
import EventsPage from "@/pages/Events";
import DataSources from "@/pages/DataSources";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/trades" component={Trades} />
        <Route path="/reviews" component={Reviews} />
        <Route path="/events" component={EventsPage} />
        <Route path="/data-sources" component={DataSources} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router hook={useHashLocation}>
          <AppRoutes />
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
