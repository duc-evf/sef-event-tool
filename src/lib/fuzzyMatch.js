function trigramsOf(str) {
  const s = ` ${str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  const set = new Set();
  for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
  return set;
}

function trigramSimilarity(a, b) {
  const ta = trigramsOf(a);
  const tb = trigramsOf(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  return (2 * intersection) / (ta.size + tb.size);
}

function containsBonus(query, target) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (q.length < 2) return 0;
  if (t.includes(q)) return 0.3;
  // Check if any word in query matches a word/acronym in target
  const words = q.split(/\s+/);
  const targetWords = t.split(/[\s\-–]/);
  // Acronym check: first letters of target words match query
  const acronym = targetWords.map(w => w[0] || '').join('');
  if (acronym === q) return 0.4;
  if (words.some(w => w.length > 2 && t.includes(w))) return 0.15;
  return 0;
}

export function fuzzyMatchStakeholders(query, dbRecords, topN = 5) {
  if (!query || !dbRecords.length) return [];
  const results = dbRecords
    .map(record => {
      const title = record.title || '';
      const sim = trigramSimilarity(query, title);
      const bonus = containsBonus(query, title);
      return { record, score: Math.min(1, sim + bonus) };
    })
    .filter(r => r.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
  return results;
}
