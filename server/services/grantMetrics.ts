import { pool } from "../db";

interface CountRow {
  label: string;
  count: number;
}

interface TimeSeriesRow {
  day: string;
  count: number;
}

function bucketSmallCounts(rows: CountRow[], min = 5): CountRow[] {
  const safe: CountRow[] = [];
  let otherCount = 0;

  for (const r of rows) {
    if ((r.count ?? 0) < min) {
      otherCount += r.count ?? 0;
    } else {
      safe.push(r);
    }
  }
  if (otherCount > 0) {
    safe.push({ label: "Other / <5", count: otherCount });
  }
  return safe;
}

export async function getGrantMetrics(params: { days?: number }) {
  const days = Math.max(7, Math.min(365, params.days ?? 90));

  const totalUsersRes = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
  const totalCasesRes = await pool.query(`SELECT COUNT(*)::int AS count FROM cases`);
  const activeUsersRes = await pool.query(`
    SELECT COUNT(DISTINCT user_id)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
  `);

  const casesByStateRes = await pool.query(`
    SELECT COALESCE(state, 'Unknown') AS label, COUNT(*)::int AS count
    FROM cases
    GROUP BY COALESCE(state, 'Unknown')
    ORDER BY count DESC
    LIMIT 25
  `);

  const moduleUsageRes = await pool.query(`
    SELECT COALESCE(metadata->>'moduleKey','unknown') AS label, COUNT(*)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND event_type IN ('module_view','search_click','doc_export','pattern_export','trial_binder_export')
    GROUP BY COALESCE(metadata->>'moduleKey','unknown')
    ORDER BY count DESC
    LIMIT 15
  `);

  const aiFailuresRes = await pool.query(`
    SELECT event_type AS label, COUNT(*)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND event_type IN ('evidence_extraction_failed','claims_suggest_failed','ai_analysis_failed','lexi_error')
    GROUP BY event_type
    ORDER BY count DESC
  `);

  const newUsersByDayRes = await pool.query(`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY 1
    ORDER BY 1
  `).catch(() => ({ rows: [] }));

  const newCasesByDayRes = await pool.query(`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS count
    FROM cases
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY 1
    ORDER BY 1
  `).catch(() => ({ rows: [] }));

  const activeUsersByDayRes = await pool.query(`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           COUNT(DISTINCT user_id)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY 1
    ORDER BY 1
  `).catch(() => ({ rows: [] }));

  return {
    ok: true,
    windowDays: days,
    totals: {
      users: totalUsersRes.rows?.[0]?.count ?? 0,
      cases: totalCasesRes.rows?.[0]?.count ?? 0,
      activeUsers: activeUsersRes.rows?.[0]?.count ?? 0,
    },
    distributions: {
      casesByState: bucketSmallCounts(casesByStateRes.rows ?? [], 5),
      moduleUsage: bucketSmallCounts(moduleUsageRes.rows ?? [], 5),
      aiFailures: bucketSmallCounts(aiFailuresRes.rows ?? [], 5),
    },
    timeSeries: {
      newUsersByDay: (newUsersByDayRes.rows ?? []).map((r: any): TimeSeriesRow => ({ day: r.day, count: r.count })),
      newCasesByDay: (newCasesByDayRes.rows ?? []).map((r: any): TimeSeriesRow => ({ day: r.day, count: r.count })),
      activeUsersByDay: (activeUsersByDayRes.rows ?? []).map((r: any): TimeSeriesRow => ({ day: r.day, count: r.count })),
    },
    privacy: {
      notes: [
        "Aggregated metrics only (no user-uploaded content).",
        "Small counts are bucketed to reduce re-identification risk.",
        "No names, emails, messages, evidence text, or document text are accessible.",
      ],
    },
  };
}
