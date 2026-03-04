'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Pokeball({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top half - red */}
      <path d="M50 5C25.2 5 5 25.2 5 50h90C95 25.2 74.8 5 50 5z" fill="#DC0A2D"/>
      {/* Bottom half - white */}
      <path d="M5 50c0 24.8 20.2 45 45 45s45-20.2 45-45H5z" fill="#FAFAFA"/>
      {/* Center line */}
      <rect x="5" y="46" width="90" height="8" fill="#1A1A1A"/>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="16" fill="#1A1A1A"/>
      {/* Inner circle */}
      <circle cx="50" cy="50" r="10" fill="#FAFAFA"/>
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="no-underline flex items-center gap-2.5">
          <Pokeball size={22} />
          <span className="font-bold text-[15px] tracking-tight text-text">
            PokéMarket
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/" active={pathname === '/'}>Dashboard</NavLink>
          <NavLink href="/cards" active={pathname.startsWith('/cards')}>Cards</NavLink>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-text transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-text transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-text transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-border px-6 py-4 flex flex-col gap-1">
          <MobileNavLink href="/" active={pathname === '/'} onClick={() => setMobileOpen(false)}>
            Dashboard
          </MobileNavLink>
          <MobileNavLink href="/cards" active={pathname.startsWith('/cards')} onClick={() => setMobileOpen(false)}>
            Cards
          </MobileNavLink>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors ${
        active
          ? 'text-text bg-white/5'
          : 'text-text-muted hover:text-text'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-4 py-3 rounded-lg text-base font-medium no-underline ${
        active
          ? 'text-text bg-white/5'
          : 'text-text-muted'
      }`}
    >
      {children}
    </Link>
  );
}
