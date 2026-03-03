'use client';

import { useState, useMemo } from 'react';

type CardRow = {
  id: string;
  name: string;
  set: string;
  number: string;
  era: string;
  tier: string;
  indices: string[];
  currentPrice: number | null;
  changePct: number | null;
  volume: number | null;
};

type SortKey = 'name' | 'set' | 'tier' | 'currentPrice' | 'changePct' | 'volume';
type SortDir = 'asc' | 'desc';

const TIER_LABELS: Record<string, string> = {
  vintage: 'Vintage',
  iconic: 'Iconic',
  'modern-chase': 'Modern Chase',
};

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  vintage: { bg: 'rgba(255,203,5,0.15)', color: '#FFCB05' },
  iconic: { bg: 'rgba(255,100,100,0.15)', color: '#ff8080' },
  'modern-chase': { bg: 'rgba(0,200,83,0.15)', color: '#00c853' },
};

const INDEX_LABELS: Record<string, string> = {
  pmi: 'PMI',
  charizard: 'ZARD',
  vintage: 'VNTG',
  modern: 'MDRN',
};

const INDEX_COLORS: Record<string, { bg: string; color: string }> = {
  pmi: { bg: 'rgba(255,203,5,0.15)', color: '#FFCB05' },
  charizard: { bg: 'rgba(255,100,100,0.15)', color: '#ff8080' },
  vintage: { bg: 'rgba(52,102,175,0.25)', color: '#a0b8d8' },
  modern: { bg: 'rgba(0,200,83,0.15)', color: '#00c853' },
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: '#ffffff', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function CardsTable({ cards }: { cards: CardRow[] }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [indexFilter, setIndexFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    let result = cards;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.set.toLowerCase().includes(q)
      );
    }

    if (tierFilter !== 'all') {
      result = result.filter((c) => c.tier === tierFilter);
    }

    if (indexFilter !== 'all') {
      result = result.filter((c) => c.indices.includes(indexFilter));
    }

    return [...result].sort((a, b) => {
      const aVal: string | number | null = a[sortKey];
      const bVal: string | number | null = b[sortKey];

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (typeof aVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [cards, search, tierFilter, indexFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'set' ? 'asc' : 'desc');
    }
  }

  const thStyle = (col: SortKey, align: 'left' | 'right' = 'left'): React.CSSProperties => ({
    textAlign: align,
    fontSize: 11,
    fontWeight: 600,
    color: sortKey === col ? '#ffffff' : 'rgba(255,255,255,0.3)',
    paddingBottom: 10,
    borderBottom: '1px solid rgba(52,102,175,0.3)',
    paddingRight: 16,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  });

  return (
    <div
      style={{
        background: '#21386E',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search cards or sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1.5px solid rgba(52,102,175,0.5)',
            fontSize: 13,
            outline: 'none',
            width: 220,
            color: '#ffffff',
            background: '#1D2C5E',
          }}
        />

        {/* Tier filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'vintage', 'iconic', 'modern-chase'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: tierFilter === t ? '#3466AF' : 'rgba(52,102,175,0.3)',
                color: tierFilter === t ? '#ffffff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
              }}
            >
              {t === 'all' ? 'All Tiers' : TIER_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Index filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'pmi', 'charizard', 'vintage', 'modern'].map((idx) => (
            <button
              key={idx}
              onClick={() => setIndexFilter(idx)}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: indexFilter === idx ? '#3466AF' : 'rgba(52,102,175,0.3)',
                color: indexFilter === idx ? '#ffffff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
              }}
            >
              {idx === 'all' ? 'All Indices' : INDEX_LABELS[idx]}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {filtered.length} of {cards.length} cards
        </span>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle('name')} onClick={() => toggleSort('name')}>
              Card <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
            </th>
            <th style={thStyle('set')} onClick={() => toggleSort('set')}>
              Set <SortIcon col="set" sortKey={sortKey} sortDir={sortDir} />
            </th>
            <th style={{ ...thStyle('tier'), paddingRight: 16 }} onClick={() => toggleSort('tier')}>
              Tier <SortIcon col="tier" sortKey={sortKey} sortDir={sortDir} />
            </th>
            <th style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', paddingBottom: 10, borderBottom: '1px solid rgba(52,102,175,0.3)', paddingRight: 16 }}>
              Indices
            </th>
            <th style={{ ...thStyle('currentPrice', 'right') }} onClick={() => toggleSort('currentPrice')}>
              Price <SortIcon col="currentPrice" sortKey={sortKey} sortDir={sortDir} />
            </th>
            <th style={{ ...thStyle('changePct', 'right') }} onClick={() => toggleSort('changePct')}>
              7d % <SortIcon col="changePct" sortKey={sortKey} sortDir={sortDir} />
            </th>
            <th style={{ ...thStyle('volume', 'right'), paddingRight: 0 }} onClick={() => toggleSort('volume')}>
              Vol <SortIcon col="volume" sortKey={sortKey} sortDir={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((card, i) => {
            const tierStyle = TIER_COLORS[card.tier] ?? { bg: 'rgba(52,102,175,0.25)', color: '#a0b8d8' };
            return (
              <tr
                key={card.id}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(52,102,175,0.15)' : 'none' }}
              >
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <a
                    href={`/cards/${card.id}`}
                    style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', textDecoration: 'none' }}
                  >
                    {card.name}
                  </a>
                </td>
                <td style={{ fontSize: 13, color: '#a0b8d8', padding: '10px 16px 10px 0' }}>
                  {card.set}
                </td>
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 5,
                      background: tierStyle.bg,
                      color: tierStyle.color,
                    }}
                  >
                    {TIER_LABELS[card.tier] ?? card.tier}
                  </span>
                </td>
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {card.indices.map((idx) => {
                      const cs = INDEX_COLORS[idx] ?? { bg: 'rgba(52,102,175,0.25)', color: '#a0b8d8' };
                      return (
                        <span
                          key={idx}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: cs.bg,
                            color: cs.color,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {INDEX_LABELS[idx]}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="num" style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                  {card.currentPrice != null ? `$${card.currentPrice.toFixed(2)}` : '—'}
                </td>
                <td className="num" style={{ textAlign: 'right', padding: '10px 16px 10px 0' }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        card.changePct === null ? 'rgba(255,255,255,0.3)' :
                        card.changePct >= 0 ? '#00c853' : '#ff3d00',
                    }}
                  >
                    {card.changePct === null ? '—' : `${card.changePct >= 0 ? '+' : ''}${card.changePct.toFixed(2)}%`}
                  </span>
                </td>
                <td className="num" style={{ textAlign: 'right', padding: '10px 0', fontSize: 13, color: '#a0b8d8' }}>
                  {card.volume ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '32px 0' }}>
          No cards match your filters
        </p>
      )}
    </div>
  );
}
