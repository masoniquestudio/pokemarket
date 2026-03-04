'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const FEATURES = [
  { name: 'PMI Index + 4 Market Indices', free: true, premium: true },
  { name: 'Top Gainers/Losers (7-day)', free: true, premium: true },
  { name: 'Individual Card Pages', free: true, premium: true },
  { name: 'All Cards Table', free: true, premium: true },
  { name: '24-hour Price Changes', free: false, premium: true },
  { name: '30-day & 90-day Changes', free: false, premium: true },
  { name: 'Daily Movers Dashboard', free: false, premium: true },
  { name: 'Buy Low Signals', free: false, premium: true },
];

export default function PremiumPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 1500);
      } else {
        setError(data.error || 'Invalid key');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="max-w-2xl mx-auto px-6 pt-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full mb-4">
            PRO
          </span>
          <h1 className="text-3xl font-bold text-text mb-2">
            Upgrade to Premium
          </h1>
          <p className="text-text-muted">
            Get deeper insights into the Pokemon card market
          </p>
        </div>

        {/* Feature comparison */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">
                  Feature
                </th>
                <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 w-20">
                  Free
                </th>
                <th className="text-center text-xs font-medium text-amber-400 uppercase tracking-wider px-4 py-3 w-20">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, i) => (
                <tr
                  key={feature.name}
                  className={i < FEATURES.length - 1 ? 'border-b border-border' : ''}
                >
                  <td className="px-4 py-3 text-sm text-text">{feature.name}</td>
                  <td className="px-4 py-3 text-center">
                    {feature.free ? (
                      <span className="text-green-400">&#10003;</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {feature.premium ? (
                      <span className="text-green-400">&#10003;</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing CTA */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6 text-center mb-8">
          <p className="text-2xl font-bold text-text mb-1">$9.99</p>
          <p className="text-text-muted text-sm mb-4">One-time payment, lifetime access</p>
          <a
            href="https://gumroad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
          >
            Get Premium on Gumroad
          </a>
        </div>

        {/* Activation form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Already have a key?
          </h2>

          {success ? (
            <div className="text-center py-4">
              <p className="text-green-400 font-medium">Activated! Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label htmlFor="key" className="block text-xs text-text-muted mb-1">
                  Enter your premium key
                </label>
                <input
                  type="text"
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="PKM-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text placeholder:text-text-muted/50 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 text-text font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Activating...' : 'Activate Key'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
