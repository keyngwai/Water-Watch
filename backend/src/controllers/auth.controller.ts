import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerCitizen(req.body);
    sendCreated(res, result, 'Account created successfully. Welcome to Maji Watch.');
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    sendSuccess(res, result, 'Login successful.');
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
