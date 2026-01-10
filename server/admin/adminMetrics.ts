import { pool } from "../db";

type DateRange = { from?: string; to?: string };

function clampRange(range: DateRange) {
  const to = range.to ?? new Date().toISOString().slice(0, 10);
  const from =
    range.from ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
}

export async function getAdminMetrics(range: DateRange) {
  const { from, to } = clampRange(range);

  const usersAgg = await pool.query(`
    SELECT COUNT(*)::int AS total_users FROM users;
  `);

  const casesAgg = await pool.query(`
    SELECT COUNT(*)::int AS total_cases FROM cases;
  `);

  const stateDist = await pool.query(`
    SELECT
      COALESCE(state, 'Unknown') AS state,
      COUNT(*)::int AS count
    FROM cases
    GROUP BY COALESCE(state, 'Unknown')
    ORDER BY count DESC
    LIMIT 25;
  `);

  let usageByEvent: any[] = [];
  try {
    const usage = await pool.query(`
      SELECT
        event_type AS event,
        COUNT(*)::int AS count
      FROM activity_logs
      WHERE created_at >= $1::date
        AND created_at < ($2::date + INTERVAL '1 day')
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 25;
    `, [from, to]);
    usageByEvent = usage.rows ?? [];
  } catch {
    usageByEvent = [];
  }

  let aiFailures: any[] = [];
  try {
    const ai = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*)::int AS count
      FROM activity_logs
      WHERE event_type IN ('claims_suggest_failed','evidence_extraction_failed','ai_analysis_failed','lexi_error')
        AND created_at >= $1::date
        AND created_at < ($2::date + INTERVAL '1 day')
      GROUP BY DATE(created_at)
      ORDER BY day ASC
      LIMIT 60;
    `, [from, to]);
    aiFailures = ai.rows ?? [];
  } catch {
    aiFailures = [];
  }

  return {
    ok: true,
    range: { from, to },
    users: {
      total: usersAgg.rows?.[0]?.total_users ?? 0,
    },
    cases: {
      total: casesAgg.rows?.[0]?.total_cases ?? 0,
      byState: stateDist.rows ?? [],
    },
    usage: {
      byEvent: usageByEvent,
    },
    ai: {
      failuresByDay: aiFailures,
    },
  };
}
