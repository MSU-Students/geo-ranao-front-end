// Client-side parsing and validation for bulk fish-observation XLSX uploads.
// Mirrors useWaterQualityUpload.ts: the templates use a 3-row header (title,
// section, column) so parsing starts at row 3. Date Observed is the only
// mandatory field — same rule as the manual Fish Observation form, where
// "Date Observed is required. Everything else is optional." Photo columns in
// the template are for the researcher's own reference; bulk upload can't
// attach image files from spreadsheet cells, so they're ignored here.
import * as XLSX from 'xlsx';
import type { ConservationStatus, FishCategory } from './useFishObservations';

export type FishBulkCategory = 'endemic' | 'invasive' | 'others';

export const FISH_BULK_CATEGORY_TO_API: Record<FishBulkCategory, FishCategory> = {
  endemic: 'ENDEMIC',
  invasive: 'INVASIVE',
  others: 'GENERAL',
};

export interface FishUploadRow {
  category: FishCategory;
  dateObserved: string; // ISO YYYY-MM-DD
  speciesScientific?: string | undefined;
  speciesCommon?: string | undefined;
  conservationStatus?: ConservationStatus | undefined;
  trueLengthCm?: number | undefined;
  bodyDepthCm?: number | undefined;
  weightG?: number | undefined;
  depthM?: number | undefined;
  count?: number | undefined;
  sizeCategory?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  municipal?: string | undefined;
  barangay?: string | undefined;
  notes?: string | undefined;
  warnings: string[];
}

export interface InvalidFishUploadRow {
  rowNumber: number; // 1-based, matches spreadsheet row (header occupies rows 1–3)
  reasons: string[];
}

export interface FishUploadParseResult {
  validRows: FishUploadRow[];
  invalidRows: InvalidFishUploadRow[];
  totalDataRows: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_LABEL_TO_ENUM: Record<string, ConservationStatus> = {
  'critically endangered': 'CRITICALLY_ENDANGERED',
  cr: 'CRITICALLY_ENDANGERED',
  endangered: 'ENDANGERED',
  en: 'ENDANGERED',
  vulnerable: 'VULNERABLE',
  vu: 'VULNERABLE',
  'least concern': 'LEAST_CONCERN',
  lc: 'LEAST_CONCERN',
  'not evaluated': 'NOT_EVALUATED',
  ne: 'NOT_EVALUATED',
};

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  return '';
}

function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim().toLowerCase()] = value;
  }
  return normalized;
}

function isRowBlank(row: Record<string, unknown>): boolean {
  return Object.values(row).every((v) => cellToString(v).trim() === '');
}

