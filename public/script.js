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

document.addEventListener('DOMContentLoaded', function () {
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('show');
    });
  }

  renderAuthUI();
});