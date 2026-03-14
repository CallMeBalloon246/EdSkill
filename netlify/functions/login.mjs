import { sql } from "./_lib/db.mjs";
import {
  verifyPassword,
  createSession,
  buildSessionCookie
} from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Thiếu email hoặc mật khẩu" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rows = await sql`
      select id, full_name, email, password_hash, status
      from users
      where email = ${email.toLowerCase().trim()}
      limit 1
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "Sai email hoặc mật khẩu" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = rows[0];

    if (user.status !== "active") {
      return new Response(JSON.stringify({ error: "Tài khoản không hoạt động" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ok = verifyPassword(password, user.password_hash);

    if (!ok) {
      return new Response(JSON.stringify({ error: "Sai email hoặc mật khẩu" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawToken = await createSession(user.id);

    return new Response(JSON.stringify({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      }
    }), {
      status: 200,
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
