import { queryOne } from '../config/database';

const REQUIRED_TABLES = [
  'users',
  'reports',
  'report_images',
  'admin_actions',
  'report_upvotes',
  'password_resets',
  'security_events',
];

async function run(): Promise<void> {
  for (const table of REQUIRED_TABLES) {
    const result = await queryOne<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
      [table]
    );

    if (!result?.exists) {
      throw new Error(`DB sanity failed: missing table '${table}'.`);
    }
  }

  const pendingResets = await queryOne<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM password_resets
    WHERE used = FALSE
      AND expires_at < NOW()
  `
  );

  console.log('DB sanity check passed.', {
    tables_checked: REQUIRED_TABLES.length,
    expired_unused_reset_tokens: parseInt(pendingResets?.count ?? '0', 10),
  });
}

run().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
