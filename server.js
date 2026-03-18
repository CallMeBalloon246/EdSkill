const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

app.get('/api/health', async (_req, res) => {
  try {
    const dbState = await testConnection();
    return res.json({
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

    return res.status(500).json({
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

    const ageRaw = String(req.body.age || '').trim();
    const age = ageRaw ? Number(ageRaw) : null;

    const gender = String(req.body.gender || '').trim() || null;
    const contactNumber = String(req.body.contactNumber || '').trim() || null;
    const avatarUrl = String(req.body.avatarUrl || '').trim() || null;
    const bio = String(req.body.bio || '').trim() || null;
    const city = String(req.body.city || '').trim() || null;

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

    const existingUser = await query(
      'SELECT user_id FROM public.users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        message: 'Email này đã tồn tại.',
      });
    }

    if (contactNumber) {
      const existingPhone = await query(
        'SELECT user_id FROM public.users WHERE contact_number = $1 LIMIT 1',
        [contactNumber]
      );

      if (existingPhone.rowCount > 0) {
        return res.status(409).json({
          message: 'Số điện thoại này đã tồn tại.',
        });
      }
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
      return res.status(409).json({
        message: 'Dữ liệu bị trùng với tài khoản đã tồn tại.',
      });
    }

    if (error.code === '42P01') {
      return res.status(500).json({
        message: 'Không tìm thấy bảng public.users trong database hiện tại.',
      });
    }

    if (error.code === '42703') {
      return res.status(500).json({
        message: 'Code backend đang gọi sai tên cột trong bảng users.',
      });
    }

    return res.status(500).json({
      message: 'Không thể tạo tài khoản.',
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email và mật khẩu là bắt buộc.',
      });
    }

    const result = await query(
      `SELECT user_id, full_name, email, password_hash
       FROM public.users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    return res.json({
      message: 'Đăng nhập thành công.',
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Lỗi /api/login:', error);
    return res.status(500).json({
      message: 'Không thể đăng nhập.',
    });
  }
});

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

app.use((_req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});