const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('DATABASE_URL chưa được thiết lập. API đăng ký/đăng nhập sẽ không hoạt động cho đến khi bạn thêm biến môi trường này trên Render.');
}

const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

async function initializeDatabase() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/dang-ky', (_req, res) => {
  res.sendFile(path.join(publicDir, 'dang-ky', 'index.html'));
});

app.get('/dang-nhap', (_req, res) => {
  res.sendFile(path.join(publicDir, 'dang-nhap', 'index.html'));
});

app.get('/ky-nang', (_req, res) => {
  res.sendFile(path.join(publicDir, 'ky-nang', 'index.html'));
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/register', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ message: 'Máy chủ chưa được cấu hình DATABASE_URL.' });
    }

    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin đăng ký.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu xác nhận chưa khớp.' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const insertResult = await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, created_at`,
      [userId, fullName, email, passwordHash]
    );

    return res.status(201).json({
      message: 'Tạo tài khoản thành công.',
      user: {
        id: insertResult.rows[0].id,
        fullName: insertResult.rows[0].full_name,
        email: insertResult.rows[0].email,
        createdAt: insertResult.rows[0].created_at,
      },
    });
  } catch (error) {
  console.error('Lỗi /api/register chi tiết:', {
    message: error.message,
    code: error.code,
    detail: error.detail,
    constraint: error.constraint,
    schema: error.schema,
    table: error.table,
    column: error.column,
    stack: error.stack,
  });

  if (error.code === '23505') {
    if (String(error.constraint || '').includes('email')) {
      return res.status(409).json({ message: 'Email này đã tồn tại.' });
    }
    if (String(error.constraint || '').includes('contact_number')) {
      return res.status(409).json({ message: 'Số điện thoại này đã tồn tại.' });
    }
    return res.status(409).json({ message: 'Dữ liệu bị trùng với một tài khoản đã tồn tại.' });
  }

  return res.status(500).json({
    message: 'Không thể tạo tài khoản.',
    debug:
      process.env.NODE_ENV !== 'production'
        ? {
            code: error.code,
            detail: error.detail,
            rawMessage: error.message,
            table: error.table,
            column: error.column,
          }
        : undefined,
  });
}
});

app.post('/api/login', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ message: 'Máy chủ chưa được cấu hình DATABASE_URL.' });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    return res.json({
      message: 'Đăng nhập thành công.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Lỗi /api/login:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra khi đăng nhập.' });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`EdSkill đang chạy tại cổng ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Không thể khởi tạo database:', error);
    process.exit(1);
  });
