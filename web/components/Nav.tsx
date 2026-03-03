'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              background: 'var(--surface-dark)',
              color: 'var(--text-inverse)',
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: '0.08em',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            PMI
          </span>
          <span
            style={{
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: '-0.03em',
              color: 'var(--text)',
            }}
          >
            POKÉMARKET
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink href="/" active={pathname === '/'}>Dashboard</NavLink>
          <NavLink href="/cards" active={pathname.startsWith('/cards')}>Cards</NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '7px 18px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        color: active ? 'var(--text-inverse)' : 'var(--text-muted)',
        background: active ? 'var(--surface-dark)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </Link>
  );
}
