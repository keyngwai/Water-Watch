import { Router } from 'express';
import * as techController from '../controllers/technicians.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { technicianValidation, validate } from '../middlewares/validation.middleware';

const router = Router();

/**
 * GET /api/technicians
 * Admin: List all technicians, optionally filtered by county.
 * Returns enriched data including active assignment counts.
 */
router.get('/', authenticate, authorize('admin'), techController.listTechnicians);

/**
 * GET /api/technicians/:id
 * Admin: Retrieve a specific technician's profile and linked user information.
 */
router.get('/:id', authenticate, authorize('admin'), techController.getTechnician);

/**
 * POST /api/technicians
 * Admin: Register a new technician (creates user account + technician profile).
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  technicianValidation.create,
  validate,
  techController.createTechnician
);

/**
 * DELETE /api/technicians/:id
 * Admin: Deletes a technician and their associated user account.
 */
router.delete('/:id', authenticate, authorize('admin'), techController.deleteTechnician);

export default router;
