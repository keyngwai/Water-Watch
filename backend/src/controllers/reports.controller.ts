import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../services/reports.service';
import { saveReportImages, deleteReportImage } from '../services/upload.service';
import { emitNotification } from '../utils/socket';
import { sendSuccess, sendCreated, parsePagination } from '../utils/response';
import { buildReportPdfBytes } from '../utils/reportExportPdf';

/**
 * Controller (Citizen): Submit a new water issue report.
 * Persists report data first, then handles image uploads and triggers notifications.
 */
export async function createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Persist the report first; uploaded images are processed afterwards.
    const report = await reportsService.createReport({
      ...req.body,
      citizen_id: req.user!.sub,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      source: 'web',
    });

    // Process uploaded images (if any).
    // If no files are provided, this block becomes a no-op.
    const files = req.files as Express.Multer.File[] | undefined;
    let images: Record<string, unknown>[] = [];
    if (files && files.length > 0) {
      images = await saveReportImages(report.id, files);
    }

    emitNotification('new_report', { ...report, images });
    sendCreated(res, { ...report, images }, `Report ${report.reference_code} submitted successfully.`);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Public): List reports with filters and pagination.
 * Supports filtering by status, category, county, and proximity (lat/lng/radius).
 */
export async function listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { reports, meta } = await reportsService.listReports({
      page, limit, offset,
      status: req.query.status as never,
      category: req.query.category as never,
      county: req.query.county as string,
      assigned_to: req.query.assigned_to as string,
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radius_km: req.query.radius_km ? parseFloat(req.query.radius_km as string) : undefined,
      sort: req.query.sort as never,
    });

    sendSuccess(res, reports, undefined, 200, meta);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Citizen): Fetch reports submitted by the logged-in user.
 */
export async function getMyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { reports, meta } = await reportsService.listReports({
      page, limit, offset,
      citizen_id: req.user!.sub,
      status: req.query.status as never,
    });

    sendSuccess(res, reports, undefined, 200, meta);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Public): Get a single report by ID, including its timeline and images.
 */
export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.getReportById(req.params.id, req.user?.sub);
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Citizen): Toggle an upvote on a specific report.
 */
export async function upvoteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await reportsService.upvoteReport(req.params.id, req.user!.sub);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Admin): List all reports (including private) with full data.
 * Applies county-level restrictions for county admins.
 */
export async function adminListReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const userFilterData = req.user ? { county: req.user.county, is_root_admin: req.user.is_root_admin ?? false } : undefined;

    const { reports, meta } = await reportsService.adminListReports({
      page, limit, offset,
      status: req.query.status as never,
      category: req.query.category as never,
      county: req.query.county as string,  // Allow filtering by county if specified
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      user: userFilterData,
    });

    sendSuccess(res, reports, undefined, 200, meta);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Admin): Update a report's status (e.g., verify, reject, resolve).
 * Also handles transitions like 'in_progress'.
 */
export async function updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Admin controls workflow transitions (verify/assign/resolve/reject) through this endpoint.
    const updated = await reportsService.updateReportStatus(req.params.id, {
      ...req.body,
      admin_id: req.user!.sub,
    });
    sendSuccess(res, updated, `Report status updated to '${updated.status}'.`);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Admin): Assign a technician to a report without changing the status.
 */
export async function assignTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Assignment is separated from status updates so admins can route technicians independently.
    const updated = await reportsService.assignReportTechnician(req.params.id, {
      ...req.body,
      admin_id: req.user!.sub,
    });

    // Notify the specific technician about the new assignment
    if (updated.assigned_to) {
      emitNotification(`technician_assigned_${updated.assigned_to}`, {
        reportId: updated.id,
        referenceCode: updated.reference_code,
        title: updated.title,
        location: updated.location_name || `${updated.county}, ${updated.sub_county}`,
      });
    }

    sendSuccess(res, updated, 'Technician assigned successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Admin): Get dashboard statistics (KPIs) for the admin overview.
 */
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await reportsService.getFilteredReportStats({
      county: req.query.county as string | undefined,
      status: req.query.status as never,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
    });
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Admin): Export filtered reports to a CSV file.
 */
export async function exportReportsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await reportsService.exportReportsForAdmin({
      page: 1,
      limit: 5000,
      offset: 0,
      status: req.query.status as never,
      category: req.query.category as never,
      county: req.query.county as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      user: req.user ? { county: req.user.county, is_root_admin: req.user.is_root_admin ?? false } : undefined,
    });
    const headers = [
      'reference_code',
      'title',
      'category',
      'severity',
      'status',
      'county',
      'sub_county',
      'ward',
      'citizen_name',
      'created_at',
      'updated_at',
    ];
    const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(',')]
      .concat(rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reports-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller (Admin): Export filtered reports and statistics to a professional PDF.
 */
export async function exportReportsPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userCtx = req.user
      ? { county: req.user.county, is_root_admin: req.user.is_root_admin ?? false }
      : undefined;
    const filterOpts = {
      county: req.query.county as string | undefined,
      status: req.query.status as never,
      category: req.query.category as never,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
    };

    logger.debug('Starting PDF export', { user: req.user?.sub, filterOpts });

    const [rows, stats] = await Promise.all([
      reportsService.exportReportsForAdmin({
        page: 1,
        limit: 5000,
        offset: 0,
        status: req.query.status as never,
        category: req.query.category as never,
        county: req.query.county as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        user: userCtx,
      }),
      reportsService.getFilteredReportStats(filterOpts),
    ]);

    logger.debug('PDF export data fetched', { rowCount: rows.length });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reports-export-${Date.now()}.pdf"`);

    const pdfBytes = await buildReportPdfBytes(rows, stats);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error('PDF export failed', { error: err });
    next(err);
  }
}

/**
 * Controller: Delete an image from a report.
 */
export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteReportImage(req.params.imageId, req.params.id);
    sendSuccess(res, null, 'Image deleted.');
  } catch (err) {
    next(err);
  }
}
