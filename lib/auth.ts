import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "default_fallback_session_secret_daily_sales_log_32_chars_long"
);

export const signSession = () =>
  new SignJWT({ ok: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

export async function verifySession(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
