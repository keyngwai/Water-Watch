import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';
import { sendError } from '../utils/response';

/**
 * Middleware: Validates the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user for downstream use.
 * Rejects requests with missing, invalid, or expired tokens.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // We expect a standard `Authorization: Bearer <jwt>` header.
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'Authentication required. Provide a Bearer token.', undefined, 'AUTH_MISSING');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    // `req.user` is attached for downstream controller logic (role checks, citizen id, etc.).
    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log(`[AUTH] Decoded token for user ${decoded.sub}: role=${decoded.role}`);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      sendError(res, 401, 'Token has expired. Please log in again.', undefined, 'AUTH_EXPIRED');
    } else if (err instanceof jwt.JsonWebTokenError) {
      sendError(res, 401, 'Invalid token.', undefined, 'AUTH_INVALID');
    } else {
      sendError(res, 500, 'Authentication error.', undefined, 'AUTH_ERROR');
    }
  }
}

/**
 * Middleware: Role-based access control gate.
 * Must be used AFTER authenticate middleware.
 * @param allowedRoles - Array of roles permitted to access the route.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required.', undefined, 'AUTH_MISSING');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`[AUTH] 403 Forbidden: User role '${req.user.role}' not in allowed roles: ${allowedRoles.join(', ')}`);
      sendError(
        res,
        403,
        `Access denied. Requires one of: ${allowedRoles.join(', ')}.`,
        undefined,
        'AUTH_FORBIDDEN'
      );
      return;
    }

    next();
  };
}

/**
 * Middleware: Attaches req.user if a valid token is present, but doesn't reject unauthenticated requests.
 * Used for public endpoints that show additional data to logged-in users.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  // Optional JWT parsing so public endpoints can still personalize UI for logged-in users.
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET!;
      req.user = jwt.verify(token, secret) as JwtPayload;
    } catch {
      // Silently ignore invalid tokens for optional auth routes
    }
  }

  next();
}
