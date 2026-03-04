'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Pokeball({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle */}
      <circle cx="50" cy="50" r="46" stroke="#FAFAFA" strokeWidth="3" fill="none"/>
      {/* Center line */}
      <line x1="4" y1="50" x2="96" y2="50" stroke="#FAFAFA" strokeWidth="3"/>
      {/* Center circle outer */}
      <circle cx="50" cy="50" r="12" stroke="#FAFAFA" strokeWidth="3" fill="none"/>
      {/* Center dot */}
      <circle cx="50" cy="50" r="4" fill="#FAFAFA"/>
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
          <Pokeball size={18} />
          <span className="font-medium text-[11px] tracking-[0.2em] uppercase text-text">
            PokéMarket
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
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
      className={`text-[11px] tracking-[0.15em] uppercase font-medium no-underline transition-colors pb-0.5 ${
        active
          ? 'text-text border-b border-text'
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
      className={`px-4 py-3 rounded-lg text-[11px] tracking-[0.15em] uppercase font-medium no-underline ${
        active
          ? 'text-text bg-white/5'
          : 'text-text-muted'
      }`}
    >
      {children}
    </Link>
  );
}
