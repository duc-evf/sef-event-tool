import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MultiSelect from '@/components/shared/MultiSelect';
import SearchableSelect from '@/components/shared/SearchableSelect';
import {
  SEFMAP_COUNTRY_OPTIONS, SEFMAP_ORG_CATEGORY_OPTIONS,
  SEFMAP_ROLE_IN_POLICY_OPTIONS, SEFMAP_RELEVANCE_OPTIONS,
  SEFMAP_STAKEHOLDER_THEME_OPTIONS, SECTOR_OPTIONS, APPLICATION_AREA_OPTIONS,
} from '@/lib/constants';

export default function StakeholderMetaForm({ stakeholder, onChange }) {
  const s = stakeholder;
  const update = (field, value) => onChange(s.id, { ...s, [field]: value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border text-sm">
      <div className="md:col-span-2">
        <Label className="text-xs">Organisation Name *</Label>
        <Input
          className="mt-0.5 text-sm"
          value={s.org_name || ''}
          onChange={e => update('org_name', e.target.value)}
          placeholder="Acronym - Local language name - English name"
        />
      </div>
      <div className="md:col-span-2">
        <Label className="text-xs">Short Description</Label>
        <Textarea
          className="mt-0.5 text-sm resize-none"
          rows={2}
          value={s.short_description || ''}
          onChange={e => update('short_description', e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Country</Label>
        <SearchableSelect
          options={SEFMAP_COUNTRY_OPTIONS}
          value={s.country ? [s.country] : []}
          onChange={v => update('country', v[v.length - 1] || '')}
          placeholder="Select country..."
        />
      </div>
      <div>
        <Label className="text-xs">Website</Label>
        <Input
          className="mt-0.5 text-sm"
          value={s.website || ''}
          onChange={e => update('website', e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div>
        <Label className="text-xs">Organisational category</Label>
        <Select value={s.org_category || ''} onValueChange={v => update('org_category', v)}>
          <SelectTrigger className="mt-0.5 text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {SEFMAP_ORG_CATEGORY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Relevance</Label>
        <Select value={s.relevance || ''} onValueChange={v => update('relevance', v)}>
          <SelectTrigger className="mt-0.5 text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {SEFMAP_RELEVANCE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Role in policy</Label>
        <MultiSelect
          className="mt-0.5"
          options={SEFMAP_ROLE_IN_POLICY_OPTIONS}
          value={s.role_in_policy || []}
          onChange={v => update('role_in_policy', v)}
        />
      </div>
      <div>
        <Label className="text-xs">Theme</Label>
        <MultiSelect
          className="mt-0.5"
          options={SEFMAP_STAKEHOLDER_THEME_OPTIONS}
          value={s.themes || []}
          onChange={v => update('themes', v)}
        />
      </div>
      <div>
        <Label className="text-xs">Sector</Label>
        <SearchableSelect
          options={SECTOR_OPTIONS}
          value={s.sectors || []}
          onChange={v => update('sectors', v)}
          placeholder="Search sectors..."
        />
      </div>
      <div>
        <Label className="text-xs">Application Area</Label>
        <SearchableSelect
          options={APPLICATION_AREA_OPTIONS}
          value={s.application_areas || []}
          onChange={v => update('application_areas', v)}
          placeholder="Search application areas..."
        />
      </div>
    </div>
  );
}
