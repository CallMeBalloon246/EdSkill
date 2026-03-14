import { sql } from "./_lib/db.mjs";
import { getCurrentUserFromRequest } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const currentUser = await getCurrentUserFromRequest(req);

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Bạn cần đăng nhập" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    const {
      category_id,
      title,
      description,
      level = "beginner",
      learning_mode = "both",
      price_per_session = 0,
      exchange_only = true
    } = body;

    if (!category_id || !title || !description) {
      return new Response(JSON.stringify({ error: "Thiếu dữ liệu bắt buộc" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rows = await sql`
      insert into skills (
        user_id,
        category_id,
        title,
        description,
        level,
        learning_mode,
        price_per_session,
        exchange_only,
        status
      )
      values (
        ${currentUser.id},
        ${category_id},
        ${title},
        ${description},
        ${level},
        ${learning_mode},
        ${price_per_session},
        ${exchange_only},
        'active'
      )
      returning id, title
    `;

    return new Response(JSON.stringify({
      message: "Tạo kỹ năng thành công",
      skill: rows[0]
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
