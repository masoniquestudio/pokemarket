'use client';

type Period = '1d' | '7d' | '30d' | '90d';

type Props = {
  selected: Period;
  onChange: (period: Period) => void;
  isPremium?: boolean;
  lockedPeriods?: Period[];
};

const PERIODS: { value: Period; label: string }[] = [
  { value: '1d', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

export default function TimeframeTabs({
  selected,
  onChange,
  isPremium = false,
  lockedPeriods = ['1d', '30d', '90d'],
}: Props) {
  return (
    <div className="flex gap-1 bg-surface rounded-lg p-1">
      {PERIODS.map(({ value, label }) => {
        const isLocked = !isPremium && lockedPeriods.includes(value);
        const isActive = selected === value;

        return (
          <button
            key={value}
            onClick={() => !isLocked && onChange(value)}
            disabled={isLocked}
            className={`
              relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors
              ${isActive
                ? 'bg-white/10 text-text'
                : isLocked
                  ? 'text-text-muted/50 cursor-not-allowed'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }
            `}
          >
            {label}
            {isLocked && (
              <span className="absolute -top-1 -right-1 text-[8px] text-amber-400">
                PRO
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
