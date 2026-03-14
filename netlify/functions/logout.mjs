import { deleteSessionByRequest, clearSessionCookie } from "./_lib/auth.mjs";

export default async (req) => {
  try {
    await deleteSessionByRequest(req);

    return new Response(JSON.stringify({ message: "Đăng xuất thành công" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": clearSessionCookie()
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
