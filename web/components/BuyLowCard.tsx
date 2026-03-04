import Link from 'next/link';

type Criterion = {
  name: string;
  label: string;
  discount?: number;
  zscore?: number;
  volume?: number;
  change?: number;
  dip7d?: number;
  gain30d?: number;
};

type Props = {
  card: {
    id: string;
    name: string;
    set: string;
    tier: string;
    currentPrice: number;
    signalStrength: number;
    criteria: Criterion[];
    discountPct: number | null;
    sma30d: number | null;
  };
};

export default function BuyLowCard({ card }: Props) {
  const strengthLabel =
    card.signalStrength >= 4
      ? 'Strong'
      : card.signalStrength >= 3
        ? 'Moderate'
        : 'Weak';

  const strengthColor =
    card.signalStrength >= 4
      ? 'text-green-400'
      : card.signalStrength >= 3
        ? 'text-amber-400'
        : 'text-text-muted';

  return (
    <Link
      href={`/cards/${card.id}`}
      className="block bg-surface border border-border rounded-xl p-4 hover:border-amber-500/50 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text truncate">{card.name}</h3>
          <p className="text-xs text-text-muted truncate">{card.set}</p>
        </div>
        <div className="text-right ml-2 shrink-0">
          <p className="font-bold text-text num">${card.currentPrice.toFixed(2)}</p>
          {card.discountPct && card.discountPct > 0 && (
            <p className="text-xs text-green-400">
              {Math.min(card.discountPct, 99).toFixed(1)}% below avg
            </p>
          )}
        </div>
      </div>

      {/* Signal strength */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i <= card.signalStrength ? 'bg-amber-400' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${strengthColor}`}>
          {strengthLabel} Signal
        </span>
      </div>

      {/* Criteria tags */}
      <div className="flex flex-wrap gap-1">
        {card.criteria.map((c) => (
          <span
            key={c.name}
            className="text-[10px] px-2 py-0.5 bg-white/5 text-text-muted rounded-full"
          >
            {c.label}
          </span>
        ))}
      </div>
    </Link>
  );
}
