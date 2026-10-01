import { ref } from 'vue';

// Module-level, not component-level — see useWaterQualityDashboardState.ts
// for why: a ref declared inside IndexPage.vue's <script setup> resets to its
// default every time the page remounts, since Vue Router destroys the
// previous page component when you navigate away (no <keep-alive> wraps the
// router-view). These are the map's own filters/selections (distinct from
// useMapLayersState.ts, which only covers the Layers tab's on/off toggles) —
// surviving the trip means picking a depth, a color parameter, a base map,
// or a species/site search doesn't reset itself just from navigating to a
// dashboard and back.

// Side panel tab (Fish / Water / Layers / Map Data).
export const activeTab = ref('fish');

// Fish tab: species category chip + name search.
export const activeFilter = ref('all');
export const selectedSpeciesFilter = ref<string[]>([]);

// Water tab: site name search.
export const selectedSiteFilter = ref<string[]>([]);

// Water tab: "Color Sites By Parameter". Nullable (a visitor can explicitly
// pick "None (default colors)"), unlike the dashboard's selectedParamKey
// which is always a real parameter — kept as its own ref rather than shared
// with the dashboard for that reason.
export const selectedColorParamKey = ref<string | null>('temperature');

// Layers tab: base map tile provider (OpenStreetMap / Google Maps / Google Earth).
export const selectedBaseLayer = ref<string>('osm');
