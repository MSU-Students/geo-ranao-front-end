<template>
  <div class="station-treemap">
    <svg :viewBox="`0 0 ${vbSize} ${vbSize}`" class="station-treemap__svg">
      <g
        v-for="rect in rects"
        :key="rect.siteId"
        class="station-treemap__cell"
        :class="{ 'station-treemap__cell--selected': rect.siteId === selectedSiteId }"
        @click="emit('select-station', rect.siteId)"
      >
        <rect
          :x="rect.x"
          :y="rect.y"
          :width="rect.w"
          :height="rect.h"
          :fill="rect.color"
          rx="3"
          class="station-treemap__rect"
        >
          <title>{{ rect.siteId }}{{ rect.valueLabel ? ' — ' + rect.valueLabel : '' }}</title>
        </rect>
        <text
          v-if="rect.w > 34 && rect.h > 20"
          :x="rect.x + rect.w / 2"
          :y="rect.y + rect.h / 2 - (rect.w > 50 && rect.h > 32 ? 6 : 0)"
          text-anchor="middle"
          class="station-treemap__label"
        >
          {{ rect.siteId }}
        </text>
        <text
          v-if="rect.valueLabel && rect.w > 50 && rect.h > 32"
          :x="rect.x + rect.w / 2"
          :y="rect.y + rect.h / 2 + 11"
          text-anchor="middle"
          class="station-treemap__value"
        >
          {{ rect.valueLabel }}
        </text>
      </g>
    </svg>
    <div v-if="rects.length === 0" class="text-center text-caption q-pa-xl station-treemap__empty">
      No readings available to size this treemap for the current selection.
    </div>
  </div>
</template>

<script setup lang="ts">
// A simple squarified treemap (Bruls/Huizing/van Wijk's greedy row algorithm)
// — box AREA encodes severity (how far into the bad end of the parameter's
// range a station's reading sits, 0 = deep in "Good", 1 = at/beyond
// "Critical"), so problem stations are both the reddest *and* the biggest,
// instead of every station getting equal screen space regardless of how
// much attention it needs. Box COLOR reuses the same statusColorBySite the
// Station Map marker uses, so a station reads the same color across every
// map type on this card.
import { computed } from 'vue';
import type { WaterQualityParam } from 'src/composables/useWaterQualityModel';
import { severityPosition } from 'src/composables/useWaterQualityInterpolation';
import { formatReading } from 'src/composables/useWaterQualityModel';

export interface TreemapSite {
  siteId: string;
  stationId: string;
}

const props = defineProps<{
  sites: TreemapSite[];
  values: Record<string, number>;
  statusColorBySite: Record<string, string>;
  param: WaterQualityParam | null;
  selectedSiteId: string | null;
}>();

const emit = defineEmits<{ 'select-station': [siteId: string] }>();

const vbSize = 480;
const GAP = 3;

interface WeightedItem {
  siteId: string;
  weight: number;
  color: string;
  valueLabel: string;
}

interface Rect extends WeightedItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

function worstRatio(row: WeightedItem[], rowSum: number, shortSide: number): number {
  const weights = row.map((r) => r.weight);
  const maxW = Math.max(...weights);
  const minW = Math.min(...weights);
  const s2 = shortSide * shortSide;
  const sum2 = rowSum * rowSum;
  return Math.max((s2 * maxW) / sum2, sum2 / (s2 * minW));
}

function layoutRow(items: WeightedItem[], x: number, y: number, w: number, h: number, out: Rect[]) {
  if (items.length === 0 || w <= 0 || h <= 0) return;
  const shortSide = Math.min(w, h);
  let row: WeightedItem[] = [];
  let rowSum = 0;
  let bestWorst = Infinity;
  let i = 0;
  while (i < items.length) {
    const candidate = [...row, items[i]!];
    const candidateSum = rowSum + items[i]!.weight;
    const worst = worstRatio(candidate, candidateSum, shortSide);
    if (worst <= bestWorst) {
      row = candidate;
      rowSum = candidateSum;
      bestWorst = worst;
      i++;
    } else {
      break;
    }
  }

  const isWide = w >= h;
  const rowThickness = rowSum / (isWide ? h : w);
  let offset = 0;
  for (const item of row) {
    const itemLength = item.weight / rowThickness;
    if (isWide) {
      out.push({ ...item, x, y: y + offset, w: rowThickness, h: itemLength });
    } else {
      out.push({ ...item, x: x + offset, y, w: itemLength, h: rowThickness });
    }
    offset += itemLength;
  }

  const remaining = items.slice(row.length);
  if (remaining.length === 0) return;
  if (isWide) {
    layoutRow(remaining, x + rowThickness, y, w - rowThickness, h, out);
  } else {
    layoutRow(remaining, x, y + rowThickness, w, h - rowThickness, out);
  }
}

const rects = computed<Rect[]>(() => {
  const param = props.param;
  const items: WeightedItem[] = [];
  props.sites.forEach((site) => {
    const value = props.values[site.siteId];
    const hasValue = value !== undefined && param !== null;
    const severity = hasValue ? severityPosition(param, value) : 0;
    items.push({
      siteId: site.siteId,
      weight: 0.12 + severity, // floor so every station stays visible even at severity 0
      color: props.statusColorBySite[site.siteId] ?? '#78909c',
      valueLabel: hasValue ? formatReading(value, param) : '',
    });
  });
  if (items.length === 0) return [];

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const scale = (vbSize * vbSize) / totalWeight;
  const sorted = [...items]
    .sort((a, b) => b.weight - a.weight)
    .map((i) => ({ ...i, weight: i.weight * scale }));

  const out: Rect[] = [];
  layoutRow(sorted, 0, 0, vbSize, vbSize, out);
  // Inset each cell by GAP so adjacent tiles read as separate boxes.
  return out.map((r) => ({
    ...r,
    x: r.x + GAP / 2,
    y: r.y + GAP / 2,
    w: Math.max(r.w - GAP, 0),
    h: Math.max(r.h - GAP, 0),
  }));
});
</script>

<style scoped>
.station-treemap {
  width: 100%;
  height: 100%;
  min-height: 340px;
  border-radius: 12px;
  overflow: hidden;
  background: #16212e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.station-treemap__svg {
  width: 100%;
  height: 100%;
  min-height: 340px;
  display: block;
}

.station-treemap__cell {
  cursor: pointer;
}

.station-treemap__rect {
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 1.5;
  transition: opacity 0.15s ease;
}

.station-treemap__cell:hover .station-treemap__rect {
  opacity: 0.85;
}

.station-treemap__cell--selected .station-treemap__rect {
  stroke: #ffffff;
  stroke-width: 3;
}

.station-treemap__label {
  fill: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  font-weight: 700;
  pointer-events: none;
}

.station-treemap__value {
  fill: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  pointer-events: none;
}

.station-treemap__empty {
  color: rgba(255, 255, 255, 0.6);
}
</style>
