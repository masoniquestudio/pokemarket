import Sparkline from './Sparkline';

// Sparkline colors — keep hex for Recharts (dark theme)
const CHART_COLORS = { up: '#4ADE80', down: '#F87171', neutral: '#404040' };

export type SectorData = {
  tier: string;
  label: string;
  cardCount: number;
  avgChangePct: number | null;
  history: { value: number }[];
};

type Props = {
  sectors: SectorData[];
};

export default function SectorTiles({ sectors }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sectors.map((sector) => {
        const isUp = (sector.avgChangePct ?? 0) >= 0;
        const hasChange = sector.avgChangePct !== null;

        return (
          <div
            key={sector.tier}
            className="bg-surface rounded-2xl px-6 py-5 border border-border"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-text-muted mb-1">
                  {sector.label}
                </p>
                <p className="text-[13px] text-text-muted">
                  {sector.cardCount} card{sector.cardCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="text-right">
                {hasChange ? (
                  <span className={`num text-lg font-bold ${isUp ? 'text-up' : 'text-down'}`}>
                    {isUp ? '+' : ''}{sector.avgChangePct!.toFixed(2)}%
                  </span>
                ) : (
                  <span className="num text-lg font-bold text-text-muted">—</span>
                )}
                <p className="text-[11px] text-text-muted mt-0.5">avg chg</p>
              </div>
            </div>

            <Sparkline
              data={sector.history}
              color={!hasChange ? CHART_COLORS.neutral : isUp ? CHART_COLORS.up : CHART_COLORS.down}
              height={48}
            />
          </div>
        );
      })}
    </div>
  );
}
