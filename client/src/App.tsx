import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import HowCivillaWorks from "@/pages/HowCivillaWorks";
import AboutCivilla from "@/pages/AboutCivilla";
import Plans from "@/pages/Plans";
import LegalCompliance from "@/pages/LegalCompliance";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import SafetySupport from "@/pages/SafetySupport";
import Accessibility from "@/pages/Accessibility";
import Contact from "@/pages/Contact";
import TermsOfService from "@/pages/TermsOfService";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/how-civilla-works" component={HowCivillaWorks} />
      <Route path="/about-civilla" component={AboutCivilla} />
      <Route path="/about" component={AboutCivilla} />
      <Route path="/plans" component={Plans} />
      <Route path="/legal-compliance" component={LegalCompliance} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/safety-support" component={SafetySupport} />
      <Route path="/accessibility" component={Accessibility} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
