import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/home";
import Subscribe from "./pages/subscribe";
import Admin from "./pages/admin";
import Documents from "./pages/documents";
import DocumentViewer from "./pages/document-viewer";
import CheckoutSuccess from "./pages/checkout-success";
import CheckoutCancel from "./pages/checkout-cancel";
import Simulation from "./pages/simulation";
import Demo from "./pages/demo";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/documents" component={Documents} />
      <Route path="/document/:id" component={DocumentViewer} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/demo" component={Demo} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
