import { PoolClient } from 'pg';
import { query, queryOne, withTransaction } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { ReportRow, ReportStatus, IssueCategory, SeverityLevel } from '../types';
import { buildPaginationMeta } from '../utils/response';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// ReportService: Core business logic for water issue reports.
// All DB interactions go through this layer; controllers stay thin.
// ---------------------------------------------------------------------------

export interface CreateReportInput {
  citizen_id: string;
  category: IssueCategory;
  severity?: SeverityLevel;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  county: string;
  sub_county?: string;
  ward?: string;
  source?: string;
}

export interface ListReportsOptions {
  page: number;
  limit: number;
  offset: number;
  status?: ReportStatus;
  category?: IssueCategory;
  county?: string;
  start_date?: string;
  end_date?: string;
  citizen_id?: string;    // For citizens to see their own reports
  lat?: number;           // For proximity search
  lng?: number;
  radius_km?: number;
  sort?: 'newest' | 'oldest' | 'severity' | 'upvotes';
}

export interface ReportStatsOptions {
  county?: string;
  status?: ReportStatus;
  start_date?: string;
  end_date?: string;
}

export interface UpdateStatusInput {
  status: ReportStatus;
  comment?: string;
  is_public?: boolean;
  technician_id?: string;
  estimated_resolution_date?: string;
  admin_id: string;
}

export interface AssignReportInput {
  technician_id: string;
  comment?: string;
  is_public?: boolean;
  admin_id: string;
}

