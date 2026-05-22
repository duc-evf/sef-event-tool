import ExcelJS from 'exceljs';
import {
  COLLEAGUE_OPTIONS,
  SEFMAP_ORG_CATEGORY_OPTIONS,
  SEFMAP_ROLE_IN_POLICY_OPTIONS,
  SEFMAP_RELEVANCE_OPTIONS,
  SEFMAP_STAKEHOLDER_THEME_OPTIONS,
  SEFMAP_COUNTRY_OPTIONS,
} from './constants';

// ARGB colors (ExcelJS uses ARGB, no '#')
const SALMON  = 'FFFFCCCC';
const YELLOW  = 'FFFFFFCC';
const GREY    = 'FFD3D3D3';
const AI_TIP  = 'FFD6F4D6'; // light green to highlight the AI tip row

const STAKEHOLDER_TYPE_VALUES = [
  'ESA / SEF',
  'EO Service Provider',
  'Non-EO Service Provider',
  'Non-EO Research',
  'Policy Maker',
  'Policy Regulator/Enforcer',
  'Policy Implementer',
  'Interest Group',
  'Other',
];

function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function styleHeader(cell, argb) {
  cell.fill = fill(argb);
  cell.font = { bold: true };
  cell.alignment = { wrapText: true, vertical: 'middle' };
  cell.border = {
    bottom: { style: 'thin', color: { argb: 'FF999999' } },
  };
}

