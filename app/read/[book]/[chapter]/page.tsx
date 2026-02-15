import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import ReaderShell from "./ReaderShell";


type Verse = { verse: number; en: string; lv: string };

export default async function Reader(props: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const p = await props.params;
  const book = decodeURIComponent(p.book);
  const chapter = decodeURIComponent(p.chapter);

  const dir = path.join(process.cwd(), "public", "bible");
  const files = await fs.readdir(dir);

  const wantedFile = `${book}.json`;
  const match = files.find(
    (f) => f.toLowerCase() === wantedFile.toLowerCase()
  );

  if (!match) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Book not found</h1>
        <div>{wantedFile}</div>
        <Link href="/">← Back</Link>
      </main>
    );
  }

  const raw = await fs.readFile(path.join(dir, match), "utf-8");
  const data = JSON.parse(raw);

  const verses: Verse[] = data.chapters?.[chapter] ?? [];

  const chapterNumbers = Object.keys(data.chapters || {}).sort(
    (a, b) => Number(a) - Number(b)
  );

  const idx = chapterNumbers.indexOf(chapter);
  const prev = idx > 0 ? chapterNumbers[idx - 1] : null;
  const next =
    idx >= 0 && idx < chapterNumbers.length - 1
      ? chapterNumbers[idx + 1]
      : null;

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 900,
        margin: "0 auto",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >

      <ReaderShell
        verses={verses}
        bookTitle={data.book}
        chapter={chapter}
        prevChapter={prev}
        nextChapter={next}
        bookSlug={book}
      />
      <div style={{
        background: "#facc15",
        color: "#000",
        padding: "12px",
        marginBottom: "16px",
        fontSize: "14px",
        lineHeight: 1.5
      }}>
        <strong>!!!Tulkošana joprojām ir procesā!!!</strong><br />
        Ja ir kādi ieteikumi, pretenzijas, pamanītas kļūdas (gramatikas, teksta, tulkojuma), 
        lūdzu, rakstiet uz draudzealuksne@gmail.com
      </div>

    </main>
  );
}
