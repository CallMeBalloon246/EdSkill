function durationIndexToHours(index) {
  const map = [0.5, 1.0, 1.5, 2.0];
  return map[index] ?? 1.0;
}

function durationIndexToLabel(index) {
  const map = ["0.5h", "1h", "1.5h", "2h"];
  return map[index] ?? "1h";
}
function bindRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = document.getElementById("register-message");

    const payload = {
      full_name: form.full_name.value,
      email: form.email.value,
      password: form.password.value,
      city: form.city.value,
      bio: form.bio.value
    };

    try {
      const result = await postJson("/.netlify/functions/register", payload);

      if (result.ok) {
        message.textContent = "Đăng ký thành công. Đang chuyển sang dashboard...";
        window.location.assign("/dashboard.html");
      } else {
        message.textContent = result.data.error || "Đăng ký thất bại";
      }
    } catch (error) {
      console.error(error);
      message.textContent = "Có lỗi xảy ra khi đăng ký";
    }
  });
}
function bindSkillFormSliders() {
  const delivery = document.getElementById("delivery_score");
  const deliveryValue = document.getElementById("delivery_score_value");

  const expertise = document.getElementById("expertise_score");
  const expertiseValue = document.getElementById("expertise_score_value");

  const duration = document.getElementById("duration_slider");
  const durationValue = document.getElementById("duration_value");

  if (delivery && deliveryValue) {
    delivery.addEventListener("input", () => {
      deliveryValue.textContent = delivery.value;
    });
  }

  if (expertise && expertiseValue) {
    expertise.addEventListener("input", () => {
      expertiseValue.textContent = expertise.value;
    });
  }

  if (duration && durationValue) {
    duration.addEventListener("input", () => {
      durationValue.textContent = durationIndexToLabel(Number(duration.value));
    });
  }
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await res.json()
  };
}

async function getJson(url) {
  const res = await fetch(url, {
    credentials: "include"
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await res.json()
  };
}

function bindCreateSkillForm() {
  const form = document.getElementById("create-skill-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("create-skill-message");

    const selectedModes = [...form.querySelectorAll('input[name="learning_modes"]:checked')]
      .map(input => input.value);

    const selectedDays = [...form.querySelectorAll('input[name="learning_days"]:checked')]
      .map(input => input.value);

    const payload = {
      category_id: Number(form.category_id.value),
      title: form.title.value.trim(),
      delivery_score: Number(form.delivery_score.value),
      expertise_score: Number(form.expertise_score.value),
      session_duration_hours: durationIndexToHours(Number(form.duration_slider.value)),
      learning_modes: selectedModes,
      learning_days: selectedDays,
      detailed_description: form.detailed_description.value.trim()
    };

    const result = await postJson("/.netlify/functions/create-skill", payload);

    if (result.ok) {
      message.textContent = "Đăng kỹ năng thành công";
      form.reset();

      const deliveryValue = document.getElementById("delivery_score_value");
      const expertiseValue = document.getElementById("expertise_score_value");
      const durationValue = document.getElementById("duration_value");

      if (deliveryValue) deliveryValue.textContent = "500";
      if (expertiseValue) expertiseValue.textContent = "500";
      if (durationValue) durationValue.textContent = "1h";

      loadMySkills();
    } else {
      message.textContent = result.data.error || "Không thể đăng kỹ năng";
    }
  });
}


function bindLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("login-message");

    const payload = {
      email: form.email.value,
      password: form.password.value
    };

    const result = await postJson("/.netlify/functions/login", payload);

    if (result.ok) {
      message.textContent = "Đăng nhập thành công. Đang chuyển sang dashboard...";
      window.location.href = "dashboard.html";
    } else {
      message.textContent = result.data.error || "Đăng nhập thất bại";
    }
  });
}

async function loadCurrentUser() {
  const meBox = document.getElementById("me-box");
  if (!meBox) return;

  const result = await getJson("/.netlify/functions/me");

  if (!result.ok) {
    window.location.href = "login.html";
    return;
  }

  const user = result.data.user;

  meBox.innerHTML = `
    <div class="skill-card">
      <h3>${user.full_name}</h3>
      <p>Email: ${user.email}</p>
      <p>Thành phố: ${user.city || "Chưa cập nhật"}</p>
      <p>Bio: ${user.bio || "Chưa cập nhật"}</p>
      <p>Role: ${user.role}</p>
    </div>
  `;
}

function bindLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await fetch("/.netlify/functions/logout", {
      method: "POST",
      credentials: "include"
    });

    window.location.href = "login.html";
  });
}

function bindCreateSkillForm() {
  const form = document.getElementById("create-skill-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("create-skill-message");

    const payload = {
      category_id: Number(form.category_id.value),
      title: form.title.value,
      description: form.description.value,
      level: form.level.value,
      learning_mode: form.learning_mode.value,
      price_per_session: Number(form.price_per_session.value || 0),
      exchange_only: form.exchange_only.checked
    };

    const result = await postJson("/.netlify/functions/create-skill", payload);

    if (result.ok) {
      message.textContent = "Đăng kỹ năng thành công";
      form.reset();
      loadMySkills();
    } else {
      message.textContent = result.data.error || "Không thể đăng kỹ năng";
    }
  });
}

async function loadMySkills() {
  const box = document.getElementById("my-skills-box");
  if (!box) return;

  const result = await getJson("/.netlify/functions/my-skills");

  if (!result.ok) {
    box.innerHTML = "<p>Không tải được kỹ năng của bạn.</p>";
    return;
  }

  const skills = result.data;

  if (!Array.isArray(skills) || skills.length === 0) {
    box.innerHTML = "<p>Bạn chưa đăng kỹ năng nào.</p>";
    return;
  }

  const dayMap = {
    monday: "Thứ 2",
    tuesday: "Thứ 3",
    wednesday: "Thứ 4",
    thursday: "Thứ 5",
    friday: "Thứ 6",
    saturday: "Thứ 7"
  };

  box.innerHTML = skills.map(item => `
    <div class="skill-card">
      <h3>${item.title}</h3>
      <p>${item.detailed_description || ""}</p>
      <div class="skill-meta">Danh mục: ${item.category_name || "Chưa phân loại"}</div>
      <div class="skill-meta">Khả năng truyền đạt: ${item.delivery_score}/1000</div>
      <div class="skill-meta">Kiến thức & kinh nghiệm: ${item.expertise_score}/1000</div>
      <div class="skill-meta">Thời lượng: ${item.session_duration_hours}h</div>
      <div class="skill-meta">Hình thức học: ${(item.learning_modes || []).join(", ")}</div>
      <div class="skill-meta">Ngày học: ${(item.learning_days || []).map(day => dayMap[day] || day).join(", ")}</div>
    </div>
  `).join("");
}

function init() {
  bindRegisterForm();
  bindLoginForm();
  bindLogout();
  bindCreateSkillForm();
  bindSkillFormSliders();
  loadCurrentUser();
  loadMySkills();
}

function init() {
  if (typeof bindRegisterForm === "function") bindRegisterForm();
  if (typeof bindLoginForm === "function") bindLoginForm();
  if (typeof bindLogout === "function") bindLogout();
  if (typeof bindCreateSkillForm === "function") bindCreateSkillForm();
  if (typeof bindSkillFormSliders === "function") bindSkillFormSliders();
  if (typeof loadCurrentUser === "function") loadCurrentUser();
  if (typeof loadMySkills === "function") loadMySkills();
  if (typeof loadSkills === "function") loadSkills();
}

init();
