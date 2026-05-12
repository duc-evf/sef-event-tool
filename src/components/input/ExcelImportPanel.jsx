import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { downloadImportTemplate } from '@/lib/templateExcel';
import { parseImportFile, isDuplicateEmail } from '@/lib/importExcel';
import { aiSuggestRequirement } from '@/lib/ai';
import { getApiKey, getOpenAiKey, getAiProvider } from '@/lib/storage';
import { toast } from 'sonner';

export default function ExcelImportPanel({ eventInfo, contacts, requirements, onImport }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('idle'); // idle | error | review | enriching
  const [errors, setErrors] = useState([]);
  const [parsedContacts, setParsedContacts] = useState([]);
  const [parsedRequirements, setParsedRequirements] = useState([]);
  const [parsedStakeholders, setParsedStakeholders] = useState([]);
  const [contactInclusion, setContactInclusion] = useState({});
  const [reqEnrichment, setReqEnrichment] = useState({});
  const [isEnriching, setIsEnriching] = useState(false);

  const handleDownload = async () => {
    try {
      await downloadImportTemplate();
    } catch (e) {
      toast.error('Failed to generate template: ' + e.message);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-uploaded after fixes
    e.target.value = '';

    try {
      const buffer = await file.arrayBuffer();
      const { contacts: parsedC, requirements: parsedR, stakeholders: parsedS = [], errors: parseErrors } = parseImportFile(buffer);

      if (parseErrors.length > 0) {
        setErrors(parseErrors);
        setStep('error');
        return;
      }

      if (parsedC.length === 0 && parsedR.length === 0 && parsedS.length === 0) {
        setErrors([{ message: 'No data found. Make sure you are using the correct template with a Contacts, Requirements, or Stakeholders sheet.' }]);
        setStep('error');
        return;
      }

      // Mark duplicates: against existing session contacts AND within the imported batch itself
      const seenEmails = new Set();
      const markedContacts = parsedC.map(c => {
        const existingDup = isDuplicateEmail(c.email, contacts);
        const email = c.email?.toLowerCase();
        const intraFileDup = email ? seenEmails.has(email) : false;
        if (email) seenEmails.add(email);
        return { ...c, _isDuplicate: existingDup || intraFileDup };
      });

      const inclusion = {};
      markedContacts.filter(c => c._isDuplicate).forEach(c => { inclusion[c.id] = false; });
      setContactInclusion(inclusion);

      const enrichment = {};
      parsedR.forEach(r => { enrichment[r.id] = true; });
      setReqEnrichment(enrichment);

      setParsedContacts(markedContacts);
      setParsedRequirements(parsedR);
      setParsedStakeholders(parsedS);
      setErrors([]);
      setStep('review');
    } catch (e) {
      setErrors([{ message: `Failed to read file: ${e.message}` }]);
      setStep('error');
    }
  };

  const handleRunAiEnrichment = async () => {
    const provider = getAiProvider();
    const apiKey = provider === 'openai' ? getOpenAiKey() : getApiKey();
    if (!apiKey) {
      toast.error('Set your API key in Settings first');
      return;
    }

    const selectedIds = Object.entries(reqEnrichment).filter(([, v]) => v).map(([id]) => id);
    if (!selectedIds.length) return;

    setIsEnriching(true);
    const updated = [...parsedRequirements];

    for (const id of selectedIds) {
      const idx = updated.findIndex(r => r.id === id);
      if (idx < 0) continue;
      const req = { ...updated[idx] };
      try {
        const result = await aiSuggestRequirement(
          apiKey, req.description,
          eventInfo.event_name || '',
          eventInfo.event_dates?.start || '',
          provider
        );
        // Only fill blank fields
        if (result.name && !req.name) req.name = result.name;
        if (result.requirement_category?.length && !req.requirement_category.length)
          req.requirement_category = result.requirement_category;
        if (result.sef_themes?.length && !req.sef_themes.length)
          req.sef_themes = result.sef_themes;
        if (result.sectors?.length && !req.sectors.length)
          req.sectors = result.sectors;
        if (result.application_areas?.length && !req.application_areas.length)
          req.application_areas = result.application_areas;
        if (result.biogeophysical_variables && !req.biogeophysical_variables)
          req.biogeophysical_variables = result.biogeophysical_variables;
        req._aiEnriched = true;
      } catch {
        // silent — user can re-run or fill manually
      }
      updated[idx] = req;
      setParsedRequirements([...updated]);
    }

    setIsEnriching(false);
    toast.success('AI enrichment complete');
  };

  const handleConfirmImport = () => {
    const sessionColleague = Array.isArray(eventInfo.colleague_name)
      ? eventInfo.colleague_name.join(';')
      : eventInfo.colleague_name || '';

    const contactsToImport = parsedContacts
      .filter(c => !c._isDuplicate || contactInclusion[c.id])
      .map(({ _isDuplicate, ...c }) => ({ ...c, contact_owner: c.contact_owner || sessionColleague }));

    const reqsToImport = parsedRequirements.map(({ _aiEnriched, ...r }) => r);
    const stakeholdersToImport = parsedStakeholders.map(({ _aiEnriched, ...s }) => s);

    onImport({ contacts: contactsToImport, requirements: reqsToImport, stakeholders: stakeholdersToImport });
    toast.success(`Imported ${contactsToImport.length} contact(s), ${reqsToImport.length} requirement(s)${stakeholdersToImport.length ? `, ${stakeholdersToImport.length} stakeholder(s)` : ''}`);
    handleReset();
  };

  const handleReset = () => {
    setStep('idle');
    setErrors([]);
    setParsedContacts([]);
    setParsedRequirements([]);
    setParsedStakeholders([]);
    setContactInclusion({});
    setReqEnrichment({});
  };

  const selectedEnrichCount = Object.values(reqEnrichment).filter(Boolean).length;
  const duplicateCount = parsedContacts.filter(c => c._isDuplicate).length;
  const contactsToImportCount = parsedContacts.filter(c => !c._isDuplicate || contactInclusion[c.id]).length;

  return (
    <div className="border-t mt-2 pt-5 px-6 pb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Quick Import from Excel
        </span>
        <span className="text-xs text-muted-foreground">(optional)</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1.5" />
          Download Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1.5" />
          Import Excel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        {step !== 'idle' && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Error banner */}
      {step === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
          <div className="flex items-start gap-2 mb-1.5">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-red-800">
              Import blocked — fix these errors in your Excel file and re-upload:
            </p>
          </div>
          <ul className="text-sm text-red-700 space-y-0.5 ml-6">
            {errors.map((e, i) => <li key={i}>• {e.message}</li>)}
          </ul>
        </div>
      )}

      {/* Review & confirm */}
      {(step === 'review' || step === 'enriching') && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            File parsed:{' '}
            <strong>{parsedContacts.length} contact{parsedContacts.length !== 1 ? 's' : ''}</strong>
            {duplicateCount > 0 && (
              <span className="text-amber-700"> ({duplicateCount} duplicate email{duplicateCount > 1 ? 's' : ''} flagged)</span>
            )}
            {parsedRequirements.length > 0 && (
              <>, <strong>{parsedRequirements.length} requirement{parsedRequirements.length !== 1 ? 's' : ''}</strong></>
            )}
            {parsedStakeholders.length > 0 && (
              <>, <strong>{parsedStakeholders.length} stakeholder{parsedStakeholders.length !== 1 ? 's' : ''}</strong> (review in Stakeholders mode)</>
            )}
          </p>

          {/* Contacts table */}
          {parsedContacts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Contacts</p>
              <div className="border rounded-md overflow-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-muted border-b">
                      <th className="p-2 text-left font-medium w-16">Include</th>
                      <th className="p-2 text-left font-medium">Name</th>
                      <th className="p-2 text-left font-medium">Email</th>
                      <th className="p-2 text-left font-medium">Company</th>
                      <th className="p-2 text-left font-medium">Stakeholder Type</th>
                      <th className="p-2 text-left font-medium w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedContacts.map(c => (
                      <tr key={c.id} className={c._isDuplicate ? 'bg-amber-50' : ''}>
                        <td className="p-2 text-center">
                          {c._isDuplicate ? (
                            <input
                              type="checkbox"
                              checked={!!contactInclusion[c.id]}
                              onChange={(e) =>
                                setContactInclusion(prev => ({ ...prev, [c.id]: e.target.checked }))
                              }
                              className="accent-amber-600"
                            />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mx-auto" />
                          )}
                        </td>
                        <td className="p-2 whitespace-nowrap">{c.first_name} {c.last_name}</td>
                        <td className="p-2 text-muted-foreground">{c.email}</td>
                        <td className="p-2">{c.company_name}</td>
                        <td className="p-2">{c.stakeholder_type}</td>
                        <td className="p-2">
                          {c._isDuplicate
                            ? <span className="text-amber-700 font-medium">Duplicate email</span>
                            : <span className="text-green-700">New</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {duplicateCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Duplicate rows are unchecked by default. Check to include them anyway.
                </p>
              )}
            </div>
          )}

          {/* Requirements table */}
          {parsedRequirements.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Requirements
                </p>
                <div className="flex gap-2">
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => {
                      const all = {};
                      parsedRequirements.forEach(r => { all[r.id] = true; });
                      setReqEnrichment(all);
                    }}
                  >
                    Select all
                  </button>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => {
                      const none = {};
                      parsedRequirements.forEach(r => { none[r.id] = false; });
                      setReqEnrichment(none);
                    }}
                  >
                    Deselect all
                  </button>
                </div>
              </div>
              <div className="border rounded-md overflow-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-muted border-b">
                      <th className="p-2 text-left font-medium w-20">AI Enrich</th>
                      <th className="p-2 text-left font-medium">Description</th>
                      <th className="p-2 text-left font-medium w-40">Name</th>
                      <th className="p-2 text-left font-medium w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRequirements.map(r => (
                      <tr key={r.id} className={r._aiEnriched ? 'bg-blue-50' : ''}>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!reqEnrichment[r.id]}
                            onChange={(e) =>
                              setReqEnrichment(prev => ({ ...prev, [r.id]: e.target.checked }))
                            }
                            disabled={isEnriching}
                            className="accent-blue-600"
                          />
                        </td>
                        <td className="p-2 max-w-xs">
                          <span className="line-clamp-2 block">{r.description}</span>
                        </td>
                        <td className="p-2 text-muted-foreground">{r.name || '—'}</td>
                        <td className="p-2">
                          {r._aiEnriched
                            ? <span className="text-blue-700 font-medium">AI enriched</span>
                            : <span className="text-muted-foreground">Pending</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Check requirements to auto-fill blank fields (themes, sectors, application areas) using AI before importing.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedEnrichCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunAiEnrichment}
                disabled={isEnriching}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                {isEnriching
                  ? 'Enriching…'
                  : `Run AI Enrichment (${selectedEnrichCount} selected)`
                }
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleConfirmImport}
              disabled={isEnriching}
            >
              Confirm Import ({contactsToImportCount} contact{contactsToImportCount !== 1 ? 's' : ''}
              {parsedRequirements.length > 0 && `, ${parsedRequirements.length} requirement${parsedRequirements.length !== 1 ? 's' : ''}`}
              {parsedStakeholders.length > 0 && `, ${parsedStakeholders.length} stakeholder${parsedStakeholders.length !== 1 ? 's' : ''}`})
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isEnriching}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
