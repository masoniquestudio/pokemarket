export const dynamic = "force-dynamic";

import { fetchCard } from "@/lib/api";
import PriceChart from "@/components/PriceChart";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function CardPage({ params }: { params: { id: string } }) {
  const data = await fetchCard(params.id);
  if (!data.card) return notFound();

  const { card, history } = data;
  const latest = history[history.length - 1];
  const prev30 = history.find(
    (h: any) => new Date(h.recorded_at) < new Date(Date.now() - 30 * 86400000)
  );
  const change30 = prev30
    ? ((latest?.price - prev30.price) / prev30.price * 100).toFixed(2)
    : null;
  const isUp = change30 ? parseFloat(change30) >= 0 : true;

  return (
    <div>
      {/* Header */}
      <div className="flex gap-6 mb-6">
        {card.image_url && (
          <Image src={card.image_url} alt={card.name} width={180} height={250} className="rounded-sm" />
        )}
        <div>
          <h1 className="text-2xl font-mono font-bold" style={{ color: "var(--text)" }}>{card.name}</h1>
          <div className="text-sm font-mono mt-1" style={{ color: "var(--text-secondary)" }}>
            {card.set_name} · {card.number} · {card.rarity}
          </div>
          <div className="text-sm font-mono mt-1" style={{ color: "var(--text-secondary)" }}>
            Type: {card.types?.join(", ")} · Era: {card.era} · Holo: {card.is_holo ? "Yes" : "No"}
          </div>
          {latest && (
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">${parseFloat(latest.price).toFixed(2)}</div>
              {change30 && (
                <div className="text-sm font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
                  {isUp ? "▲" : "▼"} {Math.abs(parseFloat(change30))}% (30d)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price Chart */}
      <PriceChart history={history} />

      {/* Recent Sales */}
      <h2 className="mt-8 mb-2 text-xs font-mono tracking-widest" style={{ color: "var(--text-secondary)" }}>
        RECENT SALES
      </h2>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-sm">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Price</th>
              <th className="text-left px-4 py-2">Condition</th>
              <th className="text-left px-4 py-2">Volume</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().slice(0, 20).map((h: any, i: number) => (
              <tr key={i} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-2">{new Date(h.recorded_at).toLocaleDateString()}</td>
                <td className="px-4 py-2" style={{ color: "var(--accent)" }}>${parseFloat(h.price).toFixed(2)}</td>
                <td className="px-4 py-2">{h.condition ?? "—"}</td>
                <td className="px-4 py-2">{h.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
