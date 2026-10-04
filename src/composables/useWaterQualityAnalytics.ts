// Shared analytics computations reused by both the Water Quality Dashboard
// (per-month, per-station drill-down) and the Download Center (whole
// filtered-scope aggregate) — the math itself (Pearson correlation,
// per-site averaging) doesn't depend on which page is asking for it.
import {
  allWaterQualityParams,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_LEVELS,
  type WaterQualityParam,
} from './useWaterQualityModel';
import { dateToMonthIndex, type WaterQualityReading } from './useWaterQualityReadings';
import type { Station } from './useStations';
import type { CorrelationCell } from 'src/components/charts/CorrelationHeatmap.vue';
import type { ParallelAxis, ParallelSeries } from 'src/components/charts/ParallelCoordinatesChart.vue';
import type { DepthChartPoint } from 'src/components/charts/DepthProfileChart.vue';
import type { DepthSeries } from 'src/components/charts/MultiDepthTrendChart.vue';
import type { IsoplethColumn } from 'src/components/charts/DepthTimeIsopleth.vue';
import type { Surface3DColumn } from 'src/components/charts/Depth3DSurfacePlot.vue';
import type { TransectZone } from 'src/components/charts/TransectProfileChart.vue';
import type { ComplianceRow } from 'src/components/charts/StationMonthComplianceGrid.vue';

// Needs at least 3 paired observations for a correlation to mean anything,
// not just "more than zero" — matches WaterQualityDashboardPage.vue's own
// threshold for the same reason.
export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - meanX;
    const dy = ys[i]! - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? null : num / denom;
}

function pairedValues(
  readings: WaterQualityReading[],
  paramA: WaterQualityParam,
  paramB: WaterQualityParam,
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  readings.forEach((r) => {
    const a = r[paramA.key as keyof WaterQualityReading];
    const b = r[paramB.key as keyof WaterQualityReading];
    if (typeof a === 'number' && typeof b === 'number') {
      xs.push(a);
      ys.push(b);
    }
  });
  return { xs, ys };
}

export interface CorrelationMatrixResult {
  labels: string[];
  matrix: CorrelationCell[][];
}

// Pairs come from each raw reading row directly (same site/date/depth), not
// independently pre-averaged values — a correlation needs matched (x, y)
// observations from the same underlying record.
export function buildCorrelationMatrix(
  readings: WaterQualityReading[],
  params: WaterQualityParam[] = allWaterQualityParams,
): CorrelationMatrixResult {
  const labels = params.map((p) => p.label);
  const matrix = params.map((paramA) =>
    params.map((paramB) => {
      if (paramA.key === paramB.key) return { r: 1, n: readings.length };
      const { xs, ys } = pairedValues(readings, paramA, paramB);
      return { r: pearsonCorrelation(xs, ys), n: xs.length };
    }),
  );
  return { labels, matrix };
}

