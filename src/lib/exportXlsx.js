import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SEFMAP_XLSX_HEADERS } from './constants';

export function generateSEFMAPXLSX(requirements, eventInfo) {
  const now = new Date();
  const dateAdded = eventInfo.event_dates?.start || now.toISOString().slice(0, 10);
  const year = eventInfo.event_dates?.start ? new Date(eventInfo.event_dates.start).getFullYear() : now.getFullYear();
  const contextAdded = `${eventInfo.event_type || 'Conference'}: ${eventInfo.event_name || ''} ${year}`;

  const rows = requirements.map(r => ({
    'Name of Stakeholder Requirement': r.name,
    'Requirement category': (r.requirement_category || []).join('; '),
    'Stakeholder Requirement Description': r.description,
    'Stakeholder Priority': r.stakeholder_priority,
    'Timescale of the Priority': r.timescale,
    'Biogeophysical Variables': r.biogeophysical_variables || 'Not specified',
    'Spatial resolution': r.spatial_resolution,
    'Spatial coverage': r.spatial_coverage,
    'SEF Theme': (r.sef_themes || []).join('; '),
    'Application Area': (r.application_areas || []).join('; '),
    'Sector': (r.sectors || []).join('; '),
    'Date Added': dateAdded,
    'Who added': r.who_added || (Array.isArray(eventInfo.colleague_name) ? eventInfo.colleague_name.join('; ') : eventInfo.colleague_name),
    'Context Added': contextAdded,
    'Weblink (URL)': eventInfo.event_website,
    'Other Remarks': r.other_remarks,
  }));

  const ws = XLSX.utils.json_to_sheet(rows, { header: SEFMAP_XLSX_HEADERS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safeName = (eventInfo.event_name || 'event').replace(/[^a-zA-Z0-9]/g, '_');
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  saveAs(blob, `${yyyymmdd}-sefmap-requirements-${safeName}.xlsx`);
}
