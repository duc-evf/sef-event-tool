import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import EventInfoForm from '@/components/input/EventInfoForm';
import ContactForm from '@/components/input/ContactForm';
import ContactTable from '@/components/input/ContactTable';
import RequirementForm from '@/components/input/RequirementForm';
import RequirementTable from '@/components/input/RequirementTable';
import EventReportForm from '@/components/input/EventReportForm';
import ExportPanel from '@/components/input/ExportPanel';
import SessionStakeholders from '@/components/input/SessionStakeholders';
import ExcelImportPanel from '@/components/input/ExcelImportPanel';
import ImportPanel from '@/components/consolidate/ImportPanel';
import MergedContacts from '@/components/consolidate/MergedContacts';
import MergedRequirements from '@/components/consolidate/MergedRequirements';
import MergedReport from '@/components/consolidate/MergedReport';
import MergedStakeholders from '@/components/consolidate/MergedStakeholders';
import GenerateOutputs from '@/components/consolidate/GenerateOutputs';
import StakeholderMode from '@/components/stakeholders/StakeholderMode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadState, saveState } from '@/lib/storage';
import { EMPTY_EVENT_INFO, EMPTY_EVENT_REPORT } from '@/lib/constants';

function App() {
  const [mode, setMode] = useState('input');
  const [lastSaved, setLastSaved] = useState(null);

  // Input mode state
  const [eventInfo, setEventInfo] = useState({ ...EMPTY_EVENT_INFO });
  const [contacts, setContacts] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [eventReport, setEventReport] = useState({ ...EMPTY_EVENT_REPORT });
  const [sessionStakeholders, setSessionStakeholders] = useState([]);
  const [editingContact, setEditingContact] = useState(null);
  const [editingRequirement, setEditingRequirement] = useState(null);

  // Consolidation mode state
  const [submissions, setSubmissions] = useState([]);
  const [mergedContacts, setMergedContacts] = useState([]);
  const [mergedRequirements, setMergedRequirements] = useState([]);
  const [mergedReport, setMergedReport] = useState({ ...EMPTY_EVENT_REPORT });
  const [mergedEventInfo, setMergedEventInfo] = useState({ ...EMPTY_EVENT_INFO });
  const [mergedStakeholders, setMergedStakeholders] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      if (saved.eventInfo) setEventInfo(saved.eventInfo);
      if (saved.contacts) setContacts(saved.contacts);
      if (saved.requirements) setRequirements(saved.requirements);
      if (saved.eventReport) setEventReport(saved.eventReport);
      if (saved.sessionStakeholders) setSessionStakeholders(saved.sessionStakeholders);
      if (saved.lastSaved) setLastSaved(saved.lastSaved);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    saveState({ eventInfo, contacts, requirements, eventReport, sessionStakeholders });
    setLastSaved(new Date().toISOString());
  }, [eventInfo, contacts, requirements, eventReport, sessionStakeholders]);

  // Contact CRUD
  const handleSaveContact = useCallback((contact) => {
    setContacts(prev => {
      const idx = prev.findIndex(c => c.id === contact.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = contact; return next; }
      return [...prev, contact];
    });
    setEditingContact(null);
  }, []);

  const handleDeleteContacts = useCallback((ids) => {
    setContacts(prev => prev.filter(c => !ids.includes(c.id)));
  }, []);

  // Requirement CRUD
  const handleSaveRequirement = useCallback((req) => {
    setRequirements(prev => {
      const idx = prev.findIndex(r => r.id === req.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = req; return next; }
      return [...prev, req];
    });
    setEditingRequirement(null);
  }, []);

  const handleDeleteRequirements = useCallback((ids) => {
    setRequirements(prev => prev.filter(r => !ids.includes(r.id)));
  }, []);

  // Consolidation: import submissions
  const handleImport = useCallback((newSubmissions) => {
    setSubmissions(prev => {
      const all = [...prev, ...newSubmissions];
      const allContacts = all.flatMap(s => (s.contacts || []).map(c => ({
        ...c,
        contact_owner: c.contact_owner || (Array.isArray(s.event_info.colleague_name) ? s.event_info.colleague_name.join(', ') : s.event_info.colleague_name),
      })));
      const allReqs = all.flatMap(s => (s.stakeholder_requirements || []).map(r => ({
        ...r,
        who_added: r.who_added || (Array.isArray(s.event_info.colleague_name) ? s.event_info.colleague_name.join(', ') : s.event_info.colleague_name),
      })));
      setMergedContacts(allContacts);
      setMergedRequirements(allReqs);

      if (all.length > 0) {
        setMergedEventInfo(all[0].event_info);
      }

      const reportFields = ['esa_participants', 'sef_role', 'materials_presented',
        'rationale', 'key_messages', 'key_stakeholders', 'follow_on', 'lessons_learned', 'other_points'];
      const merged = { ...EMPTY_EVENT_REPORT };
      for (const field of reportFields) {
        const parts = all.map(s => s.event_report?.[field]).filter(Boolean);
        merged[field] = parts.join('\n\n');
      }
      setMergedReport(merged);

      return all;
    });
  }, []);

  const handleExcelImport = useCallback(({ contacts: newContacts, requirements: newReqs, stakeholders: newStakeholders }) => {
    if (newContacts?.length) setContacts(prev => [...prev, ...newContacts]);
    if (newReqs?.length) setRequirements(prev => [...prev, ...newReqs]);
    if (newStakeholders?.length) setSessionStakeholders(prev => [...prev, ...newStakeholders]);
  }, []);

  const handleClearData = useCallback(() => {
    setEventInfo({ ...EMPTY_EVENT_INFO });
    setContacts([]);
    setRequirements([]);
    setEventReport({ ...EMPTY_EVENT_REPORT });
    setSessionStakeholders([]);
    setEditingContact(null);
    setEditingRequirement(null);
  }, []);

  const participants = submissions.flatMap(s =>
    Array.isArray(s.event_info.colleague_name)
      ? s.event_info.colleague_name
      : (s.event_info.colleague_name ? [s.event_info.colleague_name] : [])
  );

  return (
    <AppShell mode={mode} onModeChange={setMode} onClearData={handleClearData} lastSaved={lastSaved}>
      {mode === 'input' ? (
        <Tabs defaultValue="event-info" className="w-full">
          <div className="border-b bg-card px-6">
            <TabsList variant="line" className="w-full justify-start gap-0 h-auto p-0">
              <TabsTrigger value="event-info" className="sef-tab">Event Info</TabsTrigger>
              <TabsTrigger value="contacts" className="sef-tab">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="requirements" className="sef-tab">Requirements ({requirements.length})</TabsTrigger>
              <TabsTrigger value="stakeholders" className="sef-tab">Stakeholders ({sessionStakeholders.length})</TabsTrigger>
              <TabsTrigger value="report" className="sef-tab">Event Report</TabsTrigger>
              <TabsTrigger value="export" className="sef-tab">Export</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="event-info">
            <EventInfoForm eventInfo={eventInfo} onChange={setEventInfo} />
            <ExcelImportPanel
              eventInfo={eventInfo}
              contacts={contacts}
              requirements={requirements}
              onImport={handleExcelImport}
            />
          </TabsContent>

          <TabsContent value="contacts">
            <div className="p-6 space-y-4">
              {editingContact ? (
                <ContactForm key={editingContact.id} contact={editingContact} onSave={handleSaveContact} onCancel={() => setEditingContact(null)} />
              ) : (
                <ContactForm key="new" onSave={handleSaveContact} />
              )}
              <ContactTable contacts={contacts} onEdit={setEditingContact} onDelete={handleDeleteContacts} />
            </div>
          </TabsContent>

          <TabsContent value="requirements">
            <div className="p-6 space-y-4">
              {editingRequirement ? (
                <RequirementForm key={editingRequirement.id} requirement={editingRequirement} eventInfo={eventInfo} onSave={handleSaveRequirement} onCancel={() => setEditingRequirement(null)} />
              ) : (
                <RequirementForm key="new" eventInfo={eventInfo} onSave={handleSaveRequirement} />
              )}
              <RequirementTable requirements={requirements} onEdit={setEditingRequirement} onDelete={handleDeleteRequirements} />
            </div>
          </TabsContent>

          <TabsContent value="stakeholders">
            <SessionStakeholders
              stakeholders={sessionStakeholders}
              onChange={setSessionStakeholders}
              eventInfo={eventInfo}
            />
          </TabsContent>

          <TabsContent value="report">
            <EventReportForm report={eventReport} eventInfo={eventInfo} contacts={contacts} requirements={requirements} onChange={setEventReport} />
          </TabsContent>

          <TabsContent value="export">
            <ExportPanel
              eventInfo={eventInfo}
              contacts={contacts}
              requirements={requirements}
              eventReport={eventReport}
              sessionStakeholders={sessionStakeholders}
            />
          </TabsContent>
        </Tabs>

      ) : mode === 'consolidate' ? (
        <Tabs defaultValue="import" className="w-full">
          <div className="border-b bg-card px-6">
            <TabsList variant="line" className="w-full justify-start gap-0 h-auto p-0">
              <TabsTrigger value="import" className="sef-tab">Import</TabsTrigger>
              <TabsTrigger value="contacts" className="sef-tab">Contacts ({mergedContacts.length})</TabsTrigger>
              <TabsTrigger value="requirements" className="sef-tab">Requirements ({mergedRequirements.length})</TabsTrigger>
              <TabsTrigger value="report" className="sef-tab">Report</TabsTrigger>
              <TabsTrigger value="stakeholders" className="sef-tab">
                Stakeholders ({mergedContacts.filter(c => c.company_name).length > 0 ? '…' : '0'})
              </TabsTrigger>
              <TabsTrigger value="generate" className="sef-tab">Generate Outputs</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="import">
            <ImportPanel
              submissions={submissions}
              onImport={handleImport}
              onClear={() => { setSubmissions([]); setMergedContacts([]); setMergedRequirements([]); setMergedReport({ ...EMPTY_EVENT_REPORT }); setMergedStakeholders([]); }}
            />
          </TabsContent>

          <TabsContent value="contacts">
            <MergedContacts contacts={mergedContacts} onChange={setMergedContacts} />
          </TabsContent>

          <TabsContent value="requirements">
            <MergedRequirements requirements={mergedRequirements} eventInfo={mergedEventInfo} onChange={setMergedRequirements} />
          </TabsContent>

          <TabsContent value="report">
            <MergedReport report={mergedReport} submissions={submissions} onChange={setMergedReport} />
          </TabsContent>

          <TabsContent value="stakeholders">
            <MergedStakeholders
              contacts={mergedContacts}
              eventInfo={mergedEventInfo}
              sessionStakeholders={sessionStakeholders}
              onChange={setMergedStakeholders}
            />
          </TabsContent>

          <TabsContent value="generate">
            <GenerateOutputs
              contacts={mergedContacts}
              requirements={mergedRequirements}
              eventInfo={mergedEventInfo}
              eventReport={mergedReport}
              participants={participants}
              mergedStakeholders={mergedStakeholders}
            />
          </TabsContent>
        </Tabs>

      ) : (
        <StakeholderMode />
      )}
    </AppShell>
  );
}

export default App;