// ---------------------------------------------------------------------------
// createReport
// ---------------------------------------------------------------------------
export async function createReport(input: CreateReportInput): Promise<ReportRow> {
  const row = await queryOne<ReportRow>(`
    INSERT INTO reports (
      citizen_id, category, severity, title, description,
      latitude, longitude, location_name, county, sub_county, ward, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    input.citizen_id, input.category, input.severity ?? 'medium',
    input.title, input.description,
    input.latitude, input.longitude, input.location_name ?? null,
    input.county, input.sub_county ?? null, input.ward ?? null, input.source ?? 'web',
  ]);

  if (!row) throw new AppError('Failed to create report.', 500);
  return row;
}

// ---------------------------------------------------------------------------
// getReportById — includes images, technician name, and public admin actions
// ---------------------------------------------------------------------------
export async function getReportById(
  id: string,
  requestingUserId?: string
): Promise<Record<string, unknown>> {
  // Public reports are readable by anyone; private reports are readable only by the owner.
  const report = await queryOne<ReportRow>(
    'SELECT * FROM reports WHERE id = $1 AND (is_public = TRUE OR citizen_id = $2)',
    [id, requestingUserId ?? '00000000-0000-0000-0000-000000000000']
  );

  if (!report) throw new AppError('Report not found.', 404, 'NOT_FOUND');

  // Increment view count (fire-and-forget so we don't slow down the response).
  query('UPDATE reports SET view_count = view_count + 1 WHERE id = $1', [id]).catch(() => null);

  // Bundle the report with related images + timeline + lightweight citizen/technician profiles.
  const [images, publicActions, citizen, technician] = await Promise.all([
    query<Record<string, unknown>>(
      'SELECT id, public_url, filename, is_primary FROM report_images WHERE report_id = $1',
      [id]
    ),
    query<Record<string, unknown>>(`
      SELECT aa.id, aa.action_type, aa.new_status, aa.comment, aa.created_at,
             u.full_name as admin_name
      FROM admin_actions aa
      JOIN users u ON u.id = aa.admin_id
      WHERE aa.report_id = $1 AND aa.is_public = TRUE
      ORDER BY aa.created_at ASC
    `, [id]),
    queryOne<Record<string, unknown>>(
      'SELECT id, full_name, county FROM users WHERE id = $1',
      [report.citizen_id]
    ),
    report.assigned_to
      ? queryOne<Record<string, unknown>>(`
          SELECT t.id, u.full_name, t.specialization, t.employee_id, t.job_role
          FROM technicians t JOIN users u ON u.id = t.user_id
          WHERE t.id = $1
        `, [report.assigned_to])
      : Promise.resolve(null),
  ]);

  return { ...report, images, timeline: publicActions, citizen, technician };
}

// ---------------------------------------------------------------------------
// listReports — paginated, filterable, with proximity search
// ---------------------------------------------------------------------------
export async function listReports(
  opts: ListReportsOptions
): Promise<{ reports: Record<string, unknown>[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  // Build WHERE conditions dynamically so we only filter on fields the client provided.
  const conditions: string[] = ['r.is_public = TRUE'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (opts.status) {
    conditions.push(`r.status = $${paramIdx++}`);
    params.push(opts.status);
  }
  if (opts.category) {
    conditions.push(`r.category = $${paramIdx++}`);
    params.push(opts.category);
  }
  if (opts.county) {
    conditions.push(`r.county ILIKE $${paramIdx++}`);
    params.push(`%${opts.county}%`);
  }
  if (opts.citizen_id) {
    // Override is_public filter when citizen views their own reports
    conditions.splice(conditions.indexOf('r.is_public = TRUE'), 1);
    conditions.push(`r.citizen_id = $${paramIdx++}`);
    params.push(opts.citizen_id);
  }

  // Proximity filter using PostGIS
  if (opts.lat !== undefined && opts.lng !== undefined && opts.radius_km) {
    // Uses `location_geom` (GEOGRAPHY) and converts km to meters.
    conditions.push(`
      ST_DWithin(
        r.location_geom,
        ST_SetSRID(ST_MakePoint($${paramIdx++}, $${paramIdx++}), 4326)::geography,
        $${paramIdx++}
      )
    `);
    params.push(opts.lng, opts.lat, opts.radius_km * 1000); // convert km to meters
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap: Record<string, string> = {
    newest: 'r.created_at DESC',
    oldest: 'r.created_at ASC',
    severity: "CASE r.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END",
    upvotes: 'r.upvote_count DESC',
  };
  const orderBy = sortMap[opts.sort ?? 'newest'];

  const [countResult, reportRows] = await Promise.all([
    queryOne<{ count: string }>(`SELECT COUNT(*) FROM reports r ${whereClause}`, params),
    query<Record<string, unknown>>(`
      SELECT r.id, r.reference_code, r.category, r.severity, r.title,
             r.latitude, r.longitude, r.location_name, r.county, r.sub_county, r.ward,
             r.status, r.upvote_count, r.view_count, r.created_at, r.updated_at,
             u.full_name as citizen_name,
             (SELECT public_url FROM report_images WHERE report_id = r.id AND is_primary = TRUE LIMIT 1) as primary_image
      FROM reports r
      JOIN users u ON u.id = r.citizen_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `, [...params, opts.limit, opts.offset]),
  ]);

  const total = parseInt(countResult?.count ?? '0', 10);
  return {
    reports: reportRows,
    meta: buildPaginationMeta(total, opts.page, opts.limit),
  };
}

// ---------------------------------------------------------------------------
// Admin: listAllReports (bypasses is_public filter, includes private data)
// ---------------------------------------------------------------------------
export async function adminListReports(
  opts: ListReportsOptions & { user?: { county: string | null; is_root_admin: boolean } }
): Promise<{ reports: Record<string, unknown>[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  // Admin can see everything (including non-public reports), so we don't filter by `is_public`.
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (opts.status) { conditions.push(`r.status = $${paramIdx++}`); params.push(opts.status); }
  if (opts.category) { conditions.push(`r.category = $${paramIdx++}`); params.push(opts.category); }
  if (opts.county) { conditions.push(`r.county ILIKE $${paramIdx++}`); params.push(`%${opts.county}%`); }
  if (opts.start_date) {
    // Compare at DATE granularity to avoid timezone edge-cases.
    conditions.push(`r.created_at >= $${paramIdx++}::date`);
    params.push(opts.start_date);
  }
  if (opts.end_date) {
    // Include the full end date by using the next day as an exclusive upper bound.
    conditions.push(`r.created_at < ($${paramIdx++}::date + INTERVAL '1 day')`);
    params.push(opts.end_date);
  }

  // County admin restriction: only see reports from their county
  if (opts.user && !opts.user.is_root_admin && opts.user.county) {
    logger.debug('Applying county admin filter', {
      user_county: opts.user.county,
      is_root_admin: opts.user.is_root_admin,
    });
    conditions.push(`r.county = $${paramIdx++}`);
    params.push(opts.user.county);
  } else if (opts.user) {
    logger.debug('User admin filter check', {
      user_exists: !!opts.user,
      is_root_admin: opts.user?.is_root_admin,
      county: opts.user?.county,
    });
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countResult, reportRows] = await Promise.all([
    queryOne<{ count: string }>(`SELECT COUNT(*) FROM reports r ${whereClause}`, params),
    query<Record<string, unknown>>(`
      SELECT r.*,
             u.full_name as citizen_name, u.phone as citizen_phone,
             tu.full_name as technician_name, t.employee_id as technician_employee_id, t.job_role as technician_job_role
      FROM reports r
      JOIN users u ON u.id = r.citizen_id
      LEFT JOIN technicians t ON t.id = r.assigned_to
      LEFT JOIN users tu ON tu.id = t.user_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `, [...params, opts.limit, opts.offset]),
  ]);

  const total = parseInt(countResult?.count ?? '0', 10);
  return {
    reports: reportRows,
    meta: buildPaginationMeta(total, opts.page, opts.limit),
  };
}

// ---------------------------------------------------------------------------
// updateReportStatus — transactional: updates report + creates audit log entry
// ---------------------------------------------------------------------------
export async function updateReportStatus(
  reportId: string,
  input: UpdateStatusInput
): Promise<ReportRow> {
  return withTransaction(async (client: PoolClient) => {
    // Lock row to prevent conflicting updates (e.g., two admins changing status at once).
    const report = await client.query<ReportRow>(
      'SELECT * FROM reports WHERE id = $1 FOR UPDATE',
      [reportId]
    );

    if (report.rowCount === 0) {
      throw new AppError('Report not found.', 404, 'NOT_FOUND');
    }

    const current = report.rows[0];

    // Validate status transitions
    validateStatusTransition(current.status, input.status);

    // Build update fields
    const updateFields: string[] = ['status = $1', 'updated_at = NOW()'];
    const updateParams: unknown[] = [input.status];
    let pIdx = 2;

    if (input.status === 'verified') {
      updateFields.push(`verified_by = $${pIdx++}`, `verified_at = NOW()`);
      updateParams.push(input.admin_id);
    }
    if (input.status === 'resolved') {
      updateFields.push(`resolved_at = NOW()`);
    }
    if (input.technician_id) {
      updateFields.push(`assigned_to = $${pIdx++}`);
      updateParams.push(input.technician_id);
    }
    if (input.estimated_resolution_date) {
      updateFields.push(`estimated_resolution_date = $${pIdx++}`);
      updateParams.push(input.estimated_resolution_date);
    }

    updateParams.push(reportId);
    const updatedReport = await client.query<ReportRow>(
      `UPDATE reports SET ${updateFields.join(', ')} WHERE id = $${pIdx} RETURNING *`,
      updateParams
    );

    // Create immutable audit log entry
    await client.query(`
      INSERT INTO admin_actions (report_id, admin_id, action_type, previous_status, new_status, assigned_to, comment, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      reportId, input.admin_id, 'status_update',
      current.status, input.status,
      input.technician_id ?? null,
      input.comment ?? null,
      input.is_public ?? false,
    ]);

    return updatedReport.rows[0];
  });
}

