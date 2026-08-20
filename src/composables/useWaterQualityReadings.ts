// Real water-quality reading data — fetch + a lookup table shaped so it can
// stand in for useWaterQualityModel.ts's generateReading() simulator. Unlike
// the simulator, a lookup miss is a real possibility (most site/month/depth
// combinations won't have been sampled yet), so callers get `null` back
// instead of a fabricated number and decide how to handle a gap themselves.
import { api } from 'src/boot/axios';
import { allWaterQualityParams, READING_START_YEAR, type WaterQualityParam } from './useWaterQualityModel';
import type { WaterQualityUploadRow } from './useWaterQualityUpload';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WaterQualityReading {
  id: number;
  researcherId: number;
  siteId: string;
  dateObserved: string;
  depthM: number;
  temperature?: number | null;
  ph?: number | null;
  turbidity?: number | null;
  dissolvedOxygen?: number | null;
  conductivity?: number | null;
  tds?: number | null;
  tss?: number | null;
  phosphate?: number | null;
  ammonia?: number | null;
  nitrate?: number | null;
  nitrite?: number | null;
  sulfate?: number | null;
  chlorophyll?: number | null;
  notes?: string | null;
  batchId?: string | null;
  reviewStatus: ReviewStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaterQualityReadingInput {
  siteId: string;
  dateObserved: string;
  depthM: number;
  temperature?: number | null | undefined;
  ph?: number | null | undefined;
  turbidity?: number | null | undefined;
  dissolvedOxygen?: number | null | undefined;
  conductivity?: number | null | undefined;
  tds?: number | null | undefined;
  tss?: number | null | undefined;
  phosphate?: number | null | undefined;
  ammonia?: number | null | undefined;
  nitrate?: number | null | undefined;
  nitrite?: number | null | undefined;
  sulfate?: number | null | undefined;
  chlorophyll?: number | null | undefined;
  notes?: string | undefined;
}

export async function submitWaterQualityReading(input: CreateWaterQualityReadingInput): Promise<WaterQualityReading> {
  const { data } = await api.post<WaterQualityReading>('/water-quality/readings', input);
  return data;
}

export async function submitWaterQualityBatch(rows: WaterQualityUploadRow[]): Promise<WaterQualityReading[]> {
  const payload = rows.map((row) => ({
    siteId: row.siteId,
    dateObserved: row.date,
    depthM: row.depthM,
    notes: row.notes,
    ...row.values,
  }));
  const { data } = await api.post<WaterQualityReading[]>('/water-quality/readings/bulk', { rows: payload });
  return data;
}

export async function fetchWaterQualityReadings(
  params: { status?: ReviewStatus; siteId?: string; mine?: boolean } = {},
): Promise<WaterQualityReading[]> {
  const { data } = await api.get<WaterQualityReading[]>('/water-quality/readings', {
    params: { status: params.status, siteId: params.siteId, mine: params.mine ? 'true' : undefined },
  });
  return data;
}

export async function approveWaterQualityReading(id: number): Promise<WaterQualityReading> {
  const { data } = await api.patch<WaterQualityReading>(`/water-quality/readings/${id}/approve`);
  return data;
}
export async function rejectWaterQualityReading(id: number, reason?: string): Promise<WaterQualityReading> {
  const { data } = await api.patch<WaterQualityReading>(`/water-quality/readings/${id}/reject`, { reason });
  return data;
}
export async function approveWaterQualityBatch(batchId: string): Promise<WaterQualityReading[]> {
  const { data } = await api.patch<WaterQualityReading[]>(`/water-quality/readings/batch/${batchId}/approve`);
  return data;
}
export async function rejectWaterQualityBatch(batchId: string, reason?: string): Promise<WaterQualityReading[]> {
  const { data } = await api.patch<WaterQualityReading[]>(`/water-quality/readings/batch/${batchId}/reject`, {
    reason,
  });
  return data;
}

// ─── Reading lookup (siteId|monthIndex|paramKey|depthM -> averaged value) ───
export type ReadingLookup = Map<string, number[]>;

export function dateToMonthIndex(dateObserved: string): number {
  const [yearStr, monthStr] = dateObserved.split('-');
  const year = Number(yearStr);
  const monthInYear = Number(monthStr) - 1;
  return (year - READING_START_YEAR) * 12 + monthInYear;
}

function lookupKey(siteId: string, monthIndex: number, paramKey: string, depthM: number): string {
  return `${siteId}|${monthIndex}|${paramKey}|${depthM}`;
}

export function buildReadingLookup(readings: WaterQualityReading[]): ReadingLookup {
  const lookup: ReadingLookup = new Map();
  for (const reading of readings) {
    const monthIndex = dateToMonthIndex(reading.dateObserved);
    for (const param of allWaterQualityParams) {
      const value = reading[param.key as keyof WaterQualityReading];
      if (typeof value !== 'number') continue;
      const key = lookupKey(reading.siteId, monthIndex, param.key, reading.depthM);
      const bucket = lookup.get(key);
      if (bucket) bucket.push(value);
      else lookup.set(key, [value]);
    }
  }
  return lookup;
}

/** Real reading, averaged if multiple exist for the same site/month/param/depth — null if never sampled. */
export function getReading(
  lookup: ReadingLookup,
  siteId: string,
  monthIndex: number,
  param: WaterQualityParam,
  depthM = 0,
): number | null {
  const bucket = lookup.get(lookupKey(siteId, monthIndex, param.key, depthM));
  if (!bucket || bucket.length === 0) return null;
  return bucket.reduce((sum, v) => sum + v, 0) / bucket.length;
}

/** Distinct site count backing a lookup value — the "how much data is this?" companion to getReading(). */
export function getReadingCoverage(
  lookup: ReadingLookup,
  siteId: string,
  monthIndex: number,
  param: WaterQualityParam,
  depthM = 0,
): number {
  return lookup.get(lookupKey(siteId, monthIndex, param.key, depthM))?.length ?? 0;
}
