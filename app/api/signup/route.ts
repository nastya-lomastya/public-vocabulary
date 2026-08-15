import { NextResponse } from "next/server";
import { sql, ensureUsersTable } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSessionCookieValue, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  await ensureUsersTable();
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const { hash, salt, iterations } = await hashPassword(password);
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO users (id, email, password_hash, password_salt, password_iterations, created_at)
    VALUES (${id}, ${email}, ${hash}, ${salt}, ${iterations}, ${Date.now()})
  `;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionCookieValue(id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
