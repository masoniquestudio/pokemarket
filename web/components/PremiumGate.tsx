import Link from 'next/link';

type Props = {
  children: React.ReactNode;
  isPremium: boolean;
  featureName?: string;
};

export default function PremiumGate({ children, isPremium, featureName = 'this feature' }: Props) {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/60 backdrop-blur-[2px] rounded-xl">
        <div className="text-center px-4">
          <p className="text-amber-400 font-bold text-sm mb-1">PRO Feature</p>
          <p className="text-text-muted text-xs mb-3">
            Unlock {featureName} with Premium
          </p>
          <Link
            href="/premium"
            className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
