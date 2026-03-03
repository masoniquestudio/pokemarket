import Link from 'next/link';

export type CardRow = {
  id: string;
  name: string;
  set: string;
  tier: string;
  currentPrice: number;
  changePct: number | null;
  volume: number | null;
};

type Props = {
  gainers: CardRow[];
  losers: CardRow[];
};

const TIER_LABELS: Record<string, string> = {
  vintage: 'Vintage',
  iconic: 'Iconic',
  'modern-chase': 'Modern',
};

export default function MoversTable({ gainers, losers }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Table title="Top Gainers" rows={gainers} type="up" />
      <Table title="Top Losers" rows={losers} type="down" />
    </div>
  );
}

function Table({
  title,
  rows,
  type,
}: {
  title: string;
  rows: CardRow[];
  type: 'up' | 'down';
}) {
  const accentColor = type === 'up' ? '#00c853' : '#ff3d00';

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accentColor,
          }}
        />
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#1a1a1a',
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: 11,
            color: '#bbb',
            marginLeft: 'auto',
          }}
        >
          7d
        </span>
      </div>

      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '24px 0' }}>
          No data yet
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#bbb',
                  paddingBottom: 8,
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                Card
              </th>
              <th
                style={{
                  textAlign: 'right',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#bbb',
                  paddingBottom: 8,
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                Price
              </th>
              <th
                style={{
                  textAlign: 'right',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#bbb',
                  paddingBottom: 8,
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                7d %
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: i < rows.length - 1 ? '1px solid #f9f9f9' : 'none',
                }}
              >
                <td style={{ padding: '10px 0' }}>
                  <Link
                    href={`/cards/${row.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#1a1a1a',
                        marginBottom: 2,
                      }}
                    >
                      {row.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#bbb' }}>
                      {TIER_LABELS[row.tier] ?? row.tier} · {row.set}
                    </p>
                  </Link>
                </td>
                <td style={{ textAlign: 'right', padding: '10px 0' }}>
                  <span
                    className="num"
                    style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}
                  >
                    ${row.currentPrice.toFixed(2)}
                  </span>
                </td>
                <td style={{ textAlign: 'right', padding: '10px 0' }}>
                  <span
                    className="num"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        row.changePct === null
                          ? '#bbb'
                          : row.changePct >= 0
                          ? '#00c853'
                          : '#ff3d00',
                    }}
                  >
                    {row.changePct === null
                      ? '—'
                      : `${row.changePct >= 0 ? '+' : ''}${row.changePct.toFixed(2)}%`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
