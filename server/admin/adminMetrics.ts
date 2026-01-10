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

export async function getAdminMetrics(params: { days?: number }) {
  const days = Math.max(7, Math.min(365, params.days ?? 90));

  const totalUsersRes = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
  const totalCasesRes = await pool.query(`SELECT COUNT(*)::int AS count FROM cases`);

  const active7dRes = await pool.query(`
    SELECT COUNT(DISTINCT user_id)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `);

  const active30dRes = await pool.query(`
    SELECT COUNT(DISTINCT user_id)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

  const casesByStateRes = await pool.query(`
    SELECT COALESCE(state, 'Unknown') AS label, COUNT(*)::int AS count
    FROM cases
    GROUP BY COALESCE(state, 'Unknown')
    ORDER BY count DESC
    LIMIT 25
  `);

  const moduleUsageRes = await pool.query(`
    SELECT COALESCE(module_key, 'unknown') AS label, COUNT(*)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND module_key IS NOT NULL
    GROUP BY module_key
    ORDER BY count DESC
    LIMIT 20
  `);

  const funnelRes = await pool.query(`
    SELECT event_type AS label, COUNT(*)::int AS count
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND event_type IN (
        'onboarding_complete', 'case_created', 'evidence_uploaded',
        'claim_accepted', 'doc_compiled', 'export_zip'
      )
    GROUP BY event_type
    ORDER BY
      CASE event_type
        WHEN 'onboarding_complete' THEN 1
        WHEN 'case_created' THEN 2
        WHEN 'evidence_uploaded' THEN 3
        WHEN 'claim_accepted' THEN 4
        WHEN 'doc_compiled' THEN 5
        WHEN 'export_zip' THEN 6
      END
  `).catch(() => ({ rows: [] }));

  const aiFailuresRes = await pool.query(`
    SELECT COALESCE(error_code, 'unknown') AS label, COUNT(*)::int AS count
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND success = false
      AND error_code IS NOT NULL
    GROUP BY error_code
    ORDER BY count DESC
    LIMIT 15
  `).catch(() => ({ rows: [] }));

  const activityAiFailuresRes = await pool.query(`
    SELECT type AS label, COUNT(*)::int AS count
    FROM activity_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND type IN ('evidence_extraction_failed','claims_suggest_failed','ai_analysis_failed','lexi_error')
    GROUP BY type
    ORDER BY count DESC
  `).catch(() => ({ rows: [] }));

  const exportCountsRes = await pool.query(`
    SELECT event_type AS label, COUNT(*)::int AS count
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND event_type IN ('doc_export', 'docx_export', 'pattern_export', 'trial_binder_export', 'export_zip')
    GROUP BY event_type
    ORDER BY count DESC
  `).catch(() => ({ rows: [] }));

  const performanceRes = await pool.query(`
    SELECT 
      event_type,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS p50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
      COUNT(*)::int AS sample_count
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '${days} days'
      AND duration_ms IS NOT NULL
      AND duration_ms > 0
      AND event_type IN ('lexi_response', 'extraction', 'ai_analysis')
    GROUP BY event_type
  `).catch(() => ({ rows: [] }));

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

  const allAiFailures = [
    ...aiFailuresRes.rows,
    ...activityAiFailuresRes.rows,
  ];

  return {
    ok: true,
    windowDays: days,
    totals: {
      users: totalUsersRes.rows?.[0]?.count ?? 0,
      cases: totalCasesRes.rows?.[0]?.count ?? 0,
      active7d: active7dRes.rows?.[0]?.count ?? 0,
      active30d: active30dRes.rows?.[0]?.count ?? 0,
    },
    distributions: {
      casesByState: bucketSmallCounts(casesByStateRes.rows ?? [], 5),
      moduleUsage: bucketSmallCounts(moduleUsageRes.rows ?? [], 5),
    },
    funnel: bucketSmallCounts(funnelRes.rows ?? [], 5),
    aiReliability: bucketSmallCounts(allAiFailures as CountRow[], 5),
    exports: bucketSmallCounts(exportCountsRes.rows ?? [], 5),
    performance: (performanceRes.rows ?? []).map((r: any) => ({
      eventType: r.event_type,
      p50: Math.round(r.p50 ?? 0),
      p95: Math.round(r.p95 ?? 0),
      sampleCount: r.sample_count ?? 0,
    })),
    timeSeries: {
      newUsersByDay: (newUsersByDayRes.rows ?? []).map((r: any): TimeSeriesRow => ({ day: r.day, count: r.count })),
      newCasesByDay: (newCasesByDayRes.rows ?? []).map((r: any): TimeSeriesRow => ({ day: r.day, count: r.count })),
      activeUsersByDay: (activeUsersByDayRes.rows ?? []).map((r: any): TimeSeriesRow => ({ day: r.day, count: r.count })),
    },
    privacy: {
      notes: [
        "Admin dashboards show aggregated metrics only.",
        "No user content, evidence, documents, or messages are accessible.",
        "Small counts are bucketed to prevent re-identification.",
      ],
    },
  };
}

export async function getSystemHealth() {
  let dbOk = false;
  let dbError: string | null = null;

  try {
    const res = await pool.query("SELECT 1 as test");
    dbOk = res.rows?.[0]?.test === 1;
  } catch (e) {
    dbError = "db_connection_failed";
  }

  const queueCountsRes = await pool.query(`
    SELECT 
      SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END)::int AS queued,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END)::int AS processing,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)::int AS failed,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)::int AS complete
    FROM evidence_processing_jobs
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `).catch(() => ({ rows: [{ queued: 0, processing: 0, failed: 0, complete: 0 }] }));

  const aiAnalysesRes = await pool.query(`
    SELECT 
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int AS pending,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END)::int AS processing,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::int AS failed,
      SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END)::int AS complete
    FROM evidence_ai_analyses
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `).catch(() => ({ rows: [{ pending: 0, processing: 0, failed: 0, complete: 0 }] }));

  const claimsRes = await pool.query(`
    SELECT 
      SUM(CASE WHEN status = 'suggested' THEN 1 ELSE 0 END)::int AS suggested,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END)::int AS accepted,
      SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END)::int AS pending_review
    FROM case_claims
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `).catch(() => ({ rows: [{ suggested: 0, accepted: 0, pending_review: 0 }] }));

  const missingCitationsRes = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM case_claims cc
    LEFT JOIN claim_citations ci ON ci.claim_id = cc.id
    WHERE cc.status = 'accepted'
      AND ci.id IS NULL
      AND cc.created_at >= NOW() - INTERVAL '30 days'
  `).catch(() => ({ rows: [{ count: 0 }] }));

  const openaiKeyPresent = !!process.env.OPENAI_API_KEY;
  const visionKeyPresent = !!process.env.GOOGLE_CLOUD_VISION_API_KEY;

  return {
    ok: dbOk && openaiKeyPresent,
    db: {
      connected: dbOk,
      error: dbError,
      lastCheckedAt: new Date().toISOString(),
    },
    ai: {
      openaiKeyPresent,
      status: openaiKeyPresent ? "configured" : "missing_key",
    },
    vision: {
      keyPresent: visionKeyPresent,
      status: visionKeyPresent ? "configured" : "missing_key",
    },
    jobs: {
      evidenceExtractions: {
        queued: queueCountsRes.rows?.[0]?.queued ?? 0,
        processing: queueCountsRes.rows?.[0]?.processing ?? 0,
        failed: queueCountsRes.rows?.[0]?.failed ?? 0,
        complete: queueCountsRes.rows?.[0]?.complete ?? 0,
      },
      aiAnalyses: {
        pending: aiAnalysesRes.rows?.[0]?.pending ?? 0,
        processing: aiAnalysesRes.rows?.[0]?.processing ?? 0,
        failed: aiAnalysesRes.rows?.[0]?.failed ?? 0,
        complete: aiAnalysesRes.rows?.[0]?.complete ?? 0,
      },
      claims: {
        suggested: claimsRes.rows?.[0]?.suggested ?? 0,
        accepted: claimsRes.rows?.[0]?.accepted ?? 0,
        pendingReview: claimsRes.rows?.[0]?.pending_review ?? 0,
        missingCitations: missingCitationsRes.rows?.[0]?.count ?? 0,
      },
    },
  };
}

