import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Database Configuration
// ---------------------------------------------------------------------------
// Uses a connection pool backed by the DATABASE_URL environment variable.
// Supabase requires SSL in production; the ssl config handles this gracefully.
// ---------------------------------------------------------------------------

const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 10_000, // Reduced from 30s to 10s to clear stale connections faster
  connectionTimeoutMillis: 5_000,
  // keepAlive helps prevent ECONNRESET by sending periodic pings to the server
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: isProduction || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

// Handle pool errors globally to prevent unhandled rejections
pool.on('error', (err) => {
  // Check for ECONNRESET specifically
  if ((err as any).code === 'ECONNRESET' || (err as any).message?.includes('ECONNRESET')) {
    logger.warn('PostgreSQL pool connection reset (ECONNRESET). The pool will recover automatically.', { error: err.message });
  } else {
    logger.error('Unexpected PostgreSQL pool error', { error: err.message });
  }
});

// ---------------------------------------------------------------------------
// query: Thin wrapper for one-off queries (auto-releases client)
// ---------------------------------------------------------------------------
export async function query<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  // Wrapper so we can log query duration and keep the rest of the codebase clean.
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { duration_ms: duration, rows: result.rowCount });
    return result.rows;
  } catch (err) {
    logger.error('Query failed', { query: text, error: (err as Error).message });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// queryOne: Returns first row or null
// ---------------------------------------------------------------------------
export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// withTransaction: Wraps multiple queries in a single transaction
// ---------------------------------------------------------------------------
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error: (err as Error).message });
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// healthCheck: Used by /health endpoint
// ---------------------------------------------------------------------------
export async function dbHealthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
