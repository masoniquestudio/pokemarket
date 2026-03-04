type MarketStatsProps = {
  totalCards: number;
  totalMarketCap: number;
  totalVolume: number;
  avgChange: number;
  mostActive: { name: string; volume: number } | null;
  marketSentiment: { up: number; down: number; neutral: number };
};

export default function MarketStats({
  totalCards,
  totalMarketCap,
  totalVolume,
  avgChange,
  mostActive,
  marketSentiment,
}: MarketStatsProps) {
  const sentimentPct = totalCards > 0
    ? Math.round((marketSentiment.up / totalCards) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatTile
        label="Market Cap"
        value={`$${formatNumber(totalMarketCap)}`}
        sublabel="sum of avg prices"
      />
      <StatTile
        label="Cards Tracked"
        value={totalCards.toString()}
        sublabel="with price data"
      />
      <StatTile
        label="Total Volume"
        value={formatNumber(totalVolume)}
        sublabel="listings found"
      />
      <StatTile
        label="Avg Change"
        value={`${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`}
        sublabel="7 day"
        valueColor={avgChange >= 0 ? 'text-up' : 'text-down'}
      />
      <StatTile
        label="Sentiment"
        value={`${sentimentPct}%`}
        sublabel={`${marketSentiment.up} up · ${marketSentiment.down} down`}
        valueColor={sentimentPct >= 50 ? 'text-up' : 'text-down'}
      />
      <StatTile
        label="Most Active"
        value={mostActive?.name ?? '—'}
        sublabel={mostActive ? `${mostActive.volume} sales` : 'no data'}
        smallValue
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  sublabel,
  valueColor = 'text-text',
  smallValue = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  valueColor?: string;
  smallValue?: boolean;
}) {
  return (
    <div className="bg-surface rounded-xl px-4 py-4 border border-border">
      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-text-muted mb-1">
        {label}
      </p>
      <p className={`${smallValue ? 'text-sm truncate' : 'text-xl'} font-bold ${valueColor} num`}>
        {value}
      </p>
      <p className="text-[11px] text-text-muted mt-0.5">{sublabel}</p>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}
