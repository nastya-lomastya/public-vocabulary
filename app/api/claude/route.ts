import { NextResponse } from "next/server";
import { sql, ensureUsersTable } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { API_CALL_LIMIT, QUOTA_EXCEEDED_MESSAGE } from "@/lib/quota";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set on the server" }, { status: 500 });
  }

  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureUsersTable();
  const [user] = await sql`SELECT api_calls_used FROM users WHERE id = ${userId}`;
  const used = (user?.api_calls_used as number) ?? 0;
  if (used >= API_CALL_LIMIT) {
    return NextResponse.json({ error: QUOTA_EXCEEDED_MESSAGE, remaining: 0 }, { status: 402 });
  }

  const body = await req.json();
  const { prompt, image, maxTokens } = body as {
    prompt: string;
    image?: { mediaType: string; data: string };
    maxTokens?: number;
  };

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const content: any[] = [];
  if (image) {
    content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  }
  content.push({ type: "text", text: prompt });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens || 500,
        messages: [{ role: "user", content }],
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: json }, { status: response.status });
    }

    const text = (json.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();

    const [updated] = await sql`
      UPDATE users SET api_calls_used = api_calls_used + 1 WHERE id = ${userId} RETURNING api_calls_used
    `;
    const remaining = Math.max(0, API_CALL_LIMIT - (updated?.api_calls_used as number));

    return NextResponse.json({ text, remaining });
  } catch (e) {
    return NextResponse.json({ error: "Claude API request failed" }, { status: 502 });
  }
}
