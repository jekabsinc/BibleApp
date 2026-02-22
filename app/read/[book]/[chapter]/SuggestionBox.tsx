"use client";

import { useState } from "react";

export default function SuggestionBox(props: {
  book: string;
  chapter: string;
  maxVerse: number;
}) {
  const { book, chapter, maxVerse } = props;

  const [verse, setVerse] = useState(1);
  const [suggestion, setSuggestion] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function submit() {
    const text = suggestion.trim();
    if (!text) return;

    setStatus("sending");
    try {
      const r = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, chapter, verse, suggestion: text }),
      });

      const raw = await r.text();

      if (!r.ok) {
        console.log("API /api/suggest failed:", r.status, raw);
        throw new Error(raw);
      }
      if (!r.ok) throw new Error("bad");

      setSuggestion("");
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <div className="suggestBox">
      <div className="suggestRow">
        <div className="suggestMuted">
          <b>{book}</b> <b>{chapter}</b>
        </div>

        <label className="suggestMuted">
          Pants:&nbsp;
          <select
            className="suggestSelect"
            value={verse}
            onChange={(e) => setVerse(Number(e.target.value))}
          >
            {Array.from({ length: maxVerse }, (_, i) => i + 1).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        className="suggestTextarea"
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        placeholder='Rakstīt ieteikumu'
        rows={3}
      />

      <div className="suggestRow" style={{ marginTop: 10 }}>
        <button className="suggestBtn" onClick={submit} disabled={status === "sending"}>
          Ieteikt
        </button>

        {status === "sent" && <span className="suggestMuted">Ieteikums nosūtīts</span>}
        {status === "error" && <span className="suggestMuted">Kļūda</span>}
      </div>
    </div>
  );
}