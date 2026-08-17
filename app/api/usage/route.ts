import { NextResponse } from "next/server";
import { sql, ensureUsersTable } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { API_CALL_LIMIT } from "@/lib/quota";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureUsersTable();
  const [user] = await sql`SELECT api_calls_used FROM users WHERE id = ${userId}`;
  const used = (user?.api_calls_used as number) ?? 0;
  const remaining = Math.max(0, API_CALL_LIMIT - used);

  return NextResponse.json({ used, limit: API_CALL_LIMIT, remaining });
}
