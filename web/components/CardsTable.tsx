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
  vintage:       { bg: 'var(--tier-vintage-bg)',  color: 'var(--tier-vintage-color)' },
  iconic:        { bg: 'var(--tier-iconic-bg)',   color: 'var(--tier-iconic-color)' },
  'modern-chase':{ bg: 'var(--tier-modern-bg)',   color: 'var(--tier-modern-color)' },
};

const INDEX_LABELS: Record<string, string> = {
  pmi: 'PMI',
  charizard: 'ZARD',
  vintage: 'VNTG',
  modern: 'MDRN',
};

const INDEX_COLORS: Record<string, { bg: string; color: string }> = {
  pmi:       { bg: 'var(--tier-vintage-bg)',  color: 'var(--tier-vintage-color)' },
  charizard: { bg: 'var(--tier-iconic-bg)',   color: 'var(--tier-iconic-color)' },
  vintage:   { bg: 'rgba(124,58,237,0.1)',    color: 'var(--accent)' },
  modern:    { bg: 'var(--tier-modern-bg)',   color: 'var(--tier-modern-color)' },
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: 'var(--accent)', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function CardsTable({ cards }: { cards: CardRow[] }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [indexFilter, setIndexFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    let result = cards;

    // Hide cards with no price data
    result = result.filter((c) => c.currentPrice != null && c.currentPrice > 0);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.set.toLowerCase().includes(q));
    }
    if (tierFilter !== 'all') result = result.filter((c) => c.tier === tierFilter);
    if (indexFilter !== 'all') result = result.filter((c) => c.indices.includes(indexFilter));

    return [...result].sort((a, b) => {
      const aVal: string | number | null = a[sortKey];
      const bVal: string | number | null = b[sortKey];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
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
    color: sortKey === col ? 'var(--accent)' : 'var(--text-muted)',
    paddingBottom: 10,
    borderBottom: '1px solid var(--border)',
    paddingRight: 16,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  });

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 999,
    border: active ? 'none' : '1px solid var(--border)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    background: active ? 'var(--surface-dark)' : 'var(--surface)',
    color: active ? 'var(--text-inverse)' : 'var(--text-muted)',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '20px 24px',

        border: '1px solid var(--border)',
      }}
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search cards or sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid var(--border)',
            fontSize: 13,
            outline: 'none',
            width: 220,
            color: 'var(--text)',
            background: 'var(--bg)',
          }}
        />

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'vintage', 'iconic', 'modern-chase'].map((t) => (
            <button key={t} onClick={() => setTierFilter(t)} style={filterBtn(tierFilter === t)}>
              {t === 'all' ? 'All Tiers' : TIER_LABELS[t]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'pmi', 'charizard', 'vintage', 'modern'].map((idx) => (
            <button key={idx} onClick={() => setIndexFilter(idx)} style={filterBtn(indexFilter === idx)}>
              {idx === 'all' ? 'All Indices' : INDEX_LABELS[idx]}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} of {cards.length} cards
        </span>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle('name')} onClick={() => toggleSort('name')}>Card <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></th>
            <th style={thStyle('set')} onClick={() => toggleSort('set')}>Set <SortIcon col="set" sortKey={sortKey} sortDir={sortDir} /></th>
            <th style={{ ...thStyle('tier'), paddingRight: 16 }} onClick={() => toggleSort('tier')}>Tier <SortIcon col="tier" sortKey={sortKey} sortDir={sortDir} /></th>
            <th style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', paddingBottom: 10, borderBottom: '1px solid var(--border)', paddingRight: 16 }}>Indices</th>
            <th style={thStyle('currentPrice', 'right')} onClick={() => toggleSort('currentPrice')}>Avg Price <SortIcon col="currentPrice" sortKey={sortKey} sortDir={sortDir} /></th>
            <th style={thStyle('changePct', 'right')} onClick={() => toggleSort('changePct')}>7d % <SortIcon col="changePct" sortKey={sortKey} sortDir={sortDir} /></th>
            <th style={{ ...thStyle('volume', 'right'), paddingRight: 0 }} onClick={() => toggleSort('volume')}>Vol <SortIcon col="volume" sortKey={sortKey} sortDir={sortDir} /></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((card, i) => {
            const tierStyle = TIER_COLORS[card.tier] ?? { bg: 'rgba(124,58,237,0.1)', color: 'var(--accent)' };
            return (
              <tr key={card.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <a href={`/cards/${card.id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                    {card.name}
                  </a>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 16px 10px 0' }}>{card.set}</td>
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: tierStyle.bg, color: tierStyle.color }}>
                    {TIER_LABELS[card.tier] ?? card.tier}
                  </span>
                </td>
                <td style={{ padding: '10px 16px 10px 0' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {card.indices.map((idx) => {
                      const cs = INDEX_COLORS[idx] ?? { bg: 'rgba(124,58,237,0.1)', color: 'var(--accent)' };
                      return (
                        <span key={idx} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: cs.bg, color: cs.color, letterSpacing: '0.04em' }}>
                          {INDEX_LABELS[idx]}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="num" style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {card.currentPrice != null ? `$${card.currentPrice.toFixed(2)}` : '—'}
                </td>
                <td className="num" style={{ textAlign: 'right', padding: '10px 16px 10px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: card.changePct === null ? 'var(--text-muted)' : card.changePct >= 0 ? 'var(--up)' : 'var(--down)' }}>
                    {card.changePct === null ? '—' : `${card.changePct >= 0 ? '+' : ''}${card.changePct.toFixed(2)}%`}
                  </span>
                </td>
                <td className="num" style={{ textAlign: 'right', padding: '10px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  {card.volume ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '32px 0' }}>
          No cards match your filters
        </p>
      )}
    </div>
  );
}
