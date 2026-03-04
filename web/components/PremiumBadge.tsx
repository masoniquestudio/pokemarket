type Props = {
  size?: 'sm' | 'md';
};

export default function PremiumBadge({ size = 'sm' }: Props) {
  const sizeClasses = size === 'sm'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-1';

  return (
    <span
      className={`${sizeClasses} font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 rounded`}
    >
      PRO
    </span>
  );
}
