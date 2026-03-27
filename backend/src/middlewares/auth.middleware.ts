import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';
import { sendError } from '../utils/response';

// ---------------------------------------------------------------------------
// authenticate: Validates the Bearer JWT in the Authorization header.
// Attaches the decoded payload to req.user for downstream use.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// authorize: Role-based access control gate.
// Must be used AFTER authenticate middleware.
// Usage: router.post('/admin/action', authenticate, authorize('admin'), handler)
// ---------------------------------------------------------------------------
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required.', undefined, 'AUTH_MISSING');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
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

// ---------------------------------------------------------------------------
// optionalAuth: Attaches req.user if a valid token is present, but doesn't
// reject unauthenticated requests. Used for public endpoints that show
// additional data to logged-in users (e.g., "did you upvote this?").
// ---------------------------------------------------------------------------
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
