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
      user_id TEXT PRIMARY KEY,
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

app.get('/api/health', async (_req, res) => {
  try {
    const dbState = await testConnection();

    res.json({
      ok: true,
      connectedAt: dbState.connected_at,
      databaseName: dbState.database_name,
      schemaName: dbState.schema_name,
      usersTable: dbState.users_table,
    });
  } catch (error) {
    console.error('Health check thất bại:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });

    res.status(500).json({
      ok: false,
      message: 'Không kết nối được database.',
      error: error.message,
    });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const gender = String(req.body.gender || '').trim() || null;
    const city = String(req.body.city || '').trim() || null;
    const bio = String(req.body.bio || '').trim() || null;
    const avatarUrl = String(req.body.avatarUrl || '').trim() || null;
    const contactNumberRaw = String(req.body.contactNumber || '').trim();
    const contactNumber = contactNumberRaw || null;
    const ageRaw = String(req.body.age || '').trim();
    const age = ageRaw ? Number(ageRaw) : null;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Họ tên, email, mật khẩu và xác nhận mật khẩu là bắt buộc.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 8 ký tự.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Mật khẩu xác nhận chưa khớp.',
      });
    }

    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) {
      return res.status(400).json({
        message: 'Tuổi phải là số nguyên từ 0 đến 120.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertResult = await query(
      `INSERT INTO public.users (
        full_name,
        age,
        gender,
        email,
        contact_number,
        password_hash,
        avatar_url,
        bio,
        city
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        user_id,
        full_name,
        age,
        gender,
        email,
        contact_number,
        avatar_url,
        bio,
        city,
        token_balance,
        created_at`,
      [fullName, age, gender, email, contactNumber, passwordHash, avatarUrl, bio, city]
    );

    const user = insertResult.rows[0];

    return res.status(201).json({
      message: 'Đăng ký thành công.',
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        age: user.age,
        gender: user.gender,
        email: user.email,
        contactNumber: user.contact_number,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        city: user.city,
        tokenBalance: user.token_balance,
        createdAt: user.created_at,
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
      return res.status(409).json({
        message: 'Dữ liệu bị trùng với một tài khoản đã tồn tại.',
      });
    }

    if (error.code === '42P01') {
      return res.status(500).json({
        message: 'Không tìm thấy bảng public.users trong database hiện tại.',
      });
    }

    if (error.code === '42703') {
      return res.status(500).json({
        message: 'Tên cột trong bảng users không khớp với code backend.',
      });
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
      'SELECT user_id, full_name, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1',
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
        id: user.user_id,
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
