import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { PieChart } from "lucide-react";

interface GrantMetrics {
  ok: boolean;
  windowDays: number;
  totals: {
    users: number;
    cases: number;
    activeUsers: number;
  };
  distributions: {
    casesByState: { label: string; count: number }[];
    moduleUsage: { label: string; count: number }[];
    aiFailures: { label: string; count: number }[];
  };
  privacy: {
    notes: string[];
  };
}

export default function AppGrantDashboard() {
  const { data, isLoading, error } = useQuery<GrantMetrics>({
    queryKey: ["/api/grants/metrics", { days: 90 }],
    queryFn: async () => {
      const res = await fetch(`/api/grants/metrics?days=90`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  return (
    <AppLayout>
      <div className="w-full px-4 sm:px-6 md:px-10 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
            <div className="flex items-center gap-3">
              <PieChart className="h-6 w-6 text-[#14b8a6]" />
              <div>
                <h1 className="text-xl font-bold text-[#243032]">Grant Dashboard</h1>
                <p className="text-sm text-[#243032]/70 mt-1">
                  Aggregated impact and usage metrics (privacy-safe).
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-[#243032]/60">
              No user evidence, documents, or messages are accessible here.
            </div>
          </div>

          {isLoading && (
            <div className="bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5 text-[#243032]/70">
              Loading metrics…
            </div>
          )}

          {error && (
            <div className="bg-white rounded-lg border border-red-300 p-5 text-red-700">
              Could not load grant metrics.
            </div>
          )}

          {data?.ok && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[hsl(var(--module-tile))] rounded-lg border border-[hsl(var(--module-tile-border))] p-4">
                <div className="text-sm text-[#243032]/70">Total Users</div>
                <div className="text-3xl font-bold text-[#243032]">{data.totals.users}</div>
              </div>
              <div className="bg-[hsl(var(--module-tile))] rounded-lg border border-[hsl(var(--module-tile-border))] p-4">
                <div className="text-sm text-[#243032]/70">Total Cases</div>
                <div className="text-3xl font-bold text-[#243032]">{data.totals.cases}</div>
              </div>
              <div className="bg-[hsl(var(--module-tile))] rounded-lg border border-[hsl(var(--module-tile-border))] p-4">
                <div className="text-sm text-[#243032]/70">Active Users ({data.windowDays}d)</div>
                <div className="text-3xl font-bold text-[#243032]">{data.totals.activeUsers}</div>
              </div>

              <div className="md:col-span-2 bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                <h2 className="font-bold text-[#243032] mb-3">Cases by State</h2>
                <div className="space-y-2">
                  {(data.distributions.casesByState ?? []).map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-[#243032]/80">{r.label}</span>
                      <span className="font-semibold text-[#243032]">{r.count}</span>
                    </div>
                  ))}
                  {(data.distributions.casesByState?.length ?? 0) === 0 && (
                    <div className="text-sm text-[#243032]/60">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                <h2 className="font-bold text-[#243032] mb-3">Module Usage</h2>
                <div className="space-y-2">
                  {(data.distributions.moduleUsage ?? []).map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-[#243032]/80">{r.label}</span>
                      <span className="font-semibold text-[#243032]">{r.count}</span>
                    </div>
                  ))}
                  {(data.distributions.moduleUsage?.length ?? 0) === 0 && (
                    <div className="text-sm text-[#243032]/60">No data available</div>
                  )}
                </div>
              </div>

              {(data.distributions.aiFailures?.length ?? 0) > 0 && (
                <div className="md:col-span-3 bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                  <h2 className="font-bold text-[#243032] mb-3">AI Reliability</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data.distributions.aiFailures.map((r, idx) => (
                      <div key={idx} className="bg-[hsl(var(--module-tile))] rounded-lg p-3">
                        <div className="text-xs text-[#243032]/60">{r.label}</div>
                        <div className="text-xl font-bold text-[#243032]">{r.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-3 bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                <h2 className="font-bold text-[#243032] mb-2">Privacy Safeguards</h2>
                <ul className="list-disc pl-5 text-sm text-[#243032]/75 space-y-1">
                  {(data.privacy?.notes ?? []).map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
