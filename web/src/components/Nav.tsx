import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <nav
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
      className="px-6 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-8">
        <Link href="/" style={{ color: "var(--accent)" }} className="font-bold text-lg tracking-widest">
          POKÉMARKET
        </Link>
        <div className="flex gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Link href="/indices" className="hover:text-white transition-colors">Indices</Link>
          <Link href="/cards" className="hover:text-white transition-colors">Cards</Link>
          <Link href="/screener" className="hover:text-white transition-colors">Screener</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <input
          placeholder="Search cards..."
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          className="px-3 py-1 text-sm rounded-sm w-48 focus:outline-none focus:border-yellow-400"
        />
        <ThemeToggle />
      </div>
    </nav>
  );
}
