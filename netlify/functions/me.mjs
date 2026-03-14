import { getCurrentUserFromRequest } from "./_lib/auth.mjs";

export default async (req) => {
  try {
    const user = await getCurrentUserFromRequest(req);

    if (!user) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      authenticated: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        bio: user.bio,
        city: user.city,
        role: user.role
      }
    }), {
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
