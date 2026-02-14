// app/search/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Scope = "all" | "ot" | "nt" | "book" | "range";
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
  truncated?: boolean;
  error?: string;
};

const STORAGE_KEY = "bible_lang";
const SEARCH_SCROLL_KEY = "search_scroll_y";
const BOOKS = [
  "Iesākums",
  "Izceļošana",
  "Levīti",
  "Skaitļi",
  "Atkārtotais likums",
  "Jozuas",
  "Tiesneši",
  "Rutes",
  "1. Samuēla",
  "2. Samuēla",
  "1. Ķēniņu",
  "2. Ķēniņu",
  "1. Hroniku",
  "2. Hroniku",
  "Ezras",
  "Nehemijas",
  "Esteres",
  "Ījaba",
  "Psalmi",
  "Sakāmvārdi",
  "Ekleziaste",
  "Salamana dziesma",
  "Jesajas",
  "Jeremijas",
  "Vaimanās",
  "Ecēhiēla",
  "Daniela",
  "Hozejas",
  "Joēla",
  "Amosa",
  "Obadijas",
  "Jonas",
  "Mihas",
  "Nahuma",
  "Habakuka",
  "Cefanjas",
  "Hagaja",
  "Zaharija",
  "Maleahija",
  "Mateja evaņģēlijs",
  "Marka Evaņģēlijs",
  "Lūkas evaņģēlijs",
  "Jāņa evaņģēlijs",
  "Apustuļu darbi",
  "Romiešiem",
  "1. Korintiešiem",
  "2. Korintiešiem",
  "Galatiešiem",
  "Efeziešiem",
  "Filipiešiem",
  "Kolosiešiem",
  "1. Tesaloniķiešiem",
  "2. Tesaloniķiešiem",
  "1. Timotejam",
  "2. Timotejam",
  "Titam",
  "Filemonam",
  "Ebrejiem",
  "Jēkaba",
  "1. Pētera",
  "2. Pētera",
  "1. Jāņa",
  "2. Jāņa",
  "3. Jāņa",
  "Jūdas",
  "Atklāsmes",
] as const;


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

function getParam(sp: ReturnType<typeof useSearchParams>, k: string) {
  const v = sp.get(k);
  return v == null ? "" : v;
}

