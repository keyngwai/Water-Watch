import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.middleware';
import { reportValidation, validate } from '../middlewares/validation.middleware';
import { uploadMiddleware } from '../services/upload.service';

const router = Router();

// ---------------------------------------------------------------------------
// Public Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/reports
 * Public: List reports with filtering, pagination, and proximity search.
 */
router.get('/', reportValidation.list, validate, optionalAuth, reportsController.listReports);

/**
 * GET /api/reports/:id
 * Public: Get a single report with its full details, images, and public timeline.
 */
router.get('/:id', optionalAuth, reportsController.getReport);

// ---------------------------------------------------------------------------
// Citizen Routes
// Features restricted to registered citizens.
// ---------------------------------------------------------------------------

/**
 * POST /api/reports
 * Citizen: Submit a new water issue report with up to 5 optional images.
 */
router.post(
  '/',
  authenticate,
  authorize('citizen', 'admin'),
  uploadMiddleware.array('images', 5),
  reportValidation.create,
  validate,
  reportsController.createReport
);

/**
 * GET /api/reports/my/reports
 * Citizen: Returns a list of reports submitted by the authenticated user.
 */
router.get('/my/reports', authenticate, authorize('citizen'), reportsController.getMyReports);

/**
 * POST /api/reports/:id/upvote
 * Citizen: Toggles a community upvote on a specific report.
 */
router.post('/:id/upvote', authenticate, authorize('citizen'), reportsController.upvoteReport);

/**
 * DELETE /api/reports/:id/images/:imageId
 * Citizen: Deletes an image from a report. (Authentication required).
 */
router.delete('/:id/images/:imageId', authenticate, reportsController.deleteImage);

// ---------------------------------------------------------------------------
// Admin Routes
// Advanced management features restricted to authorized administrators.
// ---------------------------------------------------------------------------

/**
 * GET /api/reports/admin/all
 * Admin: List all reports, including non-public ones, with full diagnostic data.
 */
router.get(
  '/admin/all',
  authenticate,
  authorize('admin'),
  reportValidation.list,
  validate,
  reportsController.adminListReports
);

/**
 * GET /api/reports/admin/stats
 * Admin: Returns aggregated statistics and KPIs for the dashboard.
 */
router.get('/admin/stats', authenticate, authorize('admin'), reportValidation.analytics, validate, reportsController.getStats);

/**
 * GET /api/reports/admin/export.csv
 * Admin: Downloads a CSV file of filtered report data for offline analysis.
 */
router.get('/admin/export.csv', authenticate, authorize('admin'), reportValidation.analytics, validate, reportsController.exportReportsCsv);

/**
 * GET /api/reports/admin/export.pdf
 * Admin: Generates and downloads a professional PDF summary of reports and stats.
 */
router.get('/admin/export.pdf', authenticate, authorize('admin'), reportValidation.analytics, validate, reportsController.exportReportsPdf);

/**
 * PATCH /api/reports/:id/status
 * Admin: Updates a report's status, assigns a technician, or adds an official comment.
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  reportValidation.updateStatus,
  validate,
  reportsController.updateReportStatus
);

/**
 * PATCH /api/reports/:id/assign
 * Admin: Directly assigns a field technician to a report without triggering a status change.
 */
router.patch(
  '/:id/assign',
  authenticate,
  authorize('admin'),
  reportValidation.assignTechnician,
  validate,
  reportsController.assignTechnician
);

export default router;
