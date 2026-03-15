require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    const hash = await bcrypt.hash('AdminPass123', 10);
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [hash, 'konahamaru566@gmail.com']
    );

    console.log('Updated password for konahamaru566@gmail.com to AdminPass123');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
