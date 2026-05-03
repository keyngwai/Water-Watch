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
 * List public reports with filtering, pagination, proximity search
 */
router.get('/', reportValidation.list, validate, optionalAuth, reportsController.listReports);

/**
 * GET /api/reports/:id
 * Get a single public report with images and timeline
 */
router.get('/:id', optionalAuth, reportsController.getReport);

// ---------------------------------------------------------------------------
// Citizen Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/reports
 * Submit a new water issue report (with optional image uploads)
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
 * Citizen views their own reports (all statuses)
 */
router.get('/my/reports', authenticate, authorize('citizen'), reportsController.getMyReports);

/**
 * POST /api/reports/:id/upvote
 * Toggle upvote on a report
 */
router.post('/:id/upvote', authenticate, authorize('citizen'), reportsController.upvoteReport);

/**
 * DELETE /api/reports/:id/images/:imageId
 * Remove an image from a report (citizen can only delete their own report's images)
 */
router.delete('/:id/images/:imageId', authenticate, reportsController.deleteImage);

// ---------------------------------------------------------------------------
// Admin Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/reports/admin/all
 * Admin list with full data, no is_public filter
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
 * Dashboard statistics: counts by status, category, daily trend
 */
router.get('/admin/stats', authenticate, authorize('admin'), reportValidation.analytics, validate, reportsController.getStats);

/**
 * GET /api/reports/admin/export.csv
 * Export filtered reports as CSV
 */
router.get('/admin/export.csv', authenticate, authorize('admin'), reportValidation.analytics, validate, reportsController.exportReportsCsv);

/**
 * GET /api/reports/admin/export.pdf
 * Export filtered reports as PDF
 */
router.get('/admin/export.pdf', authenticate, authorize('admin'), reportValidation.analytics, validate, reportsController.exportReportsPdf);

/**
 * PATCH /api/reports/:id/status
 * Update status, assign technician, add admin comment
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
 * Assign technician to a report without changing status
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
