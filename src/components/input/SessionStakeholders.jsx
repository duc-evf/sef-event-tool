import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import StakeholderCard from '@/components/stakeholders/StakeholderCard';
import { toast } from 'sonner';

function extractOrgsFromContacts(contacts, defaultColleagues) {
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
        _contactMeetings: [],
        _roleInProject: 'User',
        _involvement: 'Expressed Interest',
      });
    }
    const org = seen.get(name);
    org._contactMeetings.push({
      owner: c.contact_owner || defaultColleagues?.[0] || '',
      firstName: c.first_name || '',
      lastName: c.last_name || '',
      note: c.associated_note || '',
    });
  }
  return Array.from(seen.values());
}

export default function SessionStakeholders({ contacts, stakeholders, onChange, eventInfo }) {
  const [orgs, setOrgs] = useState(stakeholders || []);
  const [newOrgName, setNewOrgName] = useState('');

  const colleagues = Array.isArray(eventInfo?.colleague_name)
    ? eventInfo.colleague_name
    : eventInfo?.colleague_name ? [eventInfo.colleague_name] : [];

  useEffect(() => {
    const fromContacts = extractOrgsFromContacts(contacts || [], colleagues);
    setOrgs(prev => {
      const contactNames = new Set(fromContacts.map(o => o.org_name));
      // Update contact-derived orgs (preserve status decisions, refresh notes/colleagues)
      const updatedFromContacts = fromContacts.map(c => {
        const existing = prev.find(p => p.org_name === c.org_name && !p._isManual);
        return existing
          ? { ...existing, _contactMeetings: c._contactMeetings }
          : c;
      });
      // Keep manually added orgs
      const manualOrgs = prev.filter(p => p._isManual && !contactNames.has(p.org_name));
      return [...updatedFromContacts, ...manualOrgs];
    });
  }, [contacts]);

  useEffect(() => { onChange(orgs); }, [orgs]);

  const handleUpdate = (origId, updated) => {
    setOrgs(prev => prev.map(o => o.id === origId ? updated : o));
  };

  const handleAdd = () => {
    const name = newOrgName.trim();
    if (!name) return;
    if (orgs.some(o => o.org_name === name)) {
      toast.error('Organisation already in list');
      return;
    }
    setOrgs(prev => [...prev, {
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
      _status: 'new',
      _isManual: true,
      _contactMeetings: [],
      _roleInProject: 'User',
      _involvement: 'Expressed Interest',
    }]);
    setNewOrgName('');
  };

  const pendingCount = orgs.filter(s => s._status === 'pending').length;
  const readyCount = orgs.filter(s => s._status === 'new' || s._status === 'existing').length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Stakeholders</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Organisations derived from your contacts.
          {pendingCount > 0 && <span className="text-amber-700"> · {pendingCount} pending review</span>}
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          className="text-sm"
          placeholder="Add extra organisation name..."
          value={newOrgName}
          onChange={e => setNewOrgName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={!newOrgName.trim()}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {orgs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No organisations yet — add contacts with a Company Name in the Contacts tab, or add one manually above.
        </p>
      )}

      <div className="space-y-2">
        {orgs.map(s => (
          <StakeholderCard key={s.id} stakeholder={s} onUpdate={handleUpdate} />
        ))}
      </div>

      {readyCount > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-3">
          {orgs.filter(s => s._status === 'new').length} new · {orgs.filter(s => s._status === 'existing').length} existing (linked) · {orgs.filter(s => s._status === 'skip').length} skipped
        </div>
      )}
    </div>
  );
}
