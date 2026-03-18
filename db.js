const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Thiếu biến môi trường DATABASE_URL.');
}

const shouldUseSsl =
  String(process.env.DATABASE_SSL || 'false').toLowerCase() === 'true';

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Postgres pool error:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
  });
});

async function testConnection() {
  const result = await pool.query('SELECT NOW() AS connected_at, current_database() AS db_name, current_schema() AS schema_name');
  return result.rows[0];
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
};