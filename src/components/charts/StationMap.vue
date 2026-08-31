<template>
  <div ref="mapContainer" class="station-map" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STATUS_COLORS, STATUS_LABELS, type StatusLevel } from 'src/composables/useWaterQualityModel';

export interface StationMapSite {
  siteId: string;
  stationId: string;
  lat: number;
  lng: number;
}

export interface SiteAttentionDetail {
  paramLabel: string;
  formattedValue: string;
}

const props = withDefaults(
  defineProps<{
    sites: StationMapSite[];
    /** Simplified 3-tier color per site (good/warning/critical) — empty when no parameter is selected. */
    statusColorBySite: Record<string, string>;
    /**
     * True (uncollapsed) status per site, used only to decide the attention
     * decoration below — independent of statusColorBySite's quick-glance color.
     * serious -> pulsing ring, warning -> static badge, critical -> both.
     */
    statusBySite?: Record<string, StatusLevel>;
    /**
     * Which parameter/reading is driving statusBySite's status — surfaced in
     * the tooltip so a pulse/badge never shows up unexplained (it's easy to
     * assume it means whichever parameter the map is currently colored by,
     * when it's actually the worst of all 13).
     */
    attentionDetailBySite?: Record<string, SiteAttentionDetail>;
    selectedSiteId: string | null;
  }>(),
  { statusBySite: () => ({}), attentionDetailBySite: () => ({}) },
);

const emit = defineEmits<{ 'select-station': [siteId: string] }>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const markers = new Map<string, L.Marker>();

const NEUTRAL_COLOR = '#78909c';
const MARKER_SIZE = 34;

function iconFor(siteId: string, selected: boolean): L.DivIcon {
  const color = props.statusColorBySite[siteId] ?? NEUTRAL_COLOR;
  const status = props.statusBySite[siteId];
  const pulse = status === 'serious' || status === 'critical';
  const badge = status === 'warning' || status === 'critical';
  const dotClass = `wq-marker__dot${selected ? ' wq-marker__dot--selected' : ''}`;

  return L.divIcon({
    className: 'wq-marker-wrap',
    html: `
      <div class="wq-marker" style="--wq-color:${color}">
        ${pulse ? '<span class="wq-marker__pulse"></span>' : ''}
        <span class="${dotClass}"></span>
        ${badge ? '<span class="wq-marker__badge">!</span>' : ''}
      </div>
    `,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
  });
}

function tooltipHtml(site: StationMapSite): string {
  const status = props.statusBySite[site.siteId];
  const detail = props.attentionDetailBySite[site.siteId];
  const attentionLine =
    status && detail
      ? `<br><span style="color:${STATUS_COLORS[status]}; font-weight:bold;">⚠ ${detail.paramLabel}: ${detail.formattedValue} (${STATUS_LABELS[status]})</span>`
      : '';
  return `<strong>${site.siteId}</strong><br>Station: ${site.stationId}${attentionLine}`;
}

function renderMarkers() {
  if (!map) return;
  markers.forEach((m) => m.remove());
  markers.clear();

  props.sites.forEach((site) => {
    const selected = site.siteId === props.selectedSiteId;
    const marker = L.marker([site.lat, site.lng], { icon: iconFor(site.siteId, selected) });
    // Bound as a function (not a static string) so the tooltip stays
    // accurate as statusBySite/attentionDetailBySite change without needing
    // to recreate every marker on every month/depth/param change.
    marker.bindTooltip(() => tooltipHtml(site), {
      direction: 'top',
      offset: [0, -16],
    });
    marker.on('click', () => emit('select-station', site.siteId));
    marker.addTo(map!);
    markers.set(site.siteId, marker);
  });
}

function restyleMarkers() {
  markers.forEach((marker, siteId) => {
    marker.setIcon(iconFor(siteId, siteId === props.selectedSiteId));
  });
}

// Selecting a site — by clicking its marker directly, or from a list like
// "Sites of Concern" elsewhere on the page — zooms/pans the map to it, so a
// site that needs attention doesn't just get a badge you have to go hunting
// for. The zoom-in itself scales with severity: critical sites "size up"
// more than a routine good/warning one, matching the pulse/badge emphasis.
const ATTENTION_ZOOM: Record<StatusLevel, number> = {
  good: 14,
  warning: 14,
  serious: 15,
  critical: 16,
};

function flyToSelected() {
  if (!map || !props.selectedSiteId) return;
  const site = props.sites.find((s) => s.siteId === props.selectedSiteId);
  if (!site) return;
  const status = props.statusBySite[site.siteId];
  const targetZoom = status ? ATTENTION_ZOOM[status] : 14;
  // Only ever zoom in, never out — clicking a site you're already zoomed
  // past shouldn't yank the view back out.
  map.flyTo([site.lat, site.lng], Math.max(map.getZoom(), targetZoom), { duration: 1.1 });
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
watch([() => props.statusColorBySite, () => props.statusBySite, () => props.selectedSiteId], restyleMarkers);
watch(() => props.selectedSiteId, flyToSelected);
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

<!--
  Unscoped: Leaflet injects this markup via divIcon's raw HTML string, outside
  Vue's render tree, so Vue's scoped data-v-* attribute never reaches it —
  scoped styles here would silently no-op.
-->
<style>
.wq-marker-wrap {
  background: transparent;
  border: none;
}

.wq-marker {
  position: relative;
  width: 100%;
  height: 100%;
}

.wq-marker__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  background: var(--wq-color);
  transform: translate(-50%, -50%);
  z-index: 2;
}

.wq-marker__dot--selected {
  width: 18px;
  height: 18px;
  border-width: 3px;
  border-color: #ffffff;
}

/* Serious + Critical: a repeating radar-ping ring around the dot. */
.wq-marker__pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--wq-color);
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
  animation: wq-marker-pulse 1.8s ease-out infinite;
}

@keyframes wq-marker-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.6);
    opacity: 0.6;
  }
  70% {
    transform: translate(-50%, -50%) scale(2.4);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.4);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wq-marker__pulse {
    animation: none;
    opacity: 0.35;
    transform: translate(-50%, -50%) scale(1.6);
  }
}

/* Warning + Critical: a static "!" badge — always paired with the color, never a signal on its own. */
.wq-marker__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #ffffff;
  color: #b5290a;
  font-size: 9px;
  font-weight: 800;
  line-height: 13px;
  text-align: center;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
  z-index: 3;
  pointer-events: none;
}
</style>
