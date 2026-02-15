import fs from "fs/promises";
import path from "path";
import Link from "next/link";

const norm = (s: string) => s.trim().toLowerCase();

const SECTIONS: Array<{ color: string; books: string[] }> = [
  // OT: Law (Torah)
  {
    color: "#b9a8ff",
    books: ["Iesākums", "Izceļošana", "Levīti", "Skaitļi", "Atkārtotais likums"],
  },
  // OT: History
  {
    color: "#f0b27a",
    books: [
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
    ],
  },
  // OT: Wisdom/Poetry
  {
    color: "#6fe38a",
    books: ["Ījaba", "Psalmi", "Sakāmvārdi", "Ekleziasti", "Salamana dziesma"],
  },
  // OT: Major Prophets
  {
    color: "#ff7bd1",
    books: ["Jesajas", "Jeremijas", "Vaimanas", "Ecehiēla", "Daniēla"],
  },
  // OT: Minor Prophets
  {
    color: "#f2e96b",
    books: [
      "Hozejas",
      "Joēla",
      "Amosa",
      "Obadijas",
      "Jonas",
      "Mihas",
      "Nahuma",
      "Habakuka",
      "Cefanijas",
      "Hagaja",
      "Zaharija",
      "Maleahija",
    ],
  },
  // NT: Gospels
  {
    color: "#ff9a3c",
    books: ["Mateja evaņģēlijs", "Marka Evaņģēlijs", "Lūkas evaņģēlijs", "Jāņa evaņģēlijs"],
  },
  // NT: Acts
  { color: "#4aa3ff", books: ["Apustuļu darbi"] },
  // NT: Paul
  {
    color: "#f2e96b",
    books: [
      "Romiešiem",
      "1. Korintiešiem",
      "2. Korintiešiem",
      "Galatiešiem",
      "Efeziešiem",
      "Filipiešiem",
      "Kolosiešiem",
      "1. tesaloniķiešiem",
      "2. tesaloniķiešiem",
      "1. Timotejam",
      "2. Timotejam",
      "Titam",
      "Filemonam",
      "Ebrejiem",
    ],
  },
  // NT: General + Revelation
  {
    color: "#76e06d",
    books: ["Jēkaba", "1. Pētera", "2. Pētera", "1. Jāņa", "2. Jāņa", "3. Jāņa", "Jūdas"],
  },
  { color: "#ff4bd2", books: ["Atklāsmes"] },
];

const COLOR_MAP = new Map<string, string>();
for (const s of SECTIONS) for (const b of s.books) COLOR_MAP.set(norm(b), s.color);

function bookColor(book: string) {
  return COLOR_MAP.get(norm(book)) ?? "var(--text)";
}

const CANONICAL_ORDER = [
  "Iesākums","Izceļošana","Levīti","Skaitļi","Atkārtotais likums","Jozuas","Tiesneši","Rutes",
  "1. Samuēla","2. Samuēla","1. Ķēniņu","2. Ķēniņu","1. Hroniku","2. Hroniku","Ezras","Nehemijas","Esteres",
  "Ījaba","Psalmi","Sakāmvārdi","Ekleziasti","Salamana dziesma",
  "Jesajas","Jeremijas","Vaimanas","Ecehiēla","Daniēla",
  "Hozejas","Joēla","Amosa","Obadijas","Jonas","Mihas","Nahuma","Habakuka","Cefanijas","Hagaja","Zaharija","Maleahija",
  "Mateja evaņģēlijs","Marka Evaņģēlijs","Lūkas evaņģēlijs","Jāņa evaņģēlijs","Apustuļu darbi",
  "Romiešiem","1. Korintiešiem","2. Korintiešiem","Galatiešiem","Efeziešiem","Filipiešiem","Kolosiešiem",
  "1. tesaloniķiešiem","2. tesaloniķiešiem","1. Timotejam","2. Timotejam","Titam","Filemonam","Ebrejiem",
  "Jēkaba","1. Pētera","2. Pētera","1. Jāņa","2. Jāņa","3. Jāņa","Jūdas","Atklāsmes",
];

const ORDER_MAP = new Map(CANONICAL_ORDER.map((name, i) => [norm(name), i]));

export default async function Page() {
  const dir = path.join(process.cwd(), "public", "bible");

  const books = (await fs.readdir(dir))
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => f.replace(/\.json$/i, ""))
    .sort((a, b) => {
      const ia = ORDER_MAP.get(norm(a));
      const ib = ORDER_MAP.get(norm(b));

      if (ia === undefined && ib === undefined)
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      if (ia === undefined) return 1;
      if (ib === undefined) return -1;
      return ia - ib;
    });

  return (
    <main style={{ padding: 16, background: "var(--bg)", color: "var(--text)" }}>
      <h1 style={{ marginBottom: 12 }}>Izvēlies grāmatu</h1>
      <style>{`
        @media (max-width: 640px) {
          .bookGrid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .bookGrid a {
            padding: 10px !important;
            font-size: 13px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>

      <div
        className="bookGrid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
        }}
      >

        {books.map((b) => (
          <Link
            key={b}
            href={`/read/${encodeURIComponent(b)}`}
            style={{
              display: "block",
              padding: 14,
              border: "1px solid #333",
              borderRadius: 10,
              textDecoration: "none",
              color: bookColor(b),
              background: "var(--bg)",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {b}
          </Link>
        ))}
      </div>
    </main>
  );
}