// ---------------------------------------------------------------------------
// assignReportTechnician — transactional: assigns technician + audit log
// ---------------------------------------------------------------------------
export async function assignReportTechnician(
  reportId: string,
  input: AssignReportInput
): Promise<ReportRow> {
  return withTransaction(async (client: PoolClient) => {
    // Assignment is its own action: we only change `assigned_to` and record it in the audit log.
    const report = await client.query<ReportRow>(
      'SELECT * FROM reports WHERE id = $1 FOR UPDATE',
      [reportId]
    );

    if (report.rowCount === 0) {
      throw new AppError('Report not found.', 404, 'NOT_FOUND');
    }

    const technicianExists = await client.query<{ id: string }>(
      'SELECT id FROM technicians WHERE id = $1',
      [input.technician_id]
    );
    if (technicianExists.rowCount === 0) {
      throw new AppError('Technician not found.', 404, 'NOT_FOUND');
    }

    const current = report.rows[0];

    const updatedReport = await client.query<ReportRow>(
      'UPDATE reports SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [input.technician_id, reportId]
    );

    await client.query(`
      INSERT INTO admin_actions (report_id, admin_id, action_type, previous_status, new_status, assigned_to, comment, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      reportId, input.admin_id, 'assign',
      current.status, current.status,
      input.technician_id,
      input.comment ?? null,
      input.is_public ?? false,
    ]);

    return updatedReport.rows[0];
  });
}

// ---------------------------------------------------------------------------
// upvoteReport — idempotent (safe to call multiple times)
// ---------------------------------------------------------------------------
export async function upvoteReport(reportId: string, citizenId: string): Promise<{ upvote_count: number }> {
  return withTransaction(async (client: PoolClient) => {
    // Try to insert upvote; if duplicate, remove it (toggle behavior)
    const existing = await client.query(
      'SELECT 1 FROM report_upvotes WHERE citizen_id = $1 AND report_id = $2',
      [citizenId, reportId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      await client.query(
        'DELETE FROM report_upvotes WHERE citizen_id = $1 AND report_id = $2',
        [citizenId, reportId]
      );
      await client.query(
        'UPDATE reports SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = $1',
        [reportId]
      );
    } else {
      await client.query(
        'INSERT INTO report_upvotes (citizen_id, report_id) VALUES ($1, $2)',
        [citizenId, reportId]
      );
      await client.query(
        'UPDATE reports SET upvote_count = upvote_count + 1 WHERE id = $1',
        [reportId]
      );
    }

    const result = await client.query<{ upvote_count: number }>(
      'SELECT upvote_count FROM reports WHERE id = $1',
      [reportId]
    );
    return result.rows[0];
  });
}

// ---------------------------------------------------------------------------
// getReportStats — for admin dashboard
// ---------------------------------------------------------------------------
export async function getReportStats(county?: string): Promise<Record<string, unknown>> {
  const filters: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (county) {
    filters.push(`county ILIKE $${idx++}`);
    params.push(`%${county}%`);
  }
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [statusCounts, categoryCounts, recentTrend, countyCounts] = await Promise.all([
    query<Record<string, unknown>>(`
      SELECT status, COUNT(*) as count
      FROM reports ${whereClause}
      GROUP BY status
    `, params),
    query<Record<string, unknown>>(`
      SELECT category, COUNT(*) as count
      FROM reports ${whereClause}
      GROUP BY category ORDER BY count DESC
    `, params),
    query<Record<string, unknown>>(`
      SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
      FROM reports
      ${county ? `WHERE county ILIKE $1 AND created_at >= NOW() - INTERVAL '30 days'` : `WHERE created_at >= NOW() - INTERVAL '30 days'`}
      GROUP BY date ORDER BY date ASC
    `, params),
    query<Record<string, unknown>>(`
      SELECT county, COUNT(*) as count
      FROM reports
      GROUP BY county ORDER BY count DESC
    `, []),
  ]);

  return { byStatus: statusCounts, byCategory: categoryCounts, dailyTrend: recentTrend, byCounty: countyCounts };
}

export async function getFilteredReportStats(options: ReportStatsOptions): Promise<Record<string, unknown>> {
  const filters: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (options.county) {
    filters.push(`county ILIKE $${idx++}`);
    params.push(`%${options.county}%`);
  }
  if (options.status) {
    filters.push(`status = $${idx++}`);
    params.push(options.status);
  }
  if (options.start_date) {
    filters.push(`created_at >= $${idx++}::date`);
    params.push(options.start_date);
  }
  if (options.end_date) {
    filters.push(`created_at < ($${idx++}::date + INTERVAL '1 day')`);
    params.push(options.end_date);
  }
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [statusCounts, categoryCounts, recentTrend, countyCounts] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT status, COUNT(*) as count FROM reports ${whereClause} GROUP BY status`,
      params
    ),
    query<Record<string, unknown>>(
      `SELECT category, COUNT(*) as count FROM reports ${whereClause} GROUP BY category ORDER BY count DESC`,
      params
    ),
    query<Record<string, unknown>>(`
      SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
      FROM reports
      ${whereClause ? `${whereClause} AND created_at >= NOW() - INTERVAL '90 days'` : `WHERE created_at >= NOW() - INTERVAL '90 days'`}
      GROUP BY date ORDER BY date ASC
    `, params),
    query<Record<string, unknown>>(
      `SELECT county, COUNT(*) as count FROM reports ${whereClause} GROUP BY county ORDER BY count DESC`,
      params
    ),
  ]);

  return { byStatus: statusCounts, byCategory: categoryCounts, dailyTrend: recentTrend, byCounty: countyCounts };
}

