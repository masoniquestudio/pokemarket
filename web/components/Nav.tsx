'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="no-underline flex items-center gap-2.5">
          <span className="bg-surface-dark text-text-inverse font-black text-xs tracking-wide px-2.5 py-1 rounded-md">
            PMI
          </span>
          <span className="font-black text-base tracking-tight text-text">
            POKÉMARKET
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
        <div className="md:hidden bg-surface border-t border-border px-6 py-4 flex flex-col gap-2">
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
      className={`px-4 py-1.5 rounded-full text-sm font-semibold no-underline transition-all duration-150 ${
        active
          ? 'bg-surface-dark text-text-inverse'
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
      className={`px-4 py-3 rounded-xl text-base font-semibold no-underline ${
        active
          ? 'bg-surface-dark text-text-inverse'
          : 'text-text-muted'
      }`}
    >
      {children}
    </Link>
  );
}
