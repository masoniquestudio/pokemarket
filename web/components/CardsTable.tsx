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

const TIER_CLASSES: Record<string, string> = {
  vintage: 'bg-tier-vintage-bg text-tier-vintage',
  iconic: 'bg-tier-iconic-bg text-tier-iconic',
  'modern-chase': 'bg-tier-modern-bg text-tier-modern',
};

const INDEX_LABELS: Record<string, string> = {
  pmi: 'PMI',
  charizard: 'ZARD',
  vintage: 'VNTG',
  modern: 'MDRN',
};

const INDEX_CLASSES: Record<string, string> = {
  pmi: 'bg-primary/10 text-primary',
  charizard: 'bg-accent/10 text-accent',
  vintage: 'bg-tier-iconic-bg text-tier-iconic',
  modern: 'bg-tier-modern-bg text-tier-modern',
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <span className="text-text-muted ml-1">↕</span>;
  return <span className="text-accent ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
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

  const thBase = 'text-[11px] font-semibold pb-2.5 border-b border-border pr-4 cursor-pointer select-none whitespace-nowrap';

  return (
    <div className="bg-surface rounded-2xl px-6 py-5 border border-border">
      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search cards or sets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3.5 py-2 rounded-full border border-border text-[13px] outline-none w-full sm:w-56 text-text bg-bg"
        />

        <div className="flex gap-1 flex-wrap">
          {['all', 'vintage', 'iconic', 'modern-chase'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3.5 py-1.5 rounded-full cursor-pointer text-xs font-semibold transition-all duration-150 ${
                tierFilter === t
                  ? 'bg-surface-dark text-text-inverse border-none'
                  : 'bg-surface text-text-muted border border-border'
              }`}
            >
              {t === 'all' ? 'All Tiers' : TIER_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap">
          {['all', 'pmi', 'charizard', 'vintage', 'modern'].map((idx) => (
            <button
              key={idx}
              onClick={() => setIndexFilter(idx)}
              className={`px-3.5 py-1.5 rounded-full cursor-pointer text-xs font-semibold transition-all duration-150 ${
                indexFilter === idx
                  ? 'bg-surface-dark text-text-inverse border-none'
                  : 'bg-surface text-text-muted border border-border'
              }`}
            >
              {idx === 'all' ? 'All Indices' : INDEX_LABELS[idx]}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-text-muted">
          {filtered.length} of {cards.length} cards
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className={`${thBase} text-left ${sortKey === 'name' ? 'text-accent' : 'text-text-muted'}`} onClick={() => toggleSort('name')}>
                Card <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={`${thBase} text-left hidden md:table-cell ${sortKey === 'set' ? 'text-accent' : 'text-text-muted'}`} onClick={() => toggleSort('set')}>
                Set <SortIcon col="set" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={`${thBase} text-left hidden md:table-cell ${sortKey === 'tier' ? 'text-accent' : 'text-text-muted'}`} onClick={() => toggleSort('tier')}>
                Tier <SortIcon col="tier" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={`${thBase} text-left hidden lg:table-cell text-text-muted`}>Indices</th>
              <th className={`${thBase} text-right ${sortKey === 'currentPrice' ? 'text-accent' : 'text-text-muted'}`} onClick={() => toggleSort('currentPrice')}>
                Price <SortIcon col="currentPrice" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={`${thBase} text-right ${sortKey === 'changePct' ? 'text-accent' : 'text-text-muted'}`} onClick={() => toggleSort('changePct')}>
                Chg % <SortIcon col="changePct" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className={`${thBase} text-right hidden lg:table-cell pr-0 ${sortKey === 'volume' ? 'text-accent' : 'text-text-muted'}`} onClick={() => toggleSort('volume')}>
                Vol <SortIcon col="volume" sortKey={sortKey} sortDir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((card, i) => {
              const tierClass = TIER_CLASSES[card.tier] ?? 'bg-violet-500/10 text-accent';
              return (
                <tr key={card.id} className={i < filtered.length - 1 ? 'border-b border-border' : ''}>
                  <td className="py-2.5 pr-4">
                    <a href={`/cards/${card.id}`} className="text-sm font-semibold text-text no-underline">
                      {card.name}
                    </a>
                  </td>
                  <td className="text-[13px] text-text-muted py-2.5 pr-4 hidden md:table-cell">{card.set}</td>
                  <td className="py-2.5 pr-4 hidden md:table-cell">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-xl ${tierClass}`}>
                      {TIER_LABELS[card.tier] ?? card.tier}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {card.indices.map((idx) => {
                        const idxClass = INDEX_CLASSES[idx] ?? 'bg-violet-500/10 text-accent';
                        return (
                          <span key={idx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${idxClass}`}>
                            {INDEX_LABELS[idx]}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="num text-right py-2.5 pr-4 text-sm font-semibold text-text">
                    {card.currentPrice != null ? `$${card.currentPrice.toFixed(2)}` : '—'}
                  </td>
                  <td className="num text-right py-2.5 pr-4">
                    <span className={`text-[13px] font-bold ${
                      card.changePct === null ? 'text-text-muted' : card.changePct >= 0 ? 'text-up' : 'text-down'
                    }`}>
                      {card.changePct === null ? '—' : `${card.changePct >= 0 ? '+' : ''}${card.changePct.toFixed(2)}%`}
                    </span>
                  </td>
                  <td className="num text-right py-2.5 text-[13px] text-text-muted hidden lg:table-cell">
                    {card.volume ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-text-muted text-sm py-8">
          No cards match your filters
        </p>
      )}
    </div>
  );
}