function isValidCalendarDate(y: number, m: number, d: number): boolean {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function parseDateCell(raw: unknown): { iso: string | null; error: string | null } {
  if (raw instanceof Date) {
    return { iso: raw.toISOString().slice(0, 10), error: null };
  }
  const str = cellToString(raw).trim();
  if (!str) return { iso: null, error: 'Missing Date Observed' };
  if (!ISO_DATE_RE.test(str)) return { iso: null, error: 'Invalid Date Observed (expected YYYY-MM-DD)' };
  const parts = str.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  if (!isValidCalendarDate(y, m, d)) {
    return { iso: null, error: 'Invalid Date Observed (expected YYYY-MM-DD)' };
  }
  return { iso: str, error: null };
}

function parseOptionalNumber(
  row: Record<string, unknown>,
  column: string,
  label: string,
  warnings: string[],
): number | undefined {
  const cellStr = cellToString(row[column]).trim();
  if (!cellStr) return undefined;
  const num = Number(cellStr);
  if (!Number.isFinite(num)) {
    warnings.push(`${label} value "${cellStr}" is not numeric — ignored`);
    return undefined;
  }
  return num;
}

function parseStatus(row: Record<string, unknown>, warnings: string[]): ConservationStatus | undefined {
  const cellStr = cellToString(row['status']).trim().toLowerCase();
  if (!cellStr) return undefined;
  const status = STATUS_LABEL_TO_ENUM[cellStr];
  if (!status) {
    warnings.push(
      `Status "${cellStr}" not recognized — expected Critically Endangered / Endangered / Vulnerable / Least Concern / Not Evaluated; defaulted to Not Evaluated`,
    );
    return 'NOT_EVALUATED';
  }
  return status;
}

// Endemic Cyprinids and Invasive Species share the same template layout
// (Science Name, Local Name, Status, TL, BD, W, photo columns, Municipal,
// Barangay, Latitude, Longitude, Date Observed, Notes).
function parseEndemicOrInvasiveRow(
  row: Record<string, unknown>,
  category: FishCategory,
): { row: FishUploadRow | null; reasons: string[] } {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const { iso: dateObserved, error: dateError } = parseDateCell(row['date observed']);
  if (dateError) reasons.push(dateError);

  if (reasons.length > 0) return { row: null, reasons };

  const speciesScientific = cellToString(row['science name']).trim() || undefined;
  const speciesLocal = cellToString(row['local name']).trim() || undefined;
  // Backend has one "speciesCommon" slot. Endemic keeps the local name there;
  // Invasive's manual form only has a single free-text species field, so
  // combine scientific + local when both are given.
  const speciesCommon =
    category === 'INVASIVE'
      ? speciesScientific && speciesLocal
        ? `${speciesScientific} (${speciesLocal})`
        : (speciesScientific ?? speciesLocal)
      : speciesLocal;

  const trueLengthCm = parseOptionalNumber(row, 'true length (tl)', 'True Length (TL)', warnings);
  const bodyDepthCm = parseOptionalNumber(row, 'body depth (bd)', 'Body Depth (BD)', warnings);
  const weightG = parseOptionalNumber(row, 'weight (w)', 'Weight (W)', warnings);
  const latitude = parseOptionalNumber(row, 'latitude', 'Latitude', warnings);
  const longitude = parseOptionalNumber(row, 'longitude', 'Longitude', warnings);

  const municipal = cellToString(row['municipal']).trim() || undefined;
  const barangay = cellToString(row['barangay']).trim() || undefined;
  const notes = cellToString(row['notes']).trim() || undefined;
  const conservationStatus = parseStatus(row, warnings);

  return {
    row: {
      category,
      dateObserved: dateObserved!,
      ...(category === 'ENDEMIC' ? { speciesScientific } : {}),
      speciesCommon,
      conservationStatus,
      trueLengthCm,
      bodyDepthCm,
      weightG,
      latitude,
      longitude,
      municipal,
      barangay,
      notes,
      warnings,
    },
    reasons,
  };
}

function parseGeneralRow(row: Record<string, unknown>): { row: FishUploadRow | null; reasons: string[] } {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const { iso: dateObserved, error: dateError } = parseDateCell(row['date observed']);
  if (dateError) reasons.push(dateError);

  if (reasons.length > 0) return { row: null, reasons };

  const latitude = parseOptionalNumber(row, 'latitude', 'Latitude', warnings);
  const longitude = parseOptionalNumber(row, 'longitude', 'Longitude', warnings);
  const depthM = parseOptionalNumber(row, 'depth', 'Depth', warnings);
  const weightG = parseOptionalNumber(row, 'weight', 'Weight', warnings);
  const count = parseOptionalNumber(row, 'number', 'Number', warnings);
  const sizeCategory = cellToString(row['size']).trim() || undefined;
  const notes = cellToString(row['notes']).trim() || undefined;

  return {
    row: {
      category: 'GENERAL',
      dateObserved: dateObserved!,
      latitude,
      longitude,
      depthM,
      weightG,
      count,
      sizeCategory,
      notes,
      warnings,
    },
    reasons,
  };
}

export async function parseFishObservationWorkbook(
  file: File,
  bulkCategory: FishBulkCategory,
): Promise<FishUploadParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file has no sheets.');
  }
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error('The uploaded file has no readable sheet data.');
  }

  // Template header occupies rows 1–3 (title, section, column headers); data
  // starts on row 4, so read with the column-header row (index 2) as keys.
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: 2,
    defval: '',
    raw: true,
  });

  const category = FISH_BULK_CATEGORY_TO_API[bulkCategory];
  const validRows: FishUploadRow[] = [];
  const invalidRows: InvalidFishUploadRow[] = [];
  let dataRowCount = 0;

  rawRows.forEach((rawRow, index) => {
    const row = normalizeRowKeys(rawRow);
    if (isRowBlank(row)) return; // skip fully blank trailing rows silently

    dataRowCount += 1;
    const rowNumber = index + 4; // header occupies rows 1–3

    const { row: parsedRow, reasons } =
      bulkCategory === 'others' ? parseGeneralRow(row) : parseEndemicOrInvasiveRow(row, category);

    if (reasons.length > 0 || !parsedRow) {
      invalidRows.push({ rowNumber, reasons });
      return;
    }

    validRows.push(parsedRow);
  });

  return { validRows, invalidRows, totalDataRows: dataRowCount };
}
