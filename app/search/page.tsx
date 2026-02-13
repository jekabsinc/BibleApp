// app/search/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Scope = "all" | "ot" | "nt" | "book";
type Mode = "all" | "any" | "exact";
type Lang = "en" | "lv";

type Result = {
  book: string;
  chapter: string;
  verse: number;
  snippet: string;
  where: "en" | "lv";
};

type SearchResponse = {
  results: Result[];
  error?: string;
};

const STORAGE_KEY = "bible_lang";

function readStoredLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "lv" ? "lv" : "en";
}

function RadioRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "2px solid #2fb7b0",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#2fb7b0",
              display: "block",
            }}
          />
        ) : null}
      </span>
      <span style={{ fontSize: 18, color: "var(--text)" }}>{label}</span>
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={{ display: "none" }}
      />
    </label>
  );
}

export default function SearchPage() {
  const sp = useSearchParams();

  const bookFromQuery = (sp.get("book") ?? "").trim();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [mode, setMode] = useState<Mode>("all");
  const [lang, setLang] = useState<Lang>("en");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    setLang(readStoredLang());
  }, []);

  useEffect(() => {
    if (bookFromQuery) setScope("book");
  }, [bookFromQuery]);

  const title = lang === "en" ? "Find in KJV" : "Find in LV";

  async function runSearch() {
    const qq = q.trim();
    if (!qq) return;

    setLoading(true);
    setError(null);
    setTruncated(false);


    try {
      const params = new URLSearchParams();
      params.set("q", qq);
      params.set("scope", scope);
      params.set("mode", mode);
      params.set("lang", lang);
      if (scope === "book" && bookFromQuery) params.set("book", bookFromQuery);

      const res = await fetch(`/api/search?${params.toString()}`);

      if (!res.ok) {
        const t = await res.text();
        setResults([]);
        setError(`API error ${res.status}`);
        console.error("Search API error:", res.status, t);
        return;
      }

      const text = await res.text();
      let parsed: unknown;

      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        setResults([]);
        setError("API returned non-JSON");
        console.error("Search API returned non-JSON:", text);
        return;
      }

      const data = parsed as Partial<SearchResponse>;

      setResults(Array.isArray(data.results) ? (data.results as Result[]) : []);
      setTruncated(Boolean((data as { truncated?: unknown }).truncated));
      if (typeof data.error === "string") setError(data.error);

    } catch (e: unknown) {
      setResults([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const headerH = 56;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: headerH,
          background: "var(--bg)",
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          zIndex: 1000,
        }}
      >
        <Link
          href="/"
          style={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            color: "var(--text)",
            fontSize: 22,
          }}
        >
          ←
        </Link>

        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 0.2 }}>
          {title}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setLang(lang === "en" ? "lv" : "en")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text)",
              padding: "6px 10px",
              fontSize: 14,
              cursor: "pointer",
              opacity: 0.9,
            }}
            aria-label="Toggle language"
          >
            {lang === "en" ? "LV" : "KJV"}
          </button>
        </div>
      </div>

      <div style={{ height: headerH }} />

      {/* input */}
      <div style={{ padding: "14px 14px 0 14px" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type text or bible reference"
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          style={{
            width: "100%",
            fontSize: 24,
            padding: "10px 2px 12px 2px",
            background: "transparent",
            color: "var(--text)",
            border: "none",
            borderBottom: "2px solid #2fb7b0",
            outline: "none",
          }}
        />
      </div>

      {/* options */}
      <div style={{ padding: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ opacity: 0.7, marginBottom: 6, fontSize: 18 }}>
              Search Where
            </div>

            <RadioRow checked={scope === "all"} label="Whole Bible" onChange={() => setScope("all")} />
            <RadioRow checked={scope === "ot"} label="Old Testament" onChange={() => setScope("ot")} />
            <RadioRow checked={scope === "nt"} label="New Testament" onChange={() => setScope("nt")} />
            <RadioRow
              checked={scope === "book"}
              label={bookFromQuery ? bookFromQuery : "Current Book"}
              onChange={() => setScope("book")}
            />
          </div>

          <div>
            <div style={{ opacity: 0.7, marginBottom: 6, fontSize: 18 }}>
              Find verses
            </div>

            <RadioRow checked={mode === "all"} label="All words" onChange={() => setMode("all")} />
            <RadioRow checked={mode === "any"} label="Any word" onChange={() => setMode("any")} />
            <RadioRow checked={mode === "exact"} label="Phrase" onChange={() => setMode("exact")} />
          </div>
        </div>

        <button
          onClick={runSearch}
          disabled={!q.trim() || loading}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "14px 12px",
            border: "none",
            background: "transparent",
            color: "#2fb7b0",
            fontSize: 18,
            letterSpacing: 1,
            cursor: "pointer",
            opacity: !q.trim() || loading ? 0.5 : 1,
          }}
        >
          {loading ? "FIND…" : "FIND"}
        </button>

        {error && <div style={{ marginTop: 12, opacity: 0.85, fontSize: 14 }}>{error}</div>}

        {/* results */}
        {results.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 20, margin: "10px 0 14px 0" }}>
              {truncated ? "500+" : results.length} results in {lang === "en" ? "KJV" : "LV"}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {results.map((r, i) => (
                <div
                  key={`${r.book}-${r.chapter}-${r.verse}-${i}`}
                  style={{ padding: "14px 0", borderTop: "1px solid #333" }}
                >
                  <Link
                    href={`/read/${encodeURIComponent(r.book)}/${encodeURIComponent(
                      r.chapter
                    )}?v=${r.verse}`}
                    style={{
                      color: "var(--text)",
                      textDecoration: "none",
                      fontSize: 22,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {r.book} {r.chapter}:{r.verse}
                  </Link>
                  <div style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.4 }}>
                    {r.snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
