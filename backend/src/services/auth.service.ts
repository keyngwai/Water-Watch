import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, query } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { UserRow, JwtPayload, UserRole } from '../types';

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

interface AuthResult {
  user: Omit<UserRow, 'password_hash'>;
  token: string;
}

export async function registerCitizen(input: RegisterInput): Promise<AuthResult> {
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
              is_active, is_email_verified, last_login_at, created_at, updated_at
  `, [input.email, passwordHash, input.full_name, input.phone ?? null,
      input.county ?? null, input.sub_county ?? null, input.ward ?? null]);

  const user = rows[0];
  const token = signToken({ sub: user.id, role: user.role, email: user.email });

  return { user, token };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await queryOne<UserRow>(
    `SELECT id, email, phone, full_name, password_hash, role, county, sub_county, ward,
            is_active, is_email_verified, last_login_at, created_at, updated_at
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

  const token = signToken({ sub: user.id, role: user.role, email: user.email });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeUser } = user;
  return { user: safeUser as Omit<UserRow, 'password_hash'>, token };
}

export async function getUserById(id: string): Promise<Omit<UserRow, 'password_hash'> | null> {
  return queryOne<Omit<UserRow, 'password_hash'>>(
    `SELECT id, email, phone, full_name, role, county, sub_county, ward,
            is_active, is_email_verified, last_login_at, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
}

// ---------------------------------------------------------------------------
// Admin user creation (internal, called during seeding or by super-admin)
// ---------------------------------------------------------------------------
export async function createAdminUser(
  input: RegisterInput & { role: UserRole }
): Promise<Omit<UserRow, 'password_hash'>> {
  const existing = await queryOne<UserRow>('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing) {
    throw new AppError('Admin account already exists.', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const rows = await query<Omit<UserRow, 'password_hash'>>(`
    INSERT INTO users (email, password_hash, full_name, phone, role, county, is_email_verified)
    VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    RETURNING id, email, phone, full_name, role, county, sub_county, ward,
              is_active, is_email_verified, last_login_at, created_at, updated_at
  `, [input.email, passwordHash, input.full_name, input.phone ?? null, input.role, input.county ?? null]);

  return rows[0];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  return (jwt.sign as any)(payload, secret, {

    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'maji-watch-api',
  });
}
