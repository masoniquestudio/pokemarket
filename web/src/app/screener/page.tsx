export const dynamic = "force-dynamic";

import { fetchCards } from "@/lib/api";
import Link from "next/link";

const TYPES = ["Fire", "Water", "Grass", "Electric", "Psychic", "Fighting", "Darkness", "Metal", "Dragon"];

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: { type?: string; era?: string; is_holo?: string };
}) {
  const params: Record<string, string> = { limit: "100" };
  if (searchParams.type) params.type = searchParams.type;
  if (searchParams.era) params.era = searchParams.era;
  if (searchParams.is_holo) params.is_holo = searchParams.is_holo;

  const { cards } = await fetchCards(params);

  return (
    <div>
      <h1 className="text-xl font-mono font-bold mb-4">CARD SCREENER</h1>

      {/* Filters */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <select name="type" defaultValue={searchParams.type ?? ""}
          className="text-sm font-mono px-3 py-1 rounded-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="era" defaultValue={searchParams.era ?? ""}
          className="text-sm font-mono px-3 py-1 rounded-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
          <option value="">All Eras</option>
          <option value="vintage">Vintage</option>
          <option value="modern">Modern</option>
        </select>
        <select name="is_holo" defaultValue={searchParams.is_holo ?? ""}
          className="text-sm font-mono px-3 py-1 rounded-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
          <option value="">All Cards</option>
          <option value="true">Holo Only</option>
          <option value="false">Non-Holo</option>
        </select>
        <button type="submit"
          style={{ background: "var(--accent)", color: "#000" }}
          className="text-sm font-mono px-4 py-1 rounded-sm font-bold">
          Filter
        </button>
      </form>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-sm">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <th className="text-left px-4 py-2">Card</th>
              <th className="text-left px-4 py-2">Set</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Price</th>
              <th className="text-left px-4 py-2">30d Δ</th>
              <th className="text-left px-4 py-2">Holo</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card: any) => {
              const price = card.current_price ? parseFloat(card.current_price) : null;
              const prev = card.price_30d_ago ? parseFloat(card.price_30d_ago) : null;
              const change = price && prev ? ((price - prev) / prev * 100) : null;
              const isUp = change !== null && change >= 0;

              return (
                <tr key={card.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-2">
                    <Link href={`/cards/${card.id}`} className="hover:underline" style={{ color: "var(--text)" }}>
                      {card.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{card.set_name}</td>
                  <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{card.types?.join(", ")}</td>
                  <td className="px-4 py-2" style={{ color: "var(--accent)" }}>
                    {price ? `$${price.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-2" style={{ color: change !== null ? (isUp ? "var(--up)" : "var(--down)") : "var(--text-secondary)" }}>
                    {change !== null ? `${isUp ? "+" : ""}${change.toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                    {card.is_holo ? "✓" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
