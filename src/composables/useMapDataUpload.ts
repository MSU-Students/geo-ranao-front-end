import * as XLSX from 'xlsx';
import { Notify } from 'quasar';
import {
  computeRingsBounds,
  pointInPolygon,
  type DepthGrid,
} from 'src/composables/useBathymetry';

// --- Types --------------------------------------------------------------------

export interface DepthPoint {
  lat: number;
  lng: number;
  depth: number;
}

export interface DepthParseResult {
  points: DepthPoint[];
  skippedRows: number;
  totalRows: number;
}

// --- Excel Parser -------------------------------------------------------------

/**
 * Parses an Excel file (.xlsx / .xls) containing depth sounding data.
 *
 * Required columns (case-insensitive):
 *   latitude  — decimal degrees (e.g. 7.8234)
 *   longitude — decimal degrees (e.g. 124.1234)
 *   depth_m   — depth in meters, positive = downward (e.g. 45.2)
 *
 * Optional column:
 *   notes     — ignored by the parser but included in the template
 */
export async function parseDepthExcel(file: File): Promise<DepthParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('The Excel file appears to be empty (no sheets found).');

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error('Could not read the first sheet of the Excel file.');

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: true,
  });

  if (rows.length === 0) {
    throw new Error('The sheet contains no data rows. Please add depth measurements and try again.');
  }

  const firstRow = rows[0];
  const keys = Object.keys(firstRow).map((k) => k.toLowerCase().trim());

  const hasLatitude = keys.includes('latitude');
  const hasLongitude = keys.includes('longitude');
  const hasDepth = keys.includes('depth_m');

  if (!hasLatitude || !hasLongitude || !hasDepth) {
    const missing: string[] = [];
    if (!hasLatitude) missing.push('latitude');
    if (!hasLongitude) missing.push('longitude');
    if (!hasDepth) missing.push('depth_m');
    throw new Error(
      `Missing required column(s): ${missing.join(', ')}. ` +
        'Please use the provided template or ensure your headers match exactly.',
    );
  }

  const points: DepthPoint[] = [];
  let skippedRows = 0;

  for (const row of rows) {
    const normRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normRow[k.toLowerCase().trim()] = v;
    }

    const lat = parseFloat(String(normRow['latitude'] ?? ''));
    const lng = parseFloat(String(normRow['longitude'] ?? ''));
    const depth = parseFloat(String(normRow['depth_m'] ?? ''));

    if (isNaN(lat) || isNaN(lng) || isNaN(depth) || depth < 0) {
      skippedRows++;
      continue;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      skippedRows++;
      continue;
    }

    points.push({ lat, lng, depth });
  }

  if (points.length < 3) {
    throw new Error(
      `Only ${points.length} valid data point(s) found (minimum 3 required). ` +
        `${skippedRows} row(s) were skipped due to missing or invalid values.`,
    );
  }

  return { points, skippedRows, totalRows: rows.length };
}

// --- IDW Depth Grid Builder ---------------------------------------------------

const IDW_POWER = 2;
const IDW_SMOOTHING = 0.001;
const GRID_RESOLUTION = 220;

/**
 * Builds a DepthGrid from scattered depth soundings using Inverse Distance
 * Weighting (IDW) interpolation. Drop-in replacement for buildDepthGrid().
 * Cells outside the lake polygon rings get a value of 0.
 */
export function buildDepthGridFromPoints(
  points: DepthPoint[],
  lakePolygonRings: [number, number][][],
): DepthGrid | null {
  if (points.length < 3) return null;
  if (lakePolygonRings.length === 0) return null;

  const bounds = computeRingsBounds(lakePolygonRings);
  if (!bounds) return null;

  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  if (latSpan <= 0 || lngSpan <= 0) return null;

  const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const lngCorrection = Math.max(Math.cos(midLatRad), 0.1);
  const correctedLngSpan = lngSpan * lngCorrection;

  let width: number;
  let height: number;
  if (correctedLngSpan >= latSpan) {
    width = GRID_RESOLUTION;
    height = Math.max(40, Math.round((GRID_RESOLUTION * latSpan) / correctedLngSpan));
  } else {
    height = GRID_RESOLUTION;
    width = Math.max(40, Math.round((GRID_RESOLUTION * correctedLngSpan) / latSpan));
  }

  const values = new Float32Array(width * height);

  for (let row = 0; row < height; row++) {
    const lat = maxLat - (row / (height - 1)) * latSpan;
    for (let col = 0; col < width; col++) {
      const lng = minLng + (col / (width - 1)) * lngSpan;
      const idx = row * width + col;

      if (!pointInPolygon(lat, lng, lakePolygonRings)) {
        values[idx] = 0;
        continue;
      }

      let weightedSum = 0;
      let weightSum = 0;

      for (const pt of points) {
        const dLat = lat - pt.lat;
        const dLng = (lng - pt.lng) * lngCorrection;
        const distSq = dLat * dLat + dLng * dLng + IDW_SMOOTHING * IDW_SMOOTHING;
        const weight = 1 / Math.pow(distSq, IDW_POWER / 2);
        weightedSum += weight * pt.depth;
        weightSum += weight;
      }

      values[idx] = weightSum > 0 ? weightedSum / weightSum : 0;
    }
  }

  return { width, height, minLat, maxLat, minLng, maxLng, values };
}

// --- Backend Stub (Option B placeholder) -------------------------------------

/**
 * Placeholder for the backend upload API call.
 *
 * TODO: Replace this stub with a real API call when the backend endpoint
 * is ready. Example future implementation:
 *
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   formData.append('type', type);
 *   await api.post('/admin/map-data/upload', formData);
 */
export async function uploadMapDataToBackend(
  file: File,
  type: '2d-depth' | '3d-kmz',
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log(`[Map Upload Stub] Would upload "${file.name}" (type: ${type}) to backend`);
  Notify.create({
    type: 'info',
    icon: 'cloud_upload',
    message: 'Map updated for this session.',
    caption: 'Backend persistence will be enabled in the next update.',
    position: 'bottom-right',
    timeout: 4000,
  });
}
