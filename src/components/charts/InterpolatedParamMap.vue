<template>
  <div ref="mapContainer" class="interp-map" />
</template>

<script setup lang="ts">
// Same IDW interpolation + canvas-rasterization approach as the main
// Interactive Map's "Interpolated" layer (see IndexPage.vue's
// buildWqInterpolatedLayer) — just packaged as a small self-contained
// component so this dashboard card can offer it as one of several map
// visualization types without pulling in that page's much larger layer
// stack.
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  buildParamInterpolationGrid,
  severityColor,
  severityPosition,
  type ValuePoint,
} from 'src/composables/useWaterQualityInterpolation';
import { loadLakePolygonRings } from 'src/composables/useBathymetryClean';
import type { WaterQualityParam } from 'src/composables/useWaterQualityModel';

export interface InterpMapSite {
  siteId: string;
  lat: number;
  lng: number;
}

const props = defineProps<{
  sites: InterpMapSite[];
  values: Record<string, number>;
  param: WaterQualityParam | null;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let overlayLayer: L.ImageOverlay | null = null;
let lakePolygonRings: [number, number][][] = [];
let hasFitBounds = false;

function rebuildOverlay() {
  if (!map) return;
  if (overlayLayer) {
    map.removeLayer(overlayLayer);
    overlayLayer = null;
  }
  const param = props.param;
  if (!param || lakePolygonRings.length === 0) return;

  const points: ValuePoint[] = [];
  props.sites.forEach((site) => {
    const value = props.values[site.siteId];
    if (value !== undefined) points.push({ lat: site.lat, lng: site.lng, value });
  });
  const grid = buildParamInterpolationGrid(points, lakePolygonRings);
  if (!grid) return;

  const { width, height, minLat, maxLat, minLng, maxLng, values } = grid;
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = width;
  rawCanvas.height = height;
  const rawCtx = rawCanvas.getContext('2d');
  if (!rawCtx) return;
  const imageData = rawCtx.createImageData(width, height);
  const data = imageData.data;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    const [r, g, b] = severityColor(severityPosition(param, v));
    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = Math.round(0.72 * 255);
  }
  rawCtx.putImageData(imageData, 0, 0);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = height;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  finalCtx.beginPath();
  for (const ring of lakePolygonRings) {
    ring.forEach(([lat, lng], i) => {
      const x = ((lng - minLng) / lngSpan) * width;
      const y = ((maxLat - lat) / latSpan) * height;
      if (i === 0) finalCtx.moveTo(x, y);
      else finalCtx.lineTo(x, y);
    });
    finalCtx.closePath();
  }
  finalCtx.clip('evenodd');
  finalCtx.filter = 'blur(3px)';
  finalCtx.drawImage(rawCanvas, 0, 0);

  overlayLayer = L.imageOverlay(
    finalCanvas.toDataURL('image/png'),
    [
      [minLat, minLng],
      [maxLat, maxLng],
    ],
    { interactive: false },
  ).addTo(map);

  if (!hasFitBounds) {
    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      { padding: [16, 16] },
    );
    hasFitBounds = true;
  }
}

onMounted(async () => {
  if (!mapContainer.value) return;
  map = L.map(mapContainer.value, {
    center: [7.893111, 124.272778],
    zoom: 11,
    scrollWheelZoom: false,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  lakePolygonRings = await loadLakePolygonRings();
  rebuildOverlay();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

watch([() => props.values, () => props.param], rebuildOverlay);
</script>

<style scoped>
.interp-map {
  width: 100%;
  height: 100%;
  min-height: 340px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
