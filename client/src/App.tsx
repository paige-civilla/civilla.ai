import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import HowCivillaWorks from "@/pages/HowCivillaWorks";
import MeetTheFounders from "@/pages/MeetTheFounders";
import OurMission from "@/pages/OurMission";
import Plans from "@/pages/Plans";
import LegalCompliance from "@/pages/LegalCompliance";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import SafetySupport from "@/pages/SafetySupport";
import Accessibility from "@/pages/Accessibility";
import Contact from "@/pages/Contact";
import TermsOfService from "@/pages/TermsOfService";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminLogin from "@/pages/AdminLogin";
import Careers from "@/pages/Careers";
import WallOfWins from "@/pages/WallOfWins";
import FAQPage from "@/pages/FAQ";
import AppCases from "@/pages/AppCases";
import AppDashboard from "@/pages/AppDashboard";
import AppCase from "@/pages/AppCase";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/how-civilla-works" component={HowCivillaWorks} />
      <Route path="/meet-the-founders" component={MeetTheFounders} />
      <Route path="/founders">{() => <Redirect to="/meet-the-founders" />}</Route>
      <Route path="/our-mission" component={OurMission} />
      <Route path="/mission">{() => <Redirect to="/our-mission" />}</Route>
      <Route path="/plans" component={Plans} />
      <Route path="/legal-compliance" component={LegalCompliance} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/safety-support" component={SafetySupport} />
      <Route path="/accessibility" component={Accessibility} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/careers" component={Careers} />
      <Route path="/wall-of-wins" component={WallOfWins} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/app" component={AppDashboard} />
      <Route path="/app/cases" component={AppCases} />
      <Route path="/app/dashboard">{() => <Redirect to="/app" />}</Route>
      <Route path="/app/case/:caseId" component={AppCase} />
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