// Distinct, evenly-spaced hues — same generator WaterQualityDashboardPage.vue
// uses for its own parallel-coordinates lines, so a station's color reads
// consistently if someone compares the two pages side by side.
function colorForIndex(i: number, total: number): string {
  const hue = (i / Math.max(total, 1)) * 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export interface ParallelCoordinatesResult {
  axes: ParallelAxis[];
  seriesList: ParallelSeries[];
}

// One series per station, averaged across every reading in the given set
// (not one specific month) — fits the Download Center's date-RANGE filter,
// where there's no single month to key off like the dashboard's Reading
// Period selector has.
export function buildParallelCoordinatesData(
  readings: WaterQualityReading[],
  params: WaterQualityParam[] = allWaterQualityParams,
): ParallelCoordinatesResult {
  const axes: ParallelAxis[] = params.map((p) => ({ key: p.key, label: p.label, min: p.min, max: p.max }));

  const bySite = new Map<string, WaterQualityReading[]>();
  readings.forEach((r) => {
    const bucket = bySite.get(r.siteId);
    if (bucket) bucket.push(r);
    else bySite.set(r.siteId, [r]);
  });

  const siteIds = Array.from(bySite.keys()).sort();
  const seriesList: ParallelSeries[] = siteIds.map((siteId, i) => {
    const siteReadings = bySite.get(siteId)!;
    const values = params.map((p) => {
      const nums = siteReadings
        .map((r) => r[p.key as keyof WaterQualityReading])
        .filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return null;
      return nums.reduce((s, v) => s + v, 0) / nums.length;
    });
    return { siteId, color: colorForIndex(i, siteIds.length), values };
  });

  return { axes, seriesList };
}

// ═══ SHARED "MONTH" AXIS ═══
// The Download Center filters by a date RANGE, not the dashboard's single
// Reading Period — so every time-axis chart below builds its own month axis
// straight from whichever calendar months are actually present in the
// filtered reading set, sorted chronologically, instead of a global
// months[] index. Keyed by "YYYY-MM" so two different readings in the same
// calendar month always bucket together regardless of day-of-month.
export interface MonthBucket {
  key: string; // "YYYY-MM"
  label: string; // "Mar 2026"
}

function monthKeyOf(reading: WaterQualityReading): string {
  return reading.dateObserved.slice(0, 7);
}

function monthLabelOf(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year!, (month ?? 1) - 1, 1)).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function distinctMonths(readings: WaterQualityReading[]): MonthBucket[] {
  const keys = new Set(readings.map(monthKeyOf));
  return Array.from(keys)
    .sort()
    .map((key) => ({ key, label: monthLabelOf(key) }));
}

