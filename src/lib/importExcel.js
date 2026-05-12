import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const CONTACT_COMPULSORY = [
  'First Name', 'Last Name', 'Company Name', 'Stakeholder Type', 'Associated Note',
];

function cell(row, header) {
  const v = row[header];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function parseArray(value) {
  const str = String(value || '').trim();
  if (!str) return [];
  return str.split(';').map(s => s.trim()).filter(Boolean);
}

function isRowEmpty(row) {
  return Object.values(row).every(v => String(v ?? '').trim() === '');
}

export function parseImportFile(arrayBuffer) {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const errors = [];
  const contacts = [];
  const requirements = [];

  // Resolve sheets by name, falling back to index position (handles old template with Sheet1/2/3 names)
  const sheetNames = workbook.SheetNames;
  const resolveSheet = (preferred, fallbackIndex) =>
    workbook.Sheets[preferred] || workbook.Sheets[sheetNames[fallbackIndex]];

  // --- Contacts sheet ---
  const contactSheet = resolveSheet('Contacts', 1);
  if (contactSheet) {
    const rows = XLSX.utils.sheet_to_json(contactSheet, { defval: '' }).filter(r => !isRowEmpty(r));
    rows.forEach((row, i) => {
      const rowNum = i + 2; // +1 for header, +1 for 1-index
      const rowErrors = CONTACT_COMPULSORY
        .filter(f => !cell(row, f))
        .map(f => ({ sheet: 'Contacts', row: rowNum, message: `Contacts row ${rowNum}: "${f}" is required` }));

      if (rowErrors.length) {
        errors.push(...rowErrors);
        return;
      }

      const engRaw = parseArray(cell(row, 'Engagement Type'));
      contacts.push({
        id: uuidv4(),
        first_name: cell(row, 'First Name'),
        last_name: cell(row, 'Last Name'),
        email: cell(row, 'Email'),
        company_name: cell(row, 'Company Name'),
        job_title: cell(row, 'Job Title') || 'Unknown',
        source_of_contact: 'Events',
        lead_status: cell(row, 'Lead Status') || 'New contact',
        stakeholder_type: cell(row, 'Stakeholder Type'),
        engagement_type: engRaw.length ? engRaw : ['Outreach'],
        associated_note: cell(row, 'Associated Note'),
        contact_owner: cell(row, 'Contact Owner') || '',
      });
    });
  }

  // --- Requirements sheet ---
  const reqSheet = resolveSheet('Requirements', 2);
  if (reqSheet) {
    const rows = XLSX.utils.sheet_to_json(reqSheet, { defval: '' }).filter(r => !isRowEmpty(r));
    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const description = cell(row, 'Description');
      if (!description) {
        errors.push({ sheet: 'Requirements', row: rowNum, message: `Requirements row ${rowNum}: "Description" is required` });
        return;
      }
      requirements.push({
        id: uuidv4(),
        description,
        name: cell(row, 'Name'),
        requirement_category: parseArray(cell(row, 'Requirement Category')),
        stakeholder_priority: cell(row, 'Stakeholder Priority'),
        timescale: cell(row, 'Timescale'),
        biogeophysical_variables: cell(row, 'Biogeophysical Variables'),
        spatial_resolution: cell(row, 'Spatial Resolution'),
        spatial_coverage: cell(row, 'Spatial Coverage'),
        sef_themes: parseArray(cell(row, 'SEF Theme')),
        application_areas: parseArray(cell(row, 'Application Area')),
        sectors: parseArray(cell(row, 'Sector')),
        other_remarks: cell(row, 'Other Remarks'),
      });
    });
  }

  // --- Stakeholders sheet ---
  const stakeholderSheet = resolveSheet('Stakeholders', 3);
  const stakeholders = [];
  if (stakeholderSheet) {
    const rows = XLSX.utils.sheet_to_json(stakeholderSheet, { defval: '' }).filter(r => !isRowEmpty(r));
    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const orgName = cell(row, 'Organisation Name');
      if (!orgName) {
        errors.push({ sheet: 'Stakeholders', row: rowNum, message: `Stakeholders row ${rowNum}: "Organisation Name" is required` });
        return;
      }
      stakeholders.push({
        id: uuidv4(),
        org_name: orgName,
        short_description: cell(row, 'Short Description'),
        country: cell(row, 'Country'),
        website: cell(row, 'Website'),
        org_category: cell(row, 'Organisational category'),
        role_in_policy: parseArray(cell(row, 'Role in policy')),
        relevance: cell(row, 'Relevance'),
        themes: parseArray(cell(row, 'Theme')),
        sectors: parseArray(cell(row, 'Sector')),
        application_areas: parseArray(cell(row, 'Application Area')),
        _status: 'pending',
      });
    });
  }

  return { contacts, requirements, stakeholders, errors };
}

export function isDuplicateEmail(email, existingContacts) {
  if (!email) return false;
  const lower = email.toLowerCase();
  return existingContacts.some(c => c.email && c.email.toLowerCase() === lower);
}
