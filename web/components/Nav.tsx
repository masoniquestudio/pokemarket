'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #ebebeb',
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
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: '#f7d02c',
              color: '#1a1a1a',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            PMI
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '0.04em',
              color: '#1a1a1a',
            }}
          >
            POKÉMARKET
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink href="/" active={pathname === '/'}>
            Dashboard
          </NavLink>
          <NavLink href="/cards" active={pathname.startsWith('/cards')}>
            Cards
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '6px 14px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        color: active ? '#1a1a1a' : '#909090',
        background: active ? '#f5f5f5' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </Link>
  );
}
