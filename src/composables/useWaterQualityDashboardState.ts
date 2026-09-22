import { ref } from 'vue';
import {
  allWaterQualityParams,
  DEFAULT_WATER_QUALITY_CLASS,
  READING_START_YEAR,
  READING_YEARS,
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
// Computed once at module load (first visit this session), not per-mount —
// which is the right behavior here anyway: "today" doesn't change mid-session.
const now = new Date();
const defaultReadingYear = READING_YEARS.includes(now.getFullYear())
  ? now.getFullYear()
  : READING_YEARS[READING_YEARS.length - 1]!;
export const selectedYear = ref(defaultReadingYear);
export const selectedMonthInYear = ref(defaultReadingYear === now.getFullYear() ? now.getMonth() : 0);

export const selectedStationId = ref<string | null>(null);
export const selectedDepthM = ref(0);

export const compareParamKeyA = ref(
  allWaterQualityParams.find((p) => p.key === 'chlorophyll')?.key ?? allWaterQualityParams[0]!.key,
);
export const compareParamKeyB = ref(
  allWaterQualityParams.find((p) => p.key === 'nitrate')?.key ?? allWaterQualityParams[1]!.key,
);

export const depthProfileParamKeyA = ref(
  allWaterQualityParams.find((p) => p.key === 'temperature')?.key ?? allWaterQualityParams[0]!.key,
);
export const depthProfileParamKeyB = ref(
  allWaterQualityParams.find((p) => p.key === 'dissolvedOxygen')?.key ?? allWaterQualityParams[1]!.key,
);

// selectedMonthIndex depends on READING_START_YEAR, kept here (rather than
// as a page-local computed) so it stays next to the refs it derives from.
export function readingMonthIndex(year: number, monthInYear: number): number {
  return (year - READING_START_YEAR) * 12 + monthInYear;
}
