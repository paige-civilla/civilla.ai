import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppNavbar from "./AppNavbar";
import Footer from "@/components/Footer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [, setLocation] = useLocation();

  const { data: authData, isLoading, isError } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
    queryKey: ["/api/auth/me"],
  });

  useEffect(() => {
    if (!isLoading && (isError || !authData?.user)) {
      setLocation("/login");
    }
  }, [isLoading, isError, authData, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-neutral-darkest flex items-center justify-center">
        <p className="font-sans text-neutral-darkest/60 dark:text-cream/60">Loading...</p>
      </div>
    );
  }

  if (isError || !authData?.user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream" data-testid="app-layout">
      <AppNavbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
