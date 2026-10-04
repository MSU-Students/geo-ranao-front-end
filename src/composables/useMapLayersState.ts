import { ref } from 'vue';

// Module-level, not component-level — see useWaterQualityDashboardState.ts
// for why: a ref declared inside the map page's <script setup> gets reset to
// these defaults every time the page mounts, since Vue Router destroys the
// previous page component when you navigate away (no <keep-alive> wraps the
// router-view). Re-toggling every layer after every visit was the complaint
// this fixes — the toggle states now survive the trip.

// Every toggleable layer lives in one category, so the Layers tab can group
// them instead of the three-way split (a "Map Layers" list, a Water tab
// "Additional Layers" list, and individually hand-placed toggles) this
// replaced — a new layer only needs the right category here, not a new
// id added to some filter array in the page component too.
export type MapLayerCategory = 'fish' | 'waterQuality' | 'bathymetry' | 'boundaries';

export interface MapLayer {
  id: string;
  name: string;
  description: string;
  category: MapLayerCategory;
  active: boolean;
  /** 0–100 — applied via a dedicated Leaflet pane per layer (see IndexPage.vue's PANE_Z_ORDER), not per-feature restyling. */
  opacity: number;
  /**
   * False for a layer that doesn't render its own pane/geometry — it just
   * toggles a visual modifier rather than owning its own pane (e.g. "Fish
   * With Photos" draws into the same pane as Fish Observations, applying a
   * gold highlight — it's independent of whether Fish Observations is also
   * on, so it isn't just styling that layer's existing markers). An opacity
   * slider for a modifier like that has nothing of its own to apply to, so
   * LayerToggleItem.vue hides it when this is false. Omitted (undefined)
   * means true, same as every ordinary layer.
   */
  opacityApplies?: boolean;
}

export const mapLayers = ref<MapLayer[]>([
  {
    id: 'fish',
    name: 'Fish Observations',
    description: 'Endemic & invasive species markers',
    category: 'fish',
    active: true,
    opacity: 100,
  },
  {
    id: 'fishPhotos',
    name: 'Fish With Photos',
    description: 'Shows/highlights observations with an uploaded photo — independent of Fish Observations',
    category: 'fish',
    active: false,
    opacity: 100,
    opacityApplies: false,
  },
  {
    id: 'wqAll',
    name: 'All Water Quality Sites',
    description: 'Every water quality sampling point',
    category: 'waterQuality',
    active: true,
    opacity: 100,
  },
  {
    id: 'wqInterpolated',
    name: 'Water Quality Interpolation',
    description: 'Smooth blended surface for the selected parameter',
    category: 'waterQuality',
    active: false,
    opacity: 100,
  },
  {
    id: 'wqChoropleth',
    name: 'Water Quality Choropleth',
    description: 'Station zones shaded by averaged parameter value',
    category: 'waterQuality',
    active: false,
    opacity: 100,
  },
  {
    id: 'lakeStations',
    name: 'Lake Monitoring Stations',
    description: 'Lake zone boundaries (hover for details)',
    category: 'waterQuality',
    active: false,
    opacity: 100,
  },
  {
    id: 'tributaries',
    name: 'Lake Tributaries',
    description: 'Rivers feeding into Lake Lanao',
    category: 'waterQuality',
    active: false,
    opacity: 100,
  },
  {
    id: 'contourLines',
    name: 'Bathymetry Contours (Lines)',
    description: 'Modeled depth contours — 20/40/60/80/100m, lines only',
    category: 'bathymetry',
    active: false,
    opacity: 100,
  },
  {
    id: 'contourFilled',
    name: 'Bathymetry Contours (Filled)',
    description: 'Modeled depth contours — filled color bands + lines',
    category: 'bathymetry',
    active: false,
    opacity: 100,
  },
  {
    id: 'lakeBoundary',
    name: 'Lake Lanao Boundary',
    description: 'Official OSM outline of Lake Lanao',
    category: 'boundaries',
    active: false,
    opacity: 100,
  },
  {
    id: 'municipalWaters',
    name: 'Municipal Water Zones (~15km)',
    description: 'Illustrative median-line division among lakeshore LGUs',
    category: 'boundaries',
    active: false,
    opacity: 100,
  },
  {
    id: 'municipalityMarkers',
    name: 'Municipality Markers',
    description: 'Clickable city markers — one per lakeside municipality',
    category: 'boundaries',
    active: true,
    opacity: 100,
  },
]);

// Bottom -> top. Drives the custom Leaflet pane z-index each layer id's
// content renders into (see IndexPage.vue), so stacking order stays
// predictable regardless of the order layers happen to load/toggle in —
// without dedicated panes, a layer's visual stacking is just DOM add order,
// which varies with async fetch timing.
export const LAYER_PANE_Z_ORDER: string[] = [
  'lakeBoundary',
  'municipalWaters',
  'contourFilled',
  'wqInterpolated',
  'wqChoropleth',
  'lakeStations',
  'contourLines',
  'municipalityMarkers',
  'fish',
  // Water quality markers render above fish observations on purpose — water
  // quality is this capstone's primary focus, so a station/tributary pin
  // should never be hidden underneath a coincident fish observation marker.
  'tributaries',
  'wqAll',
];
