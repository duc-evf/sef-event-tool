import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { getApiKey, getOpenAiKey, getAiProvider, getBraveKey, getBraveUsage } from '@/lib/storage';
import { aiEnrichStakeholder } from '@/lib/ai';
import { braveSearch, BRAVE_FREE_TIER_LIMIT } from '@/lib/brave';
import { toast } from 'sonner';

export default function EnrichmentPanel({ stakeholders, onEnriched }) {
  const [enriching, setEnriching] = useState(false);
  const [selected, setSelected] = useState(() => {
    const m = {};
    stakeholders.filter(s => s._status === 'new').forEach(s => { m[s.id] = true; });
    return m;
  });

  const newOnes = stakeholders.filter(s => s._status === 'new');
  const braveUsage = getBraveUsage();
  const braveOver = braveUsage.count >= BRAVE_FREE_TIER_LIMIT;

  const handleEnrich = async () => {
    const provider = getAiProvider();
    const aiKey = provider === 'openai' ? getOpenAiKey() : getApiKey();
    if (!aiKey) { toast.error('Set your AI API key in Settings first'); return; }

    const braveKey = getBraveKey();
    const ids = Object.entries(selected).filter(([, v]) => v).map(([id]) => id);
    if (!ids.length) return;

    setEnriching(true);
    for (const id of ids) {
      const s = stakeholders.find(s => s.id === id);
      if (!s) continue;
      try {
        let snippets = null;
        if (braveKey && !braveOver) {
          snippets = await braveSearch(braveKey, s.org_name);
        }
        const result = await aiEnrichStakeholder(aiKey, s.org_name, snippets, provider);
        const enriched = { ...s, _aiEnriched: true };
        const fields = ['org_name','short_description','country','website','org_category','role_in_policy','relevance','themes','sectors','application_areas'];
        for (const f of fields) {
          if (result[f] !== undefined) {
            const isEmpty = Array.isArray(s[f]) ? !s[f].length : !s[f];
            if (isEmpty) enriched[f] = result[f];
          }
        }
        onEnriched(id, enriched);
      } catch (e) {
        toast.error(`Failed to enrich ${s.org_name}: ${e.message}`);
      }
    }
    setEnriching(false);
    toast.success('Enrichment complete');
  };

  if (!newOnes.length) return null;

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-blue-50/30">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">AI Enrichment for new stakeholders</p>
        {braveOver && (
          <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Brave limit reached — using Claude only</span>
        )}
      </div>
      <div className="space-y-1.5">
        {newOnes.map(s => (
          <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!selected[s.id]}
              onChange={e => setSelected(prev => ({ ...prev, [s.id]: e.target.checked }))}
              disabled={enriching}
              className="accent-blue-600"
            />
            <span className={s._aiEnriched ? 'text-blue-700 font-medium' : ''}>{s.org_name}</span>
            {s._aiEnriched && <span className="text-xs text-blue-600">(AI enriched)</span>}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleEnrich} disabled={enriching || !Object.values(selected).some(Boolean)}>
          <Sparkles className="w-4 h-4 mr-1.5" />
          {enriching ? 'Enriching…' : `Enrich with AI${!getBraveKey() || braveOver ? ' (Claude)' : ' (Brave + Claude)'}`}
        </Button>
        <button className="text-xs text-muted-foreground underline" onClick={() => {
          const all = {}; newOnes.forEach(s => { all[s.id] = true; }); setSelected(all);
        }}>Select all</button>
        <button className="text-xs text-muted-foreground underline" onClick={() => {
          const none = {}; newOnes.forEach(s => { none[s.id] = false; }); setSelected(none);
        }}>Deselect all</button>
      </div>
    </div>
  );
}
