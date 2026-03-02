export const dynamic = "force-dynamic";

import { fetchIndexHistory, fetchIndices } from "@/lib/api";
import IndexChart from "@/components/IndexChart";
import { notFound } from "next/navigation";

export default async function IndexPage({ params }: { params: { slug: string } }) {
  const [historyData, { indices }] = await Promise.all([
    fetchIndexHistory(params.slug, 90),
    fetchIndices(),
  ]);

  if (!historyData.history?.length) return notFound();

  const idx = indices.find((i: any) => i.slug === params.slug);
  const isUp = idx?.change_pct >= 0;

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-mono tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>
          INDEX
        </div>
        <h1 className="text-2xl font-mono font-bold">{idx?.name}</h1>
        {idx && (
          <div className="flex items-baseline gap-4 mt-2">
            <span className="text-3xl font-mono font-bold">{parseFloat(idx.value).toFixed(2)}</span>
            <span className="font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
              {isUp ? "▲" : "▼"} {Math.abs(idx.change_pct).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      <IndexChart history={historyData.history} name={idx?.name ?? params.slug} />
    </div>
  );
}
