import { Request, Response, NextFunction } from 'express';
import * as reportsService from '../services/reports.service';
import { saveReportImages, deleteReportImage } from '../services/upload.service';
import { sendSuccess, sendCreated, parsePagination } from '../utils/response';

// ---------------------------------------------------------------------------
// Citizen: Submit a new water issue report
// ---------------------------------------------------------------------------
export async function createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.createReport({
      ...req.body,
      citizen_id: req.user!.sub,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      source: 'web',
    });

    // Process uploaded images (if any) — non-blocking from the user's perspective
    const files = req.files as Express.Multer.File[] | undefined;
    let images: Record<string, unknown>[] = [];
    if (files && files.length > 0) {
      images = await saveReportImages(report.id, files);
    }

    sendCreated(res, { ...report, images }, `Report ${report.reference_code} submitted successfully.`);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Public: List reports with filters and pagination
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Citizen: View own reports
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Public: Get single report
// ---------------------------------------------------------------------------
export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.getReportById(req.params.id, req.user?.sub);
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Citizen: Upvote a report
// ---------------------------------------------------------------------------
export async function upvoteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await reportsService.upvoteReport(req.params.id, req.user!.sub);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Admin: List all reports (including private, full data)
// ---------------------------------------------------------------------------
export async function adminListReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { reports, meta } = await reportsService.adminListReports({
      page, limit, offset,
      status: req.query.status as never,
      category: req.query.category as never,
      county: req.query.county as string,  // Allow filtering by county if specified
    });

    sendSuccess(res, reports, undefined, 200, meta);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Admin: Update report status (verify, assign, resolve, reject)
// ---------------------------------------------------------------------------
export async function updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await reportsService.updateReportStatus(req.params.id, {
      ...req.body,
      admin_id: req.user!.sub,
    });
    sendSuccess(res, updated, `Report status updated to '${updated.status}'.`);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Admin: Get dashboard statistics
// ---------------------------------------------------------------------------
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Admin dashboard stats should show all reports by default.
    // Optional `county` query parameter can be used to filter.
    const stats = await reportsService.getReportStats(req.query.county as string | undefined);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Citizen/Admin: Delete an image from a report
// ---------------------------------------------------------------------------
export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteReportImage(req.params.imageId, req.params.id);
    sendSuccess(res, null, 'Image deleted.');
  } catch (err) {
    next(err);
  }
}
