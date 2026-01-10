import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BarChart3, Users, FolderOpen, AlertTriangle } from "lucide-react";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

interface AdminMetrics {
  ok: boolean;
  range: { from: string; to: string };
  users: { total: number };
  cases: { total: number; byState: { state: string; count: number }[] };
  usage: { byEvent: { event: string; count: number }[] };
  ai: { failuresByDay: { day: string; count: number }[] };
}

export default function AppAdminDashboard() {
  const [from, setFrom] = useState(toISODate(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(toISODate(new Date()));

  const { data, isLoading, error } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/admin/metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access denied. Admin privileges required.");
        throw new Error("Failed to load metrics");
      }
      return res.json();
    },
  });

  const topStates = useMemo(() => (data?.cases?.byState ?? []).slice(0, 10), [data]);

  return (
    <AppLayout>
      <section className="w-full px-4 sm:px-6 md:px-10 py-6">
        <div className="max-w-container mx-auto space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading font-bold text-xl md:text-2xl text-neutral-darkest flex items-center gap-2" data-testid="heading-admin-dashboard">
              <BarChart3 className="w-5 h-5" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-neutral-darkest/70">
              Metrics-only view. No user content is shown.
            </p>
          </div>

          <Card className="border border-[hsl(var(--module-tile-border))] bg-[hsl(var(--module-tile))]">
            <CardHeader>
              <CardTitle className="text-base">Date range</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label>From</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="input-date-from" />
              </div>
              <div className="flex-1">
                <Label>To</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="input-date-to" />
              </div>
            </CardContent>
          </Card>

          {isLoading && (
            <Card>
              <CardContent className="py-10 text-sm text-neutral-darkest/70">Loading...</CardContent>
            </Card>
          )}

          {error && (
            <Card className="border border-red-300">
              <CardContent className="py-6 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error instanceof Error ? error.message : "Failed to load metrics."}
              </CardContent>
            </Card>
          )}

          {data?.ok && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-[hsl(var(--module-tile-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold" data-testid="text-total-users">{data.users.total}</CardContent>
                </Card>

                <Card className="border border-[hsl(var(--module-tile-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Cases
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold" data-testid="text-total-cases">{data.cases.total}</CardContent>
                </Card>

                <Card className="border border-[hsl(var(--module-tile-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Logged events (top)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-neutral-darkest/80">
                    {(data.usage.byEvent ?? []).slice(0, 3).map((x) => (
                      <div key={x.event} className="flex justify-between gap-2">
                        <span className="truncate">{x.event}</span>
                        <span className="font-semibold">{x.count}</span>
                      </div>
                    ))}
                    {(!data.usage.byEvent || data.usage.byEvent.length === 0) && (
                      <div className="text-neutral-darkest/60">No activity logs in this range.</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border border-[hsl(var(--module-tile-border))]">
                  <CardHeader>
                    <CardTitle className="text-base">State distribution (top 10)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topStates.map((s) => (
                      <div key={s.state} className="flex items-center gap-3" data-testid={`state-row-${s.state}`}>
                        <div className="w-32 text-sm truncate">{s.state}</div>
                        <div className="flex-1 h-2 rounded bg-neutral-200 overflow-hidden">
                          <div
                            className="h-2 rounded bg-primary"
                            style={{
                              width: `${Math.min(
                                100,
                                (s.count / Math.max(1, topStates[0]?.count ?? 1)) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="w-10 text-right text-sm font-semibold">{s.count}</div>
                      </div>
                    ))}
                    {topStates.length === 0 && (
                      <div className="text-neutral-darkest/60 text-sm">No cases yet.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-[hsl(var(--module-tile-border))]">
                  <CardHeader>
                    <CardTitle className="text-base">AI failures (by day)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-neutral-darkest/80 space-y-1">
                    {(data.ai.failuresByDay ?? []).slice(-10).map((d) => (
                      <div key={String(d.day)} className="flex justify-between gap-2">
                        <span>{String(d.day).slice(0, 10)}</span>
                        <span className="font-semibold">{d.count}</span>
                      </div>
                    ))}
                    {(!data.ai.failuresByDay || data.ai.failuresByDay.length === 0) && (
                      <div className="text-neutral-darkest/60">No failures in this range.</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border border-[hsl(var(--module-tile-border))]">
                <CardHeader>
                  <CardTitle className="text-base">Privacy rule (enforced)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-darkest/70 space-y-2">
                  <p>
                    This dashboard intentionally excludes user content. You will not see uploads, messages, drafts,
                    or evidence text here.
                  </p>
                  <p>
                    Support access (if added later) must be explicit-consent, time-limited, and fully logged.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
