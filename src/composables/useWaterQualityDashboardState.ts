import { ref } from 'vue';
import {
  allWaterQualityParams,
  DEFAULT_WATER_QUALITY_CLASS,
  READING_START_YEAR,
  type WaterQualityClass,
} from 'src/composables/useWaterQualityModel';

// Module-level, not component-level — a ref declared inside the dashboard
// page's <script setup> gets re-created (and reset to its initial value)
// every time the page mounts, since Vue Router destroys the previous page
// component when you navigate away (no <keep-alive> wraps the router-view).
// This module's top-level code runs once, on first import; every later
// import — including a freshly-mounted page instance after you navigate
// back — reuses this same ref, so the selection survives the trip. Every
// other filter/selection on this dashboard follows the same reasoning below.
export const selectedParamKey = ref(allWaterQualityParams[0]!.key);

export const selectedWaterClass = ref<WaterQualityClass>(DEFAULT_WATER_QUALITY_CLASS);

// Reading Period: pick a year (2025 onward), then a month within that year.
// Defaults to July 2025 — the start of this platform's real sampling record,
// not "today" — so a fresh session lands on a period with actual data rather
// than whichever month happens to be current (which usually has nothing
// recorded yet). Shared with the 2D map's own Reading Period control
// (IndexPage.vue imports these same refs), so picking a period on either one
// updates both.
export const selectedYear = ref(2025);
export const selectedMonthInYear = ref(6); // July — MONTH_NAMES is 0-indexed Jan..Dec

export const selectedStationId = ref<string | null>(null);
export const selectedDepthM = ref(0);

export const depthProfileParamKeyA = ref(
  allWaterQualityParams.find((p) => p.key === 'temperature')?.key ?? allWaterQualityParams[0]!.key,
);
export const depthProfileParamKeyB = ref(
  allWaterQualityParams.find((p) => p.key === 'dissolvedOxygen')?.key ?? allWaterQualityParams[1]!.key,
);

export const timeLagParamKeyA = ref(
  allWaterQualityParams.find((p) => p.key === 'phosphate')?.key ?? allWaterQualityParams[0]!.key,
);
export const timeLagParamKeyB = ref(
  allWaterQualityParams.find((p) => p.key === 'chlorophyll')?.key ?? allWaterQualityParams[1]!.key,
);

// selectedMonthIndex depends on READING_START_YEAR, kept here (rather than
// as a page-local computed) so it stays next to the refs it derives from.
export function readingMonthIndex(year: number, monthInYear: number): number {
  return (year - READING_START_YEAR) * 12 + monthInYear;
}
