import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash
} from "node:crypto";
import { sql } from "./db.mjs";

const SESSION_COOKIE = "edskill_session";

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(":")) return false;

  const [salt, storedHash] = storedValue.split(":");
  const hashedBuffer = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (hashedBuffer.length !== storedBuffer.length) return false;
  return timingSafeEqual(hashedBuffer, storedBuffer);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createSession(userId) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);

  await sql`
    insert into session_tokens (user_id, token_hash, expires_at)
    values (${userId}, ${tokenHash}, now() + interval '7 days')
  `;

  return rawToken;
}

export function buildSessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}; Secure`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

export async function getCurrentUserFromRequest(req) {
  const cookies = parseCookies(req.headers.get("cookie") || "");
  const rawToken = cookies[SESSION_COOKIE];

  if (!rawToken) return null;

  const tokenHash = sha256(rawToken);

  const rows = await sql`
    select
      u.id,
      u.full_name,
      u.email,
      u.bio,
      u.city,
      u.role,
      u.status,
      s.id as session_id
    from session_tokens s
    join users u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
      and s.expires_at > now()
      and u.status = 'active'
    limit 1
  `;

  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    full_name: rows[0].full_name,
    email: rows[0].email,
    bio: rows[0].bio,
    city: rows[0].city,
    role: rows[0].role,
    status: rows[0].status,
    session_id: rows[0].session_id,
    rawToken
  };
}

export async function deleteSessionByRequest(req) {
  const cookies = parseCookies(req.headers.get("cookie") || "");
  const rawToken = cookies[SESSION_COOKIE];
  if (!rawToken) return;

  const tokenHash = sha256(rawToken);

  await sql`
    delete from session_tokens
    where token_hash = ${tokenHash}
  `;
}
