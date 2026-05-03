import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import type { CookieOptions } from 'express';
import { queryOne, query, withTransaction } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { UserRow, JwtPayload, UserRole } from '../types';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// AuthService: Handles citizen registration, login for all roles.
// Password hashing uses bcrypt with cost factor 12 (OWASP recommended).
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSessionResult {
  user: Omit<UserRow, 'password_hash'>;
  accessToken: string;
  refreshTokenRaw: string;
}

export const REFRESH_COOKIE_NAME = 'maji_refresh';

const REFRESH_TOKEN_BYTES = 32;

function refreshTokenTtlMs(): number {
  const days = parseInt(process.env.REFRESH_TOKEN_DAYS || '14', 10);
  return Math.max(1, days) * 24 * 60 * 60 * 1000;
}

export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: refreshTokenTtlMs(),
  };
}

function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

async function insertRefreshSession(userId: string): Promise<{ rawToken: string }> {
  const rawToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs());
  await query(
    'INSERT INTO refresh_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
  return { rawToken };
}

interface PasswordResetRow {
  id: number;
  user_id: string;
  token: string;
  expires_at: Date;
  used: boolean;
  [key: string]: unknown;
}

interface SecurityEventInput {
  event_type: string;
  user_id?: string | null;
  email?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
}

export async function registerCitizen(input: RegisterInput): Promise<AuthSessionResult> {
  // Check for duplicate email
  const existing = await queryOne<UserRow>(
    'SELECT id FROM users WHERE email = $1',
    [input.email]
  );
  if (existing) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const rows = await query<UserRow>(`
    INSERT INTO users (email, password_hash, full_name, phone, role, county, sub_county, ward)
    VALUES ($1, $2, $3, $4, 'citizen', $5, $6, $7)
    RETURNING id, email, phone, full_name, role, county, sub_county, ward,
              is_root_admin, is_active, is_email_verified, last_login_at, created_at, updated_at
  `, [input.email, passwordHash, input.full_name, input.phone ?? null,
      input.county ?? null, input.sub_county ?? null, input.ward ?? null]);

  const user = rows[0];
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    county: user.county,
    is_root_admin: user.is_root_admin ?? false,
  });
  const { rawToken } = await insertRefreshSession(user.id);

  return { user, accessToken, refreshTokenRaw: rawToken };
}

export async function loginUser(input: LoginInput): Promise<AuthSessionResult> {
  const user = await queryOne<UserRow>(
    `SELECT id, email, phone, full_name, password_hash, role, county, sub_county, ward,
            is_root_admin, is_active, is_email_verified, last_login_at, created_at, updated_at
     FROM users WHERE email = $1`,
    [input.email]
  );

  // Constant-time comparison to prevent timing attacks
  if (!user) {
    await bcrypt.compare(input.password, '$2b$12$invalidhashpadding000000000000000000000000000000000000');
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.is_active) {
    throw new AppError('This account has been deactivated. Contact your county water authority.', 403, 'ACCOUNT_INACTIVE');
  }

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login timestamp
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  logger.debug('Creating JWT token for user login', {
    id: user.id,
    email: user.email,
    role: user.role,
    county: user.county,
    is_root_admin: user.is_root_admin,
  });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    county: user.county,
    is_root_admin: user.is_root_admin ?? false,
  });
  const { rawToken } = await insertRefreshSession(user.id);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeUser } = user;
  return {
    user: safeUser as Omit<UserRow, 'password_hash'>,
    accessToken,
    refreshTokenRaw: rawToken,
  };
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ accessToken: string; newRefreshToken: string } | null> {
  const tokenHash = hashRefreshToken(rawToken);
  return withTransaction(async (client) => {
    const locked = await client.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      revoked_at: Date | null;
    }>(
      `SELECT id, user_id, expires_at, revoked_at
       FROM refresh_sessions
       WHERE token_hash = $1
       FOR UPDATE`,
      [tokenHash]
    );
    const row = locked.rows[0];
    if (!row || row.revoked_at || new Date(row.expires_at).getTime() < Date.now()) {
      return null;
    }

    await client.query('UPDATE refresh_sessions SET revoked_at = NOW() WHERE id = $1', [row.id]);

    const userResult = await client.query<{
      id: string;
      email: string;
      role: UserRole;
      county: string | null;
      is_root_admin: boolean;
      is_active: boolean;
    }>('SELECT id, email, role, county, is_root_admin, is_active FROM users WHERE id = $1', [
      row.user_id,
    ]);
    const u = userResult.rows[0];
    if (!u?.is_active) {
      return null;
    }

    const newRaw = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const newHash = hashRefreshToken(newRaw);
    const expiresAt = new Date(Date.now() + refreshTokenTtlMs());
    await client.query(
      'INSERT INTO refresh_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [u.id, newHash, expiresAt]
    );

    const accessToken = signAccessToken({
      sub: u.id,
      role: u.role,
      email: u.email,
      county: u.county,
      is_root_admin: u.is_root_admin ?? false,
    });
    return { accessToken, newRefreshToken: newRaw };
  });
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await query(
    `UPDATE refresh_sessions
     SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}

export async function getUserById(id: string): Promise<Omit<UserRow, 'password_hash'> | null> {
  return queryOne<Omit<UserRow, 'password_hash'>>(
    `SELECT id, email, phone, full_name, role, county, sub_county, ward,
            is_root_admin, is_active, is_email_verified, last_login_at, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
}

