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
  public readonly suggestion?: string;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true,
    suggestion?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.suggestion = suggestion;
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
      suggestion: err.suggestion,
    });
    return;
  }

  // PostgreSQL constraint violations
  if ((err as NodeJS.ErrnoException).code === '23505') {
    res.status(409).json({
      success: false,
      error: 'A record with this information already exists.',
      code: 'DUPLICATE_ENTRY',
      suggestion: 'Please check your input (e.g., email or reference code) and try a different value.',
    });
    return;
  }

  if ((err as NodeJS.ErrnoException).code === '23503') {
    res.status(400).json({
      success: false,
      error: 'Referenced record does not exist.',
      code: 'FOREIGN_KEY_VIOLATION',
      suggestion: 'The item you are trying to link to might have been deleted. Please refresh and try again.',
    });
    return;
  }

  // PostgreSQL: undefined_table (e.g. forgot to run migrations)
  const pgCode = (err as { code?: string }).code;
  if (pgCode === '42P01') {
    res.status(503).json({
      success: false,
      error: 'Database schema is missing expected tables.',
      code: 'SCHEMA_OUTDATED',
      suggestion: 'The system administrator needs to run database migrations: npm run migrate --prefix backend',
    });
    return;
  }

  // Handle ECONNRESET
  if (pgCode === 'ECONNRESET' || err.message?.includes('ECONNRESET')) {
    res.status(503).json({
      success: false,
      error: 'Database connection was reset.',
      code: 'DB_CONNECTION_RESET',
      suggestion: 'The connection to the database was temporarily lost. Please wait a few seconds and try your request again.',
    });
    return;
  }

  // Unknown / programming errors — don't leak internal details in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProduction ? 'An internal server error occurred.' : err.message,
    code: 'INTERNAL_ERROR',
    suggestion: 'This appears to be a system error. If it persists, please contact technical support.',
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
