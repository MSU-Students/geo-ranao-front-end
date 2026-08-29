// Client-side parsing and validation for bulk water-quality XLSX uploads.
// Mandatory fields (site_id, date, depth_m) invalidate a row when missing or
// malformed; optional analyte cells are lenient — a bad/out-of-range value is
// dropped or flagged with a warning but never invalidates the row, since the
// three mandatory fields already make the row meaningful on their own.
import * as XLSX from 'xlsx';
import { allWaterQualityParams, getParamWarning } from './useWaterQualityModel';

export interface WaterQualityUploadRow {
  siteId: string;
  date: string; // ISO YYYY-MM-DD
  depthM: number;
  values: Partial<Record<string, number>>; // keyed by WaterQualityParam.key
  notes: string | undefined;
  warnings: string[];
}

export interface InvalidUploadRow {
  rowNumber: number; // 1-based, matches spreadsheet row (header = row 1)
  reasons: string[];
}

export interface WaterQualityUploadParseResult {
  validRows: WaterQualityUploadRow[];
  invalidRows: InvalidUploadRow[];
  totalDataRows: number;
}

const COLUMN_TO_PARAM_KEY: Record<string, string> = {
  sulfate_ppm: 'sulfate',
  ammonia_ppm: 'ammonia',
  nitrite_ppm: 'nitrite',
  nitrate_ppm: 'nitrate',
  phosphate_ppm: 'phosphate',
  do_ppm: 'dissolvedOxygen',
  temperature_c: 'temperature',
  ph_level: 'ph',
  turbidity_ntu: 'turbidity',
  conductivity_us_cm: 'conductivity',
  tds_ppm: 'tds',
  tss_ppm: 'tss',
  chlorophyll_ug_l: 'chlorophyll',
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function fetchValidSiteIds(): Promise<Set<string>> {
  const res = await fetch('/geo/WQ-All-Sampling-Sites.geojson');
  const geojson = (await res.json()) as GeoJSON.FeatureCollection;
  const ids = geojson.features.map((feature) => {
    const props = feature.properties as unknown as { SITE_ID: string };
    return props.SITE_ID;
  });
  return new Set(ids);
}

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

function isValidCalendarDate(y: number, m: number, d: number): boolean {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function parseDateCell(raw: unknown): { iso: string | null; error: string | null } {
  if (raw instanceof Date) {
    // toISOString() is always UTC — safe here since cellDates gives us a Date
    // already anchored at local midnight; using local getters would risk the
    // classic SheetJS off-by-one-day bug depending on the machine's timezone.
    return { iso: raw.toISOString().slice(0, 10), error: null };
  }
  const str = cellToString(raw).trim();
  if (!str) return { iso: null, error: 'Missing date' };
  if (!ISO_DATE_RE.test(str)) return { iso: null, error: 'Invalid date (expected YYYY-MM-DD)' };
  const parts = str.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  if (!isValidCalendarDate(y, m, d)) {
    return { iso: null, error: 'Invalid date (expected YYYY-MM-DD)' };
  }
  return { iso: str, error: null };
}

export async function parseWaterQualityWorkbook(file: File): Promise<WaterQualityUploadParseResult> {
  const [validSiteIds, buffer] = await Promise.all([fetchValidSiteIds(), file.arrayBuffer()]);

  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file has no sheets.');
  }
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error('The uploaded file has no readable sheet data.');
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true });

  const validRows: WaterQualityUploadRow[] = [];
  const invalidRows: InvalidUploadRow[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // header is row 1
    const row = normalizeRowKeys(rawRow);
    const reasons: string[] = [];

    const siteId = cellToString(row['site_id']).trim();
    if (!siteId) {
      reasons.push('Missing site_id');
    } else if (!validSiteIds.has(siteId)) {
      reasons.push(`Unknown site_id "${siteId}" — not one of the registered sites`);
    }

    const { iso: date, error: dateError } = parseDateCell(row['date']);
    if (dateError) reasons.push(dateError);

    const depthRaw = row['depth_m'];
    const depthStr = cellToString(depthRaw).trim();
    const depthM = Number(depthStr);
    if (!depthStr) {
      reasons.push('Missing depth_m');
    } else if (!Number.isFinite(depthM)) {
      reasons.push('depth_m must be a number');
    }

    if (reasons.length > 0) {
      invalidRows.push({ rowNumber, reasons });
      return;
    }

    const warnings: string[] = [];
    const values: Partial<Record<string, number>> = {};

    for (const [column, paramKey] of Object.entries(COLUMN_TO_PARAM_KEY)) {
      const cell = row[column];
      const cellStr = cellToString(cell).trim();
      if (!cellStr) continue; // blank optional cell — skip silently

      const num = Number(cellStr);
      if (!Number.isFinite(num)) {
        warnings.push(`${column} value "${cellStr}" is not numeric — ignored`);
        continue;
      }

      const param = allWaterQualityParams.find((p) => p.key === paramKey);
      if (param) {
        const warning = getParamWarning(param, num);
        if (warning) warnings.push(warning);
      }
      values[paramKey] = num;
    }

    const notesRaw = cellToString(row['notes']).trim();

    validRows.push({
      siteId,
      date: date!,
      depthM,
      values,
      notes: notesRaw || undefined,
      warnings,
    });
  });

  return { validRows, invalidRows, totalDataRows: rawRows.length };
}
