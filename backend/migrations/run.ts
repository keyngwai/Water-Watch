/**
 * migrations/run.ts
 * ──────────────────
 * Runs all .sql migration files in order against the configured database.
 * Usage: npm run migrate
 *
 * Design: Each migration is tracked in a `schema_migrations` table.
 * Already-applied migrations are skipped.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Always load backend/.env even when invoked from repo root. Use override so a stale
// DATABASE_URL in the shell cannot shadow this file.
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

function migrateSslConfig(): false | { rejectUnauthorized: boolean } {
  const conn = process.env.DATABASE_URL ?? '';
  if (process.env.DB_SSL === 'false') return false;
  // Local Postgres typically has SSL off; remote (Supabase, RDS, …) needs TLS.
  if (/localhost|127\.0\.0\.1|::1/i.test(conn)) return false;
  if (process.env.DB_SSL === 'true') return { rejectUnauthorized: false };
  if (process.env.NODE_ENV === 'production') return { rejectUnauthorized: false };
  return false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: migrateSslConfig(),
});

async function run() {
  const client = await pool.connect();

  try {
    // Create tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`  ⏭  Skipping ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`  ✅ Applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Failed to apply ${file}:`, (err as Error).message);
        process.exit(1);
      }
    }

    console.log('\n✅ All migrations complete.\n');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration runner error:', err.message);
  process.exit(1);
});
