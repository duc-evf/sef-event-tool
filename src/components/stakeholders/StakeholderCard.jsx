import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import StakeholderMetaForm from './StakeholderMetaForm';
import { fuzzyMatchStakeholders } from '@/lib/fuzzyMatch';
import { getStakeholderDb, getApiKey, getOpenAiKey, getAiProvider, getBraveKey, getBraveUsage } from '@/lib/storage';
import { aiEnrichStakeholder } from '@/lib/ai';
import { braveSearch, BRAVE_FREE_TIER_LIMIT } from '@/lib/brave';
import { toast } from 'sonner';

function scoreLabel(score) {
  if (score >= 0.7) return { label: 'Strong', color: 'bg-green-100 text-green-800' };
  if (score >= 0.4) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800' };
  return { label: 'Weak', color: 'bg-red-100 text-red-800' };
}

export default function StakeholderCard({ stakeholder: s, onUpdate }) {
  const db = getStakeholderDb();
  const matches = fuzzyMatchStakeholders(s.org_name, db, 3);
  const isNew = s._status === 'new';
  const isExisting = s._status === 'existing';
  const isSkip = s._status === 'skip';
  const [formOpen, setFormOpen] = useState(isNew);
  const [enriching, setEnriching] = useState(false);

  const setStatus = (status, record = null) => {
    const origId = s.id;
    const updated = { ...s, _status: status, _matchedRecord: record || null };
    if (record?.id) updated.id = record.id;
    onUpdate(origId, updated);
    if (status === 'new') setFormOpen(true);
  };

  const handleEnrich = async () => {
    const provider = getAiProvider();
    const aiKey = provider === 'openai' ? getOpenAiKey() : getApiKey();
    if (!aiKey) { toast.error('Set your AI API key in Settings first'); return; }

    const braveKey = getBraveKey();
    const braveUsage = getBraveUsage();
    const braveOver = braveUsage.count >= BRAVE_FREE_TIER_LIMIT;

    setEnriching(true);
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
      onUpdate(s.id, enriched);
      setFormOpen(true);
      toast.success(`Enriched: ${s.org_name}`);
    } catch (e) {
      toast.error(`Enrichment failed: ${e.message}`);
    } finally {
      setEnriching(false);
    }
  };

  const handleMetaChange = (id, updated) => onUpdate(s.id, updated);

  return (
    <div className={`border rounded-lg overflow-hidden ${isNew ? 'border-blue-200' : isExisting ? 'border-green-200' : isSkip ? 'border-gray-200 opacity-60' : 'border-border'}`}>
      {/* Header row */}
      <div className={`p-3 flex items-start gap-3 ${isNew ? 'bg-blue-50/40' : isExisting ? 'bg-green-50/40' : 'bg-card'}`}>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{s.org_name}</p>
          {isExisting && s._matchedRecord && (
            <p className="text-xs text-green-700 mt-0.5">
              → Linked to: <span className="font-medium">{s._matchedRecord.title}</span>
              {s._matchedRecord.id && <span className="text-muted-foreground ml-1">(ID: {s._matchedRecord.id})</span>}
            </p>
          )}
          {s._aiEnriched && <span className="text-xs text-blue-600">AI enriched</span>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setStatus('new')} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${isNew ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>New</button>
          <button onClick={() => setStatus('skip')} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${isSkip ? 'bg-gray-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Skip</button>
          {isNew && (
            <button onClick={() => setFormOpen(v => !v)} className="p-1 rounded text-muted-foreground hover:text-foreground">
              {formOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Fuzzy matches */}
      {!isExisting && !isSkip && db.length > 0 && matches.length > 0 && (
        <div className="px-3 py-2 border-t bg-muted/20 space-y-1">
          <p className="text-xs text-muted-foreground">Match against existing DB:</p>
          {matches.map(({ record, score }) => {
            const sl = scoreLabel(score);
            return (
              <div key={record.id} className="flex items-center gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded font-medium ${sl.color}`}>{sl.label}</span>
                <button onClick={() => setStatus('existing', record)} className="text-left hover:underline text-blue-700 truncate max-w-xs">
                  {record.title}
                </button>
                {record.country && <span className="text-muted-foreground shrink-0">· {record.country}</span>}
              </div>
            );
          })}
        </div>
      )}
      {!isExisting && !isSkip && db.length === 0 && (
        <p className="text-xs text-amber-700 px-3 py-1.5 border-t bg-amber-50/50">No stakeholder DB loaded — upload in Settings to enable matching.</p>
      )}

      {/* Metadata form — shown when new */}
      {isNew && formOpen && (
        <div className="border-t p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Metadata</p>
            <Button size="sm" variant="outline" onClick={handleEnrich} disabled={enriching} className="h-7 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {enriching ? 'Enriching…' : 'Enrich with AI'}
            </Button>
          </div>
          <StakeholderMetaForm stakeholder={s} onChange={handleMetaChange} />
        </div>
      )}
    </div>
  );
}
