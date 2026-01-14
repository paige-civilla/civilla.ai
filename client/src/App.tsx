import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProcessingPackProvider } from "@/components/app/ProcessingPackModal";
import { TourProvider } from "@/components/tour/TourProvider";
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
import AppPatterns from "@/pages/AppPatterns";
import AppContacts from "@/pages/AppContacts";
import AppCommunications from "@/pages/AppCommunications";
import AppChildSupport from "@/pages/AppChildSupport";
import AppChildren from "@/pages/AppChildren";
import AppCaseSettings from "@/pages/AppCaseSettings";
import AppAccountSettings from "@/pages/AppAccountSettings";
import OnboardingLite from "@/pages/OnboardingLite";
import LexiIntake from "@/pages/LexiIntake";
import AppDocumentLibrary from "@/pages/AppDocumentLibrary";
import AppDisclosures from "@/pages/AppDisclosures";
import AppTrialPrep from "@/pages/AppTrialPrep";
import AppTrialPrepPrint from "@/pages/AppTrialPrepPrint";
import AppParentingPlan from "@/pages/AppParentingPlan";
import AppStartHere from "@/pages/AppStartHere";
import AppAdminDashboard from "@/pages/AppAdminDashboard";
import AppAdminPolicy from "@/pages/AppAdminPolicy";
import AppGrantDashboard from "@/pages/AppGrantDashboard";
import AppGrantDashboardPrint from "@/pages/AppGrantDashboardPrint";
import AppCourtForms from "@/pages/AppCourtForms";
import AttorneyAcceptInvite from "@/pages/AttorneyAcceptInvite";
import AttorneyPortal from "@/pages/AttorneyPortal";
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
      <Route path="/attorney/accept" component={AttorneyAcceptInvite} />
      <Route path="/app/attorney/case/:caseId" component={AttorneyPortal} />
      <Route path="/app/onboarding" component={OnboardingLite} />
      <Route path="/app/lexi-intake" component={LexiIntake} />
      <Route path="/app/start-here" component={AppStartHere} />
      <Route path="/app/admin" component={AppAdminDashboard} />
      <Route path="/app/admin/policy" component={AppAdminPolicy} />
      <Route path="/app/grants" component={AppGrantDashboard} />
      <Route path="/app/grants/print" component={AppGrantDashboardPrint} />
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
      <Route path="/app/patterns/:caseId" component={AppPatterns} />
      <Route path="/app/messages/:caseId">{({ caseId }) => <Redirect to={`/app/patterns/${caseId}`} />}</Route>
      <Route path="/app/contacts/:caseId" component={AppContacts} />
      <Route path="/app/communications/:caseId" component={AppCommunications} />
      <Route path="/app/child-support/:caseId" component={AppChildSupport} />
      <Route path="/app/children/:caseId" component={AppChildren} />
      <Route path="/app/library/:caseId" component={AppDocumentLibrary} />
      <Route path="/app/disclosures/:caseId" component={AppDisclosures} />
      <Route path="/app/trial-prep/:caseId" component={AppTrialPrep} />
      <Route path="/app/trial-prep/:caseId/print" component={AppTrialPrepPrint} />
      <Route path="/app/parenting-plan/:caseId" component={AppParentingPlan} />
      <Route path="/app/court-forms/:caseId" component={AppCourtForms} />
      <Route path="/app/dashboard">{() => <CaseRedirect targetPath="dashboard" />}</Route>
      <Route path="/app/case">{() => <CaseRedirect targetPath="case" />}</Route>
      <Route path="/app/documents">{() => <CaseRedirect targetPath="documents" />}</Route>
      <Route path="/app/timeline">{() => <CaseRedirect targetPath="timeline" />}</Route>
      <Route path="/app/evidence">{() => <CaseRedirect targetPath="evidence" />}</Route>
      <Route path="/app/exhibits">{() => <CaseRedirect targetPath="exhibits" />}</Route>
      <Route path="/app/tasks">{() => <CaseRedirect targetPath="tasks" />}</Route>
      <Route path="/app/deadlines">{() => <CaseRedirect targetPath="deadlines" />}</Route>
      <Route path="/app/patterns">{() => <CaseRedirect targetPath="patterns" />}</Route>
      <Route path="/app/messages">{() => <CaseRedirect targetPath="patterns" />}</Route>
      <Route path="/app/contacts">{() => <CaseRedirect targetPath="contacts" />}</Route>
      <Route path="/app/communications">{() => <CaseRedirect targetPath="communications" />}</Route>
      <Route path="/app/child-support">{() => <CaseRedirect targetPath="child-support" />}</Route>
      <Route path="/app/children">{() => <CaseRedirect targetPath="children" />}</Route>
      <Route path="/app/library">{() => <CaseRedirect targetPath="library" />}</Route>
      <Route path="/app/disclosures">{() => <CaseRedirect targetPath="disclosures" />}</Route>
      <Route path="/app/trial-prep">{() => <CaseRedirect targetPath="trial-prep" />}</Route>
      <Route path="/app/parenting-plan">{() => <CaseRedirect targetPath="parenting-plan" />}</Route>
      <Route path="/app/court-forms">{() => <CaseRedirect targetPath="court-forms" />}</Route>
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
          <TourProvider>
            <ProcessingPackProvider>
              <ScrollToTop />
              <Toaster />
              <Router />
            </ProcessingPackProvider>
          </TourProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
