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
 * POST /api/auth/refresh
 * Rotate refresh cookie and issue a new access token (JSON body: { token }).
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Revoke refresh session and clear cookie.
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', authValidation.forgotPassword, validate, authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password using one-time token
 */
router.post('/reset-password', authValidation.resetPassword, validate, authController.resetPassword);

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
