// One-off authoring tool: regenerates the clean, flat upload template at
// "public/templates/water quality template.xlsx". Run with:
//   npm run generate:wq-template
// Uses xlsx-js-style (not the runtime `xlsx` package) because plain SheetJS
// cannot write cell fill colors, and the reference template highlights the
// mandatory columns in yellow.
import XLSX from 'xlsx-js-style';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '..', 'public', 'templates', 'water quality template.xlsx');

const MANDATORY_COLUMNS = ['site_id', 'date', 'depth_m'];
const OPTIONAL_COLUMNS = [
  'sulfate_ppm',
  'ammonia_ppm',
  'nitrite_ppm',
  'nitrate_ppm',
  'phosphate_ppm',
  'do_ppm',
  'temperature_c',
  'ph_level',
  'turbidity_ntu',
  'conductivity_us_cm',
  'tds_ppm',
  'tss_ppm',
  'chlorophyll_ug_l',
  'notes',
];
const COLUMNS = [...MANDATORY_COLUMNS, ...OPTIONAL_COLUMNS];

const mandatoryStyle = {
  fill: { fgColor: { rgb: 'FFFF00' } },
  font: { bold: true },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  },
};
const optionalStyle = {
  fill: { fgColor: { rgb: 'D9E1F2' } },
  font: { bold: true },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  },
};

const worksheet = XLSX.utils.aoa_to_sheet([COLUMNS]);

COLUMNS.forEach((name, colIndex) => {
  const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
  const cell = worksheet[cellRef];
  if (!cell) return;
  cell.s = MANDATORY_COLUMNS.includes(name) ? mandatoryStyle : optionalStyle;
});

worksheet['!cols'] = COLUMNS.map((name) => ({ wch: Math.max(name.length + 2, 12) }));
worksheet['!ref'] = XLSX.utils.encode_range({
  s: { r: 0, c: 0 },
  e: { r: 0, c: COLUMNS.length - 1 },
});

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Water Quality Data');

const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
writeFileSync(outPath, buffer);

console.log(`Generated: ${outPath}`);
console.log(`Columns (${COLUMNS.length}): ${COLUMNS.join(', ')}`);
console.log(`Mandatory (yellow): ${MANDATORY_COLUMNS.join(', ')}`);
