import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import StakeholderCard from '@/components/stakeholders/StakeholderCard';
import { generateStakeholdersXLSX } from '@/lib/exportStakeholders';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

function extractOrgsFromContacts(contacts) {
  const seen = new Map();
  for (const c of contacts) {
    const name = (c.company_name || '').trim();
    if (!name) continue;
    if (!seen.has(name)) {
      seen.set(name, {
        id: uuidv4(),
        org_name: name,
        short_description: '',
        country: '',
        website: '',
        org_category: '',
        role_in_policy: [],
        relevance: '',
        themes: [],
        sectors: [],
        application_areas: [],
        _status: 'pending',
        _contactColleagues: [],
        _contactNotes: [],
        _roleInProject: 'User',
        _involvement: 'Expressed Interest',
      });
    }
    const org = seen.get(name);
    if (c.contact_owner && !org._contactColleagues.includes(c.contact_owner))
      org._contactColleagues.push(c.contact_owner);
    if (c.associated_note) org._contactNotes.push(c.associated_note);
  }
  return Array.from(seen.values());
}

export default function MergedStakeholders({ contacts, eventInfo, sessionStakeholders, onChange }) {
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    const fromContacts = extractOrgsFromContacts(contacts);
    const fromSession = (sessionStakeholders || []).filter(s => !fromContacts.some(o => o.org_name === s.org_name));
    setOrgs([...fromContacts, ...fromSession]);
  }, [contacts]);

  useEffect(() => { onChange?.(orgs); }, [orgs]);

  const handleUpdate = (origId, updated) => {
    setOrgs(prev => prev.map(o => o.id === origId ? updated : o));
  };

  const readyOrgs = orgs.filter(o => o._status === 'new' || o._status === 'existing');
  const pendingCount = orgs.filter(o => o._status === 'pending').length;

  const handleDownload = () => {
    if (!readyOrgs.length) { toast.error('No stakeholders confirmed yet'); return; }
    generateStakeholdersXLSX(readyOrgs, eventInfo);
    toast.success('Download started');
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stakeholders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orgs.length} organisation{orgs.length !== 1 ? 's' : ''} from contacts
            {pendingCount > 0 && <span className="text-amber-700"> · {pendingCount} pending review</span>}
          </p>
        </div>
        <Button onClick={handleDownload} disabled={!readyOrgs.length}>
          <Download className="w-4 h-4 mr-1.5" />
          Download SEFMAP Stakeholders XLSX
        </Button>
      </div>

      {orgs.length === 0 && (
        <p className="text-sm text-muted-foreground">No contacts with company names found in the merged submissions.</p>
      )}

      <div className="space-y-2">
        {orgs.map(s => (
          <StakeholderCard key={s.id} stakeholder={s} onUpdate={handleUpdate} />
        ))}
      </div>

      {readyOrgs.length > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-3">
          {readyOrgs.filter(o => o._status === 'new').length} new · {readyOrgs.filter(o => o._status === 'existing').length} existing (linked) · {orgs.filter(o => o._status === 'skip').length} skipped
        </div>
      )}
    </div>
  );
}
