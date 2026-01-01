import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import type { Case } from "@shared/schema";

interface CaseRedirectProps {
  targetPath: "dashboard" | "case" | "documents" | "timeline" | "evidence" | "exhibits" | "tasks" | "deadlines" | "patterns" | "contacts" | "communications";
}

export default function CaseRedirect({ targetPath }: CaseRedirectProps) {
  const [, setLocation] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  const { data: casesData, isLoading } = useQuery<{ cases: Case[] }>({
    queryKey: ["/api/cases"],
  });

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    const cases = casesData?.cases || [];

    if (cases.length === 0) {
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

    setLocation(`/app/${targetPath}/${targetCaseId}`, { replace: true });
  }, [isLoading, casesData, hasRedirected, setLocation, targetPath]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center py-20">
        <p className="font-sans text-neutral-darkest/60">Loading...</p>
      </div>
    </AppLayout>
  );
}
