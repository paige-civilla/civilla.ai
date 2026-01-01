import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import AppDocuments from "@/pages/AppDocuments";
import AppTimeline from "@/pages/AppTimeline";
import AppEvidence from "@/pages/AppEvidence";
import AppExhibits from "@/pages/AppExhibits";
import AppTasks from "@/pages/AppTasks";
import AppDeadlines from "@/pages/AppDeadlines";
import AppMessages from "@/pages/AppMessages";
import AppContacts from "@/pages/AppContacts";
import AppCaseSettings from "@/pages/AppCaseSettings";
import AppAccountSettings from "@/pages/AppAccountSettings";
import AppOnboarding from "@/pages/AppOnboarding";
import CaseRedirect from "@/components/CaseRedirect";
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
      <Route path="/app/onboarding" component={AppOnboarding} />
      <Route path="/app/account" component={AppAccountSettings} />
      <Route path="/app/cases" component={AppCases} />
      <Route path="/app/dashboard/:caseId" component={AppDashboard} />
      <Route path="/app/case/:caseId" component={AppCase} />
      <Route path="/app/case-settings/:caseId" component={AppCaseSettings} />
      <Route path="/app/documents/:caseId" component={AppDocuments} />
      <Route path="/app/timeline/:caseId" component={AppTimeline} />
      <Route path="/app/evidence/:caseId" component={AppEvidence} />
      <Route path="/app/exhibits/:caseId" component={AppExhibits} />
      <Route path="/app/tasks/:caseId" component={AppTasks} />
      <Route path="/app/deadlines/:caseId" component={AppDeadlines} />
      <Route path="/app/messages/:caseId" component={AppMessages} />
      <Route path="/app/contacts/:caseId" component={AppContacts} />
      <Route path="/app/dashboard">{() => <CaseRedirect targetPath="dashboard" />}</Route>
      <Route path="/app/case">{() => <CaseRedirect targetPath="case" />}</Route>
      <Route path="/app/documents">{() => <CaseRedirect targetPath="documents" />}</Route>
      <Route path="/app/timeline">{() => <CaseRedirect targetPath="timeline" />}</Route>
      <Route path="/app/evidence">{() => <CaseRedirect targetPath="evidence" />}</Route>
      <Route path="/app/exhibits">{() => <CaseRedirect targetPath="exhibits" />}</Route>
      <Route path="/app/tasks">{() => <CaseRedirect targetPath="tasks" />}</Route>
      <Route path="/app/deadlines">{() => <CaseRedirect targetPath="deadlines" />}</Route>
      <Route path="/app/messages">{() => <CaseRedirect targetPath="messages" />}</Route>
      <Route path="/app/contacts">{() => <CaseRedirect targetPath="contacts" />}</Route>
      <Route path="/app">{() => <CaseRedirect targetPath="dashboard" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ScrollToTop />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
