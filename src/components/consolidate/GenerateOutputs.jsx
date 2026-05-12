import { Button } from '@/components/ui/button';
import { generateHubSpotCSV } from '@/lib/exportCsv';
import { generateSEFMAPXLSX } from '@/lib/exportXlsx';
import { generateEventReportDOCX } from '@/lib/exportDocx';
import { generateStakeholdersXLSX } from '@/lib/exportStakeholders';

export default function GenerateOutputs({ contacts, requirements, eventInfo, eventReport, participants, mergedStakeholders }) {
  const readyStakeholders = (mergedStakeholders || []).filter(s => s._status === 'new' || s._status === 'existing');

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Generate Outputs</h2>
      <p className="text-sm text-muted-foreground">
        Download the consolidated outputs for import into HubSpot, SEFMAP, and as an event report.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">HubSpot CSV</h3>
          <p className="text-sm text-muted-foreground">{contacts.length} contacts</p>
          <Button
            className="w-full"
            onClick={() => generateHubSpotCSV(contacts, eventInfo)}
            disabled={contacts.length === 0}
          >
            Download CSV
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">SEFMAP Requirements XLSX</h3>
          <p className="text-sm text-muted-foreground">{requirements.length} requirements</p>
          <Button
            className="w-full"
            onClick={() => generateSEFMAPXLSX(requirements, eventInfo)}
            disabled={requirements.length === 0}
          >
            Download XLSX
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Event Report DOCX</h3>
          <p className="text-sm text-muted-foreground">Narrative report</p>
          <Button
            className="w-full"
            onClick={() => generateEventReportDOCX(eventInfo, eventReport, participants)}
          >
            Download DOCX
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium">SEFMAP Stakeholders XLSX</h3>
          <p className="text-sm text-muted-foreground">
            {readyStakeholders.length > 0
              ? `${readyStakeholders.filter(s => s._status === 'new').length} new · ${readyStakeholders.filter(s => s._status === 'existing').length} linked`
              : 'Review in Stakeholders tab'}
          </p>
          <Button
            className="w-full"
            onClick={() => generateStakeholdersXLSX(readyStakeholders, eventInfo)}
            disabled={readyStakeholders.length === 0}
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
  );
}
