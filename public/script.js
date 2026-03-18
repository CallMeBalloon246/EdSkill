const mobileToggle = document.getElementById('mobileToggle');
const mainNav = document.getElementById('mainNav');

if (mobileToggle && mainNav) {
  mobileToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    mobileToggle.classList.toggle('active');
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
