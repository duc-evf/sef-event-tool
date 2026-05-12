import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AiButton from '@/components/shared/AiButton';
import { aiDraftReport } from '@/lib/ai';
import { getApiKey, getOpenAiKey, getAiProvider } from '@/lib/storage';

export default function EventReportForm({ report, eventInfo, contacts, requirements, onChange }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const update = (field, value) => onChange({ ...report, [field]: value });

  const handleAiDraft = async () => {
    const provider = getAiProvider();
    const apiKey = provider === 'openai' ? getOpenAiKey() : getApiKey();
    if (!apiKey) { setAiError('Set your API key in Settings first'); return; }

    setAiLoading(true);
    setAiError('');
    try {
      const dates = eventInfo.event_dates?.start
        ? `${eventInfo.event_dates.start} to ${eventInfo.event_dates.end || eventInfo.event_dates.start}`
        : '';
      const result = await aiDraftReport(apiKey, eventInfo.event_name, dates, contacts, requirements, provider);
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
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Event Report</h2>
        <div className="flex items-center gap-2">
          <AiButton onClick={handleAiDraft} loading={aiLoading}>AI Draft</AiButton>
          {aiError && <span className="text-sm text-red-600">{aiError}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>ESA Participants</Label>
          <Input value={report.esa_participants} onChange={(e) => update('esa_participants', e.target.value)} />
        </div>
        <div>
          <Label>SEF Role</Label>
          <Input value={report.sef_role} onChange={(e) => update('sef_role', e.target.value)} placeholder="attendee, presenter, demo..." />
        </div>
        <div>
          <Label>Materials Presented</Label>
          <Input value={report.materials_presented} onChange={(e) => update('materials_presented', e.target.value)} placeholder="URL or description" />
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'rationale', label: 'Rationale for Attendance', hint: 'Why did SEF decide to attend this event?' },
          { key: 'key_messages', label: 'Key Messages from this Event', hint: 'Main conclusions — use bullet points (start lines with •)' },
          { key: 'key_stakeholders', label: 'Key Stakeholders Encountered', hint: 'Highlight key organisations (full details are in HubSpot)' },
          { key: 'follow_on', label: 'Area for SEF Follow On', hint: 'Action items for SEF based on event discussions' },
          { key: 'lessons_learned', label: 'Lessons Learned', hint: 'Recommendations for approaching similar events' },
          { key: 'other_points', label: 'Any Other Points', hint: 'Anything that doesn\'t fit above' },
        ].map(({ key, label, hint }) => (
          <div key={key}>
            <Label>{label}</Label>
            <p className="text-xs text-muted-foreground mb-1">{hint}</p>
            <Textarea
              value={report[key]}
              onChange={(e) => update(key, e.target.value)}
              rows={4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
