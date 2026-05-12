import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Plus } from 'lucide-react';
import StakeholderCard from '@/components/stakeholders/StakeholderCard';
import { generateStakeholdersXLSX } from '@/lib/exportStakeholders';
import { toast } from 'sonner';

export default function SessionStakeholders({ stakeholders, onChange, eventInfo }) {
  const [newOrgName, setNewOrgName] = useState('');

  const handleUpdate = (origId, updated) => {
    onChange(stakeholders.map(s => s.id === origId ? updated : s));
  };

  const handleAdd = () => {
    const name = newOrgName.trim();
    if (!name) return;
    const org = {
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
      _contactColleagues: [],
      _contactNotes: [],
      _roleInProject: 'User',
      _involvement: 'Expressed Interest',
    };
    onChange([...stakeholders, org]);
    setNewOrgName('');
  };

  const readyOrgs = stakeholders.filter(s => s._status === 'new' || s._status === 'existing');
  const pendingCount = stakeholders.filter(s => s._status === 'pending').length;

  const handleDownload = () => {
    if (!readyOrgs.length) { toast.error('No stakeholders confirmed yet'); return; }
    generateStakeholdersXLSX(readyOrgs, eventInfo || {});
    toast.success('Download started');
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stakeholders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stakeholders.length} organisation{stakeholders.length !== 1 ? 's' : ''}
            {pendingCount > 0 && <span className="text-amber-700"> · {pendingCount} pending review</span>}
          </p>
        </div>
        <Button onClick={handleDownload} disabled={!readyOrgs.length}>
          <Download className="w-4 h-4 mr-1.5" />
          Download SEFMAP Stakeholders XLSX
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          className="text-sm"
          placeholder="Add organisation name..."
          value={newOrgName}
          onChange={e => setNewOrgName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={!newOrgName.trim()}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {stakeholders.length === 0 && (
        <p className="text-sm text-muted-foreground">No stakeholders yet. Add organisations above or import from the Excel template.</p>
      )}

      <div className="space-y-2">
        {stakeholders.map(s => (
          <StakeholderCard key={s.id} stakeholder={s} onUpdate={handleUpdate} />
        ))}
      </div>

      {readyOrgs.length > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-3">
          {readyOrgs.filter(s => s._status === 'new').length} new · {readyOrgs.filter(s => s._status === 'existing').length} existing (linked) · {stakeholders.filter(s => s._status === 'skip').length} skipped
        </div>
      )}
    </div>
  );
}
