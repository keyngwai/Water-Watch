import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { authValidation, validate } from '../middlewares/validation.middleware';


const router = Router();

// ---------------------------------------------------------------------------
// Authentication Routes
// Handles user registration, login, session management, and password recovery.
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Public: Allows citizens to create a new account.
 */
router.post('/register', authValidation.register, validate, authController.register);

/**
 * POST /api/auth/login
 * Public: Authenticates users and returns access token + refresh cookie.
 */
router.post('/login', authValidation.login, validate, authController.login);

/**
 * POST /api/auth/refresh
 * Public: Uses the refresh cookie to issue a new short-lived access token.
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Public: Revokes the current session and clears auth cookies.
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/forgot-password
 * Public: Sends a password reset link to the provided email address.
 */
router.post('/forgot-password', authValidation.forgotPassword, validate, authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Public: Resets the password using a valid token from the reset email.
 */
router.post('/reset-password', authValidation.resetPassword, validate, authController.resetPassword);

/**
 * GET /api/auth/me
 * Private: Returns the profile of the currently logged-in user.
 */
router.get('/me', authenticate, authController.getMe);

/**
 * POST /api/auth/admin/create
 * Admin: Allows authorized administrators to create other administrative accounts.
 */
router.post('/admin/create', authenticate, authorize('admin'), authValidation.createAdmin, validate, authController.createAdmin);


export default router;
