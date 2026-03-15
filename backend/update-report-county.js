require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    await pool.query(
      `UPDATE reports SET county = $1 WHERE id = $2`,
      ['Nairobi', 'df6e9c12-f3b9-4162-bace-9e27e5161fe3']
    );

    console.log('Updated report county to Nairobi');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
