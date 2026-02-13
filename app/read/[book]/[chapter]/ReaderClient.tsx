"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const HEADER_H = 56;
const WARN_H = 30;
const WARN_KEY = "translation_warning_dismissed";

type Theme = "dark" | "light";
const THEME_KEY = "bible_theme";

function readTheme(): Theme {
  const t = localStorage.getItem(THEME_KEY);
  return t === "light" ? "light" : "dark";
}

type Verse = { verse: number; en: string; lv: string };
type Mode = "en" | "lv" | "split";

const STORAGE_KEY = "bible_lang";


function readStoredMode(): Mode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "lv" || stored === "split" ? stored : "en";
}

function nextMode(m: Mode): Mode {
  if (m === "en") return "lv";
  if (m === "lv") return "split";
  return "en";
}

// Button shows the NEXT mode name (as you requested)
function nextModeLabel(m: Mode): string {
  if (m === "en") return "LV";
  if (m === "lv") return "Dalīt";
  return "KJV";
}

export default function ReaderClient({
  verses,
  bookTitle,
  chapter,
  bookSlug,
  prevChapter,
  nextChapter,
}: {
  verses: Verse[];
  bookTitle: string;
  chapter: string;
  bookSlug: string;
  prevChapter: string | null;
  nextChapter: string | null;
}) {

  const [warnVisible, setWarnVisible] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(WARN_KEY);
    } catch {
      return true;
    }
  });

  const headerTop = warnVisible ? WARN_H : 0;
  const headerOffset = HEADER_H + headerTop;

  const [mode, setMode] = useState<Mode>(() => readStoredMode());
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

    
    useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function closeWarn() {
    try {
      sessionStorage.setItem(WARN_KEY, "true");
    } catch {}
    setWarnVisible(false);
  }


  // existing refs, functions, effects continue below



  const anchorVerseRef = useRef<number | null>(null);
  const anchorDeltaRef = useRef<number>(0);

  function rememberAnchor() {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-verse]"));
    if (!nodes.length) return;

    const targetY = headerOffset;


    let best = nodes[0];
    let bestDist = Number.POSITIVE_INFINITY;

    for (const el of nodes) {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }

    const v = Number(best.dataset.verse);
    if (!Number.isFinite(v)) return;

    const rect = best.getBoundingClientRect();
    anchorVerseRef.current = v;
    anchorDeltaRef.current = rect.top - targetY;
  }

  function setAndStore(next: Mode) {
    localStorage.setItem(STORAGE_KEY, next);
    setMode(next);
  }

  function cycleMode() {
    rememberAnchor();
    setAndStore(nextMode(mode));
  }

  useLayoutEffect(() => {
    const v = anchorVerseRef.current;
    if (v == null) return;

    const el = document.getElementById(`v-${v}`);
    if (!el) return;

    const top =
      window.scrollY +
      el.getBoundingClientRect().top -
      headerOffset -
      anchorDeltaRef.current;


    window.scrollTo(0, top);
  }, [mode, headerOffset]);

  useEffect(() => {
    const raw = searchParams.get("v");
    if (!raw) return;

    const vnum = Number(raw);
    if (!Number.isFinite(vnum)) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(`v-${vnum}`);
      if (!el) return;

      const top = window.scrollY + el.getBoundingClientRect().top - headerOffset - 8;
      window.scrollTo(0, top);
    });
  }, [searchParams, headerOffset]);



  function goPrev() {
  if (!prevChapter) return;
  router.push(
    `/read/${encodeURIComponent(bookSlug)}/${encodeURIComponent(prevChapter)}`
  );
}

function goNext() {
  if (!nextChapter) return;
  router.push(
    `/read/${encodeURIComponent(bookSlug)}/${encodeURIComponent(nextChapter)}`
  );
}


  return (
    <>
      {warnVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: WARN_H,
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            background: "#991b1b",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            !!!Tulkošana joprojām ir procesā!!!
          </span>
          <button
            type="button"
            onClick={closeWarn}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              padding: "2px 6px",
              lineHeight: 1,
            }}
            aria-label="Aizvērt"
          >
            ✕
          </button>
        </div>
      )}
      <div
        style={{
          position: "fixed",
          top: headerTop,
          left: 0,
          right: 0,
          height: 56,
          whiteSpace: "nowrap",
          overflow: "hidden",
          backgroundColor: "var(--bg)",
          color: "var(--text)",
          borderBottom: "1px solid #333",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 1000,
        }}
      >
        <button
          style={{
            cursor: "pointer",
            background: "transparent",
            color: "var(--text)",
            border: "none",
            padding: "6px 8px",
            fontSize: 14,
          }}
          onClick={cycleMode}
        >
          {nextModeLabel(mode)}
        </button>

        <div style={{ width: 1, height: 18, background: "#333" }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          {!isMobile ? (
            prevChapter ? (
              <Link
                href={`/read/${encodeURIComponent(bookSlug)}/${encodeURIComponent(prevChapter)}`}
                style={{ color: "var(--text)", textDecoration: "none" }}
              >
                ←
              </Link>
            ) : (
              <span style={{ width: 12 }} />
            )
          ) : null}

          <Link
            href="/"
            style={{
              color: "var(--text)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {bookTitle} {chapter}
          </Link>

          {!isMobile ? (
            nextChapter ? (
              <Link
                href={`/read/${encodeURIComponent(bookSlug)}/${encodeURIComponent(nextChapter)}`}
                style={{ color: "var(--text)", textDecoration: "none" }}
              >
                →
              </Link>
            ) : (
              <span style={{ width: 12 }} />
            )
          ) : null}
        </div>


        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link
            href={`/search?book=${encodeURIComponent(bookSlug)}`}
            style={{
              textDecoration: "none",
              color: "var(--text)",
              padding: "6px 8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Search"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.5 16.5 21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          <button
            style={{
              cursor: "pointer",
              background: "transparent",
              color: "var(--text)",
              border: "none",
              padding: "6px 8px",
              fontSize: 16,
            }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div style={{ height: headerOffset }} />
      <div
        className="space-y-3"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStart.current) return;

          const t = e.changedTouches[0];
          const dx = t.clientX - touchStart.current.x;
          const dy = t.clientY - touchStart.current.y;

          touchStart.current = null;

          // ignore mostly-vertical gestures
          if (Math.abs(dx) < 60) return;
          if (Math.abs(dx) < Math.abs(dy) * 1.2) return;

          // swipe left => next, swipe right => prev
          if (dx < 0) goNext();
          else goPrev();
        }}
      >
        {verses.map((v) => (
          <div
            key={v.verse}
            id={`v-${v.verse}`}
            data-verse={v.verse}
            style={{ lineHeight: 1.6 }}
          >
            {mode === "en" && (
              <span dangerouslySetInnerHTML={{ __html: v.en }} />
            )}

            {mode === "lv" && (
              <span dangerouslySetInnerHTML={{ __html: v.lv }} />
            )}

            {mode === "split" && (
              <>
                <div dangerouslySetInnerHTML={{ __html: v.en }} />
                <div style={{ opacity: 0.8 }} dangerouslySetInnerHTML={{ __html: v.lv }} />
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
