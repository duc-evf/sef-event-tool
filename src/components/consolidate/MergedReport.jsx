import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AiButton from '@/components/shared/AiButton';
import { aiMergeReports } from '@/lib/ai';
import { getApiKey, getOpenAiKey, getAiProvider } from '@/lib/storage';

export default function MergedReport({ report, submissions, onChange }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const update = (field, value) => onChange({ ...report, [field]: value });

  const handleAiMerge = async () => {
    const provider = getAiProvider();
    const apiKey = provider === 'openai' ? getOpenAiKey() : getApiKey();
    if (!apiKey) { setAiError('Set your API key in Settings first'); return; }

    const reports = submissions
      .map(s => s.event_report)
      .filter(r => r && Object.values(r).some(v => v));

    if (reports.length === 0) { setAiError('No report content to merge'); return; }

    setAiLoading(true);
    setAiError('');
    try {
      const eventName = submissions[0]?.event_info?.event_name || '';
      const result = await aiMergeReports(apiKey, eventName, reports, provider);
      onChange({
        ...report,
        rationale: result.rationale || report.rationale,
        key_messages: result.key_messages || report.key_messages,
        key_stakeholders: result.key_stakeholders || report.key_stakeholders,
        follow_on: result.follow_on || report.follow_on,
        lessons_learned: result.lessons_learned || report.lessons_learned,
        other_points: result.other_points || report.other_points,
      });
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Merged Event Report</h2>
        <div className="flex items-center gap-2">
          <AiButton onClick={handleAiMerge} loading={aiLoading}>AI Merge Reports</AiButton>
          {aiError && <span className="text-sm text-red-600">{aiError}</span>}
        </div>
      </div>

      {[
        { key: 'esa_participants', label: 'ESA Participants' },
        { key: 'sef_role', label: 'SEF Role' },
        { key: 'materials_presented', label: 'Materials Presented' },
      ].map(({ key, label }) => (
        <div key={key}>
          <Label>{label}</Label>
          <Textarea value={report[key] || ''} onChange={(e) => update(key, e.target.value)} rows={2} />
        </div>
      ))}

      {[
        { key: 'rationale', label: 'Rationale for Attendance' },
        { key: 'key_messages', label: 'Key Messages' },
        { key: 'key_stakeholders', label: 'Key Stakeholders Encountered' },
        { key: 'follow_on', label: 'Area for SEF Follow On' },
        { key: 'lessons_learned', label: 'Lessons Learned' },
        { key: 'other_points', label: 'Any Other Points' },
      ].map(({ key, label }) => (
        <div key={key}>
          <Label>{label}</Label>
          <Textarea value={report[key] || ''} onChange={(e) => update(key, e.target.value)} rows={4} />
        </div>
      ))}
    </div>
  );
}
