'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function Pokeball({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top half - red */}
      <path d="M50 5C25.2 5 5 25.2 5 50h90C95 25.2 74.8 5 50 5z" fill="#DC0A2D"/>
      {/* Bottom half - white */}
      <path d="M5 50c0 24.8 20.2 45 45 45s45-20.2 45-45H5z" fill="#FFFFFF"/>
      {/* Center line */}
      <rect x="5" y="46" width="90" height="8" fill="#1A1A1A"/>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="16" fill="#1A1A1A"/>
      {/* Inner circle */}
      <circle cx="50" cy="50" r="10" fill="#FFFFFF"/>
      {/* Button highlight */}
      <circle cx="50" cy="50" r="5" fill="#F5F5F0" stroke="#E0E0DC" strokeWidth="1"/>
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-primary border-b-4 border-primary-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="no-underline flex items-center gap-3">
          <Pokeball size={28} />
          <span className="font-black text-lg tracking-tight text-text-inverse">
            POKÉMARKET
          </span>
        </Link>

        {/* Small indicator lights - decorative */}
        <div className="hidden sm:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
          <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
          <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.6)]" />
        </div>

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
          <span className={`block w-5 h-0.5 bg-text-inverse transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-text-inverse transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-text-inverse transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden bg-primary-dark px-6 py-4 flex flex-col gap-2">
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
          ? 'bg-accent text-text-inverse'
          : 'text-white/80 hover:text-white hover:bg-white/10'
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
          ? 'bg-accent text-text-inverse'
          : 'text-white/80'
      }`}
    >
      {children}
    </Link>
  );
}
