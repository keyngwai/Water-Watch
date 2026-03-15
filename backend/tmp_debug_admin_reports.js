require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const axios = require('axios');

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    const res = await pool.query(
      `SELECT id, email, role, county FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT 1`,
      ['admin']
    );
    const user = res.rows[0];
    await pool.end();

    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email, county: user.county }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const resp = await axios.get('http://localhost:3000/api/reports/admin/all', {
      headers: { Authorization: 'Bearer ' + token },
    });

    console.log('admin user county:', user.county);
    console.log('reports:', resp.data.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
