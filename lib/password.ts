// Password hashing via Web Crypto's PBKDF2 - no npm dependency, works in both
// the Node and Edge runtimes. 600k iterations follows OWASP's 2023 guidance
// for PBKDF2-SHA256.
const PBKDF2_ITERATIONS = 600_000;

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
}

// Constant-time string compare. PBKDF2 output has no built-in verify
// primitive the way HMAC does, so this guards against timing attacks on the
// hash comparison itself.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string; iterations: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return { hash: toHex(hash), salt: toHex(salt), iterations: PBKDF2_ITERATIONS };
}

export async function verifyPassword(
  password: string,
  salt: string,
  iterations: number,
  expectedHash: string
): Promise<boolean> {
  const hash = await derive(password, fromHex(salt), iterations);
  return timingSafeEqual(toHex(hash), expectedHash);
}

// Used on login when the email isn't found, so response timing doesn't leak
// whether an account exists (fixed decoy salt/iterations, cost matches a real check).
export async function dummyVerify(password: string): Promise<void> {
  await derive(password, new Uint8Array(16), PBKDF2_ITERATIONS);
}
