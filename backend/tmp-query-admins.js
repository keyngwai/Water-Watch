require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    const res = await pool.query(
      `SELECT id, email, full_name, county, role, created_at
       FROM users
       WHERE role = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      ['admin']
    );

    console.log(res.rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
