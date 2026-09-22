import { ref } from 'vue';

// Module-level, not component-level — see useWaterQualityDashboardState.ts
// for why: a ref declared inside the map page's <script setup> gets reset to
// these defaults every time the page mounts, since Vue Router destroys the
// previous page component when you navigate away (no <keep-alive> wraps the
// router-view). Re-toggling every layer after every visit was the complaint
// this fixes — the toggle states now survive the trip.

export interface MapLayer {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export const mapLayers = ref<MapLayer[]>([
  {
    id: 'fish',
    name: 'Fish Observations',
    description: 'Endemic & invasive species markers',
    active: true,
  },
  {
    id: 'lakeBoundary',
    name: 'Lake Lanao Boundary',
    description: 'Official OSM outline of Lake Lanao',
    active: false,
  },
  {
    id: 'wqAll',
    name: 'All Water Quality Sites',
    description: 'Every water quality sampling point',
    active: true,
  },
  {
    id: 'wqAbove40',
    name: 'Sites Above 40m Depth',
    description: 'Sampling points deeper than 40m',
    active: false,
  },
  {
    id: 'wqBelow40',
    name: 'Sites Below 40m Depth',
    description: 'Sampling points shallower than 40m',
    active: false,
  },
  {
    id: 'wqTributary',
    name: 'Tributary Sampling Sites',
    description: 'Sampling points along tributaries',
    active: false,
  },
  {
    id: 'lakeStations',
    name: 'Lake Monitoring Stations',
    description: 'Lake zone boundaries (hover for details)',
    active: false,
  },
  {
    id: 'tributaries',
    name: 'Lake Tributaries',
    description: 'Rivers feeding into Lake Lanao',
    active: false,
  },
  {
    id: 'contourLines',
    name: 'Bathymetry Contours (Lines)',
    description: 'Modeled depth contours — 20/40/60/80/100m, lines only',
    active: false,
  },
  {
    id: 'contourFilled',
    name: 'Bathymetry Contours (Filled)',
    description: 'Modeled depth contours — filled color bands + lines',
    active: false,
  },
  {
    id: 'municipalWaters',
    name: 'Municipal Water Zones (~15km)',
    description: 'Illustrative median-line division among lakeshore LGUs',
    active: false,
  },
  {
    id: 'municipalityMarkers',
    name: 'Municipality Markers',
    description: 'Clickable city markers — one per lakeside municipality',
    active: true,
  },
]);
