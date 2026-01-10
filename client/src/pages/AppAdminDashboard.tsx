import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Users, FolderOpen, Activity, Shield, ScrollText, Copy,
  CheckCircle, XCircle, Clock, AlertTriangle, Download, FileText
} from "lucide-react";
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

interface AdminMetrics {
  ok: boolean;
  windowDays: number;
  totals: {
    users: number;
    cases: number;
    active7d: number;
    active30d: number;
  };
  distributions: {
    casesByState: { label: string; count: number }[];
    moduleUsage: { label: string; count: number }[];
  };
  funnel: { label: string; count: number }[];
  aiReliability: { label: string; count: number }[];
  exports: { label: string; count: number }[];
  performance: { eventType: string; p50: number; p95: number; sampleCount: number }[];
  timeSeries: {
    newUsersByDay: { day: string; count: number }[];
    newCasesByDay: { day: string; count: number }[];
    activeUsersByDay: { day: string; count: number }[];
  };
  privacy: { notes: string[] };
}

interface SystemHealth {
  ok: boolean;
  db: { connected: boolean; error: string | null; lastCheckedAt: string };
  ai: { openaiKeyPresent: boolean; status: string };
  vision: { keyPresent: boolean; status: string };
  jobs: {
    evidenceExtractions: { queued: number; processing: number; failed: number; complete: number };
    aiAnalyses: { pending: number; processing: number; failed: number; complete: number };
    claims: { suggested: number; accepted: number; pendingReview: number; missingCitations: number };
  };
}

interface UserResult {
  userId: string;
  createdAt: string;
  lastActiveAt: string | null;
  isAdmin: boolean;
  isGrantViewer: boolean;
  maskedEmail: string | null;
}

