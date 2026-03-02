export const dynamic = "force-dynamic";

import { fetchIndices, fetchIndexHistory, fetchMarketMovers } from "@/lib/api";
import IndexChart from "@/components/IndexChart";
import SectorGrid from "@/components/SectorGrid";
import MoversTable from "@/components/MoversTable";

export default async function HomePage() {
  const [{ indices }, pmiHistory, { gainers, losers, most_active }] = await Promise.all([
    fetchIndices(),
    fetchIndexHistory("pmi", 30),
    fetchMarketMovers(),
  ]);

  const pmi = indices.find((i: any) => i.slug === "pmi");
  const isUp = pmi?.change_pct >= 0;

  return (
    <div>
      {/* PMI Header */}
      <div className="mb-4">
        <div className="text-xs font-mono mb-1" style={{ color: "var(--text-secondary)" }}>
          POKÉMARKET INDEX (PMI)
        </div>
        <div className="flex items-baseline gap-4">
          <span className="text-4xl font-mono font-bold">
            {pmi ? parseFloat(pmi.value).toFixed(2) : "—"}
          </span>
          {pmi?.change_pct !== null && (
            <span className="text-lg font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
              {isUp ? "▲" : "▼"} {Math.abs(pmi.change_pct).toFixed(2)}% today
            </span>
          )}
        </div>
      </div>

      {/* PMI Chart */}
      <IndexChart history={pmiHistory.history ?? []} name="PokéMarket Index" />

      {/* Sector Indices */}
      <h2 className="mt-8 mb-2 text-xs font-mono tracking-widest" style={{ color: "var(--text-secondary)" }}>
        SECTOR INDICES
      </h2>
      <SectorGrid indices={indices} />

      {/* Movers Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <MoversTable title="TOP GAINERS" cards={gainers} metric="change_pct_7d" />
        <MoversTable title="TOP LOSERS" cards={losers} metric="change_pct_7d" />
        <MoversTable title="MOST ACTIVE" cards={most_active} metric="volume_7d" />
      </div>
    </div>
  );
}
