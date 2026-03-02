export default function MoversTable({ title, cards, metric }: { title: string; cards: any[]; metric: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-sm">
      <div className="px-4 py-2 border-b text-xs font-mono tracking-widest" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
        {title}
      </div>
      <table className="w-full text-sm font-mono">
        <tbody>
          {cards.map((card) => {
            const val = card[metric];
            const isUp = val >= 0;
            return (
              <tr key={card.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-2" style={{ color: "var(--text)" }}>
                  <a href={`/cards/${card.id}`} className="hover:underline">{card.name}</a>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{card.set_name}</div>
                </td>
                <td className="px-4 py-2 text-right" style={{ color: isUp ? "var(--up)" : "var(--down)" }}>
                  {metric === "volume_7d"
                    ? `${val} sales`
                    : `${isUp ? "+" : ""}${parseFloat(val).toFixed(2)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
