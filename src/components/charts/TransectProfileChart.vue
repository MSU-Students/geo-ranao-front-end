<template>
  <div class="transect-chart">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" class="transect-chart__svg">
      <!-- Zone background bands — Lake Lanao has no single inflow->outflow
           flow path (6 tributaries around its perimeter, one outlet), so
           "distance along the transect" is this categorical zone gradient
           rather than a fabricated continuous distance. -->
      <g v-for="band in zoneBands" :key="band.zone">
        <rect
          :x="band.x0"
          :y="padTop"
          :width="band.x1 - band.x0"
          :height="vbHeight - padTop - padBottom"
          :fill="ZONE_COLORS[band.zone]"
          opacity="0.1"
        />
        <text
          :x="(band.x0 + band.x1) / 2"
          :y="padTop - 6"
          text-anchor="middle"
          class="transect-chart__zone-label"
          :fill="ZONE_COLORS[band.zone]"
        >
          {{ band.zone }}
        </text>
      </g>

      <!-- Y-axis gridlines + labels -->
      <g v-for="tick in yTicks" :key="tick.value">
        <line :x1="padLeft" :x2="vbWidth - padRight" :y1="tick.y" :y2="tick.y" class="transect-chart__grid" />
        <text :x="padLeft - 6" :y="tick.y + 3" text-anchor="end" class="transect-chart__axis-label">
          {{ tick.value.toFixed(decimals) }}
        </text>
      </g>

      <!-- Value line — breaks at any station with no reading, no interpolation. -->
      <polyline
        v-for="(seg, si) in segments"
        :key="si"
        :points="seg"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        stroke-width="1.5"
      />
      <g v-for="(p, pi) in points" :key="pi">
        <circle :cx="p.x" :cy="p.y" r="3.5" :fill="ZONE_COLORS[p.zone]" stroke="#fff" stroke-width="1" />
        <title>{{ p.siteId }} ({{ p.zone }}): {{ p.value.toFixed(decimals) }}{{ unit }}</title>
      </g>

      <!-- X-axis station labels, thinned so they don't overlap. -->
      <text
        v-for="i in tickIndices"
        :key="'x' + i"
        :x="xFor(i)"
        :y="vbHeight - padBottom + 14"
        text-anchor="end"
        class="transect-chart__axis-label"
        :transform="`rotate(-60 ${xFor(i)} ${vbHeight - padBottom + 14})`"
      >
        {{ stations[i]!.siteId }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type TransectZone = 'Tributary' | 'Nearshore' | 'Offshore';

export interface TransectStation {
  siteId: string;
  zone: TransectZone;
  value: number | null;
}

const props = withDefaults(
  defineProps<{
    stations: TransectStation[];
    unit?: string;
    decimals?: number;
  }>(),
  { unit: '', decimals: 1 },
);

const ZONE_COLORS: Record<TransectZone, string> = {
  Tributary: '#26a69a',
  Nearshore: '#42a5f5',
  Offshore: '#7e57c2',
};

const vbWidth = 900;
const vbHeight = 320;
const padLeft = 44;
const padRight = 16;
const padTop = 24;
const padBottom = 90;

function xFor(i: number): number {
  const span = vbWidth - padLeft - padRight;
  return padLeft + (i / Math.max(props.stations.length - 1, 1)) * span;
}

const valueRange = computed(() => {
  const values = props.stations.map((s) => s.value).filter((v): v is number => v !== null);
  if (values.length === 0) return { min: 0, max: 1 };
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const span = dataMax - dataMin || 1;
  return { min: dataMin - span * 0.1, max: dataMax + span * 0.1 };
});

function yFor(value: number): number {
  const { min, max } = valueRange.value;
  const range = max - min || 1;
  return padTop + (1 - (value - min) / range) * (vbHeight - padTop - padBottom);
}

const yTicks = computed(() => {
  const { min, max } = valueRange.value;
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / steps;
    return { value, y: yFor(value) };
  });
});

// Contiguous runs of the same zone (stations arrive pre-sorted by zone) —
// each run becomes one background band spanning its stations' x-range.
const zoneBands = computed(() => {
  const bands: { zone: TransectZone; x0: number; x1: number }[] = [];
  props.stations.forEach((s, i) => {
    const last = bands[bands.length - 1];
    const halfStep = (xFor(1) - xFor(0)) / 2 || 20;
    if (last && last.zone === s.zone) {
      last.x1 = xFor(i) + halfStep;
    } else {
      bands.push({ zone: s.zone, x0: xFor(i) - halfStep, x1: xFor(i) + halfStep });
    }
  });
  return bands;
});

const points = computed(() =>
  props.stations
    .map((s, i) => (s.value !== null ? { x: xFor(i), y: yFor(s.value), zone: s.zone, siteId: s.siteId, value: s.value } : null))
    .filter((p): p is { x: number; y: number; zone: TransectZone; siteId: string; value: number } => p !== null),
);

// Each run of consecutive non-null stations becomes its own polyline —
// a straight line across a gap would imply a measured trend between two
// stations that were never actually connected by a reading.
const segments = computed(() => {
  const segs: string[] = [];
  let current: string[] = [];
  props.stations.forEach((s, i) => {
    if (s.value === null) {
      if (current.length > 1) segs.push(current.join(' '));
      current = [];
      return;
    }
    current.push(`${xFor(i)},${yFor(s.value)}`);
  });
  if (current.length > 1) segs.push(current.join(' '));
  return segs;
});

// Thin station labels to a manageable count on the x-axis — up to ~30
// stations rotated -60deg still overlap if every single one is labeled.
const tickIndices = computed(() => {
  const length = props.stations.length;
  const maxTicks = 16;
  if (length <= maxTicks) return Array.from({ length }, (_, i) => i);
  const picked = new Set<number>();
  for (let i = 0; i < maxTicks; i++) {
    picked.add(Math.round((i * (length - 1)) / (maxTicks - 1)));
  }
  return [...picked].sort((a, b) => a - b);
});
</script>

<style scoped>
.transect-chart {
  position: relative;
}

.transect-chart__svg {
  width: 100%;
  height: 320px;
  display: block;
  overflow: visible;
}

.transect-chart__grid {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}

.transect-chart__axis-label {
  fill: rgba(255, 255, 255, 0.6);
  font-size: 9px;
}

.transect-chart__zone-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
