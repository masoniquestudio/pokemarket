const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchIndices() {
  const res = await fetch(`${API}/indices`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchIndexHistory(slug: string, days = 30) {
  const res = await fetch(`${API}/indices/${slug}?days=${days}`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchMarketMovers() {
  const res = await fetch(`${API}/market/movers`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchCards(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/cards?${qs}`, { next: { revalidate: 300 } });
  return res.json();
}

export async function fetchCard(id: string) {
  const res = await fetch(`${API}/cards/${id}`, { next: { revalidate: 300 } });
  return res.json();
}