interface AuditLog {
  id: string;
  actorUserId: string;
  targetUserId: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export default function AppAdminDashboard() {
  const [days, setDays] = useState(90);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics", { days }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/metrics?days=${days}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access denied. Admin privileges required.");
        throw new Error("Failed to load metrics");
      }
      return res.json();
    },
  });

  const { data: health, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/admin/system-health"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system-health", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<{ ok: boolean; users: UserResult[] }>({
    queryKey: ["/api/admin/users", { q: searchQuery }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(searchQuery)}&limit=20`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to search");
      return res.json();
    },
    enabled: searchQuery.length > 0,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<{ ok: boolean; logs: AuditLog[] }>({
    queryKey: ["/api/admin/audit", { action: actionFilter }],
    queryFn: async () => {
      const url = actionFilter
        ? `/api/admin/audit?action=${encodeURIComponent(actionFilter)}&limit=100`
        : "/api/admin/audit?limit=100";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async (params: { userId: string; isAdmin: boolean; isGrantViewer: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${params.userId}/roles`, {
        isAdmin: params.isAdmin,
        isGrantViewer: params.isGrantViewer,
      });
    },
    onSuccess: () => {
      toast({ title: "Roles updated" });
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit"] });
    },
    onError: () => {
      toast({ title: "Failed to update roles", variant: "destructive" });
    },
  });

  const copyDiagnostics = () => {
    if (!health) return;
    const sanitized = JSON.stringify(health, null, 2);
    navigator.clipboard.writeText(sanitized);
    toast({ title: "Diagnostics copied" });
  };

  return (
    <AppLayout>
      <section className="w-full px-4 sm:px-6 md:px-10 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-[#243032] flex items-center gap-2" data-testid="heading-admin-dashboard">
                <BarChart3 className="w-5 h-5" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-[#243032]/70 mt-1">
                Aggregated metrics only. No user content accessible.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/app/admin/policy"
                className="text-sm text-[#243032]/70 hover:underline"
                data-testid="link-policy"
              >
                Policy
              </a>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="health" data-testid="tab-health">Health</TabsTrigger>
              <TabsTrigger value="access" data-testid="tab-access">Access</TabsTrigger>
              <TabsTrigger value="audit" data-testid="tab-audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <select
                  className="border border-[hsl(var(--module-tile-border))] rounded px-2 py-2 text-sm bg-white text-[#243032]"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  data-testid="select-days"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={180}>Last 180 days</option>
                </select>
              </div>

              {metricsLoading && (
                <Card><CardContent className="py-10 text-sm text-[#243032]/70">Loading...</CardContent></Card>
              )}

              {metricsError && (
                <Card className="border border-red-300">
                  <CardContent className="py-6 text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {metricsError instanceof Error ? metricsError.message : "Failed to load metrics."}
                  </CardContent>
                </Card>
              )}

              {metrics?.ok && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" />Total Users</CardTitle>
                      </CardHeader>
                      <CardContent className="text-2xl font-bold" data-testid="text-total-users">{metrics.totals.users}</CardContent>
                    </Card>
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><FolderOpen className="w-4 h-4" />Total Cases</CardTitle>
                      </CardHeader>
                      <CardContent className="text-2xl font-bold" data-testid="text-total-cases">{metrics.totals.cases}</CardContent>
                    </Card>
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" />Active (7d)</CardTitle>
                      </CardHeader>
                      <CardContent className="text-2xl font-bold">{metrics.totals.active7d}</CardContent>
                    </Card>
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" />Active (30d)</CardTitle>
                      </CardHeader>
                      <CardContent className="text-2xl font-bold">{metrics.totals.active30d}</CardContent>
                    </Card>
                  </div>

                  {(metrics.timeSeries?.activeUsersByDay?.length ?? 0) > 0 && (
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader><CardTitle className="text-base">Daily Active Users</CardTitle></CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics.timeSeries.activeUsersByDay}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#243032" }} tickFormatter={(v) => v.slice(5)} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#243032" }} />
                              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                              <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={false} name="Active Users" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader><CardTitle className="text-base">Cases by State</CardTitle></CardHeader>
                      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {(metrics.distributions.casesByState ?? []).map((s, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-[#243032]/80">{s.label}</span>
                            <span className="font-semibold text-[#243032]">{s.count}</span>
                          </div>
                        ))}
                        {(metrics.distributions.casesByState?.length ?? 0) === 0 && (
                          <div className="text-[#243032]/60 text-sm">No data</div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader><CardTitle className="text-base">Module Usage</CardTitle></CardHeader>
                      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {(metrics.distributions.moduleUsage ?? []).map((m, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-[#243032]/80">{m.label}</span>
                            <span className="font-semibold text-[#243032]">{m.count}</span>
                          </div>
                        ))}
                        {(metrics.distributions.moduleUsage?.length ?? 0) === 0 && (
                          <div className="text-[#243032]/60 text-sm">No data</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {(metrics.funnel?.length ?? 0) > 0 && (
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.funnel} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis type="number" tick={{ fontSize: 11, fill: "#243032" }} />
                              <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: "#243032" }} width={120} />
                              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                              <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(metrics.aiReliability?.length ?? 0) > 0 && (
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader><CardTitle className="text-base">AI Reliability (Failures)</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {metrics.aiReliability.map((f, idx) => (
                          <div key={idx} className="bg-[hsl(var(--module-tile))] rounded-lg p-3">
                            <div className="text-xs text-[#243032]/60 truncate">{f.label}</div>
                            <div className="text-xl font-bold text-[#243032]">{f.count}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border border-[hsl(var(--module-tile-border))]">
                    <CardHeader><CardTitle className="text-base">Privacy Safeguards</CardTitle></CardHeader>
                    <CardContent className="text-sm text-[#243032]/70 space-y-1">
                      <ul className="list-disc pl-5">
                        {(metrics.privacy?.notes ?? []).map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="health" className="space-y-4 mt-4">
              {healthLoading && <Card><CardContent className="py-10 text-sm">Loading...</CardContent></Card>}

              {health && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">Database</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2">
                        {health.db.connected ? (
                          <><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-green-700">Connected</span></>
                        ) : (
                          <><XCircle className="w-5 h-5 text-red-600" /><span className="text-red-700">{health.db.error || "Disconnected"}</span></>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">OpenAI</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2">
                        {health.ai.openaiKeyPresent ? (
                          <><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-green-700">Configured</span></>
                        ) : (
                          <><XCircle className="w-5 h-5 text-red-600" /><span className="text-red-700">Missing Key</span></>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-[hsl(var(--module-tile-border))]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">Vision OCR</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2">
                        {health.vision.keyPresent ? (
                          <><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-green-700">Configured</span></>
                        ) : (
                          <><XCircle className="w-5 h-5 text-amber-600" /><span className="text-amber-700">Not Configured</span></>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border border-[hsl(var(--module-tile-border))]">
                    <CardHeader><CardTitle className="text-base">Job Queues (7 days)</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="font-medium mb-2">Evidence Extractions</div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span>Queued</span><span>{health.jobs.evidenceExtractions.queued}</span></div>
                          <div className="flex justify-between"><span>Processing</span><span>{health.jobs.evidenceExtractions.processing}</span></div>
                          <div className="flex justify-between"><span>Failed</span><span className="text-red-600">{health.jobs.evidenceExtractions.failed}</span></div>
                          <div className="flex justify-between"><span>Complete</span><span className="text-green-600">{health.jobs.evidenceExtractions.complete}</span></div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">AI Analyses</div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span>Pending</span><span>{health.jobs.aiAnalyses.pending}</span></div>
                          <div className="flex justify-between"><span>Processing</span><span>{health.jobs.aiAnalyses.processing}</span></div>
                          <div className="flex justify-between"><span>Failed</span><span className="text-red-600">{health.jobs.aiAnalyses.failed}</span></div>
                          <div className="flex justify-between"><span>Complete</span><span className="text-green-600">{health.jobs.aiAnalyses.complete}</span></div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">Claims (30d)</div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span>Suggested</span><span>{health.jobs.claims.suggested}</span></div>
                          <div className="flex justify-between"><span>Accepted</span><span className="text-green-600">{health.jobs.claims.accepted}</span></div>
                          <div className="flex justify-between"><span>Pending Review</span><span>{health.jobs.claims.pendingReview}</span></div>
                          <div className="flex justify-between"><span>Missing Citations</span><span className="text-amber-600">{health.jobs.claims.missingCitations}</span></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button variant="outline" onClick={copyDiagnostics} data-testid="button-copy-diagnostics">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Diagnostics
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-4">
              <Card className="border border-[hsl(var(--module-tile-border))]">
                <CardHeader><CardTitle className="text-base">Search Users</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by user ID or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-user-search"
                    />
                    <Button onClick={() => refetchUsers()} disabled={!searchQuery} data-testid="button-search-users">
                      Search
                    </Button>
                  </div>

                  {usersLoading && <div className="text-sm text-[#243032]/70">Searching...</div>}

                  {usersData?.users && usersData.users.length > 0 && (
                    <div className="space-y-2">
                      {usersData.users.map((user) => (
                        <div key={user.userId} className="flex items-center justify-between p-3 bg-[hsl(var(--module-tile))] rounded-lg border border-[hsl(var(--module-tile-border))]">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs text-[#243032]/60 truncate">{user.userId}</div>
                            {user.maskedEmail && <div className="text-sm text-[#243032]">{user.maskedEmail}</div>}
                            <div className="text-xs text-[#243032]/50">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                              {user.lastActiveAt && ` | Last active: ${new Date(user.lastActiveAt).toLocaleDateString()}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Admin</span>
                              <Switch
                                checked={user.isAdmin}
                                onCheckedChange={(checked) => {
                                  updateRolesMutation.mutate({
                                    userId: user.userId,
                                    isAdmin: checked,
                                    isGrantViewer: user.isGrantViewer,
                                  });
                                }}
                                data-testid={`switch-admin-${user.userId}`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Grant</span>
                              <Switch
                                checked={user.isGrantViewer}
                                onCheckedChange={(checked) => {
                                  updateRolesMutation.mutate({
                                    userId: user.userId,
                                    isAdmin: user.isAdmin,
                                    isGrantViewer: checked,
                                  });
                                }}
                                data-testid={`switch-grant-${user.userId}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {usersData?.users && usersData.users.length === 0 && (
                    <div className="text-sm text-[#243032]/60">No users found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4 mt-4">
              <Card className="border border-[hsl(var(--module-tile-border))]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ScrollText className="w-4 h-4" />
                    Audit Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      className="border border-[hsl(var(--module-tile-border))] rounded px-2 py-2 text-sm bg-white"
                      value={actionFilter}
                      onChange={(e) => setActionFilter(e.target.value)}
                      data-testid="select-action-filter"
                    >
                      <option value="">All actions</option>
                      <option value="SET_ROLE">SET_ROLE</option>
                      <option value="VIEW_METRICS">VIEW_METRICS</option>
                    </select>
                  </div>

                  {auditLoading && <div className="text-sm text-[#243032]/70">Loading...</div>}

                  {auditData?.logs && auditData.logs.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {auditData.logs.map((log) => (
                        <div key={log.id} className="p-3 bg-[hsl(var(--module-tile))] rounded-lg border border-[hsl(var(--module-tile-border))] text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-xs text-[#243032]/50">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-[#243032]/60">
                            Actor: <span className="font-mono">{log.actorUserId.slice(0, 8)}...</span>
                            {log.targetUserId && (
                              <> | Target: <span className="font-mono">{log.targetUserId.slice(0, 8)}...</span></>
                            )}
                          </div>
                          {log.details && (
                            <div className="mt-1 text-xs text-[#243032]/70 font-mono">
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {auditData?.logs && auditData.logs.length === 0 && (
                    <div className="text-sm text-[#243032]/60">No audit logs found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </AppLayout>
  );
}