export async function searchUsers(query: string, limit = 20) {
  const searchTerm = `%${query.toLowerCase()}%`;

  const res = await pool.query(`
    SELECT 
      u.id AS user_id,
      u.created_at,
      (SELECT MAX(created_at) FROM activity_logs WHERE user_id = u.id) AS last_active_at,
      COALESCE(up.is_admin, false) AS is_admin,
      COALESCE(up.is_grant_viewer, false) AS is_grant_viewer,
      CASE 
        WHEN u.email IS NOT NULL THEN 
          CONCAT(SUBSTRING(u.email, 1, 1), '***@', SPLIT_PART(u.email, '@', 2))
        ELSE NULL
      END AS masked_email
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE 
      LOWER(u.id) LIKE $1
      OR (u.email IS NOT NULL AND LOWER(u.email) LIKE $1)
    ORDER BY u.created_at DESC
    LIMIT $2
  `, [searchTerm, limit]);

  return res.rows.map((r: any) => ({
    userId: r.user_id,
    createdAt: r.created_at,
    lastActiveAt: r.last_active_at,
    isAdmin: r.is_admin,
    isGrantViewer: r.is_grant_viewer,
    maskedEmail: r.masked_email,
  }));
}

export async function setUserRoles(
  targetUserId: string,
  patch: { isAdmin?: boolean; isGrantViewer?: boolean }
) {
  const isAdmin = patch.isAdmin ?? false;
  const isGrantViewer = patch.isGrantViewer ?? false;

  await pool.query(`
    INSERT INTO user_profiles (user_id, is_admin, is_grant_viewer)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id) DO UPDATE SET
      is_admin = COALESCE($2, user_profiles.is_admin),
      is_grant_viewer = COALESCE($3, user_profiles.is_grant_viewer)
  `, [targetUserId, isAdmin, isGrantViewer]);

  return { ok: true };
}

