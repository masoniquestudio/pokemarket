const TYPE_EMOJI: Record<string, string> = {
  fire: "🔥", water: "💧", grass: "🌿", electric: "⚡",
  psychic: "🌀", fighting: "🥊", darkness: "🌑", metal: "⚙️",
  dragon: "🐉",
};

export default function SectorGrid({ indices }: { indices: any[] }) {
  const sectors = indices.filter((i) => TYPE_EMOJI[i.slug]);

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-6">
      {sectors.map((idx) => {
        const isUp = idx.change_pct >= 0;
        return (
          <a
            key={idx.slug}
            href={`/indices/${idx.slug}`}
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            className="p-3 rounded-sm hover:border-yellow-400 transition-colors"
          >
            <div className="text-lg">{TYPE_EMOJI[idx.slug]}</div>
            <div className="text-xs font-mono mt-1" style={{ color: "var(--text-secondary)" }}>
              {idx.name.replace(" Type Index", "")}
            </div>
            <div className="text-sm font-mono font-bold mt-1" style={{ color: "var(--text)" }}>
              {parseFloat(idx.value).toFixed(2)}
            </div>
            <div className="text-xs font-mono" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
              {isUp ? "▲" : "▼"} {Math.abs(idx.change_pct).toFixed(2)}%
            </div>
          </a>
        );
      })}
    </div>
  );
}
