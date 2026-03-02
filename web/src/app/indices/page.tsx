export const dynamic = "force-dynamic";

import { fetchIndices } from "@/lib/api";
import Link from "next/link";

export default async function IndicesPage() {
  const { indices } = await fetchIndices();

  return (
    <div>
      <h1 className="text-xl font-mono font-bold mb-6">ALL INDICES</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {indices.map((idx: any) => {
          const isUp = idx.change_pct >= 0;
          return (
            <Link
              key={idx.slug}
              href={`/indices/${idx.slug}`}
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              className="p-4 rounded-sm hover:border-yellow-400 transition-colors flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-mono font-bold" style={{ color: "var(--text)" }}>{idx.name}</div>
                <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{idx.slug.toUpperCase()}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold">{parseFloat(idx.value).toFixed(2)}</div>
                {idx.change_pct !== null && (
                  <div className="text-xs font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
                    {isUp ? "▲" : "▼"} {Math.abs(idx.change_pct).toFixed(2)}%
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
