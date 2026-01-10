import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { PieChart, Download, FileText } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
  timeSeries: {
    newUsersByDay: { day: string; count: number }[];
    newCasesByDay: { day: string; count: number }[];
    activeUsersByDay: { day: string; count: number }[];
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
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <PieChart className="h-6 w-6 text-[#14b8a6]" />
                <div>
                  <h1 className="text-xl font-bold text-[#243032]">Grant Dashboard</h1>
                  <p className="text-sm text-[#243032]/70 mt-1">
                    Aggregated impact and usage metrics (privacy-safe).
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[hsl(var(--module-tile-border))] bg-white text-sm text-[#243032] hover:bg-[#243032]/5 transition-colors"
                  href="/api/grants/metrics.csv?days=90"
                  target="_blank"
                  rel="noreferrer"
                  data-testid="link-download-csv"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </a>
                <a
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[hsl(var(--module-tile-border))] bg-white text-sm text-[#243032] hover:bg-[#243032]/5 transition-colors"
                  href="/app/grants/print?days=90"
                  target="_blank"
                  rel="noreferrer"
                  data-testid="link-print-pdf"
                >
                  <FileText className="h-4 w-4" />
                  Impact Summary (PDF)
                </a>
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

              {(data.timeSeries?.activeUsersByDay?.length ?? 0) > 0 && (
                <div className="md:col-span-3 bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                  <h2 className="font-bold text-[#243032] mb-3">Daily Active Users (Last {data.windowDays} days)</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.timeSeries.activeUsersByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10, fill: "#243032" }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#243032" }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
                          labelStyle={{ color: "#243032" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#14b8a6" 
                          strokeWidth={2}
                          dot={false}
                          name="Active Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {(data.timeSeries?.newUsersByDay?.length ?? 0) > 0 && (
                <div className="md:col-span-2 bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                  <h2 className="font-bold text-[#243032] mb-3">New Users by Day</h2>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.timeSeries.newUsersByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10, fill: "#243032" }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#243032" }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
                          labelStyle={{ color: "#243032" }}
                        />
                        <Bar dataKey="count" fill="#22c55e" name="New Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {(data.timeSeries?.newCasesByDay?.length ?? 0) > 0 && (
                <div className="bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                  <h2 className="font-bold text-[#243032] mb-3">New Cases by Day</h2>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.timeSeries.newCasesByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10, fill: "#243032" }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#243032" }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
                          labelStyle={{ color: "#243032" }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" name="New Cases" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 bg-white rounded-lg border border-[hsl(var(--module-tile-border))] p-5">
                <h2 className="font-bold text-[#243032] mb-3">Cases by State</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
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
                <div className="space-y-2 max-h-64 overflow-y-auto">
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