export async function exportReportsForAdmin(
  opts: ListReportsOptions & { user?: { county: string | null; is_root_admin: boolean } }
): Promise<Record<string, unknown>[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (opts.status) { conditions.push(`r.status = $${paramIdx++}`); params.push(opts.status); }
  if (opts.category) { conditions.push(`r.category = $${paramIdx++}`); params.push(opts.category); }
  if (opts.county) { conditions.push(`r.county ILIKE $${paramIdx++}`); params.push(`%${opts.county}%`); }
  if (opts.start_date) { conditions.push(`r.created_at >= $${paramIdx++}::date`); params.push(opts.start_date); }
  if (opts.end_date) { conditions.push(`r.created_at < ($${paramIdx++}::date + INTERVAL '1 day')`); params.push(opts.end_date); }

  if (opts.user && !opts.user.is_root_admin && opts.user.county) {
    conditions.push(`r.county = $${paramIdx++}`);
    params.push(opts.user.county);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return query<Record<string, unknown>>(`
    SELECT r.reference_code, r.title, r.category, r.severity, r.status, r.county,
           r.sub_county, r.ward, r.created_at, r.updated_at,
           u.full_name AS citizen_name
    FROM reports r
    JOIN users u ON u.id = r.citizen_id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT 5000
  `, params);
}

// ---------------------------------------------------------------------------
// Internal: Enforce valid state machine transitions
// ---------------------------------------------------------------------------
function validateStatusTransition(current: ReportStatus, next: ReportStatus): void {
  const allowedTransitions: Record<ReportStatus, ReportStatus[]> = {
    reported:     ['verified', 'rejected'],
    verified:     ['in_progress', 'resolved', 'rejected'],
    in_progress:  ['resolved', 'verified'],
    resolved:     ['in_progress'],   // Allow re-opening
    rejected:     ['verified'],      // Allow re-review
  };

  if (!allowedTransitions[current]?.includes(next)) {
    throw new AppError(
      `Cannot transition from '${current}' to '${next}'.`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }
}
