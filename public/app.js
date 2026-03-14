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

    const result = await postJson("/.netlify/functions/register", payload);

    if (result.ok) {
      message.textContent = "Đăng ký thành công. Đang chuyển sang dashboard...";
      window.location.href = "dashboard.html";
    } else {
      message.textContent = result.data.error || "Đăng ký thất bại";
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

  box.innerHTML = skills.map(item => `
    <div class="skill-card">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="skill-meta">Danh mục: ${item.category_name || "Chưa phân loại"}</div>
      <div class="skill-meta">Level: ${item.level}</div>
      <div class="skill-meta">Mode: ${item.learning_mode}</div>
      <div class="skill-meta">Giá: ${Number(item.price_per_session).toLocaleString("vi-VN")}đ</div>
    </div>
  `).join("");
}

function init() {
  bindRegisterForm();
  bindLoginForm();
  bindLogout();
  bindCreateSkillForm();
  loadCurrentUser();
  loadMySkills();
}

init();
