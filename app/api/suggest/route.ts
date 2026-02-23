// app/api/suggest/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const book = String(body.book ?? "").trim();
    const chapter = String(body.chapter ?? "").trim();
    const verse = Number(body.verse);
    const suggestion = String(body.suggestion ?? "").trim();

    if (!book || !chapter || !Number.isFinite(verse) || verse <= 0 || !suggestion) {
      return NextResponse.json({ ok: false, error: "Missing/invalid fields" }, { status: 400 });
    }

    const scriptUrl = process.env.SUGGEST_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ ok: false, error: "Missing SUGGEST_SCRIPT_URL" }, { status: 500 });
    }

    const r = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book, chapter, verse, suggestion }),
      cache: "no-store",
    });

    const text = await r.text(); // IMPORTANT: capture whatever Google returns (often HTML on error)

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `AppsScript HTTP ${r.status}`, details: text.slice(0, 2000) },
        { status: 502 }
      );
    }

    // Try parse JSON; if not JSON, still show it
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: 200 });
    } catch {
      return NextResponse.json(
        { ok: false, error: "AppsScript returned non-JSON", details: text.slice(0, 2000) },
        { status: 502 }
      );
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}