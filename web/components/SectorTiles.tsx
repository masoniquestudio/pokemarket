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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}
    >
      {sectors.map((sector) => {
        const isUp = (sector.avgChangePct ?? 0) >= 0;
        const hasChange = sector.avgChangePct !== null;

        return (
          <div
            key={sector.tier}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow:
                '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#909090',
                    marginBottom: 4,
                  }}
                >
                  {sector.label}
                </p>
                <p style={{ fontSize: 13, color: '#bbb', fontWeight: 400 }}>
                  {sector.cardCount} card{sector.cardCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                {hasChange ? (
                  <span
                    className="num"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: isUp ? '#00c853' : '#ff3d00',
                    }}
                  >
                    {isUp ? '+' : ''}
                    {sector.avgChangePct!.toFixed(2)}%
                  </span>
                ) : (
                  <span
                    className="num"
                    style={{ fontSize: 18, fontWeight: 700, color: '#ccc' }}
                  >
                    —
                  </span>
                )}
                <p style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                  7d avg
                </p>
              </div>
            </div>

            <Sparkline
              data={sector.history}
              color={
                !hasChange
                  ? '#e0e0e0'
                  : isUp
                  ? '#00c853'
                  : '#ff3d00'
              }
              height={48}
            />
          </div>
        );
      })}
    </div>
  );
}
