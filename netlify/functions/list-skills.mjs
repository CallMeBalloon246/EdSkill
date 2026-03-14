import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async () => {
  try {
    const rows = await sql`
      select id, title, description
      from skills
      order by id desc
    `;

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
