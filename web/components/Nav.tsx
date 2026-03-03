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
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              background: 'var(--gradient)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.06em',
              padding: '3px 10px',
              borderRadius: 999,
            }}
          >
            PMI
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: '0.04em',
              background: 'var(--gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
        padding: '6px 16px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        color: active ? '#fff' : 'var(--text-muted)',
        background: active ? 'var(--gradient)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </Link>
  );
}
