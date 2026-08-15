import { NextResponse } from "next/server";
import { sql, ensureStreakTable } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureStreakTable();
  const rows = await sql`
    SELECT day, seconds FROM streak_days WHERE user_id = ${userId} ORDER BY day DESC LIMIT 400
  `;
  return NextResponse.json({ days: rows });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureStreakTable();
  const { day, deltaSeconds } = await req.json();

  if (!day || !deltaSeconds || deltaSeconds <= 0) {
    return NextResponse.json({ error: "day and a positive deltaSeconds are required" }, { status: 400 });
  }

  await sql`
    INSERT INTO streak_days (user_id, day, seconds)
    VALUES (${userId}, ${day}, ${deltaSeconds})
    ON CONFLICT (user_id, day) DO UPDATE SET seconds = streak_days.seconds + ${deltaSeconds}
  `;
  return NextResponse.json({ ok: true });
}
