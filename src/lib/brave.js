import { incrementBraveUsage } from './storage';

export const BRAVE_FREE_TIER_LIMIT = 1000;

// Brave Search API cannot be called directly from the browser (no CORS).
// Calls are proxied through the Netlify Function at /api/brave-search.
export async function braveSearch(apiKey, query) {
  if (!apiKey) return null;
  try {
    const res = await fetch('/api/brave-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    incrementBraveUsage();
    const results = data.web?.results || [];
    return results.slice(0, 3).map(r => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
    }));
  } catch {
    return null;
  }
}

export async function testBraveViaProxy(apiKey) {
  const res = await fetch('/api/brave-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'test', apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Brave API error ${res.status}`);
  }
  return true;
}
