import { ref } from 'vue';
import { allWaterQualityParams, READING_START_YEAR } from 'src/composables/useWaterQualityModel';
import { dateToMonthIndex, type WaterQualityReading } from 'src/composables/useWaterQualityReadings';

// Module-level, not component-level — a ref declared inside the dashboard
// page's <script setup> gets re-created (and reset to its initial value)
// every time the page mounts, since Vue Router destroys the previous page
// component when you navigate away (no <keep-alive> wraps the router-view).
// This module's top-level code runs once, on first import; every later
// import — including a freshly-mounted page instance after you navigate
// back — reuses this same ref, so the selection survives the trip. Every
// other filter/selection on this dashboard follows the same reasoning below.
export const selectedParamKey = ref(allWaterQualityParams[0]!.key);

// Reading Period: pick a year (2025 onward), then a month within that year.
// Starts at this placeholder (July 2025) only until the first real readings
// load, at which point applyLatestReadingPeriodDefault below bumps it
// forward to whichever month actually has the most recent data — "today"
// itself usually has nothing recorded yet, so landing there would show an
// empty dashboard. Shared with the 2D map's own Reading Period control
// (IndexPage.vue imports these same refs), so picking a period on either one
// updates both.
export const selectedYear = ref(2025);
export const selectedMonthInYear = ref(6); // July — MONTH_NAMES is 0-indexed Jan..Dec

// The most recent {year, monthInYear} with at least one approved reading —
// shared by the one-shot default below and by Advanced Analytics' own
// (page-local, not session-persisted) Reading Period, which re-applies this
// on every mount.
export function latestYearMonth(readings: WaterQualityReading[]): { year: number; monthInYear: number } | null {
  if (readings.length === 0) return null;
  const maxIndex = Math.max(...readings.map((r) => dateToMonthIndex(r.dateObserved)));
  return {
    year: READING_START_YEAR + Math.floor(maxIndex / 12),
    monthInYear: ((maxIndex % 12) + 12) % 12,
  };
}

// Only auto-advances the Reading Period once per session, and only if it's
// still sitting at the placeholder above — if the user (or a restored
// session) already moved it before readings finished loading, that's a real
// choice and this leaves it alone rather than yanking it to "latest".
let appliedLatestReadingPeriodDefault = false;
export function applyLatestReadingPeriodDefault(readings: WaterQualityReading[]): void {
  if (appliedLatestReadingPeriodDefault) return;
  appliedLatestReadingPeriodDefault = true;
  if (selectedYear.value !== 2025 || selectedMonthInYear.value !== 6) return;

  const latest = latestYearMonth(readings);
  if (!latest) return;
  selectedYear.value = latest.year;
  selectedMonthInYear.value = latest.monthInYear;
}

export const selectedStationId = ref<string | null>(null);
export const selectedDepthM = ref(0);

export const depthProfileParamKeyA = ref(
  allWaterQualityParams.find((p) => p.key === 'temperature')?.key ?? allWaterQualityParams[0]!.key,
);
export const depthProfileParamKeyB = ref(
  allWaterQualityParams.find((p) => p.key === 'dissolvedOxygen')?.key ?? allWaterQualityParams[1]!.key,
);

// Which Advanced Analytics visualization type is showing.
export const analyticsVizType = ref<string>('all-param-depth-profiles');

// Composition Over Time's stack dimension — Status/Station/Parameter.
export const compositionStackBy = ref<'status' | 'station' | 'parameter'>('status');

// Long-Term Trend's optional second comparison line — off by default
// (lake-wide average + trend line only), or compare against one zone
// average or one station (reuses selectedStationId when set to 'station').
export const longTermTrendCompare = ref<'none' | 'zone' | 'station'>('none');
export const longTermTrendZone = ref<'Nearshore' | 'Offshore' | 'Tributary'>('Nearshore');

// Station Comparison's range filters (e.g. "Temperature > 28 AND Dissolved
// Oxygen < 4") — the id counter stays private to this module since an
// imported `let` can't be reassigned from the page file; allocateFilterRuleId
// is the only way to get a fresh one.
export interface ParallelFilterRule {
  id: number;
  paramKey: string;
  operator: '>' | '<' | '>=' | '<=';
  value: number;
}
export const parallelFilterRules = ref<ParallelFilterRule[]>([]);
let nextParallelFilterRuleId = 1;
export function allocateParallelFilterRuleId(): number {
  return nextParallelFilterRuleId++;
}

// selectedMonthIndex depends on READING_START_YEAR, kept here (rather than
// as a page-local computed) so it stays next to the refs it derives from.
export function readingMonthIndex(year: number, monthInYear: number): number {
  return (year - READING_START_YEAR) * 12 + monthInYear;
}
