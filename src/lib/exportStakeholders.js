import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SEFMAP_PROJECT_ID } from './constants';

function yyyymmdd() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function safeName(str) {
  return (str || 'batch').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildComment(meetings, eventName, fallbackColleagues, orgName) {
  if (meetings?.length) {
    const sentences = meetings
      .map(m => {
        const person = [m.firstName, m.lastName].filter(Boolean).join(' ');
        const owner = m.owner || '';
        if (!owner && !person) return '';
        if (!owner) return person ? `met ${person} at ${eventName}.` : '';
        if (!person) return `${owner} attended ${eventName}.`;
        return `${owner} met ${person} at ${eventName}.`;
      })
      .filter(Boolean)
      .join(' ');
    const notes = meetings.map(m => m.note).filter(Boolean).join('; ');
    return notes ? `${sentences} Note: ${notes}` : sentences;
  }
  // Fallback: no specific contacts, use event-level colleagues + org name
  if (fallbackColleagues?.length && eventName) {
    const names = fallbackColleagues.join(', ');
    const orgSuffix = orgName ? ` and met a person from ${orgName}` : '';
    return `${names} attended ${eventName}${orgSuffix}.`;
  }
  return '';
}

export function generateStakeholdersXLSX(sessionStakeholders, eventInfo, opts = {}) {
  const { filename } = opts;
  const eventName = eventInfo?.event_name || '';
  const date = yyyymmdd();
  const outputName = filename || `${date}-sefmap-stakeholders-${safeName(eventName)}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Stakeholders (new only)
  const newStakeholders = sessionStakeholders.filter(s => s._status === 'new');
  const stakeholderRows = newStakeholders.map((s, i) => {
    const key = `Stakeholders-${String(i + 1).padStart(3, '0')}`;
    s._importKey = key;
    return {
      'Import Key *': key,
      'ID': '',
      'Organisation Name *': s.org_name || '',
      'Short Description': s.short_description || '',
      'Country': s.country || '',
      'Website': s.website || '',
      'Organisational category': s.org_category || '',
      'Role in policy': (s.role_in_policy || []).join('; '),
      'Relevance': s.relevance || '',
      'Theme': (s.themes || []).join('; '),
      'Sector': (s.sectors || []).join('; '),
      'Application Area': (s.application_areas || []).join('; '),
    };
  });

  const stakeholderHeaders = [
    'Import Key *', 'ID', 'Organisation Name *', 'Short Description',
    'Country', 'Website', 'Organisational category', 'Role in policy',
    'Relevance', 'Theme', 'Sector', 'Application Area',
  ];

  const ws1 = XLSX.utils.json_to_sheet(
    stakeholderRows.length ? stakeholderRows : [Object.fromEntries(stakeholderHeaders.map(h => [h, '']))],
    { header: stakeholderHeaders }
  );
  XLSX.utils.book_append_sheet(wb, ws1, 'Stakeholders');

  // Sheet 2: Link_Project-Stakeholder (all)
  const colleague = Array.isArray(eventInfo?.colleague_name)
    ? eventInfo.colleague_name
    : eventInfo?.colleague_name ? [eventInfo.colleague_name] : [];

  const linkHeaders = [
    'Source Import Key *', 'Target Import Key *', 'Source Topic ID',
    'Target Topic ID', 'Role in project', 'Comment', 'Involvement *',
  ];

  const linkRows = sessionStakeholders.map(s => {
    const isNew = s._status === 'new';
    const comment = buildComment(s._contactMeetings, eventName, colleague, s.org_name);

    return {
      'Source Import Key *': isNew ? (s._importKey || '') : '',
      'Target Import Key *': '',
      'Source Topic ID': isNew ? '' : String(s.id || ''),
      'Target Topic ID': String(SEFMAP_PROJECT_ID),
      'Role in project': s._roleInProject || 'User',
      'Comment': comment,
      'Involvement *': s._involvement || 'Expressed Interest',
    };
  });

  const ws2 = XLSX.utils.json_to_sheet(
    linkRows.length ? linkRows : [Object.fromEntries(linkHeaders.map(h => [h, '']))],
    { header: linkHeaders }
  );
  XLSX.utils.book_append_sheet(wb, ws2, 'Link_Project-Stakeholder');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, outputName);
}
