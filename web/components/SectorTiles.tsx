import Sparkline from './Sparkline';

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {sectors.map((sector) => {
        const isUp = (sector.avgChangePct ?? 0) >= 0;
        const hasChange = sector.avgChangePct !== null;

        return (
          <div
            key={sector.tier}
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: '20px 24px',

              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                  {sector.label}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                  {sector.cardCount} card{sector.cardCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                {hasChange ? (
                  <span className="num" style={{ fontSize: 18, fontWeight: 700, color: isUp ? 'var(--up)' : 'var(--down)' }}>
                    {isUp ? '+' : ''}{sector.avgChangePct!.toFixed(2)}%
                  </span>
                ) : (
                  <span className="num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)' }}>—</span>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>avg chg</p>
              </div>
            </div>

            <Sparkline
              data={sector.history}
              color={!hasChange ? '#E0E0DC' : isUp ? '#00A86B' : '#FF3D00'}
              height={48}
            />
          </div>
        );
      })}
    </div>
  );
}
