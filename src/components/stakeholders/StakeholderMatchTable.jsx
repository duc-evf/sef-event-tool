import { fuzzyMatchStakeholders } from '@/lib/fuzzyMatch';
import { getStakeholderDb } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';

function scoreLabel(score) {
  if (score >= 0.7) return { label: 'Strong', color: 'bg-green-100 text-green-800' };
  if (score >= 0.4) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800' };
  return { label: 'Weak', color: 'bg-red-100 text-red-800' };
}

export default function StakeholderMatchTable({ stakeholders, onStatusChange }) {
  const db = getStakeholderDb();

  return (
    <div className="space-y-3">
      {stakeholders.map(s => {
        const matches = fuzzyMatchStakeholders(s.org_name, db, 3);
        const isNew = s._status === 'new';
        const isExisting = s._status === 'existing';
        const isPending = s._status === 'pending';

        return (
          <div key={s.id} className={`border rounded-lg p-4 ${isNew ? 'border-blue-200 bg-blue-50/30' : isExisting ? 'border-green-200 bg-green-50/30' : 'border-border'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{s.org_name}</p>
                {isExisting && s._matchedRecord && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Matched to: <span className="font-medium text-green-700">{s._matchedRecord.title}</span>
                    {s._matchedRecord.id && <span className="ml-1 text-muted-foreground">(ID: {s._matchedRecord.id})</span>}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => onStatusChange(s.id, 'new', null)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${isNew ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  New
                </button>
                <button
                  onClick={() => onStatusChange(s.id, 'skip', null)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${s._status === 'skip' ? 'bg-gray-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Fuzzy matches */}
            {(isPending || isNew) && db.length > 0 && matches.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Possible existing matches:</p>
                {matches.map(({ record, score }) => {
                  const sl = scoreLabel(score);
                  return (
                    <div key={record.id} className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sl.color}`}>{sl.label}</span>
                      <button
                        onClick={() => onStatusChange(s.id, 'existing', record)}
                        className="text-left hover:underline text-blue-700 truncate max-w-xs"
                      >
                        {record.title}
                      </button>
                      {record.country && <span className="text-muted-foreground shrink-0">· {record.country}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {db.length === 0 && isPending && (
              <p className="text-xs text-amber-700 mt-1">No stakeholder DB loaded — upload in Settings to enable matching.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
