import fs from "fs";
import path from "path";
import Link from "next/link";

type BookJson = {
  book: string;
  chapters: Record<string, Array<{ verse: number; en: string; lv: string }>>;
};

function findBookJsonPath(bookName: string) {
  const dir = path.join(process.cwd(), "public", "bible");
  const files = fs.readdirSync(dir);
  const target = `${bookName}.json`.toLowerCase();
  const match = files.find((f) => f.toLowerCase() === target);
  return match ? path.join(dir, match) : null;
}

export default async function BookChaptersPage(props: {
  params: Promise<{ book: string }>;
}) {
  const p = await props.params;
  const book = decodeURIComponent(p.book);

  const filePath = findBookJsonPath(book);
  if (!filePath) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold">Not found</h1>
          <p className="mt-2 opacity-80">Book file not found: {book}.json</p>
          <Link className="inline-block mt-4 underline" href="/">
            Back
          </Link>
        </div>
      </main>
    );
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as BookJson;

  const chapterNums = Object.keys(data.chapters)
    .map((c) => Number(c))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div>
          <Link className="underline" href="/">
            Grāmatas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{data.book}</h1>
        </div>

        <div className="mt-6 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {chapterNums.map((n) => (
            <Link
              key={n}
              href={`/read/${encodeURIComponent(book)}/${encodeURIComponent(
                String(n)
              )}`}
              className="rounded-lg border px-3 py-2 text-center hover:opacity-80"
            >
              {n}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
