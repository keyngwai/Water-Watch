import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { authValidation, validate } from '../middlewares/validation.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Citizen self-registration
 */
router.post('/register', authValidation.register, validate, authController.register);

/**
 * POST /api/auth/login
 * Login for all roles (citizen, admin, technician)
 */
router.post('/login', authValidation.login, validate, authController.login);

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
router.get('/me', authenticate, authController.getMe);

/**
 * POST /api/auth/admin/create
 * Admin creates a new admin account
 */
router.post('/admin/create', authenticate, authorize('admin'), authValidation.createAdmin, validate, authController.createAdmin);

export default router;
