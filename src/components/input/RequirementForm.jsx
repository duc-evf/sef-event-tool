import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MultiSelect from '@/components/shared/MultiSelect';
import SearchableSelect from '@/components/shared/SearchableSelect';
import AiButton from '@/components/shared/AiButton';
import {
  REQUIREMENT_CATEGORY_OPTIONS, STAKEHOLDER_PRIORITY_OPTIONS,
  TIMESCALE_OPTIONS, SEF_THEME_OPTIONS, SECTOR_OPTIONS,
  APPLICATION_AREA_OPTIONS, EMPTY_REQUIREMENT,
} from '@/lib/constants';
import { aiSuggestRequirement } from '@/lib/ai';
import { getApiKey, getOpenAiKey, getAiProvider } from '@/lib/storage';
import { cn } from '@/lib/utils';

export default function RequirementForm({ requirement, eventInfo, onSave, onCancel }) {
  const [form, setForm] = useState(requirement || { ...EMPTY_REQUIREMENT });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuggested, setAiSuggested] = useState({});

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Remove AI highlight when user edits
    if (aiSuggested[field]) {
      setAiSuggested(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleAiSuggest = async () => {
    if (!form.description) return;
    const provider = getAiProvider();
    const apiKey = provider === 'openai' ? getOpenAiKey() : getApiKey();
    if (!apiKey) { setAiError('Set your API key in Settings first'); return; }

    setAiLoading(true);
    setAiError('');
    try {
      const result = await aiSuggestRequirement(
        apiKey, form.description,
        eventInfo.event_name,
        eventInfo.event_dates?.start || '',
        provider
      );
      const updates = {};
      const suggested = {};
      if (result.name) { updates.name = result.name; suggested.name = true; }
      if (result.requirement_category) { updates.requirement_category = result.requirement_category; suggested.requirement_category = true; }
      if (result.sef_themes) { updates.sef_themes = result.sef_themes; suggested.sef_themes = true; }
      if (result.sectors) { updates.sectors = result.sectors; suggested.sectors = true; }
      if (result.application_areas) { updates.application_areas = result.application_areas; suggested.application_areas = true; }
      if (result.biogeophysical_variables) { updates.biogeophysical_variables = result.biogeophysical_variables; suggested.biogeophysical_variables = true; }
      setForm(prev => ({ ...prev, ...updates }));
      setAiSuggested(suggested);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description) return;
    onSave({ ...form, id: form.id || crypto.randomUUID() });
    if (!requirement) {
      setForm({ ...EMPTY_REQUIREMENT });
      setAiSuggested({});
    }
  };

  const isEditing = !!requirement;
  const aiHighlight = (field) => aiSuggested[field] ? 'ring-2 ring-blue-300 bg-blue-50 dark:bg-blue-950/30' : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="font-medium">{isEditing ? 'Edit Requirement' : 'Add New Requirement'}</h3>

      <div>
        <Label>Stakeholder Requirement Description *</Label>
        <Textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          placeholder="Describe the stakeholder requirement in detail..."
          required
        />
        <div className="flex items-center gap-2 mt-2">
          <AiButton onClick={handleAiSuggest} loading={aiLoading} type="button">
            AI Suggest
          </AiButton>
          {aiError && <span className="text-sm text-red-600">{aiError}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Name of Stakeholder Requirement</Label>
          <Input className={cn(aiHighlight('name'))} value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div>
          <Label>Requirement Category</Label>
          <div className={cn('rounded-md', aiHighlight('requirement_category'))}>
            <MultiSelect
              options={REQUIREMENT_CATEGORY_OPTIONS}
              value={form.requirement_category}
              onChange={(v) => update('requirement_category', v)}
            />
          </div>
        </div>
        <div>
          <Label>Stakeholder Priority</Label>
          <Select value={form.stakeholder_priority} onValueChange={(v) => update('stakeholder_priority', v)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {STAKEHOLDER_PRIORITY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Timescale</Label>
          <Select value={form.timescale} onValueChange={(v) => update('timescale', v)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {TIMESCALE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Biogeophysical Variables</Label>
          <Input className={cn(aiHighlight('biogeophysical_variables'))} value={form.biogeophysical_variables} onChange={(e) => update('biogeophysical_variables', e.target.value)} />
        </div>
        <div>
          <Label>Spatial Resolution</Label>
          <Input value={form.spatial_resolution} onChange={(e) => update('spatial_resolution', e.target.value)} />
        </div>
        <div>
          <Label>Spatial Coverage</Label>
          <Input value={form.spatial_coverage} onChange={(e) => update('spatial_coverage', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>SEF Themes</Label>
          <div className={cn('rounded-md', aiHighlight('sef_themes'))}>
            <MultiSelect
              options={SEF_THEME_OPTIONS}
              value={form.sef_themes}
              onChange={(v) => update('sef_themes', v)}
            />
          </div>
        </div>
        <div>
          <Label>Application Area (EARSC)</Label>
          <div className={cn('rounded-md', aiHighlight('application_areas'))}>
            <SearchableSelect
              options={APPLICATION_AREA_OPTIONS}
              value={form.application_areas}
              onChange={(v) => update('application_areas', v)}
              placeholder="Search application areas..."
            />
          </div>
        </div>
        <div>
          <Label>Sector</Label>
          <div className={cn('rounded-md', aiHighlight('sectors'))}>
            <SearchableSelect
              options={SECTOR_OPTIONS}
              value={form.sectors}
              onChange={(v) => update('sectors', v)}
              placeholder="Search sectors..."
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Other Remarks</Label>
        <Textarea value={form.other_remarks} onChange={(e) => update('other_remarks', e.target.value)} rows={2} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEditing ? 'Update' : 'Add Requirement'}</Button>
        {isEditing && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