function avgOf(values: number[]): number | null {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

function valueAt(readings: WaterQualityReading[], siteId: string, monthKey: string, param: WaterQualityParam): number | null {
  const nums = readings
    .filter((r) => r.siteId === siteId && monthKeyOf(r) === monthKey)
    .map((r) => r[param.key as keyof WaterQualityReading])
    .filter((v): v is number => typeof v === 'number');
  return avgOf(nums);
}

// ═══ VERTICAL DEPTH PROFILE / MULTI-DEPTH TIME-SERIES / FACETED PROFILES /
//     DEPTH-TIME ISOPLETH / 3D SURFACE — all five read the SAME per-depth
//     readings at one focus station, just sliced differently (one month's
//     depths vs. one depth's months vs. every month's depths stacked). ═══
export function buildDepthProfilePoints(
  readings: WaterQualityReading[],
  stationId: string,
  param: WaterQualityParam,
  monthKey: string,
): DepthChartPoint[] {
  return readings
    .filter((r) => r.siteId === stationId && monthKeyOf(r) === monthKey)
    .map((r) => ({ depth: r.depthM, value: r[param.key as keyof WaterQualityReading] }))
    .filter((p): p is DepthChartPoint => typeof p.value === 'number')
    .sort((a, b) => a.depth - b.depth);
}

function categoricalColor(i: number, total: number): string {
  return `hsl(${Math.round((i * 360) / Math.max(total, 1))}, 70%, 62%)`;
}

export function buildMultiDepthSeries(
  readings: WaterQualityReading[],
  stationId: string,
  param: WaterQualityParam,
  months: MonthBucket[],
): { months: string[]; series: DepthSeries[] } {
  const stationReadings = readings.filter((r) => r.siteId === stationId);
  const activeDepths = Array.from(new Set(stationReadings.map((r) => r.depthM))).sort((a, b) => a - b);
  const series: DepthSeries[] = activeDepths.map((depth, di) => ({
    depth,
    label: depth === 0 ? 'Surface' : `${depth}m`,
    color: categoricalColor(di, activeDepths.length),
    values: months.map((m) => {
      const match = stationReadings.find((r) => r.depthM === depth && monthKeyOf(r) === m.key);
      const v = match?.[param.key as keyof WaterQualityReading];
      return typeof v === 'number' ? v : null;
    }),
  }));
  return { months: months.map((m) => m.label), series };
}

// IsoplethColumn and Surface3DColumn are structurally identical
// ({ month, points: { depth, value }[] }) — one builder covers both props.
export function buildDepthTimeColumns(
  readings: WaterQualityReading[],
  stationId: string,
  param: WaterQualityParam,
  months: MonthBucket[],
): IsoplethColumn[] & Surface3DColumn[] {
  return months.map((m) => ({
    month: m.label,
    points: buildDepthProfilePoints(readings, stationId, param, m.key),
  })) as IsoplethColumn[] & Surface3DColumn[];
}

// ═══ STATION × MONTH COMPLIANCE GRID ═══
// Orders stations Tributary -> Nearshore -> Offshore using the backend's
// 4-way zone, collapsed to the 3-way category the grid is designed around.
export function zoneToTransectZone(zone: Station['zone']): TransectZone {
  return zone === 'TRIBUTARY' || zone === 'RIVER' ? 'Tributary' : zone === 'OFFSHORE' ? 'Offshore' : 'Nearshore';
}

const TRANSECT_ZONE_ORDER: Record<TransectZone, number> = { Tributary: 0, Nearshore: 1, Offshore: 2 };

function zoneOrderedStations(stations: Station[]): Station[] {
  return [...stations].sort(
    (a, b) =>
      TRANSECT_ZONE_ORDER[zoneToTransectZone(a.zone)] - TRANSECT_ZONE_ORDER[zoneToTransectZone(b.zone)] ||
      a.siteId.localeCompare(b.siteId),
  );
}

export function buildComplianceGrid(
  readings: WaterQualityReading[],
  stations: Station[],
  param: WaterQualityParam,
  months: MonthBucket[],
): { months: string[]; rows: ComplianceRow[] } {
  const rows: ComplianceRow[] = zoneOrderedStations(stations).map((s) => ({
    siteId: s.siteId,
    cells: months.map((m) => {
      const value = valueAt(readings, s.siteId, m.key, param);
      return value === null ? { status: 'no-data' as const, value: null } : { status: param.getStatus(value), value };
    }),
  }));
  return { months: months.map((m) => m.label), rows };
}

// ═══ COMPOSITION OVER TIME (stacked bar) ═══
// Modeled after a "volume by species per year" stacked bar — but a raw
// measured value (temperature, pH, …) can't stack meaningfully across
// stations or parameters the way a volume can, so the stackable quantity
// here is reading COUNTS. "By Compliance Status" is anchored to a single
// parameter (status is only meaningful per-parameter, same as the
// Compliance Grid); "By Station" and "By Parameter" aren't.
export type CompositionStackBy = 'status' | 'station' | 'parameter';

export interface CompositionSegment {
  key: string;
  label: string;
  color: string;
  /** Aligned 1:1 with CompositionResult.months. */
  values: number[];
}

export interface CompositionResult {
  months: string[];
  segments: CompositionSegment[];
}

export function buildCompositionOverTime(
  readings: WaterQualityReading[],
  sites: { siteId: string }[],
  param: WaterQualityParam,
  stackBy: CompositionStackBy,
  monthIndices: number[],
  monthLabels: string[],
): CompositionResult {
  const indexPos = new Map(monthIndices.map((idx, pos) => [idx, pos]));
  const n = monthIndices.length;

  if (stackBy === 'status') {
    const counts = new Map<string, number[]>(STATUS_LEVELS.map((level) => [level, Array(n).fill(0) as number[]]));
    for (const r of readings) {
      const pos = indexPos.get(dateToMonthIndex(r.dateObserved));
      if (pos === undefined) continue;
      const v = r[param.key as keyof WaterQualityReading];
      if (typeof v !== 'number') continue;
      const bucket = counts.get(param.getStatus(v))!;
      bucket[pos] = (bucket[pos] ?? 0) + 1;
    }
    return {
      months: monthLabels,
      segments: STATUS_LEVELS.map((level) => ({
        key: level,
        label: STATUS_LABELS[level],
        color: STATUS_COLORS[level],
        values: counts.get(level)!,
      })),
    };
  }

  if (stackBy === 'station') {
    const counts = new Map<string, number[]>(sites.map((s) => [s.siteId, Array(n).fill(0) as number[]]));
    for (const r of readings) {
      const pos = indexPos.get(dateToMonthIndex(r.dateObserved));
      if (pos === undefined) continue;
      const arr = counts.get(r.siteId);
      if (arr) arr[pos] = (arr[pos] ?? 0) + 1;
    }
    const withData = sites.filter((s) => counts.get(s.siteId)!.some((v) => v > 0));
    return {
      months: monthLabels,
      segments: withData.map((s, i) => ({
        key: s.siteId,
        label: s.siteId,
        color: categoricalColor(i, withData.length),
        values: counts.get(s.siteId)!,
      })),
    };
  }

  // stackBy === 'parameter' — counts non-null values per parameter per
  // month, i.e. a data-completeness view rather than a water-quality one.
  const counts = new Map<string, number[]>(allWaterQualityParams.map((p) => [p.key, Array(n).fill(0) as number[]]));
  for (const r of readings) {
    const pos = indexPos.get(dateToMonthIndex(r.dateObserved));
    if (pos === undefined) continue;
    for (const p of allWaterQualityParams) {
      const v = r[p.key as keyof WaterQualityReading];
      if (typeof v === 'number') {
        const bucket = counts.get(p.key)!;
        bucket[pos] = (bucket[pos] ?? 0) + 1;
      }
    }
  }
  const withData = allWaterQualityParams.filter((p) => counts.get(p.key)!.some((v) => v > 0));
  return {
    months: monthLabels,
    segments: withData.map((p, i) => ({
      key: p.key,
      label: p.label,
      color: categoricalColor(i, withData.length),
      values: counts.get(p.key)!,
    })),
  };
}

// ═══ LONG-TERM TREND ═══
// Unlike every other chart on this dashboard (which shows a trailing
// 13-month window), a trend line only means something over the FULL
// history — so this spans every month from the earliest to the latest
// approved reading of this parameter, not the Reading Period window.
export interface TrendLineGroup {
  key: string;
  label: string;
  color: string;
  filter: (r: WaterQualityReading) => boolean;
}

export interface TrendLineSeries {
  key: string;
  label: string;
  color: string;
  /** Aligned 1:1 with TrendLineResult.months; null = no reading that month. */
  values: (number | null)[];
}

export interface TrendLineResult {
  months: string[];
  series: TrendLineSeries[];
  /** Linear regression (ordinary least squares) fit to the first group's non-null points only. */
  trend: { slope: number; intercept: number; perYear: number } | null;
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 2) return null;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: meanY - slope * meanX };
}

