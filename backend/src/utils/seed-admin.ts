/**
 * seed-admin.ts
 * ─────────────
 * One-time script to bootstrap the first admin account.
 * Run with: npm run seed:admin
 *
 * Uses SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from .env.
 * Change these values in .env before running.
 */
import 'dotenv/config';
import { createAdminUser } from '../services/auth.service';
import { pool } from '../config/database';
import { logger } from './logger';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME || 'County Water Authority Admin';
  const county = process.env.SEED_ADMIN_COUNTY || 'Nairobi';

  if (!email || !password) {
    logger.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    const admin = await createAdminUser({
      email,
      password,
      full_name: fullName,
      county,
      role: 'admin',
    });

    logger.info('Admin account created successfully', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      county: admin.county,
    });

    console.log('\n✅ Admin account created:');
    console.log(`   Email:  ${admin.email}`);
    console.log(`   Role:   ${admin.role}`);
    console.log(`   County: ${admin.county}`);
    console.log('\n⚠️  Change the password immediately after first login!\n');
  } catch (err) {
    if ((err as { code?: string }).code === 'EMAIL_TAKEN') {
      logger.warn('Admin account already exists for this email.', { email });
    } else {
      logger.error('Failed to create admin', { error: (err as Error).message });
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main();
