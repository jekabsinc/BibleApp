"use client";

import dynamic from "next/dynamic";

const ReaderClient = dynamic(() => import("./ReaderClient"), { ssr: false });

type Verse = { verse: number; en: string; lv: string };

export default function ReaderShell(props: {
  verses: Verse[];
  bookTitle: string;
  chapter: string;
  bookSlug: string;
  prevChapter: string | null;
  nextChapter: string | null;
}) {
  return <ReaderClient {...props} />;
}

