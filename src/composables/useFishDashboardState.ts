import { ref } from 'vue';

// Module-level, not component-level — see useWaterQualityDashboardState.ts
// for why: a ref declared inside the dashboard page's <script setup> gets
// reset to its default every time the page mounts, since Vue Router destroys
// the previous page component when you navigate away (no <keep-alive> wraps
// the router-view). Every filter/selection below survives the trip instead.

// Species list category chip ("All" / "Endemic" / "Invasive") and search box.
export const activeFilter = ref('all');
export const search = ref('');

// Distribution Explorer.
export const distYear = ref<string>('All Years');
export const distMunicipality = ref<string>('All Municipalities');
export const distCategory = ref<string>('All');

// Timeline Comparison (two independent series, A and B).
export const timelineAYear = ref(String(new Date().getFullYear()));
export const timelineBYear = ref(String(new Date().getFullYear()));
export const timelineAMuni = ref('All Municipalities');
export const timelineBMuni = ref('All Municipalities');
export const timelineASpecies = ref('All Species');
export const timelineAMetric = ref('count');
export const timelineBSpecies = ref('All Species');
export const timelineBMetric = ref('depthM');
