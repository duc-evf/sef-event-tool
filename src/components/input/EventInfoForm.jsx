import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MultiSelect from '@/components/shared/MultiSelect';
import { EVENT_TYPE_OPTIONS, COLLEAGUE_OPTIONS } from '@/lib/constants';

export default function EventInfoForm({ eventInfo, onChange }) {
  const update = (field, value) => onChange({ ...eventInfo, [field]: value });
  const updateDate = (field, value) => onChange({
    ...eventInfo,
    event_dates: { ...eventInfo.event_dates, [field]: value },
  });

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Event Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Event Name *</Label>
          <Input value={eventInfo.event_name} onChange={(e) => update('event_name', e.target.value)} />
        </div>
        <div>
          <Label>Event Type</Label>
          <Select value={eventInfo.event_type} onValueChange={(v) => update('event_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={eventInfo.event_dates?.start || ''} onChange={(e) => updateDate('start', e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={eventInfo.event_dates?.end || ''} onChange={(e) => updateDate('end', e.target.value)} />
        </div>
        <div>
          <Label>Event Website</Label>
          <Input type="url" value={eventInfo.event_website} onChange={(e) => update('event_website', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label>Event Organiser</Label>
          <Input value={eventInfo.event_organiser} onChange={(e) => update('event_organiser', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Colleague Name(s) *</Label>
          <MultiSelect
            options={COLLEAGUE_OPTIONS}
            value={eventInfo.colleague_name}
            onChange={(v) => update('colleague_name', v)}
            placeholder="Select colleague(s)..."
          />
        </div>
      </div>
    </div>
  );
}
