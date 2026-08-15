import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSessionCookieValue, verifySessionCookieValue, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};

const PUBLIC_PATHS = new Set(["/login", "/signup", "/api/login", "/api/signup"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionCookieValue(cookie);

  if (session) {
    // Sliding expiry: touching the app resets the idle timer.
    const res = NextResponse.next();
    res.cookies.set(SESSION_COOKIE, await createSessionCookieValue(session.userId), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    return res;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
