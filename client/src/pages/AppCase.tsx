import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Save } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type { Case } from "@shared/schema";

export default function AppCase() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  
  const [title, setTitle] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [caseType, setCaseType] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: caseData, isLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;

  useEffect(() => {
    if (!isLoading && !currentCase && caseId) {
      setLocation("/app/cases");
    }
  }, [isLoading, currentCase, caseId, setLocation]);

  useEffect(() => {
    if (currentCase) {
      setTitle(currentCase.title);
      setState(currentCase.state || "");
      setCounty(currentCase.county || "");
      setCaseType(currentCase.caseType || "");
      localStorage.setItem("selectedCaseId", currentCase.id);
    }
  }, [currentCase]);

  const updateCaseMutation = useMutation({
    mutationFn: async (data: { title: string; state?: string; county?: string; caseType?: string }) => {
      const res = await apiRequest("PATCH", `/api/cases/${caseId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId] });
      setSuccess("Case settings saved successfully");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update case");
      setSuccess("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    updateCaseMutation.mutate({
      title,
      state: state || undefined,
      county: county || undefined,
      caseType: caseType || undefined,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentCase) {
    return null;
  }

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <button
            onClick={() => setLocation("/app")}
            className="inline-flex items-center gap-2 text-sm text-bush font-medium mb-6"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest mb-8">
            Case Settings
          </h1>

          {error && (
            <div className="w-full bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="font-sans text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="w-full bg-bush/10 border border-bush/30 rounded-lg p-4 mb-6">
              <p className="font-sans text-sm text-bush">{success}</p>
            </div>
          )}

          <div className="w-full max-w-xl bg-white border border-neutral-darkest/10 rounded-lg p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="font-sans text-sm font-medium text-neutral-darkest">
                  Case Title <span className="text-destructive">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-darkest/20 rounded-md font-sans text-sm text-neutral-darkest placeholder:text-neutral-darkest/40 focus:outline-none focus:ring-2 focus:ring-bush/30 focus:border-bush"
                  required
                  data-testid="input-case-title"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="state" className="font-sans text-sm font-medium text-neutral-darkest">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-darkest/20 rounded-md font-sans text-sm text-neutral-darkest placeholder:text-neutral-darkest/40 focus:outline-none focus:ring-2 focus:ring-bush/30 focus:border-bush"
                  placeholder="e.g., California"
                  data-testid="input-case-state"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="county" className="font-sans text-sm font-medium text-neutral-darkest">
                  County
                </label>
                <input
                  id="county"
                  type="text"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-darkest/20 rounded-md font-sans text-sm text-neutral-darkest placeholder:text-neutral-darkest/40 focus:outline-none focus:ring-2 focus:ring-bush/30 focus:border-bush"
                  placeholder="e.g., Alameda"
                  data-testid="input-case-county"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="caseType" className="font-sans text-sm font-medium text-neutral-darkest">
                  Case Type
                </label>
                <input
                  id="caseType"
                  type="text"
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-darkest/20 rounded-md font-sans text-sm text-neutral-darkest placeholder:text-neutral-darkest/40 focus:outline-none focus:ring-2 focus:ring-bush/30 focus:border-bush"
                  placeholder="e.g., Custody"
                  data-testid="input-case-type"
                />
              </div>
              <button
                type="submit"
                disabled={updateCaseMutation.isPending}
                className="inline-flex items-center justify-center gap-2 bg-bush text-white font-bold text-sm px-5 py-2.5 rounded-md button-inset-shadow disabled:opacity-50 mt-2"
                data-testid="button-save-case"
              >
                <Save className="w-4 h-4" />
                {updateCaseMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
