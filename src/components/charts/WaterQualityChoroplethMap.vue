<template>
  <div ref="mapContainer" class="choropleth-map" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATUS_COLORS, STATUS_LABELS, type StatusLevel } from 'src/composables/useWaterQualityModel';

export interface ChoroplethZone {
  /** Matches stations.stationId from the backend, e.g. "STATION-1". */
  stationId: string;
  formattedValue: string;
  status: StatusLevel | null;
  /** How many of the station's (up to 2) sub-sites had a reading to average. */
  coverage: number;
}

const props = defineProps<{ zones: ChoroplethZone[] }>();

// Matches the page-level NO_DATA_COLOR used by the Station Map right above
// this one, so "no data" reads the same grey across both maps.
const NO_DATA_COLOR = '#78909c';

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let zonesLayer: L.GeoJSON | null = null;

// public/geo/Lake-Station.geojson names its 12 zone polygons "Station 8",
// "Station 12", etc. — one even misspells it "Sation 11". Matching on the
// digits only (not the label text) sidesteps that typo and maps cleanly
// onto the backend's "STATION-<n>" stationId grouping.
function normalizeStationId(rawName: string): string | null {
  const match = /(\d+)/.exec(rawName);
  return match ? `STATION-${match[1]}` : null;
}

function zoneFor(stationId: string | null): ChoroplethZone | undefined {
  if (!stationId) return undefined;
  return props.zones.find((z) => z.stationId === stationId);
}

function featureStationId(feature: GeoJSON.Feature | undefined): string | null {
  const name = (feature?.properties as { name?: string } | undefined)?.name;
  return name ? normalizeStationId(name) : null;
}

function styleFor(feature: GeoJSON.Feature | undefined): L.PathOptions {
  const zone = zoneFor(featureStationId(feature));
  const fillColor = zone?.status ? STATUS_COLORS[zone.status] : NO_DATA_COLOR;
  return { color: '#1b1b1b', weight: 1, fillColor, fillOpacity: 0.55 };
}

function tooltipFor(feature: GeoJSON.Feature | undefined): string {
  const stationId = featureStationId(feature);
  const zone = zoneFor(stationId);
  if (!zone) return `<strong>${stationId ?? 'Unknown zone'}</strong><br>No data`;
  const statusLabel = zone.status ? STATUS_LABELS[zone.status] : 'No Data';
  const coverageLabel =
    zone.coverage >= 2 ? 'both sub-stations' : zone.coverage === 1 ? '1 of 2 sub-stations' : 'no sub-stations';
  return `<strong>${zone.stationId}</strong><br>${zone.formattedValue} · ${statusLabel}<br><span style="color:#999;font-size:11px;">Averaged from ${coverageLabel}</span>`;
}

onMounted(async () => {
  if (!mapContainer.value) return;
  map = L.map(mapContainer.value, {
    center: [7.9, 124.27],
    zoom: 10,
    scrollWheelZoom: false,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  try {
    const res = await fetch('/geo/Lake-Station.geojson');
    const geojson = (await res.json()) as GeoJSON.FeatureCollection;
    zonesLayer = L.geoJSON(geojson, { style: styleFor }).addTo(map);
    // Bound once as a function (not a static string) — same as StationMap's
    // tooltipHtml — so it keeps reading fresh zone data as `zones` changes,
    // without needing to rebind on every parameter switch.
    zonesLayer.eachLayer((layer) => {
      const l = layer as L.Layer & { feature?: GeoJSON.Feature };
      l.bindTooltip(() => tooltipFor(l.feature), { sticky: true });
    });
  } catch (err) {
    console.error('Failed to load Lake-Station.geojson for the choropleth map:', err);
  }
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  zonesLayer = null;
});

// Only the fill color needs to change when the selected parameter, month,
// or depth changes — geometry and tooltips stay bound to the same layers.
watch(
  () => props.zones,
  () => zonesLayer?.setStyle(styleFor),
);
</script>

<style scoped>
.choropleth-map {
  width: 100%;
  height: 100%;
  min-height: 340px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
