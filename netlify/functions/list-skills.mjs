import { sql } from "./_lib/db.mjs";

export default async () => {
  try {
    const rows = await sql`
      select
        s.id,
        s.title,
        coalesce(s.detailed_description, s.description) as detailed_description,
        s.delivery_score,
        s.expertise_score,
        s.session_duration_hours,
        s.learning_modes,
        s.learning_days,
        u.full_name as teacher_name,
        c.name as category_name
      from skills s
      join users u on u.id = s.user_id
      left join skill_categories c on c.id = s.category_id
      where s.status = 'active'
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
