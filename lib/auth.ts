import { cookies } from "next/headers";

export const SESSION_COOKIE = "vt_session";

// Sliding session: every authenticated request renews the cookie for this
// long. A real account (unlike the old shared-password model) doesn't need
// an aggressive idle timeout, so this is generous.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

async function hmacKey(usage: "sign" | "verify") {
  const secret = process.env.SESSION_SECRET || "insecure-default-change-me";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

// Cookie value: `${userId}.${expiresAt}.${signature}` - the expiry is signed
// as part of the payload (not just relied on via cookie maxAge), and userId
// is a safe-to-embed opaque handle, never a secret.
export async function createSessionCookieValue(userId: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  const key = await hmacKey("sign");
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySessionCookieValue(value: string | undefined): Promise<{ userId: string } | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtStr, sigHex] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!userId || !Number.isFinite(expiresAt) || !sigHex) return null;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return null;

  const key = await hmacKey("verify");
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromHex(sigHex) as BufferSource,
    new TextEncoder().encode(`${userId}.${expiresAtStr}`)
  );
  return valid ? { userId } : null;
}

// Reads and verifies the session cookie inside a route handler (middleware
// only gates page access - it doesn't hand userId down to routes).
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const session = await verifySessionCookieValue(store.get(SESSION_COOKIE)?.value);
  return session?.userId ?? null;
}
