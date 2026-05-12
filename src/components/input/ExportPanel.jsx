import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import { generateHubSpotCSV } from '@/lib/exportCsv';
import { generateSEFMAPXLSX } from '@/lib/exportXlsx';
import { generateEventReportDOCX } from '@/lib/exportDocx';
import { generateStakeholdersXLSX } from '@/lib/exportStakeholders';

export default function ExportPanel({ eventInfo, contacts, requirements, eventReport, sessionStakeholders }) {
  const handleExport = () => {
    const submission = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      event_info: eventInfo,
      contacts,
      stakeholder_requirements: requirements,
      event_report: eventReport,
    };

    const json = JSON.stringify(submission, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const safeName = (eventInfo.event_name || 'submission').replace(/[^a-zA-Z0-9]/g, '_');
    const nameStr = Array.isArray(eventInfo.colleague_name)
      ? eventInfo.colleague_name.join('_')
      : (eventInfo.colleague_name || '');
    const name = nameStr.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
    saveAs(blob, `${safeName}_${name}.json`);
  };

  const participants = Array.isArray(eventInfo.colleague_name)
    ? eventInfo.colleague_name
    : (eventInfo.colleague_name ? [eventInfo.colleague_name] : []);

  const warnings = [];
  if (!eventInfo.event_name) warnings.push('Event name is empty');
  if (!eventInfo.colleague_name?.length) warnings.push('Colleague name is empty');
  if (contacts.length === 0) warnings.push('No contacts added');
  if (requirements.length === 0) warnings.push('No requirements added');

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Export Submission</h2>

      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Warnings:</p>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
            {warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Option 1: Direct Output Generation */}
      <div className="border-2 border-emerald-400 dark:border-emerald-600 rounded-lg p-5 space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">OPTION A</span>
          <h3 className="font-semibold text-lg">Generate Outputs Directly</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          If you are the only person attending this event, generate the final output files directly — no consolidation needed.
        </p>

        <div className="bg-card border rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Event:</span>
            <span>{eventInfo.event_name || '—'}</span>
            <span className="text-muted-foreground">Colleague:</span>
            <span>{(Array.isArray(eventInfo.colleague_name) ? eventInfo.colleague_name.join(', ') : eventInfo.colleague_name) || '—'}</span>
            <span className="text-muted-foreground">Contacts:</span>
            <span>{contacts.length}</span>
            <span className="text-muted-foreground">Requirements:</span>
            <span>{requirements.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-card">
            <h4 className="text-sm font-medium">HubSpot CSV</h4>
            <p className="text-xs text-muted-foreground">{contacts.length} contacts</p>
            <Button
              className="w-full"
              onClick={() => generateHubSpotCSV(contacts, eventInfo)}
              disabled={contacts.length === 0}
            >
              Download CSV
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-card">
            <h4 className="text-sm font-medium">SEFMAP XLSX</h4>
            <p className="text-xs text-muted-foreground">{requirements.length} requirements</p>
            <Button
              className="w-full"
              onClick={() => generateSEFMAPXLSX(requirements, eventInfo)}
              disabled={requirements.length === 0}
            >
              Download XLSX
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-card">
            <h4 className="text-sm font-medium">Event Report DOCX</h4>
            <p className="text-xs text-muted-foreground">Narrative report</p>
            <Button
              className="w-full"
              onClick={() => generateEventReportDOCX(eventInfo, eventReport, participants)}
            >
              Download DOCX
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3 bg-white dark:bg-card">
            <h4 className="text-sm font-medium">SEFMAP Stakeholders XLSX</h4>
            <p className="text-xs text-muted-foreground">
              {(sessionStakeholders || []).filter(s => s._status === 'new' || s._status === 'existing').length} confirmed
            </p>
            <Button
              className="w-full"
              onClick={() => {
                const ready = (sessionStakeholders || []).filter(s => s._status === 'new' || s._status === 'existing');
                generateStakeholdersXLSX(ready, eventInfo);
              }}
              disabled={!(sessionStakeholders || []).filter(s => s._status === 'new' || s._status === 'existing').length}
            >
              Download XLSX
            </Button>
          </div>
        </div>

        {/* Send to Admin reminder */}
        <div className="rounded-lg p-4 bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-600">
          <p className="font-semibold text-amber-900 dark:text-amber-100 text-base">
            Remember to send the downloaded files to{' '}
            <a href="mailto:duc@evenflow.eu" className="underline font-bold">duc@evenflow.eu</a>{' '}
            and{' '}
            <a href="mailto:phil@evenflow.eu" className="underline font-bold">phil@evenflow.eu</a>
          </p>
        </div>
      </div>

      {/* Option 2: Save for Consolidation */}
      <div className="border-2 border-slate-300 dark:border-slate-600 rounded-lg p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-2">
          <span className="bg-slate-600 text-white text-xs font-bold px-2 py-0.5 rounded">OPTION B</span>
          <h3 className="font-semibold text-lg">Save for Consolidation</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Use this option if more than one person is attending the event. Save your submission as a JSON file and share it with the person consolidating all submissions.
        </p>

        <Button size="lg" variant="outline" onClick={handleExport}>Save My Submission (.json)</Button>
      </div>
    </div>
  );
}