export function buildLongTermTrend(
  readings: WaterQualityReading[],
  param: WaterQualityParam,
  groups: TrendLineGroup[],
  monthIndexToLabel: (monthIndex: number) => string,
): TrendLineResult {
  const paramIndices = readings
    .filter((r) => typeof r[param.key as keyof WaterQualityReading] === 'number')
    .map((r) => dateToMonthIndex(r.dateObserved));
  if (paramIndices.length === 0) return { months: [], series: [], trend: null };

  const minIdx = Math.min(...paramIndices);
  const maxIdx = Math.max(...paramIndices);
  const monthIndices = Array.from({ length: maxIdx - minIdx + 1 }, (_, i) => minIdx + i);
  const monthsOut = monthIndices.map(monthIndexToLabel);

  const series: TrendLineSeries[] = groups.map((g) => {
    const byIndex = new Map<number, number[]>();
    for (const r of readings) {
      if (!g.filter(r)) continue;
      const v = r[param.key as keyof WaterQualityReading];
      if (typeof v !== 'number') continue;
      const idx = dateToMonthIndex(r.dateObserved);
      const bucket = byIndex.get(idx);
      if (bucket) bucket.push(v);
      else byIndex.set(idx, [v]);
    }
    const values = monthIndices.map((idx) => {
      const vals = byIndex.get(idx);
      return vals && vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    });
    return { key: g.key, label: g.label, color: g.color, values };
  });

  const primaryPoints = (series[0]?.values ?? [])
    .map((v, i) => (v === null ? null : { x: i, y: v }))
    .filter((p): p is { x: number; y: number } => p !== null);
  const fit = linearRegression(primaryPoints);

  return {
    months: monthsOut,
    series,
    trend: fit ? { ...fit, perYear: fit.slope * 12 } : null,
  };
}
