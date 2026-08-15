import { NextResponse } from "next/server";
import { sql, ensureUsersTable } from "@/lib/db";
import { verifyPassword, dummyVerify } from "@/lib/password";
import { createSessionCookieValue, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(req: Request) {
  await ensureUsersTable();
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const rows = await sql`
    SELECT id, password_hash, password_salt, password_iterations FROM users WHERE email = ${email}
  `;
  const user = rows[0] as
    | { id: string; password_hash: string; password_salt: string; password_iterations: number }
    | undefined;

  if (!user) {
    // Do a dummy hash anyway so response timing doesn't reveal that the
    // email doesn't exist.
    await dummyVerify(password);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_salt, user.password_iterations, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionCookieValue(user.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
