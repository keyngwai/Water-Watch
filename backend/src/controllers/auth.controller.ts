import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';

/**
 * Helper: Attaches an httpOnly refresh token cookie to the response.
 * @param res - Express response object
 * @param refreshTokenRaw - The raw refresh token string to store in the cookie
 */
function attachAuthCookies(res: Response, refreshTokenRaw: string): void {
  res.cookie(
    authService.REFRESH_COOKIE_NAME,
    refreshTokenRaw,
    authService.getRefreshCookieOptions()
  );
}

/**
 * Controller: Handles citizen registration.
 * Hashes password, creates user, and returns access token + refresh cookie.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerCitizen(req.body);
    attachAuthCookies(res, result.refreshTokenRaw);
    sendCreated(
      res,
      { user: result.user, token: result.accessToken },
      'Account created successfully. Welcome to Maji Watch.'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Handles user login for all roles.
 * Verifies credentials and returns access token + refresh cookie.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    attachAuthCookies(res, result.refreshTokenRaw);
    sendSuccess(res, { user: result.user, token: result.accessToken }, 'Login successful.');
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Rotates the refresh token and issues a new access token.
 * Requires the 'maji_refresh' cookie to be present.
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = req.cookies?.[authService.REFRESH_COOKIE_NAME] as string | undefined;
    if (!raw) {
      sendError(res, 401, 'Refresh session required.', undefined, 'AUTH_REFRESH_MISSING');
      return;
    }
    const rotated = await authService.rotateRefreshToken(raw);
    if (!rotated) {
      const c = authService.getRefreshCookieOptions();
      res.clearCookie(authService.REFRESH_COOKIE_NAME, {
        path: c.path,
        secure: c.secure,
        sameSite: c.sameSite,
      });
      sendError(res, 401, 'Invalid or expired refresh session.', undefined, 'AUTH_REFRESH_INVALID');
      return;
    }
    attachAuthCookies(res, rotated.newRefreshToken);
    sendSuccess(res, { token: rotated.accessToken }, 'Token refreshed.');
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Logs out the user by revoking the refresh token and clearing the cookie.
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = req.cookies?.[authService.REFRESH_COOKIE_NAME] as string | undefined;
    if (raw) {
      await authService.revokeRefreshToken(raw);
    }
    const c = authService.getRefreshCookieOptions();
    res.clearCookie(authService.REFRESH_COOKIE_NAME, {
      path: c.path,
      secure: c.secure,
      sameSite: c.sameSite,
    });
    sendSuccess(res, { loggedOut: true }, 'Logged out.');
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Returns the profile of the currently authenticated user.
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // `authenticate` attaches JWT payload to `req.user`, so we can use `sub` as the user id.
    const user = await authService.getUserById(req.user!.sub);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Initiates the password reset process by sending an email.
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const frontendResetUrl = process.env.FRONTEND_RESET_URL || 'http://localhost:5173/reset-password';
    await authService.requestPasswordReset(req.body.email, frontendResetUrl, {
      ip_address: req.ip,
      user_agent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'],
    });
    sendSuccess(
      res,
      { requested: true },
      'If the email exists, a password reset link has been sent.'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Resets the password using a valid reset token.
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.resetPasswordWithToken(req.body.token, req.body.new_password, {
      ip_address: req.ip,
      user_agent: Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'],
    });
    sendSuccess(res, { reset: true }, 'Password reset successful. You can now sign in.');
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Admin: Create a new admin account
// ---------------------------------------------------------------------------

/**
 * Controller (Admin): Allows existing admins to create new administrative accounts.
 * Restricted to root admins only.
 */
export async function createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Check if the requester is a root admin
    const requesterId = req.user!.sub;
    const requester = await authService.getUserById(requesterId);
    
    if (!requester?.is_root_admin) {
      sendError(res, 403, 'Access denied. Only root administrators can create other admin accounts.', undefined, 'FORBIDDEN_ROOT_ONLY');
      return;
    }

    const admin = await authService.createAdminUser({
      ...req.body,
      role: 'admin',
    });
    sendCreated(res, admin, 'Admin account created successfully.');
  } catch (err) {
    next(err);
  }
}



