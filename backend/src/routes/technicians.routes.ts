import { Router } from 'express';
import * as techController from '../controllers/technicians.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/technicians
 * Admin: list all technicians, optionally filtered by county
 */
router.get('/', authenticate, authorize('admin'), techController.listTechnicians);

/**
 * GET /api/technicians/:id
 * Admin: get a specific technician's profile and assignment history
 */
router.get('/:id', authenticate, authorize('admin'), techController.getTechnician);

/**
 * POST /api/technicians
 * Admin: register a new technician (creates user account + technician profile)
 */
router.post('/', authenticate, authorize('admin'), techController.createTechnician);

/**
 * DELETE /api/technicians/:id
 * Admin: delete a technician and their user account
 */
router.delete('/:id', authenticate, authorize('admin'), techController.deleteTechnician);

export default router;
