import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case } from "@shared/schema";

export default function AppCases() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [caseType, setCaseType] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: authData, isLoading: authLoading, isError: authError } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-neutral-darkest">Loading...</p>
      </div>
    );
  }

  if (authError || !authData?.user) {
    setLocation("/login");
    return null;
  }

  const user = authData.user;
  const cases = casesData?.cases || [];
  const canCreateCase = cases.length < user.casesAllowed;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-bush text-white px-5 py-4 flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl">
          <span className="italic">civilla</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/80">{user.email}</span>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-sm text-white/80 underline"
            data-testid="button-logout"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-2xl text-neutral-darkest">Your Cases</h2>
          {canCreateCase && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-bush text-white font-bold text-sm px-4 py-2 rounded-md"
              data-testid="button-new-case"
            >
              New Case
            </button>
          )}
        </div>

        {!canCreateCase && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-md p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              You've reached your limit of {user.casesAllowed} case(s). Upgrade to create more.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreateCase} className="bg-white border border-neutral-darkest/10 rounded-md p-6 mb-6">
            <h3 className="font-heading font-bold text-lg text-neutral-darkest mb-4">Create New Case</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="title" className="text-sm font-medium text-neutral-darkest">
                  Case Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                  required
                  placeholder="e.g., My Custody Case"
                  data-testid="input-case-title"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="state" className="text-sm font-medium text-neutral-darkest">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                    placeholder="e.g., California"
                    data-testid="input-case-state"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="county" className="text-sm font-medium text-neutral-darkest">
                    County
                  </label>
                  <input
                    id="county"
                    type="text"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                    placeholder="e.g., Alameda"
                    data-testid="input-case-county"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="caseType" className="text-sm font-medium text-neutral-darkest">
                    Case Type
                  </label>
                  <input
                    id="caseType"
                    type="text"
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-darkest/20 rounded-md text-neutral-darkest"
                    placeholder="e.g., Custody"
                    data-testid="input-case-type"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createCaseMutation.isPending}
                  className="bg-bush text-white font-bold text-sm px-4 py-2 rounded-md disabled:opacity-50"
                  data-testid="button-create-case"
                >
                  {createCaseMutation.isPending ? "Creating..." : "Create Case"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-neutral-darkest font-medium text-sm px-4 py-2 border border-neutral-darkest/20 rounded-md"
                  data-testid="button-cancel-case"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {casesLoading ? (
          <p className="text-neutral-darkest/60">Loading cases...</p>
        ) : cases.length === 0 ? (
          <div className="bg-white border border-neutral-darkest/10 rounded-md p-8 text-center">
            <p className="text-neutral-darkest/60">No cases yet. Create your first case to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cases.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-neutral-darkest/10 rounded-md p-4"
                data-testid={`case-card-${c.id}`}
              >
                <h3 className="font-heading font-bold text-lg text-neutral-darkest">{c.title}</h3>
                <div className="flex gap-4 mt-2 text-sm text-neutral-darkest/60">
                  {c.state && <span>State: {c.state}</span>}
                  {c.county && <span>County: {c.county}</span>}
                  {c.caseType && <span>Type: {c.caseType}</span>}
                </div>
                <p className="text-xs text-neutral-darkest/40 mt-2">
                  Created: {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
