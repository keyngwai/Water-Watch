import { PoolClient } from 'pg';
import { query, queryOne, withTransaction } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { ReportRow, ReportStatus, IssueCategory, SeverityLevel } from '../types';
import { buildPaginationMeta } from '../utils/response';

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
  citizen_id?: string;    // For citizens to see their own reports
  lat?: number;           // For proximity search
  lng?: number;
  radius_km?: number;
  sort?: 'newest' | 'oldest' | 'severity' | 'upvotes';
}

export interface UpdateStatusInput {
  status: ReportStatus;
  comment?: string;
  is_public?: boolean;
  technician_id?: string;
  estimated_resolution_date?: string;
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
  const report = await queryOne<ReportRow>(
    'SELECT * FROM reports WHERE id = $1 AND (is_public = TRUE OR citizen_id = $2)',
    [id, requestingUserId ?? '00000000-0000-0000-0000-000000000000']
  );

  if (!report) throw new AppError('Report not found.', 404, 'NOT_FOUND');

  // Increment view count (fire-and-forget)
  query('UPDATE reports SET view_count = view_count + 1 WHERE id = $1', [id]).catch(() => null);

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
          SELECT t.id, u.full_name, t.specialization, t.employee_id
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
  opts: ListReportsOptions
): Promise<{ reports: Record<string, unknown>[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (opts.status) { conditions.push(`r.status = $${paramIdx++}`); params.push(opts.status); }
  if (opts.category) { conditions.push(`r.category = $${paramIdx++}`); params.push(opts.category); }
  if (opts.county) { conditions.push(`r.county ILIKE $${paramIdx++}`); params.push(`%${opts.county}%`); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countResult, reportRows] = await Promise.all([
    queryOne<{ count: string }>(`SELECT COUNT(*) FROM reports r ${whereClause}`, params),
    query<Record<string, unknown>>(`
      SELECT r.*,
             u.full_name as citizen_name, u.phone as citizen_phone,
             tu.full_name as technician_name, t.employee_id as technician_employee_id
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
  const countyFilter = county ? `WHERE county ILIKE $1` : '';
  const params = county ? [`%${county}%`] : [];

  const [statusCounts, categoryCounts, recentTrend] = await Promise.all([
    query<Record<string, unknown>>(`
      SELECT status, COUNT(*) as count
      FROM reports ${countyFilter}
      GROUP BY status
    `, params),
    query<Record<string, unknown>>(`
      SELECT category, COUNT(*) as count
      FROM reports ${countyFilter}
      GROUP BY category ORDER BY count DESC
    `, params),
    query<Record<string, unknown>>(`
      SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
      FROM reports
      ${county ? `WHERE county ILIKE $1 AND created_at >= NOW() - INTERVAL '30 days'` : `WHERE created_at >= NOW() - INTERVAL '30 days'`}
      GROUP BY date ORDER BY date ASC
    `, params),
  ]);

  return { byStatus: statusCounts, byCategory: categoryCounts, dailyTrend: recentTrend };
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