function addReadme(wb) {
  const ws = wb.addWorksheet('Readme');
  ws.columns = [
    { width: 22 },
    { width: 85 },
  ];

  function addRow(col1, col2, opts = {}) {
    const r = ws.addRow([col1, col2 ?? '']);
    if (opts.bold || opts.section) {
      r.getCell(1).font = { bold: true, size: opts.section ? 12 : 11 };
    }
    if (opts.highlight) {
      r.eachCell(c => { c.fill = fill(AI_TIP); });
    }
    r.getCell(2).alignment = { wrapText: true };
    r.height = opts.height ?? undefined;
    return r;
  }

  // Title
  const titleRow = ws.addRow(['SEF Event Import Template — Quick Reference', '']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  ws.addRow([]);

  // Color coding
  addRow('COLOR CODING', null, { section: true });

  const r4 = ws.addRow(['■  Compulsory', 'Must be filled for every row']);
  r4.getCell(1).fill = fill(SALMON);
  r4.getCell(1).font = { bold: true };

  const r5 = ws.addRow(['■  Optional', 'Can be left blank']);
  r5.getCell(1).fill = fill(YELLOW);
  r5.getCell(1).font = { bold: true };

  const r6 = ws.addRow(['■  Auto-populated', 'Leave blank — the tool fills this automatically from Event Info']);
  r6.getCell(1).fill = fill(GREY);
  r6.getCell(1).font = { bold: true };

  ws.addRow([]);

  // Multi-select
  addRow('MULTI-SELECT FIELDS', null, { section: true });
  addRow('Separator:', 'Use semicolons to separate multiple values — e.g. "Agriculture; Forestry; Healthcare"', { bold: false });

  const aiRow = ws.addRow(['⭐  AI tip:', 'Leave SEF Theme, Application Area, and Sector blank — after import, use the "AI Suggest" button in the online tool to auto-fill these from the description. Much faster than typing them manually!']);
  aiRow.getCell(1).font = { bold: true };
  aiRow.getCell(1).fill = fill(AI_TIP);
  aiRow.getCell(2).fill = fill(AI_TIP);
  aiRow.getCell(2).alignment = { wrapText: true };
  aiRow.height = 42;

  ws.addRow([]);

  // Stakeholder field guidance
  addRow('STAKEHOLDER FIELDS (Requirements tab)', null, { section: true });
  addRow('Stakeholder:', 'Name of the ORGANISATION — not a person. Use the org\'s common name or acronym.\n  ✓ "European Environment Agency"  ✓ "DEFRA"  ✗ "John Smith"', { bold: false });
  ws.lastRow.getCell(2).alignment = { wrapText: true };
  ws.lastRow.height = 36;
  addRow('Stakeholder Group:', 'A specific FUNCTIONAL GROUP of organisations — not a generic category.\n  ✓ "National Statistical Offices"  ✓ "CAP Paying Agencies"  ✓ "River Basin Authorities"  ✗ "Government"  ✗ "NGO"', { bold: false });
  ws.lastRow.getCell(2).alignment = { wrapText: true };
  ws.lastRow.height = 36;

  ws.addRow([]);

  // Valid values
  addRow('VALID VALUES FOR KEY FIELDS', null, { section: true });
  const valRows = [
    ['Stakeholder Type:', 'ESA / SEF  |  EO Service Provider  |  Non-EO Service Provider  |  Non-EO Research  |  Policy Maker  |  Policy Regulator/Enforcer  |  Policy Implementer  |  Interest Group  |  Other'],
    ['Lead Status:', 'Active with SEF  |  Contact with SEF  |  Aware of SEF  |  New contact'],
    ['Engagement Type:', 'Technical support  |  Requirements gathering  |  Coordination  |  Training  |  Outreach'],
    ['Requirement Category:', 'Functional requirement  |  Technical requirement  |  Other requirement'],
    ['Stakeholder Priority:', 'High priority  |  Nice to have  |  Fully addressed  |  Partially addressed'],
    ['Timescale:', 'Short term: 1-5 years  |  Medium term: 5-10 years  |  Long term: 10+ years'],
    ['SEF Theme:', 'Ecosystem and Biodiversity  |  Carbon, Energy and the Green Transition  |  Sustainable Development Goals  |  Food Systems'],
  ];
  valRows.forEach(([label, values]) => {
    const r = ws.addRow([label, values]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { wrapText: true };
  });
}

function addContactsSheet(wb) {
  const ws = wb.addWorksheet('Contacts');

  // Column definitions: [header, argb, width]
  const cols = [
    ['First Name',        SALMON, 16],
    ['Last Name',         SALMON, 16],
    ['Email',             YELLOW, 32],
    ['Company Name',      SALMON, 32],
    ['Stakeholder Type',  SALMON, 24],
    ['Associated Note',   SALMON, 48],
    ['Job Title',         YELLOW, 20],
    ['Lead Status',       YELLOW, 20],
    ['Engagement Type',   YELLOW, 26],
    ['Source of Contact', GREY,   22],
    ['Contact Owner',     YELLOW, 22],
    ['Create Date',       GREY,   20],
  ];

  ws.columns = cols.map(([, , width]) => ({ width }));

  // Header row
  const hdrRow = ws.addRow(cols.map(([h]) => h));
  hdrRow.height = 20;
  cols.forEach(([, argb], i) => styleHeader(hdrRow.getCell(i + 1), argb));

  // Data rows with light tint
  const lightArgb = cols.map(([, argb]) =>
    argb === SALMON ? 'FFFFF5F5' :
    argb === YELLOW ? 'FFFFFFF8' : 'FFF8F8F8'
  );
  for (let row = 0; row < 50; row++) {
    const r = ws.addRow(cols.map(() => ''));
    r.height = 18;
    lightArgb.forEach((argb, i) => {
      r.getCell(i + 1).fill = fill(argb);
      r.getCell(i + 1).alignment = { wrapText: false };
    });
  }

  // Dropdown for Stakeholder Type (column E)
  const dropList = STAKEHOLDER_TYPE_VALUES.join(',');
  ws.dataValidations.add('E2:E51', {
    type: 'list',
    allowBlank: true,
    formulae: [`"${dropList}"`],
    showErrorMessage: true,
    errorTitle: 'Invalid value',
    error: 'Please select a value from the dropdown list.',
  });

  // Dropdown for Contact Owner (column K)
  const colleagueList = COLLEAGUE_OPTIONS.join(',');
  ws.dataValidations.add('K2:K51', {
    type: 'list',
    allowBlank: true,
    formulae: [`"${colleagueList}"`],
    showErrorMessage: false,
  });

  // Freeze header row
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

function addRequirementsSheet(wb) {
  const ws = wb.addWorksheet('Requirements');

  const cols = [
    ['Description',              SALMON, 55],
    ['Stakeholder',              SALMON, 30],
    ['Stakeholder Group',        SALMON, 26],
    ['Name',                     YELLOW, 30],
    ['Requirement Category',     YELLOW, 26],
    ['Stakeholder Priority',     YELLOW, 24],
    ['Timescale',                YELLOW, 24],
    ['Biogeophysical Variables', YELLOW, 30],
    ['Spatial Resolution',       YELLOW, 22],
    ['Spatial Coverage',         YELLOW, 22],
    ['SEF Theme',                YELLOW, 32],
    ['Application Area',         YELLOW, 38],
    ['Sector',                   YELLOW, 30],
    ['Other Remarks',            YELLOW, 32],
    ['Date Added',               GREY,   16],
    ['Who Added',                GREY,   20],
    ['Context Added',            GREY,   30],
    ['Weblink',                  GREY,   30],
  ];

  ws.columns = cols.map(([, , width]) => ({ width }));

  const hdrRow = ws.addRow(cols.map(([h]) => h));
  hdrRow.height = 20;
  cols.forEach(([, argb], i) => styleHeader(hdrRow.getCell(i + 1), argb));

  // Tooltip notes on Stakeholder and Stakeholder Group headers (cols B and C)
  hdrRow.getCell(2).note = {
    texts: [{ text: 'Enter the ORGANISATION name (not a person\'s name).\nExample: "European Environment Agency"\nUse the same format as the Acronym - Local name - English name convention where applicable.' }],
  };
  hdrRow.getCell(3).note = {
    texts: [{ text: 'Enter the TYPE OF ORGANISATION GROUP — not a generic category (e.g. not "Government") but a specific functional group.\nExamples: "National Statistical Offices", "CAP Paying Agencies", "River Basin Authorities"' }],
  };

  const lightArgb = cols.map(([, argb]) =>
    argb === SALMON ? 'FFFFF5F5' :
    argb === YELLOW ? 'FFFFFFF8' : 'FFF8F8F8'
  );
  for (let row = 0; row < 50; row++) {
    const r = ws.addRow(cols.map(() => ''));
    r.height = 18;
    lightArgb.forEach((argb, i) => {
      r.getCell(i + 1).fill = fill(argb);
      // Wrap description column only
      r.getCell(i + 1).alignment = { wrapText: i === 0 };
    });
  }

  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

function addStakeholdersSheet(wb) {
  const ws = wb.addWorksheet('Stakeholders');

  const cols = [
    ['Organisation Name',      SALMON, 40],
    ['Short Description',      YELLOW, 50],
    ['Country',                YELLOW, 22],
    ['Website',                YELLOW, 32],
    ['Organisational category',YELLOW, 26],
    ['Role in policy',         YELLOW, 22],
    ['Relevance',              YELLOW, 14],
    ['Theme',                  YELLOW, 36],
    ['Sector',                 YELLOW, 30],
    ['Application Area',       YELLOW, 38],
  ];

  ws.columns = cols.map(([, , width]) => ({ width }));

  const hdrRow = ws.addRow(cols.map(([h]) => h));
  hdrRow.height = 20;
  cols.forEach(([, argb], i) => styleHeader(hdrRow.getCell(i + 1), argb));

  const lightArgb = cols.map(([, argb]) =>
    argb === SALMON ? 'FFFFF5F5' : 'FFFFFFF8'
  );
  for (let row = 0; row < 50; row++) {
    const r = ws.addRow(cols.map(() => ''));
    r.height = 18;
    lightArgb.forEach((argb, i) => {
      r.getCell(i + 1).fill = fill(argb);
      r.getCell(i + 1).alignment = { wrapText: i === 1 };
    });
  }

  // Country dropdown (col C)
  const countryList = SEFMAP_COUNTRY_OPTIONS.slice(0, 50).join(',');
  ws.dataValidations.add('C2:C51', {
    type: 'list', allowBlank: true,
    formulae: [`"${countryList}"`],
    showErrorMessage: false,
  });

  // Org category dropdown (col E)
  ws.dataValidations.add('E2:E51', {
    type: 'list', allowBlank: true,
    formulae: [`"${SEFMAP_ORG_CATEGORY_OPTIONS.join(',')}"`],
    showErrorMessage: false,
  });

  // Relevance dropdown (col G)
  ws.dataValidations.add('G2:G51', {
    type: 'list', allowBlank: true,
    formulae: [`"${SEFMAP_RELEVANCE_OPTIONS.join(',')}"`],
    showErrorMessage: false,
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function downloadImportTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SEF Event Tool';
  wb.created = new Date();

  addReadme(wb);
  addContactsSheet(wb);
  addRequirementsSheet(wb);
  addStakeholdersSheet(wb);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'SEF_Event_Import_Template.xlsx';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
}
