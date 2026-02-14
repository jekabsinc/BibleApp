import dynamic from "next/dynamic";

const SearchClient = dynamic(() => import("./SearchClient"), { ssr: false });

export default function Page() {
  return <SearchClient />;
}
