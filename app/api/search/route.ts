// app/api/search/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Mode = "all" | "allw" | "any" | "exact";
type Scope = "all" | "ot" | "nt" | "book" | "range";
type Lang = "en" | "lv";

type VerseRow = { verse: number; en: string; lv: string };
type BookJson = { book: string; chapters: Record<string, VerseRow[]> };

const NT_BOOKS = new Set([
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
]);

function stripTags(s: string) {
  return s.replace(/<[^>]*>/g, "");
}

function norm(s: string) {
  return stripTags(s)
    .toLowerCase()
    .replace(/[\u2019’]/g, "'")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .trim();
}

function words(q: string) {
  return norm(q).split(/\s+/).filter(Boolean);
}

function matchAllWholeWords(text: string, q: string) {
  const hay = words(text); // normalized tokens from verse
  const need = words(q);   // normalized tokens from query
  if (!need.length) return false;

  const set = new Set(hay);
  return need.every((t) => set.has(t));
}


function matchAllPartialWords(text: string, q: string) {
  const plain = norm(text);
  const toks = words(q);
  if (!toks.length) return false;
  return toks.every((t) => plain.includes(t));
}

function matchAnyWord(text: string, q: string) {
  const plain = norm(text);
  const toks = words(q);
  if (!toks.length) return false;
  return toks.some((t) => plain.includes(t));
}

function matchExactPhrase(text: string, q: string) {
  const plain = stripTags(text).toLowerCase().replace(/\s+/g, " ").trim();
  const needle = q.toLowerCase().replace(/\s+/g, " ").trim();
  if (!needle) return false;
  return plain.includes(needle);
}

function matchText(text: string, q: string, mode: Mode) {
  if (mode === "allw") return matchAllWholeWords(text, q); // Visi vārdi
  if (mode === "all") return matchAllPartialWords(text, q); // Nepilnīgs vārds/vārdi
  if (mode === "any") return matchAnyWord(text, q);
  return matchExactPhrase(text, q);
}


function readBookOrder(dir: string): string[] {
  // preferred: file at project root
  const p = path.join(process.cwd(), "bible book list.txt");

  try {
    const raw = fs.readFileSync(p, "utf-8");
    const list = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/\.json$/i, ""));

    if (list.length) return list;
  } catch {
    // fall through to filesystem order
  }

  // fallback: use existing json filenames (stable, but not your exact OT/NT list)
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => f.replace(/\.json$/i, ""))
    .sort((a, b) => a.localeCompare(b, "lv"));
}


function buildExistingFilesMap(dir: string) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"));

  const map = new Map<string, string>(); // lower(bookName) -> actual filename
  for (const f of files) {
    const name = f.replace(/\.json$/i, "");
    map.set(name.toLowerCase(), f);
  }
  return map;
}

function cmpResults(
  a: { book: string; chapter: string; verse: number },
  b: { book: string; chapter: string; verse: number },
  order: Map<string, number>
) {
  const ai = order.get(a.book) ?? 1e9;
  const bi = order.get(b.book) ?? 1e9;
  if (ai !== bi) return ai - bi;

  const ac = Number(a.chapter);
  const bc = Number(b.chapter);
  if (ac !== bc) return ac - bc;

  return a.verse - b.verse;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const scope = (searchParams.get("scope") ?? "all") as Scope;
  const mode = (searchParams.get("mode") ?? "all") as Mode;
  const lang = (searchParams.get("lang") ?? "en") as Lang;
  const book = (searchParams.get("book") ?? "").trim();
  const fromBook = (searchParams.get("from") ?? "").trim();
  const toBook = (searchParams.get("to") ?? "").trim();


  if (!q) return NextResponse.json({ results: [] });

  const dir = path.join(process.cwd(), "public", "bible");

  const orderedBooks = readBookOrder(dir);
  const fileMap = buildExistingFilesMap(dir);

  const orderIndex = new Map<string, number>();
  orderedBooks.forEach((b, i) => orderIndex.set(b, i));

  let truncated = false;

  const results: Array<{
    book: string;
    chapter: string;
    verse: number;
    snippet: string;
    where: "en" | "lv";
  }> = [];

  for (const bookName of orderedBooks) {
    if (scope === "book" && bookName !== book) continue;
    if (scope === "nt" && !NT_BOOKS.has(bookName)) continue;
    if (scope === "ot" && NT_BOOKS.has(bookName)) continue;

    if (scope === "range") {
      const a = orderIndex.get(fromBook);
      const b = orderIndex.get(toBook);
      if (a == null || b == null) continue;

      const lo = Math.min(a, b);
      const hi = Math.max(a, b);

      const i = orderIndex.get(bookName) ?? -1;
      if (i < lo || i > hi) continue;
    }


    const file = fileMap.get(bookName.toLowerCase());
    if (!file) continue;

    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const data = JSON.parse(raw) as BookJson;

    const chapterEntries = Object.entries(data.chapters).sort(
      ([a], [b]) => Number(a) - Number(b)
    );

    for (const [chapter, verses] of chapterEntries) {
      for (const v of verses) {
        if (lang === "en" && matchText(v.en, q, mode)) {
          results.push({
            book: bookName,
            chapter,
            verse: v.verse,
            snippet: stripTags(v.en),
            where: "en",
          });
        }

        if (lang === "lv" && matchText(v.lv, q, mode)) {
          results.push({
            book: bookName,
            chapter,
            verse: v.verse,
            snippet: stripTags(v.lv),
            where: "lv",
          });
        }

        if (results.length >= 500) break;
      }
      if (results.length >= 500) break;
    }
    if (results.length >= 500) break;
  }

  if (results.length >= 500) truncated = true;
  results.sort((a, b) => cmpResults(a, b, orderIndex));

  return NextResponse.json({ results, truncated });
}