export default function SearchPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // book scope prefill from query param "book"
  const bookFromQuery = (sp.get("book") ?? "").trim();

  // restore state from URL
  const qFromUrl = getParam(sp, "q");
  const scopeFromUrl = (sp.get("scope") as Scope) || "";
  const modeFromUrl = (sp.get("mode") as Mode) || "";
  const langFromUrl = (sp.get("lang") as Lang) || "";

  const [q, setQ] = useState(qFromUrl);
  const [scope, setScope] = useState<Scope>(
    (scopeFromUrl as Scope) || (bookFromQuery ? "book" : "all")
  );
  const [mode, setMode] = useState<Mode>((modeFromUrl as Mode) || "all");
  const [lang, setLang] = useState<Lang>((langFromUrl as Lang) || "en");
  const [fromBook, setFromBook] = useState<string>(BOOKS[0]);
  const [toBook, setToBook] = useState<string>("Ījaba");


  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // prevent double auto-run in strict mode
  const didAutoRun = useRef(false);

  // init lang from localStorage ONLY if URL doesn't specify it
  useEffect(() => {
    if (!langFromUrl) setLang(readStoredLang());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep scope synced when entering from reader with ?book=
  useEffect(() => {
    if (bookFromQuery) setScope("book");
  }, [bookFromQuery]);

  const title = lang === "en" ? "Meklēt KJV" : "Meklēt LV";
  const headerH = 56;

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("q", q.trim());
    params.set("scope", scope);
    params.set("mode", mode);
    params.set("lang", lang);
    if (scope === "book" && bookFromQuery) params.set("book", bookFromQuery);

    if (scope === "range") {
      params.set("from", fromBook);
      params.set("to", toBook);
    }

    return `/api/search?${params.toString()}`;
  }, [q, scope, mode, lang, bookFromQuery, fromBook, toBook]);


  function pushStateToUrl(next: { q?: string; scope?: Scope; mode?: Mode; lang?: Lang; from?: string; to?: string }) {
    const params = new URLSearchParams(sp.toString());

    const nq = next.q ?? q;
    const ns = next.scope ?? scope;
    const nm = next.mode ?? mode;
    const nl = next.lang ?? lang;

    if (nq.trim()) params.set("q", nq.trim());
    else params.delete("q");

    params.set("scope", ns);
    params.set("mode", nm);
    params.set("lang", nl);

    const nf = next.from ?? fromBook;
    const nt = next.to ?? toBook;

    if (ns === "range") {
      params.set("from", nf);
      params.set("to", nt);
    } else {
      params.delete("from");
      params.delete("to");
    }


    if (bookFromQuery) params.set("book", bookFromQuery);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function runSearch() {
    const qq = q.trim();
    if (!qq) return;

    setLoading(true);
    setError(null);
    setTruncated(false);

    try {
      const res = await fetch(apiUrl);

      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        setResults([]);
        setError(res.ok ? "API returned non-JSON" : `API error ${res.status}`);
        console.error("Search API non-JSON:", text);
        return;
      }

      const data = parsed as Partial<SearchResponse>;

      if (!res.ok) {
        setResults([]);
        setError(typeof data.error === "string" ? data.error : `API error ${res.status}`);
        console.error("Search API error:", res.status, data);
        return;
      }

      setResults(Array.isArray(data.results) ? (data.results as Result[]) : []);
      setTruncated(Boolean(data.truncated));
      if (typeof data.error === "string") setError(data.error);

      // write state into URL (so Back restores query/options)
      pushStateToUrl({ q: qq, scope, mode, lang });

      // new search -> start at top
      window.scrollTo(0, 0);
    } catch (e: unknown) {
      setResults([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // Auto-run when URL already contains q (coming back via Back / reload)
  useEffect(() => {
    if (didAutoRun.current) return;
    if (!qFromUrl.trim()) return;

    didAutoRun.current = true;

    setQ(qFromUrl);
    if (scopeFromUrl) setScope(scopeFromUrl as Scope);
    if (modeFromUrl) setMode(modeFromUrl as Mode);
    if (langFromUrl) setLang(langFromUrl as Lang);

    Promise.resolve().then(() => runSearch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore scroll after results render (from sessionStorage)
  // Restore scroll after results render (from sessionStorage)
  useEffect(() => {
    if (!results.length) return;

    let y = 0;
    try {
      const raw = sessionStorage.getItem(SEARCH_SCROLL_KEY);
      const n = raw ? Number(raw) : 0;
      if (Number.isFinite(n) && n > 0) y = n;
    } catch {}

    if (!y) return;

    const restore = () => window.scrollTo(0, y);

    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  }, [results]);


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

        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 0.2 }}>{title}</div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              const next = lang === "en" ? "lv" : "en";
              setLang(next);
              pushStateToUrl({ lang: next });
            }}
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
          onChange={(e) => {
            setQ(e.target.value);
            pushStateToUrl({ q: e.target.value });
          }}
          placeholder="Ievadiet tekstu"
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
            <RadioRow
              checked={scope === "all"}
              label="Visa Bībele"
              onChange={() => {
                setScope("all");
                pushStateToUrl({ scope: "all" });
              }}
            />
            <RadioRow
              checked={scope === "ot"}
              label="Vecā derība"
              onChange={() => {
                setScope("ot");
                pushStateToUrl({ scope: "ot" });
              }}
            />
            <RadioRow
              checked={scope === "nt"}
              label="Jaunā derība"
              onChange={() => {
                setScope("nt");
                pushStateToUrl({ scope: "nt" });
              }}
            />
            <RadioRow
              checked={scope === "book"}
              label={bookFromQuery ? bookFromQuery : "Current Book"}
              onChange={() => {
                setScope("book");
                pushStateToUrl({ scope: "book" });
              }}
            />
            <RadioRow
              checked={scope === "range"}
              label="Grāmatu diapazons"
              onChange={() => {
                setScope("range");
                pushStateToUrl({ scope: "range" });
              }}
            />

            {scope === "range" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 10,
                }}
              >
                <div>
                  <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 6 }}>No</div>
                  <select
                    value={fromBook}
                    onChange={(e) => setFromBook(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 8px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid #333",
                    }}
                  >
                    {BOOKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 6 }}>Līdz</div>
                  <select
                    value={toBook}
                    onChange={(e) => setToBook(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 8px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid #333",
                    }}
                  >
                    {BOOKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <RadioRow
              checked={mode === "all"}
              label="Visi vārdi"
              onChange={() => {
                setMode("all");
                pushStateToUrl({ mode: "all" });
              }}
            />
            <RadioRow
              checked={mode === "any"}
              label="Jebkurš vārds"
              onChange={() => {
                setMode("any");
                pushStateToUrl({ mode: "any" });
              }}
            />
            <RadioRow
              checked={mode === "exact"}
              label="Frāze"
              onChange={() => {
                setMode("exact");
                pushStateToUrl({ mode: "exact" });
              }}
            />
          </div>
        </div>

        <button
          onClick={() => runSearch()}
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
          {loading ? "MEKLĒT..." : "MEKLĒT"}
        </button>

        {error && <div style={{ marginTop: 12, opacity: 0.85, fontSize: 14 }}>{error}</div>}

        {/* results */}
        {results.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 20, margin: "10px 0 14px 0" }}>
              {truncated ? "500+" : results.length} rezultāti {lang === "en" ? "KJV" : "LV"}
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
                    onClick={() => {
                      try {
                        sessionStorage.setItem(SEARCH_SCROLL_KEY, String(window.scrollY));
                      } catch {}
                    }}
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
                  <div style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.4 }}>{r.snippet}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