export async function requestPasswordReset(
  email: string,
  frontendResetUrl: string,
  context?: { ip_address?: string; user_agent?: string }
): Promise<void> {
  const user = await queryOne<Pick<UserRow, 'id' | 'email' | 'full_name'>>(
    'SELECT id, email, full_name FROM users WHERE email = $1',
    [email]
  );

  // Do not reveal whether this email exists.
  if (!user) {
    await recordSecurityEvent({
      event_type: 'password_reset_requested_unknown_email',
      email,
      ip_address: context?.ip_address ?? null,
      user_agent: context?.user_agent ?? null,
    });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await query(
    `INSERT INTO password_resets (user_id, token, expires_at, used)
     VALUES ($1, $2, $3, FALSE)`,
    [user.id, token, expiresAt]
  );
  await query('UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND token <> $2 AND used = FALSE', [
    user.id,
    token,
  ]);

  const resetLink = `${frontendResetUrl}${frontendResetUrl.includes('?') ? '&' : '?'}token=${token}`;
  const host = process.env.EMAIL_HOST;
  const userName = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || 'no-reply@majiwatch.local';

  if (!host || !userName || !password) {
    logger.warn('Email config not set; reset link logged for development', {
      email: user.email,
      resetLink,
    });
    await recordSecurityEvent({
      event_type: 'password_reset_requested',
      user_id: user.id,
      email: user.email,
      ip_address: context?.ip_address ?? null,
      user_agent: context?.user_agent ?? null,
      metadata: { delivery: 'log_only' },
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: userName, pass: password },
  });

  await transporter.sendMail({
    from,
    to: user.email,
    subject: 'Maji Watch Password Reset',
    text: `Hi ${user.full_name},\n\nUse this link to reset your password (valid for 30 minutes):\n${resetLink}\n\nIf you did not request this, ignore this message.`,
    html: `<p>Hi ${user.full_name},</p><p>Use this link to reset your password (valid for 30 minutes):</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, ignore this message.</p>`,
  });

  logger.info('Password reset email sent', { email: user.email });
  await recordSecurityEvent({
    event_type: 'password_reset_requested',
    user_id: user.id,
    email: user.email,
    ip_address: context?.ip_address ?? null,
    user_agent: context?.user_agent ?? null,
    metadata: { delivery: 'email' },
  });
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
  context?: { ip_address?: string; user_agent?: string }
): Promise<void> {
  const resetRow = await queryOne<PasswordResetRow>(
    `SELECT id, user_id, token, expires_at, used
     FROM password_resets
     WHERE token = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [token]
  );

  if (!resetRow) {
    await recordSecurityEvent({
      event_type: 'password_reset_failed_invalid_token',
      ip_address: context?.ip_address ?? null,
      user_agent: context?.user_agent ?? null,
      metadata: { token_prefix: token.slice(0, 8) },
    });
    throw new AppError('Invalid or expired reset token.', 400, 'INVALID_RESET_TOKEN');
  }

  if (resetRow.used || new Date(resetRow.expires_at).getTime() < Date.now()) {
    await recordSecurityEvent({
      event_type: 'password_reset_failed_expired_or_used',
      user_id: resetRow.user_id,
      ip_address: context?.ip_address ?? null,
      user_agent: context?.user_agent ?? null,
    });
    throw new AppError('Invalid or expired reset token.', 400, 'INVALID_RESET_TOKEN');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await query('BEGIN');
  try {
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      passwordHash,
      resetRow.user_id,
    ]);
    await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetRow.id]);
    await query(
      'UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND id <> $2 AND used = FALSE',
      [resetRow.user_id, resetRow.id]
    );
    await query('COMMIT');
    await recordSecurityEvent({
      event_type: 'password_reset_completed',
      user_id: resetRow.user_id,
      ip_address: context?.ip_address ?? null,
      user_agent: context?.user_agent ?? null,
    });
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Admin user creation (internal, called during seeding or by super-admin)
// ---------------------------------------------------------------------------
export async function createAdminUser(
  input: RegisterInput & { role: UserRole; is_root_admin?: boolean }
): Promise<Omit<UserRow, 'password_hash'>> {
  const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing) {
    throw new AppError('Admin account already exists.', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const rows = await query<Omit<UserRow, 'password_hash'>>(`
    INSERT INTO users (email, password_hash, full_name, phone, role, county, is_root_admin, is_email_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    RETURNING id, email, phone, full_name, role, county, sub_county, ward,
              is_root_admin, is_active, is_email_verified, last_login_at, created_at, updated_at
  `, [input.email, passwordHash, input.full_name, input.phone ?? null, input.role, input.county ?? null, input.is_root_admin ?? false]);

  return rows[0];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function signAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(
      'JWT_SECRET is not configured. Set it in backend/.env (minimum 32 random characters).',
      503,
      'AUTH_CONFIG_MISSING'
    );
  }

  return (jwt.sign as any)(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'maji-watch-api',
  });
}

async function recordSecurityEvent(event: SecurityEventInput): Promise<void> {
  try {
    await query(
      `INSERT INTO security_events (user_id, event_type, email, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        event.user_id ?? null,
        event.event_type,
        event.email ?? null,
        event.ip_address ?? null,
        event.user_agent ?? null,
        JSON.stringify(event.metadata ?? {}),
      ]
    );
  } catch (error) {
    logger.warn('Failed to persist security event', {
      event_type: event.event_type,
      error: (error as Error).message,
    });
  }
}
