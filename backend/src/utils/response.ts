import { Response } from 'express';
import { ApiResponse, ApiError, PaginationMeta } from '../types';

// ---------------------------------------------------------------------------
// Standardised response helpers
// All API responses follow { success, data?, message?, meta?, error? }
// ---------------------------------------------------------------------------

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: PaginationMeta
): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  statusCode: number,
  error: string,
  details?: Record<string, string[]>,
  code?: string
): Response {
  const body: ApiError = { success: false, error };
  if (details) body.details = details;
  if (code) body.code = code;
  return res.status(statusCode).json(body);
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  // Centralized pagination math to keep client meta usage consistent.
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function parsePagination(
  pageStr?: string,
  limitStr?: string
): { page: number; limit: number; offset: number } {
  // We clamp values to avoid invalid/huge queries.
  // - page defaults to 1
  // - limit defaults to 20 and is capped at 100
  const page = Math.max(1, parseInt(pageStr || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}
