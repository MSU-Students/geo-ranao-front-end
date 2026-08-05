<template>
  <div ref="mapContainer" class="station-map" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface StationMapSite {
  siteId: string;
  stationId: string;
  lat: number;
  lng: number;
}

const props = defineProps<{
  sites: StationMapSite[];
  /** Simplified 3-tier color per site (good/warning/critical) — empty when no parameter is selected. */
  statusColorBySite: Record<string, string>;
  selectedSiteId: string | null;
}>();

const emit = defineEmits<{ 'select-station': [siteId: string] }>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const markers = new Map<string, L.CircleMarker>();

const NEUTRAL_COLOR = '#78909c';

function styleFor(siteId: string, selected: boolean) {
  return {
    color: selected ? '#ffffff' : 'rgba(255,255,255,0.75)',
    weight: selected ? 3 : 1.5,
    radius: selected ? 9 : 6,
    fillColor: props.statusColorBySite[siteId] ?? NEUTRAL_COLOR,
    fillOpacity: 0.9,
  };
}

function renderMarkers() {
  if (!map) return;
  markers.forEach((m) => m.remove());
  markers.clear();

  props.sites.forEach((site) => {
    const marker = L.circleMarker(
      [site.lat, site.lng],
      styleFor(site.siteId, site.siteId === props.selectedSiteId),
    );
    marker.bindTooltip(`<strong>${site.siteId}</strong><br>Station: ${site.stationId}`, {
      direction: 'top',
      offset: [0, -6],
    });
    marker.on('click', () => emit('select-station', site.siteId));
    marker.addTo(map!);
    markers.set(site.siteId, marker);
  });
}

function restyleMarkers() {
  markers.forEach((marker, siteId) => {
    marker.setStyle(styleFor(siteId, siteId === props.selectedSiteId));
  });
}

onMounted(() => {
  if (!mapContainer.value) return;
  map = L.map(mapContainer.value, {
    center: [7.99, 124.07],
    zoom: 11,
    scrollWheelZoom: false,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  renderMarkers();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

watch(() => props.sites, renderMarkers);
watch([() => props.statusColorBySite, () => props.selectedSiteId], restyleMarkers);
</script>

<style scoped>
.station-map {
  width: 100%;
  height: 100%;
  min-height: 340px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
