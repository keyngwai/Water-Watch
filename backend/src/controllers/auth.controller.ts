import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';

function attachAuthCookies(res: Response, refreshTokenRaw: string): void {
  res.cookie(
    authService.REFRESH_COOKIE_NAME,
    refreshTokenRaw,
    authService.getRefreshCookieOptions()
  );
}

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

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    attachAuthCookies(res, result.refreshTokenRaw);
    sendSuccess(res, { user: result.user, token: result.accessToken }, 'Login successful.');
  } catch (err) {
    next(err);
  }
}

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

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // `authenticate` attaches JWT payload to `req.user`, so we can use `sub` as the user id.
    const user = await authService.getUserById(req.user!.sub);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

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
export async function createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = await authService.createAdminUser({
      ...req.body,
      role: 'admin',
    });
    sendCreated(res, admin, 'Admin account created successfully.');
  } catch (err) {
    next(err);
  }
}



