import { sql } from "./_lib/db.mjs";
import { getCurrentUserFromRequest } from "./_lib/auth.mjs";

export default async (req) => {
  try {
    const currentUser = await getCurrentUserFromRequest(req);

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Bạn cần đăng nhập" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rows = await sql`
      select
        s.id,
        s.title,
        s.description,
        s.level,
        s.learning_mode,
        s.price_per_session,
        s.exchange_only,
        s.status,
        c.name as category_name
      from skills s
      left join skill_categories c on c.id = s.category_id
      where s.user_id = ${currentUser.id}
      order by s.created_at desc
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
