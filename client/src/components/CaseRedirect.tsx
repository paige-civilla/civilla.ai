import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import type { Case } from "@shared/schema";

interface CaseRedirectProps {
  targetPath: "dashboard" | "case" | "documents" | "timeline" | "evidence" | "exhibits" | "tasks" | "deadlines" | "patterns" | "contacts" | "communications" | "child-support" | "children" | "library" | "disclosures" | "trial-prep" | "parenting-plan" | "court-forms";
}

function hasCaseIdInPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length >= 3 && parts[0] === "app" && !!parts[2] && parts[2].length > 8;
}

export default function CaseRedirect({ targetPath }: CaseRedirectProps) {
  const [location, setLocation] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  const { data: casesData, isLoading } = useQuery<{ cases: Case[] }>({
    queryKey: ["/api/cases"],
  });

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    const pathname = location.split("?")[0];
    
    if (hasCaseIdInPath(pathname)) {
      console.log("[CASE REDIRECT] Skipping - already has caseId in path:", pathname);
      setHasRedirected(true);
      return;
    }

    const cases = casesData?.cases || [];

    if (cases.length === 0) {
      console.log("[CASE REDIRECT] No cases, redirecting to /app/cases");
      setHasRedirected(true);
      setLocation("/app/cases");
      return;
    }

    const selectedCaseId = localStorage.getItem("selectedCaseId");
    let targetCaseId: string;

    if (selectedCaseId && cases.some((c) => c.id === selectedCaseId)) {
      targetCaseId = selectedCaseId;
    } else {
      targetCaseId = cases[0].id;
    }

    localStorage.setItem("selectedCaseId", targetCaseId);
    setHasRedirected(true);

    const to = `/app/${targetPath}/${targetCaseId}`;
    console.log("[CASE REDIRECT]", { from: location, to, targetCaseId });
    setLocation(to, { replace: true });
  }, [isLoading, casesData, hasRedirected, setLocation, targetPath, location]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center py-20">
        <p className="font-sans text-neutral-darkest/60">Loading...</p>
      </div>
    </AppLayout>
  );
}
