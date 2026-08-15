import { NextResponse } from "next/server";
import { sql, ensureTable } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureTable();
  const rows = await sql`SELECT * FROM words WHERE user_id = ${userId} ORDER BY added DESC`;
  return NextResponse.json({ words: rows });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureTable();
  const body = await req.json();
  const { id, tr, ru, added, transcription } = body;

  if (!id || !tr || !ru) {
    return NextResponse.json({ error: "id, tr and ru are required" }, { status: 400 });
  }

  await sql`
    INSERT INTO words (id, user_id, tr, ru, added, correct, wrong, transcription)
    VALUES (${id}, ${userId}, ${tr}, ${ru}, ${added ?? Date.now()}, 0, 0, ${transcription ?? ""})
    ON CONFLICT (id) DO NOTHING
  `;
  return NextResponse.json({ ok: true });
}
