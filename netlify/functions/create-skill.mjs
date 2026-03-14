import { sql } from "./_lib/db.mjs";
import { getCurrentUserFromRequest } from "./_lib/auth.mjs";

function normalizeModes(modes) {
  if (!Array.isArray(modes)) return [];
  return [...new Set(modes.map(x => String(x).toLowerCase().trim()))]
    .filter(x => ["online", "offline"].includes(x));
}

function normalizeDays(days) {
  if (!Array.isArray(days)) return [];
  return [...new Set(days.map(x => String(x).toLowerCase().trim()))]
    .filter(x =>
      ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].includes(x)
    );
}

function mapLegacyLearningMode(modes) {
  if (modes.includes("online") && modes.includes("offline")) return "both";
  if (modes.includes("offline")) return "offline";
  return "online";
}

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

    const categoryId = Number(body.category_id);
    const title = String(body.title || "").trim();
    const detailedDescription = String(body.detailed_description || "").trim();

    const deliveryScore = Number(body.delivery_score);
    const expertiseScore = Number(body.expertise_score);
    const sessionDurationHours = Number(body.session_duration_hours);

    const learningModes = normalizeModes(body.learning_modes);
    const learningDays = normalizeDays(body.learning_days);

    if (!categoryId || !title || !detailedDescription) {
      return new Response(JSON.stringify({
        error: "Thiếu danh mục, tiêu đề hoặc mô tả chi tiết kỹ năng"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (
      Number.isNaN(deliveryScore) ||
      deliveryScore < 0 ||
      deliveryScore > 1000
    ) {
      return new Response(JSON.stringify({
        error: "Khả năng truyền đạt phải từ 0 đến 1000"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (
      Number.isNaN(expertiseScore) ||
      expertiseScore < 0 ||
      expertiseScore > 1000
    ) {
      return new Response(JSON.stringify({
        error: "Kiến thức và kinh nghiệm chuyên môn phải từ 0 đến 1000"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (![0.5, 1.0, 1.5, 2.0].includes(sessionDurationHours)) {
      return new Response(JSON.stringify({
        error: "Thời lượng dạy chỉ được là 0.5h, 1h, 1.5h hoặc 2h"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (learningModes.length === 0) {
      return new Response(JSON.stringify({
        error: "Bạn phải chọn ít nhất một hình thức học"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (learningDays.length === 0) {
      return new Response(JSON.stringify({
        error: "Bạn phải chọn ít nhất một ngày học"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const legacyLearningMode = mapLegacyLearningMode(learningModes);

    const rows = await sql`
      insert into skills (
        user_id,
        category_id,
        title,
        description,
        detailed_description,
        level,
        learning_mode,
        learning_modes,
        learning_days,
        delivery_score,
        expertise_score,
        session_duration_hours,
        price_per_session,
        exchange_only,
        status
      )
      values (
        ${currentUser.id},
        ${categoryId},
        ${title},
        ${detailedDescription},
        ${detailedDescription},
        'beginner',
        ${legacyLearningMode},
        ${learningModes},
        ${learningDays},
        ${deliveryScore},
        ${expertiseScore},
        ${sessionDurationHours},
        0,
        true,
        'active'
      )
      returning
        id,
        title,
        delivery_score,
        expertise_score,
        session_duration_hours,
        learning_modes,
        learning_days
    `;

    return new Response(JSON.stringify({
      message: "Đăng kỹ năng thành công",
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
