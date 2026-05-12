import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import StakeholderCard from './StakeholderCard';
import MultiSelect from '@/components/shared/MultiSelect';
import { generateStakeholdersXLSX } from '@/lib/exportStakeholders';
import { downloadImportTemplate } from '@/lib/templateExcel';
import { COLLEAGUE_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';

function parseCustomXlsx(buffer) {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });

  // Try "Stakeholders" sheet by name first
  let sheet = wb.Sheets['Stakeholders'];

  // Search all sheets for one containing "Organisation Name" column
  if (!sheet) {
    for (const name of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
      if (rows.length > 0 && (rows[0]['Organisation Name'] !== undefined || rows[0]['Organization Name'] !== undefined)) {
        sheet = wb.Sheets[name];
        break;
      }
    }
  }

  // Fallback to first sheet
  if (!sheet) sheet = wb.Sheets[wb.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const nameKeys = ['Organisation Name', 'Organization Name', 'Name', 'Company', 'Company Name', 'org_name'];
  const findKey = (row) => nameKeys.find(k => row[k] !== undefined && String(row[k]).trim());

  return rows
    .map(row => {
      const nameKey = findKey(row);
      if (!nameKey) return null;
      const name = String(row[nameKey]).trim();
      if (!name) return null;
      return {
        id: uuidv4(),
        org_name: name,
        short_description: String(row['Short Description'] || row['Description'] || '').trim(),
        country: String(row['Country'] || '').trim(),
        website: String(row['Website'] || row['URL'] || '').trim(),
        org_category: String(row['Organisational category'] || row['Category'] || '').trim(),
        role_in_policy: String(row['Role in policy'] || '').trim().split(';').map(s => s.trim()).filter(Boolean),
        relevance: String(row['Relevance'] || '').trim(),
        themes: String(row['Theme'] || row['Themes'] || '').trim().split(';').map(s => s.trim()).filter(Boolean),
        sectors: String(row['Sector'] || row['Sectors'] || '').trim().split(';').map(s => s.trim()).filter(Boolean),
        application_areas: String(row['Application Area'] || row['Application Areas'] || '').trim().split(';').map(s => s.trim()).filter(Boolean),
        _status: 'pending',
        _contactColleagues: [],
        _contactNotes: [],
        _roleInProject: 'User',
        _involvement: 'Expressed Interest',
      };
    })
    .filter(Boolean);
}

export default function StakeholderMode() {
  const fileRef = useRef(null);
  const [orgs, setOrgs] = useState([]);
  const [step, setStep] = useState('idle');
  const [useEvent, setUseEvent] = useState(false);
  const [eventName, setEventName] = useState('');
  const [colleagueNames, setColleagueNames] = useState([]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseCustomXlsx(buffer);
      if (!parsed.length) {
        toast.error('No organisation names found. Make sure the file has an "Organisation Name" column.');
        return;
      }
      setOrgs(parsed);
      setStep('review');
      toast.success(`${parsed.length} organisation${parsed.length !== 1 ? 's' : ''} loaded`);
    } catch (e) {
      toast.error('Failed to read file: ' + e.message);
    }
  };

  const handleUpdate = (origId, updated) => {
    setOrgs(prev => prev.map(o => o.id === origId ? updated : o));
  };

  const handleDownload = () => {
    const readyOrgs = orgs.filter(o => o._status === 'new' || o._status === 'existing');
    if (!readyOrgs.length) { toast.error('No stakeholders confirmed yet'); return; }

    const fakeEventInfo = useEvent
      ? { event_name: eventName, colleague_name: colleagueNames }
      : {};

    const forExport = readyOrgs.map(o => ({
      ...o,
      _contactColleagues: useEvent ? colleagueNames : (o._contactColleagues || []),
    }));

    const fname = useEvent && eventName
      ? undefined
      : `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-sefmap-stakeholders-batch.xlsx`;

    generateStakeholdersXLSX(forExport, fakeEventInfo, { filename: fname });
    toast.success('Download started');
  };

  const readyCount = orgs.filter(o => o._status === 'new' || o._status === 'existing').length;
  const pendingCount = orgs.filter(o => o._status === 'pending').length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold">Stakeholder Batch Upload</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a list of organisations to check against the SEFMAP stakeholder database and generate an import file.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => downloadImportTemplate()}>
          <Download className="w-4 h-4 mr-1.5" />
          Download Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1.5" />
          Upload Organisation List
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
        {step !== 'idle' && (
          <Button variant="ghost" size="sm" onClick={() => { setOrgs([]); setStep('idle'); }}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {step === 'review' && orgs.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {orgs.length} organisation{orgs.length !== 1 ? 's' : ''} loaded
            {pendingCount > 0 && <span className="text-amber-700"> · {pendingCount} pending decision</span>}
          </p>

          <div className="space-y-2">
            {orgs.map(s => (
              <StakeholderCard key={s.id} stakeholder={s} onUpdate={handleUpdate} />
            ))}
          </div>

          {/* Optional event context */}
          <div className="border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
              <input type="checkbox" checked={useEvent} onChange={e => setUseEvent(e.target.checked)} className="accent-blue-600" />
              Add linkage to ESA SEF project (ID: 29020)
            </label>
            {useEvent && (
              <div className="grid grid-cols-2 gap-3 pl-5">
                <div>
                  <Label className="text-xs">Event name</Label>
                  <Input className="mt-0.5 text-sm" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="BIOSPACE25" />
                </div>
                <div>
                  <Label className="text-xs">Colleague name(s)</Label>
                  <MultiSelect
                    className="mt-0.5"
                    options={COLLEAGUE_OPTIONS}
                    value={colleagueNames}
                    onChange={setColleagueNames}
                    placeholder="Select colleagues..."
                  />
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleDownload} disabled={!readyCount}>
            <Download className="w-4 h-4 mr-1.5" />
            Download SEFMAP Stakeholders XLSX ({readyCount} organisations)
          </Button>
        </div>
      )}
    </div>
  );
}
