export const dynamic = "force-dynamic";

import { fetchCards } from "@/lib/api";
import Link from "next/link";

export default async function CardsPage() {
  const { cards } = await fetchCards({ limit: "200" });

  return (
    <div>
      <h1 className="text-xl font-mono font-bold mb-6">ALL CARDS</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cards.map((card: any) => {
          const price = card.current_price ? parseFloat(card.current_price) : null;
          return (
            <Link
              key={card.id}
              href={`/cards/${card.id}`}
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              className="p-3 rounded-sm hover:border-yellow-400 transition-colors block"
            >
              {card.image_url && (
                <img src={card.image_url} alt={card.name} className="w-full rounded-sm mb-2" />
              )}
              <div className="text-xs font-mono font-bold" style={{ color: "var(--text)" }}>{card.name}</div>
              <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{card.set_name}</div>
              {price && (
                <div className="text-sm font-mono font-bold mt-1" style={{ color: "var(--accent)" }}>
                  ${price.toFixed(2)}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
