import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MultiSelect from '@/components/shared/MultiSelect';
import {
  SOURCE_OF_CONTACT_OPTIONS, LEAD_STATUS_OPTIONS,
  STAKEHOLDER_TYPE_OPTIONS, ENGAGEMENT_TYPE_OPTIONS,
  COLLEAGUE_OPTIONS, EMPTY_CONTACT,
} from '@/lib/constants';

export default function ContactForm({ contact, onSave, onCancel, eventInfo }) {
  const defaultOwner = (() => {
    if (contact?.contact_owner) return contact.contact_owner;
    const cols = Array.isArray(eventInfo?.colleague_name)
      ? eventInfo.colleague_name
      : eventInfo?.colleague_name ? [eventInfo.colleague_name] : [];
    return cols[0] || '';
  })();

  const [form, setForm] = useState(contact || { ...EMPTY_CONTACT, contact_owner: defaultOwner });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name) e.first_name = 'Required';
    if (!form.last_name) e.last_name = 'Required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Invalid email format';
    }
    if (!form.company_name) e.company_name = 'Required';
    if (!form.job_title) e.job_title = 'Required';
    if (!form.lead_status) e.lead_status = 'Required';
    if (!form.stakeholder_type) e.stakeholder_type = 'Required';
    if (!form.engagement_type || form.engagement_type.length === 0) e.engagement_type = 'Required';
    if (!form.associated_note) e.associated_note = 'Required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave({ ...form, id: form.id || crypto.randomUUID() });
    if (!contact) setForm({ ...EMPTY_CONTACT, contact_owner: defaultOwner });
  };

  const isEditing = !!contact;
  const err = (field) => errors[field]
    ? <p className="text-xs text-red-600 mt-1">{errors[field]}</p>
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="font-medium">{isEditing ? 'Edit Contact' : 'Add New Contact'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>First Name *</Label>
          <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className={errors.first_name ? 'border-red-500' : ''} />
          {err('first_name')}
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className={errors.last_name ? 'border-red-500' : ''} />
          {err('last_name')}
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={errors.email ? 'border-red-500' : ''} />
          {err('email')}
        </div>
        <div>
          <Label>Company Name *</Label>
          <Input value={form.company_name} onChange={(e) => update('company_name', e.target.value)} className={errors.company_name ? 'border-red-500' : ''} />
          {err('company_name')}
        </div>
        <div>
          <Label>Job Title *</Label>
          <Input value={form.job_title} onChange={(e) => update('job_title', e.target.value)} className={errors.job_title ? 'border-red-500' : ''} />
          {err('job_title')}
        </div>
        <div>
          <Label>Contact Owner</Label>
          <Select value={form.contact_owner || ''} onValueChange={(v) => update('contact_owner', v)}>
            <SelectTrigger><SelectValue placeholder="Select colleague..." /></SelectTrigger>
            <SelectContent>
              {COLLEAGUE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source of Contact</Label>
          <Select value={form.source_of_contact} onValueChange={(v) => update('source_of_contact', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCE_OF_CONTACT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Lead Status *</Label>
          <Select value={form.lead_status} onValueChange={(v) => update('lead_status', v)}>
            <SelectTrigger className={errors.lead_status ? 'border-red-500' : ''}><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          {err('lead_status')}
        </div>
        <div>
          <Label>Stakeholder Type *</Label>
          <Select value={form.stakeholder_type} onValueChange={(v) => update('stakeholder_type', v)}>
            <SelectTrigger className={errors.stakeholder_type ? 'border-red-500' : ''}><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {STAKEHOLDER_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          {err('stakeholder_type')}
        </div>
        <div>
          <Label>Engagement Type *</Label>
          <div className={errors.engagement_type ? 'rounded-md ring-1 ring-red-500' : ''}>
            <MultiSelect
              options={ENGAGEMENT_TYPE_OPTIONS}
              value={form.engagement_type}
              onChange={(v) => update('engagement_type', v)}
              placeholder="Select engagement types..."
            />
          </div>
          {err('engagement_type')}
        </div>
      </div>
      <div>
        <Label>Associated Note *</Label>
        <Textarea
          value={form.associated_note}
          onChange={(e) => update('associated_note', e.target.value)}
          rows={2}
          className={errors.associated_note ? 'border-red-500' : ''}
        />
        {err('associated_note')}
      </div>
      <div className="flex gap-2">
        <Button type="submit">{isEditing ? 'Update' : 'Add Contact'}</Button>
        {isEditing && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
