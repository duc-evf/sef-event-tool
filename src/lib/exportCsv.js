import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { HUBSPOT_CSV_HEADERS } from './constants';

export function generateHubSpotCSV(contacts, eventInfo) {
  const now = new Date();
  const createDate = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  const rows = contacts.map(c => ({
    'First Name': c.first_name,
    'Last Name': c.last_name,
    'Email': c.email,
    'Company Name': c.company_name,
    'Job Title': c.job_title,
    'Source of contact': c.source_of_contact || 'Events',
    'Lead Status': c.lead_status,
    'Stakeholder Type': c.stakeholder_type,
    'Engagement type': (c.engagement_type || []).join(';'),
    'Contact owner': c.contact_owner || (Array.isArray(eventInfo.colleague_name) ? eventInfo.colleague_name.join(';') : eventInfo.colleague_name),
    'Create Date': createDate,
    'Associated Note': c.associated_note,
  }));

  const csv = Papa.unparse(rows, { columns: HUBSPOT_CSV_HEADERS });
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const safeName = (eventInfo.event_name || 'event').replace(/[^a-zA-Z0-9]/g, '_');
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  saveAs(blob, `${yyyymmdd}-hubspot-${safeName}.csv`);
}
