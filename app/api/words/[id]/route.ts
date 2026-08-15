import { NextResponse } from "next/server";
import { sql, ensureTable } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureTable();
  const { id } = await params;
  const body = await req.json();

  if (body.correct !== undefined && body.wrong !== undefined) {
    const rows = await sql`
      UPDATE words SET correct = ${body.correct}, wrong = ${body.wrong}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;
    if (rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (body.transcription !== undefined) {
    const rows = await sql`
      UPDATE words SET transcription = ${body.transcription}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;
    if (rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureTable();
  const { id } = await params;
  const rows = await sql`DELETE FROM words WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
