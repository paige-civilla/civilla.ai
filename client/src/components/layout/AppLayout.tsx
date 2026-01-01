import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppNavbar from "./AppNavbar";
import AppFooter from "./AppFooter";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import LexiPanel from "@/components/lexi/LexiPanel";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  useIdleLogout({ idleMs: 15 * 60 * 1000, logoutEndpoint: '/api/auth/logout', redirectTo: '/' });

  const { data: authData, isLoading: authLoading, isError: authError } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: onboardingData, isLoading: onboardingLoading } = useQuery<{ onboardingComplete: boolean }>({
    queryKey: ["/api/onboarding/status"],
    enabled: !!authData?.user,
  });

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

  // NOTE: .app-shell scopes the "inside the app" theme (logged-in pages only)
  return (
    <div className="app-shell flex flex-col min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" data-testid="app-layout">
      <AppNavbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <AppFooter />
      <LexiPanel />
    </div>
  );
}