export async function createAdminAuditLog(
  actorUserId: string,
  payload: {
    targetUserId?: string;
    action: string;
    details?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }
) {
  await pool.query(`
    INSERT INTO admin_audit_logs (actor_user_id, target_user_id, action, details, ip, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    actorUserId,
    payload.targetUserId || null,
    payload.action,
    payload.details ? JSON.stringify(payload.details) : null,
    payload.ip || null,
    payload.userAgent || null,
  ]);
}

export async function listAdminAuditLogs(opts: {
  start?: string;
  end?: string;
  action?: string;
  targetUserId?: string;
  limit?: number;
}) {
  const conditions: string[] = ["1=1"];
  const values: any[] = [];
  let paramIdx = 1;

  if (opts.start) {
    conditions.push(`created_at >= $${paramIdx++}`);
    values.push(opts.start);
  }
  if (opts.end) {
    conditions.push(`created_at <= $${paramIdx++}`);
    values.push(opts.end);
  }
  if (opts.action) {
    conditions.push(`action = $${paramIdx++}`);
    values.push(opts.action);
  }
  if (opts.targetUserId) {
    conditions.push(`target_user_id = $${paramIdx++}`);
    values.push(opts.targetUserId);
  }

  const limit = Math.min(opts.limit ?? 100, 500);

  const res = await pool.query(`
    SELECT id, actor_user_id, target_user_id, action, details, ip, user_agent, created_at
    FROM admin_audit_logs
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT $${paramIdx}
  `, [...values, limit]);

  return res.rows.map((r: any) => ({
    id: r.id,
    actorUserId: r.actor_user_id,
    targetUserId: r.target_user_id,
    action: r.action,
    details: r.details,
    ip: r.ip,
    userAgent: r.user_agent,
    createdAt: r.created_at,
  }));
}

export async function createAnalyticsEvent(
  userId: string,
  payload: {
    eventType: string;
    caseId?: string | null;
    moduleKey?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    durationMs?: number | null;
    success?: boolean | null;
    errorCode?: string | null;
    meta?: Record<string, unknown> | null;
  }
) {
  const forbiddenKeys = ["text", "content", "message", "body", "prompt", "response", "excerpt", "note"];
  let sanitizedMeta = payload.meta ?? null;

  if (sanitizedMeta && typeof sanitizedMeta === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(sanitizedMeta)) {
      if (!forbiddenKeys.includes(key.toLowerCase())) {
        cleaned[key] = value;
      }
    }
    const metaStr = JSON.stringify(cleaned);
    if (metaStr.length > 2048) {
      sanitizedMeta = { truncated: true };
    } else {
      sanitizedMeta = cleaned;
    }
  }

  await pool.query(`
    INSERT INTO analytics_events (
      user_id, case_id, event_type, module_key, entity_type, entity_id,
      duration_ms, success, error_code, meta
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    userId,
    payload.caseId || null,
    payload.eventType,
    payload.moduleKey || null,
    payload.entityType || null,
    payload.entityId || null,
    payload.durationMs ?? null,
    payload.success ?? null,
    payload.errorCode || null,
    sanitizedMeta ? JSON.stringify(sanitizedMeta) : null,
  ]);
}
