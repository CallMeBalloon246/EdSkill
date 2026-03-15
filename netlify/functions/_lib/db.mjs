import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function buildQuery(strings, values) {
  let text = "";

  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }

  return { text, values };
}

export async function sql(strings, ...values) {
  const { text, values: params } = buildQuery(strings, values);
  const result = await pool.query(text, params);
  return result.rows;
}

export { pool };
export default sql;