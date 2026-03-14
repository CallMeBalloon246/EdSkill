import { sql } from "./_lib/db.mjs";
import { hashPassword, createSession, buildSessionCookie } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const {
      full_name,
      email,
      password,
      city = "",
      bio = ""
    } = body;

    if (!full_name || !email || !password) {
      return new Response(JSON.stringify({ error: "Thiếu dữ liệu bắt buộc" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Mật khẩu phải từ 8 ký tự" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const existing = await sql`
      select id from users where email = ${email.toLowerCase().trim()} limit 1
    `;

    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: "Email đã tồn tại" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    const passwordHash = hashPassword(password);

    const rows = await sql`
      insert into users (full_name, email, bio, city, password_hash, role, status)
      values (
        ${full_name.trim()},
        ${email.toLowerCase().trim()},
        ${bio.trim()},
        ${city.trim()},
        ${passwordHash},
        'member',
        'active'
      )
      returning id, full_name, email, city
    `;

    const user = rows[0];
    const rawToken = await createSession(user.id);

    return new Response(JSON.stringify({
      message: "Đăng ký thành công",
      user
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildSessionCookie(rawToken)
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
