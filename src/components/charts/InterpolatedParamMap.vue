<template>
  <div class="interp-map-wrap relative-position">
    <div ref="mapContainer" class="interp-map" />
    <q-inner-loading :showing="loading" color="teal-6">
      <q-spinner-tail color="teal-6" size="42px" />
      <div class="interp-map-loading__label">Rendering interpolation…</div>
    </q-inner-loading>
  </div>
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

// The IDW interpolation + canvas rasterization below is synchronous and can
// take a noticeable moment — long enough that viewers need to see it's
// working, not just frozen. Setting `loading` isn't enough by itself: a
// synchronous block right after it would run before the browser ever gets a
// chance to paint the spinner. Yielding across two animation frames first
// gives Vue a chance to flush that DOM update and the browser to actually
// paint it before the heavy work blocks the main thread.
const loading = ref(false);
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function rebuildOverlay() {
  if (!map) return;
  if (overlayLayer) {
    map.removeLayer(overlayLayer);
    overlayLayer = null;
  }
  const param = props.param;
  if (!param || lakePolygonRings.length === 0) return;

  loading.value = true;
  await nextPaint();

  const points: ValuePoint[] = [];
  props.sites.forEach((site) => {
    const value = props.values[site.siteId];
    if (value !== undefined) points.push({ lat: site.lat, lng: site.lng, value });
  });
  const grid = buildParamInterpolationGrid(points, lakePolygonRings);
  if (!grid) {
    loading.value = false;
    return;
  }

  try {
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
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!mapContainer.value) return;
  map = L.map(mapContainer.value, {
    center: [7.893111, 124.272778],
    zoom: 11,
    scrollWheelZoom: false,
    // Leaflet adds its own top-left zoom control by default — without this,
    // that one and the explicit bottomright one below both show at once.
    zoomControl: false,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  lakePolygonRings = await loadLakePolygonRings();
  void rebuildOverlay();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

watch([() => props.values, () => props.param], () => void rebuildOverlay());
</script>

<style scoped>
.interp-map-wrap {
  width: 100%;
  height: 100%;
}
.interp-map {
  width: 100%;
  height: 100%;
  min-height: 340px;
  border-radius: 12px;
  overflow: hidden;
}
.interp-map-loading__label {
  margin-top: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #00695c;
  text-align: center;
}
</style>
