import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getApiKey, setApiKey, getOpenAiKey, setOpenAiKey, getAiProvider, setAiProvider, clearState,
  getBraveKey, setBraveKey, setStakeholderDb, getStakeholderDbMeta, getBraveUsage,
} from '@/lib/storage';
import { testConnection } from '@/lib/ai';
import { testBraveViaProxy as testBraveConnection } from '@/lib/brave';
import { BRAVE_FREE_TIER_LIMIT } from '@/lib/brave';
import { toast } from 'sonner';

export default function SettingsPanel({ onClearData, onDbUpdated }) {
  const [provider, setProvider] = useState(getAiProvider());
  const [anthropicKey, setAnthropicKey] = useState(getApiKey());
  const [openaiKey, setOpenaiKey] = useState(getOpenAiKey());
  const [braveKey, setBraveKeyState] = useState(getBraveKey());
  const [testing, setTesting] = useState(false);
  const [testingBrave, setTestingBrave] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [braveResult, setBraveResult] = useState(null);
  const [dbMeta, setDbMeta] = useState(getStakeholderDbMeta());
  const [braveUsage] = useState(getBraveUsage());
  const dbFileRef = useRef(null);

  const activeKey = provider === 'openai' ? openaiKey : anthropicKey;

  const handleProviderChange = (value) => {
    setProvider(value);
    setAiProvider(value);
    setTestResult(null);
  };

  const handleSaveKey = () => {
    if (provider === 'openai') setOpenAiKey(openaiKey);
    else setApiKey(anthropicKey);
    setTestResult({ ok: true, msg: 'Key saved' });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await testConnection(activeKey, provider);
      if (provider === 'openai') setOpenAiKey(openaiKey);
      else setApiKey(anthropicKey);
      setTestResult({ ok: true, msg: 'Connection successful!' });
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveBrave = () => {
    setBraveKey(braveKey);
    setBraveResult({ ok: true, msg: 'Brave key saved' });
  };

  const handleTestBrave = async () => {
    setTestingBrave(true);
    setBraveResult(null);
    try {
      await testBraveConnection(braveKey);
      setBraveKey(braveKey);
      setBraveResult({ ok: true, msg: 'Brave connection successful!' });
    } catch (e) {
      setBraveResult({ ok: false, msg: e.message });
    } finally {
      setTestingBrave(false);
    }
  };

  const handleDbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const records = rows
        .filter(r => r['ID'] || r['Title'])
        .map(r => ({
          id: String(r['ID'] || '').trim(),
          title: String(r['Title'] || '').trim(),
          country: String(r['Country'] || '').trim(),
          org_category: String(r['Organisational category'] || '').trim(),
          role_in_policy: String(r['Role in policy'] || '').trim(),
          website: String(r['Website'] || '').trim(),
          relevance: String(r['Relevance'] || '').trim(),
        }))
        .filter(r => r.title);
      setStakeholderDb(records);
      const meta = getStakeholderDbMeta();
      setDbMeta(meta);
      onDbUpdated?.();
      toast.success(`Stakeholder DB updated: ${records.length} records loaded`);
    } catch (e) {
      toast.error('Failed to parse stakeholder DB: ' + e.message);
    }
  };

  const handleClear = () => {
    clearState();
    onClearData?.();
  };

  const braveOver = braveUsage.count >= BRAVE_FREE_TIER_LIMIT;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Settings" className="text-white/80 hover:text-white hover:bg-white/15">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">

          {/* AI Provider */}
          <div>
            <Label>AI Provider</Label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="openai">OpenAI (GPT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{provider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}</Label>
            <p className="text-xs text-muted-foreground mb-1">Stored in localStorage. Only use on trusted devices.</p>
            {provider === 'anthropic' ? (
              <Input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." />
            ) : (
              <Input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." />
            )}
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveKey}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleTest} disabled={testing || !activeKey}>
                {testing ? 'Testing...' : 'Test connection'}
              </Button>
            </div>
            {testResult && (
              <p className={`text-sm mt-1 ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>{testResult.msg}</p>
            )}
          </div>

          {/* Brave Search */}
          <div className="border-t pt-4">
            <Label>Brave Search API Key</Label>
            <p className="text-xs text-muted-foreground mb-1">Used for stakeholder metadata enrichment. <a className="underline" href="https://brave.com/search/api/" target="_blank" rel="noreferrer">Get a key →</a></p>
            <p className="text-xs text-amber-700 mb-1">Note: Brave Search requires Netlify CLI/GitHub deployment — it does not work with drag-and-drop. Enrichment will fall back to Claude training data automatically.</p>
            <Input type="password" value={braveKey} onChange={e => setBraveKeyState(e.target.value)} placeholder="BSA..." />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveBrave}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleTestBrave} disabled={testingBrave || !braveKey}>
                {testingBrave ? 'Testing...' : 'Test Brave'}
              </Button>
            </div>
            {braveResult && (
              <p className={`text-sm mt-1 ${braveResult.ok ? 'text-green-600' : 'text-red-600'}`}>{braveResult.msg}</p>
            )}
            <p className={`text-xs mt-2 ${braveOver ? 'text-amber-700 font-medium' : 'text-muted-foreground'}`}>
              {braveOver ? '⚠ ' : ''}{braveUsage.count} / {BRAVE_FREE_TIER_LIMIT} queries used this month
              {braveOver && ' — free tier limit reached, falling back to Claude training data'}
            </p>
          </div>

          {/* Stakeholder DB */}
          <div className="border-t pt-4">
            <Label>Stakeholder Database</Label>
            <p className="text-xs text-muted-foreground mb-1">
              Upload the SEFMAP stakeholder list (XLSX) to enable fuzzy matching.
            </p>
            <div className="text-xs text-muted-foreground mb-2">
              {dbMeta.count > 0
                ? `${dbMeta.count} stakeholders loaded · updated ${dbMeta.updated ? new Date(dbMeta.updated).toLocaleDateString() : '—'}`
                : 'No database loaded'}
            </div>
            <Button size="sm" variant="outline" onClick={() => dbFileRef.current?.click()}>
              Update Stakeholder DB
            </Button>
            <input ref={dbFileRef} type="file" accept=".xlsx,.xls" onChange={handleDbUpload} className="hidden" />
          </div>

          {/* Clear data */}
          <div className="border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Clear all data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all event info, contacts, requirements, and report data. API keys and the stakeholder DB are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>Delete everything</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
