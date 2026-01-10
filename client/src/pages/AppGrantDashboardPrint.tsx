import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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

export default function AppGrantDashboardPrint() {
  const params = new URLSearchParams(window.location.search);
  const days = Number(params.get("days") ?? "90");

  const { data, isLoading } = useQuery<GrantMetrics>({
    queryKey: ["/api/grants/metrics", { days }],
    queryFn: async () => {
      const res = await fetch(`/api/grants/metrics?days=${days}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.ok) {
      setTimeout(() => window.print(), 400);
    }
  }, [data]);

  if (isLoading) return <div className="p-6 text-[#243032]">Loading report…</div>;
  if (!data?.ok) return <div className="p-6 text-red-700">Could not load report.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen">
      <style>{`
        @media print {
          button { display:none !important; }
          a { color: black; text-decoration: none; }
        }
      `}</style>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#243032]">Civilla — Grant Impact Summary</h1>
          <div className="text-sm text-[#243032]/70 mt-1">
            Reporting Window: Last {data.windowDays} days
          </div>
          <div className="text-xs text-[#243032]/60 mt-2">
            Privacy: Aggregated metrics only. No user content is viewable.
          </div>
        </div>
        <button
          className="px-4 py-2 rounded border border-[#243032]/20 text-[#243032] text-sm hover:bg-[#243032]/5"
          onClick={() => window.print()}
          data-testid="button-print"
        >
          Print / Save as PDF
        </button>
      </div>

      <hr className="my-6 border-[#243032]/20" />

      <h2 className="text-lg font-semibold text-[#243032]">Totals</h2>
      <ul className="mt-2 text-sm text-[#243032] space-y-1">
        <li>Total users: <strong>{data.totals.users}</strong></li>
        <li>Total cases: <strong>{data.totals.cases}</strong></li>
        <li>Active users (window): <strong>{data.totals.activeUsers}</strong></li>
      </ul>

      <hr className="my-6 border-[#243032]/20" />

      <h2 className="text-lg font-semibold text-[#243032]">Cases by State</h2>
      <div className="mt-2 text-sm space-y-1">
        {(data.distributions.casesByState ?? []).map((r, idx) => (
          <div key={idx} className="flex justify-between text-[#243032]">
            <span>{r.label}</span>
            <span className="font-semibold">{r.count}</span>
          </div>
        ))}
        {(data.distributions.casesByState?.length ?? 0) === 0 && (
          <div className="text-[#243032]/60">No data available</div>
        )}
      </div>

      <hr className="my-6 border-[#243032]/20" />

      <h2 className="text-lg font-semibold text-[#243032]">Module Usage</h2>
      <div className="mt-2 text-sm space-y-1">
        {(data.distributions.moduleUsage ?? []).map((r, idx) => (
          <div key={idx} className="flex justify-between text-[#243032]">
            <span>{r.label}</span>
            <span className="font-semibold">{r.count}</span>
          </div>
        ))}
        {(data.distributions.moduleUsage?.length ?? 0) === 0 && (
          <div className="text-[#243032]/60">No data available</div>
        )}
      </div>

      {(data.distributions.aiFailures?.length ?? 0) > 0 && (
        <>
          <hr className="my-6 border-[#243032]/20" />
          <h2 className="text-lg font-semibold text-[#243032]">AI Reliability (Failures)</h2>
          <div className="mt-2 text-sm space-y-1">
            {data.distributions.aiFailures.map((r, idx) => (
              <div key={idx} className="flex justify-between text-[#243032]">
                <span>{r.label}</span>
                <span className="font-semibold">{r.count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <hr className="my-6 border-[#243032]/20" />

      <h2 className="text-lg font-semibold text-[#243032]">Privacy Notes</h2>
      <ul className="mt-2 text-sm list-disc pl-5 space-y-1 text-[#243032]/80">
        {(data.privacy?.notes ?? []).map((n, i) => <li key={i}>{n}</li>)}
      </ul>
    </div>
  );
}
