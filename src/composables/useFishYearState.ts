import { ref } from 'vue';

// Module-level refs so fish time-series state survives Vue Router navigation.
// NOTE: Independent from water quality's selectedYear (in useWaterQualityDashboardState.ts).
export type FishYearMode = 'year' | 'cumulative';

/**
 * Currently selected year for fish observations, or null for "All years".
 */
export const fishYear = ref<number | null>(null);

/**
 * Filter mode:
 * - 'year': only records observed in fishYear
 * - 'cumulative': all records observed up to and including fishYear
 */
export const fishYearMode = ref<FishYearMode>('year');

/**
 * Animation playback state for year-based time series autoplay.
 */
export const fishYearPlaying = ref<boolean>(false);
