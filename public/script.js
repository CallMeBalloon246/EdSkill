function getCurrentUser() {
  const raw = localStorage.getItem('edskillUser');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem('edskillUser');
    return null;
  }
}

function logout() {
  localStorage.removeItem('edskillUser');
  window.location.href = '/';
}

function renderAuthUI() {
  const authActions = document.getElementById('authActions');
  if (!authActions) return;

  const user = getCurrentUser();

  if (!user) {
    authActions.innerHTML = `
      <a href="/dang-nhap" class="btn btn-outline">Đăng nhập</a>
      <a href="/dang-ky" class="btn btn-primary">Đăng ký</a>
    `;
    return;
  }

  const displayName = user.fullName || 'Tài khoản';
  const firstLetter = displayName.trim().charAt(0).toUpperCase();

  authActions.innerHTML = `
    <div class="profile-menu">
      <button class="profile-button" id="profileButton" type="button">
        <span class="profile-avatar">${firstLetter}</span>
        <span class="profile-label">Trang cá nhân</span>
      </button>

      <div class="profile-dropdown" id="profileDropdown">
        <div class="profile-dropdown-name">${displayName}</div>
        <a href="/trang-ca-nhan" class="profile-dropdown-link">Hồ sơ cá nhân</a>
        <a href="/ky-nang" class="profile-dropdown-link">Kỹ năng của tôi</a>
        <button class="profile-dropdown-link logout-btn" type="button" id="logoutButton">Đăng xuất</button>
      </div>
    </div>
  `;

  const profileButton = document.getElementById('profileButton');
  const profileDropdown = document.getElementById('profileDropdown');
  const logoutButton = document.getElementById('logoutButton');

  if (profileButton && profileDropdown) {
    profileButton.addEventListener('click', function (e) {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function () {
      profileDropdown.classList.remove('show');
    });

    profileDropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
}

function bindRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  const formMessage = document.getElementById('formMessage');
  if (!registerForm || !formMessage) return;

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    formMessage.textContent = '';
    formMessage.className = 'form-message';

    const payload = {
      fullName: document.getElementById('fullName')?.value.trim() || '',
      email: document.getElementById('email')?.value.trim() || '',
      password: document.getElementById('password')?.value || '',
      confirmPassword: document.getElementById('confirmPassword')?.value || ''
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        formMessage.textContent = data.message || 'Không thể tạo tài khoản.';
        formMessage.classList.add('error');
        return;
      }

      formMessage.textContent = 'Đăng ký thành công. Mời bạn đăng nhập.';
      formMessage.classList.add('success');

      setTimeout(function () {
        window.location.href = '/dang-nhap';
      }, 900);
    } catch (error) {
      formMessage.textContent = 'Đã có lỗi xảy ra khi tạo tài khoản.';
      formMessage.classList.add('error');
      console.error(error);
    }
  });
}

function bindLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const formMessage = document.getElementById('formMessage');
  if (!loginForm || !formMessage) return;

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    formMessage.textContent = '';
    formMessage.className = 'form-message';

    const payload = {
      email: document.getElementById('email')?.value.trim() || '',
      password: document.getElementById('password')?.value || ''
    };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        formMessage.textContent = data.message || 'Không thể đăng nhập.';
        formMessage.classList.add('error');
        return;
      }

      localStorage.setItem('edskillUser', JSON.stringify(data.user));

      formMessage.textContent = 'Đăng nhập thành công. Đang chuyển hướng...'; 
      formMessage.classList.add('success');

      setTimeout(function () {
        window.location.href = '/';
      }, 800);
    } catch (error) {
      formMessage.textContent = 'Đã có lỗi xảy ra khi đăng nhập.';
      formMessage.classList.add('error');
      console.error(error);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('show');
    });
  }

  renderAuthUI();
  bindRegisterForm();
  bindLoginForm();
});