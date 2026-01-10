import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useModuleView(moduleKey: string, caseId?: string | null) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current || !moduleKey) return;
    sentRef.current = true;

    apiRequest("POST", "/api/activity/module-view", { moduleKey, caseId: caseId || null }).catch((err) => {
      console.error("[useModuleView] Failed to log module view:", err);
    });
  }, [moduleKey, caseId]);
}
