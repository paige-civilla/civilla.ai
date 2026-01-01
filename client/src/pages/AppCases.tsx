import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Briefcase } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type { Case } from "@shared/schema";

export default function AppCases() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [caseType, setCaseType] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [autoOpenChecked, setAutoOpenChecked] = useState(false);

  const handleSelectCase = (caseId: string) => {
    localStorage.setItem("selectedCaseId", caseId);
    setLocation(`/app/dashboard/${caseId}`);
  };

  const { data: authData } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: casesData, isLoading: casesLoading } = useQuery<{ cases: Case[] }>({
    queryKey: ["/api/cases"],
    enabled: !!authData?.user,
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: { title: string; state?: string; county?: string; caseType?: string }) => {
      const res = await apiRequest("POST", "/api/cases", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setTitle("");
      setState("");
      setCounty("");
      setCaseType("");
      setShowForm(false);
      setError("");
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create case");
    },
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createCaseMutation.mutate({
      title,
      state: state || undefined,
      county: county || undefined,
      caseType: caseType || undefined,
    });
  };

  const user = authData?.user;
  const cases = casesData?.cases || [];
  const canCreateCase = user ? cases.length < user.casesAllowed : false;
  const noCases = cases.length === 0;

  useEffect(() => {
    if (!casesLoading && noCases && canCreateCase && !autoOpenChecked) {
      setShowForm(true);
      setAutoOpenChecked(true);
    }
  }, [casesLoading, noCases, canCreateCase, autoOpenChecked]);

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full mb-8">
            <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
              Your Cases
            </h1>
            {canCreateCase && !showForm && !noCases && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-bush text-white font-bold text-sm px-5 py-2.5 rounded-md button-inset-shadow"
                data-testid="button-new-case"
              >
                <Plus className="w-4 h-4" />
                New Case
              </button>
            )}
          </div>

          {!canCreateCase && !noCases && (
            <div className="w-full bg-muted-green/30 border border-bush/20 rounded-lg p-4 mb-6">
              <p className="font-sans text-sm text-neutral-darkest">
                You've reached your limit of {user?.casesAllowed} case(s).{" "}
                <Link href="/plans" className="text-bush font-medium underline" data-testid="link-upgrade">
                  Upgrade to create more
                </Link>
              </p>
            </div>
          )}

          {error && (
            <div className="w-full bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="font-sans text-sm text-destructive">{error}</p>
            </div>
          )}

          {showForm && (
            <div className="w-full bg-white border border-neutral-darkest/10 rounded-lg p-6 mb-6">
              <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-4">Create New Case</h2>
              <form onSubmit={handleCreateCase} className="flex flex-col gap-4">
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
                    placeholder="e.g., My Custody Case"
                    data-testid="input-case-title"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={createCaseMutation.isPending}
                    className="bg-bush text-white font-bold text-sm px-5 py-2.5 rounded-md button-inset-shadow disabled:opacity-50"
                    data-testid="button-create-case"
                  >
                    {createCaseMutation.isPending ? "Creating..." : "Create Case"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="font-sans text-sm font-medium text-neutral-darkest px-5 py-2.5 border border-neutral-darkest/20 rounded-md hover:bg-neutral-darkest/5"
                    data-testid="button-cancel-case"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {casesLoading ? (
            <div className="w-full flex items-center justify-center py-12">
              <p className="font-sans text-neutral-darkest/60">Loading cases...</p>
            </div>
          ) : noCases ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-bush/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-bush" />
              </div>
              <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">
                Create your first case
              </h2>
              <p className="font-sans text-sm text-neutral-darkest/70 mb-6 max-w-md mx-auto">
                Get started by creating a case. This will be your workspace for organizing documents, tracking deadlines, and preparing for your family law matter.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-bush text-white font-bold text-sm px-6 py-3 rounded-md button-inset-shadow"
                data-testid="button-create-first-case"
              >
                <Plus className="w-4 h-4" />
                Create Your Case
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className="block w-full bg-white border border-neutral-darkest/10 rounded-lg p-5 hover:border-neutral-darkest/20 transition-colors text-left"
                  data-testid={`case-card-${c.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-md bg-muted-green/30 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-bush" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-lg text-neutral-darkest">{c.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-neutral-darkest/60">
                        {c.state && <span>State: {c.state}</span>}
                        {c.county && <span>County: {c.county}</span>}
                        {c.caseType && <span>Type: {c.caseType}</span>}
                      </div>
                      <p className="font-sans text-xs text-neutral-darkest/40 mt-2">
                        Created: {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
