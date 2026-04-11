/**
 * test-admin-filter.ts
 * Quick test to verify admin county filtering is working
 * Run with: npx ts-node test-admin-filter.ts
 */
import 'dotenv/config';
import { pool } from './src/config/database';

async function main() {
  try {
    console.log('\n=== Checking Admin Users ===\n');

    const adminUsers = await pool.query(`
      SELECT id, email, full_name, role, county, is_root_admin 
      FROM users 
      WHERE role = 'admin' 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('Admin users in database:');
    adminUsers.rows.forEach((admin: any) => {
      console.log(`  - ${admin.email} (${admin.full_name})`);
      console.log(`    Role: ${admin.role}, County: ${admin.county}, Root Admin: ${admin.is_root_admin}`);
    });

    console.log('\n=== Checking Reports per County ===\n');

    const reportCounts = await pool.query(`
      SELECT county, COUNT(*) as count
      FROM reports
      GROUP BY county
      ORDER BY count DESC
    `);

    console.log('Reports by county:');
    reportCounts.rows.forEach((row: any) => {
      console.log(`  - ${row.county}: ${row.count} reports`);
    });

    console.log('\n✅ Test complete\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();
