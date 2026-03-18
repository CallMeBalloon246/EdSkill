# EdSkill Render Fullstack

## Cách deploy trên Render

1. Tạo **Web Service** từ repo này.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Thêm environment variable `DATABASE_URL` bằng **Internal Database URL** từ Render Postgres.
5. Deploy.

## Route

- `/`
- `/dang-ky`
- `/dang-nhap`
- `/ky-nang`
- `POST /api/register`
- `POST /api/login`

## Bảng users

Khi app khởi động, server sẽ tự tạo bảng `users` nếu bảng chưa tồn tại.
