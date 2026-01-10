import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppNavbar from "./AppNavbar";
import AppFooter from "./AppFooter";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import LexiPanel from "@/components/lexi/LexiPanel";
import { useTheme } from "@/contexts/ThemeContext";
import WorkflowPhaseBanner, { getPhaseFromRoute, type WorkflowPhase } from "@/components/app/WorkflowPhaseBanner";
import JumpAheadWarning from "@/components/app/JumpAheadWarning";
import LegalAcknowledgementModal from "@/components/app/LegalAcknowledgementModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface ProfileData {
  profile: {
    draftingDisclaimerAcceptedAt: string | null;
  };
}

interface PhaseStatusData {
  phaseNumber: number;
  checks: {
    evidenceCount: number;
    extractionCompleteCount: number;
    acceptedClaimsCount: number;
    acceptedClaimsMissingCitationsCount: number;
  };
}

const CASE_PAGE_PATTERN = /^\/app\/(?:dashboard|case|documents|timeline|evidence|exhibits|tasks|deadlines|patterns|contacts|communications|child-support|children|library|disclosures|trial-prep|parenting-plan|court-forms)\/([a-zA-Z0-9-]+)/;

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme } = useTheme();
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [hasShownModalThisSession, setHasShownModalThisSession] = useState(false);
  useIdleLogout({ idleMs: 15 * 60 * 1000, logoutEndpoint: '/api/auth/logout', redirectTo: '/' });

  const caseIdMatch = location.match(CASE_PAGE_PATTERN);
  const caseId = caseIdMatch ? caseIdMatch[1] : null;
  const isOnCasePage = !!caseId;

  const currentPhase = useMemo(() => getPhaseFromRoute(location), [location]);

  const { data: authData, isLoading: authLoading, isError: authError } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: onboardingData, isLoading: onboardingLoading } = useQuery<{ onboardingComplete: boolean }>({
    queryKey: ["/api/onboarding/status"],
    enabled: !!authData?.user,
  });

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: !!authData?.user,
  });

  const { data: phaseStatus } = useQuery<PhaseStatusData>({
    queryKey: ["/api/cases", caseId, "phase-status"],
    enabled: !!caseId,
  });

  const hasAcceptedDisclaimer = !!profileData?.profile?.draftingDisclaimerAcceptedAt;
  const isPhase3 = currentPhase === 3;
  const needsDisclaimer = isPhase3 && !hasAcceptedDisclaimer && isOnCasePage;

  const showJumpAheadWarning = useMemo(() => {
    if (!isPhase3 || !phaseStatus) return false;
    const { checks } = phaseStatus;
    const hasInsufficientPrep = 
      checks.evidenceCount === 0 || 
      checks.extractionCompleteCount === 0 || 
      checks.acceptedClaimsCount === 0 ||
      checks.acceptedClaimsMissingCitationsCount > 0;
    return hasInsufficientPrep;
  }, [isPhase3, phaseStatus]);

  useEffect(() => {
    if (needsDisclaimer && !hasShownModalThisSession) {
      setShowLegalModal(true);
    }
  }, [needsDisclaimer, hasShownModalThisSession]);

  useEffect(() => {
    if (!authLoading && (authError || !authData?.user)) {
      setLocation("/login");
    }
  }, [authLoading, authError, authData, setLocation]);

  useEffect(() => {
    if (!authLoading && !onboardingLoading && authData?.user && onboardingData) {
      if (!onboardingData.onboardingComplete && !location.startsWith("/app/onboarding")) {
        setLocation("/app/onboarding");
      }
    }
  }, [authLoading, onboardingLoading, authData, onboardingData, location, setLocation]);

  const handleAcceptDisclaimer = () => {
    setShowLegalModal(false);
    setHasShownModalThisSession(true);
  };

  const handleCancelDisclaimer = () => {
    setShowLegalModal(false);
    setHasShownModalThisSession(true);
  };

  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-sans text-neutral-darkest/60">Loading...</p>
      </div>
    );
  }

  if (authError || !authData?.user) {
    return null;
  }

  return (
    <div 
      className={`app-shell flex flex-col min-h-[100dvh] ${theme === "dark" ? "dark" : ""}`} 
      data-testid="app-layout"
    >
      <AppNavbar className="flex-shrink-0" />
      {isOnCasePage && (
        <WorkflowPhaseBanner currentPhase={currentPhase} />
      )}
      {isOnCasePage && showJumpAheadWarning && hasAcceptedDisclaimer && (
        <JumpAheadWarning />
      )}
      <main className="flex-1 min-h-0 overflow-y-auto w-full">
        {children}
      </main>
      <AppFooter className="flex-shrink-0" />
      <LexiPanel />

      <LegalAcknowledgementModal
        open={showLegalModal}
        onAccept={handleAcceptDisclaimer}
        onCancel={handleCancelDisclaimer}
      />
    </div>
  );
}
