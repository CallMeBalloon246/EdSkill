const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener('click', function () {
    mobileMenu.classList.toggle('show');
  });
}
document.querySelectorAll('.slider-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const trackId = button.dataset.track;
    const track = document.getElementById(trackId);

    if (!track) return;

    const amount = track.clientWidth * 0.85;
    const direction = button.classList.contains('next') ? amount : -amount;
    track.scrollBy({ left: direction, behavior: 'smooth' });
  });
});


function setMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`;
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('registerMessage');
    const formData = new FormData(registerForm);
    const payload = {
      fullName: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
      confirmPassword: String(formData.get('confirmPassword') || ''),
    };

    if (!payload.fullName || !payload.email || !payload.password || !payload.confirmPassword) {
      setMessage(message, 'Vui lòng điền đầy đủ thông tin.', 'error');
      return;
    }

    if (payload.password.length < 8) {
      setMessage(message, 'Mật khẩu phải có ít nhất 8 ký tự.', 'error');
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      setMessage(message, 'Mật khẩu xác nhận chưa khớp.', 'error');
      return;
    }

    try {
      setMessage(message, 'Đang tạo tài khoản...', '');
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(message, result.message || 'Đăng ký thất bại.', 'error');
        return;
      }
      setMessage(message, `Đăng ký thành công. Mã người dùng của bạn là ${result.user.id}.`, 'success');
      registerForm.reset();
      setTimeout(() => {
        window.location.href = '/dang-nhap';
      }, 1200);
    } catch (error) {
      setMessage(message, 'Không thể kết nối tới máy chủ. Hãy kiểm tra lại deploy backend.', 'error');
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('loginMessage');
    const formData = new FormData(loginForm);
    const payload = {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
    };

    if (!payload.email || !payload.password) {
      setMessage(message, 'Vui lòng nhập email và mật khẩu.', 'error');
      return;
    }

    try {
      setMessage(message, 'Đang đăng nhập...', '');
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(message, result.message || 'Đăng nhập thất bại.', 'error');
        return;
      }
      setMessage(message, `Xin chào ${result.user.fullName}. Đăng nhập thành công.`, 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      setMessage(message, 'Không thể kết nối tới máy chủ. Hãy kiểm tra lại deploy backend.', 'error');
    }
  });
}
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

  logoutButton.addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContentLoaded da chay');
  renderAuthUI();
});