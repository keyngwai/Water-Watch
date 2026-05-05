import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom Error Class: Structured error that carries an HTTP status code and a unique error code.
 * Use this to throw predictable, operational errors throughout the application.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler: Express middleware that catches all errors thrown or passed via next(err).
 * Standardizes error responses and logs errors with request context.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log every error with request context
  logger.error('Request error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Known, operational errors (thrown intentionally)
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // PostgreSQL constraint violations
  if ((err as NodeJS.ErrnoException).code === '23505') {
    res.status(409).json({
      success: false,
      error: 'A record with this information already exists.',
      code: 'DUPLICATE_ENTRY',
    });
    return;
  }

  if ((err as NodeJS.ErrnoException).code === '23503') {
    res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
      code: 'FOREIGN_KEY_VIOLATION',
    });
    return;
  }

  // PostgreSQL: undefined_table (e.g. forgot to run migrations after pulling refresh_sessions)
  const pgCode = (err as { code?: string }).code;
  if (pgCode === '42P01') {
    res.status(503).json({
      success: false,
      error:
        'Database schema is missing expected tables. From the repo root run: npm run migrate --prefix backend',
      code: 'SCHEMA_OUTDATED',
    });
    return;
  }

  // Unknown / programming errors — don't leak internal details in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'An internal server error occurred.' : err.message,
    code: 'INTERNAL_ERROR',
  });
}

/**
 * 404 Handler: Catches requests to routes that are not defined in the application.
 */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found.`,
    code: 'NOT_FOUND',
  });
}
