<template>
  <div class="parallel-coords-wrap">
    <div class="parallel-coords">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" class="parallel-coords__svg">
      <!-- Axes -->
      <g v-for="(axis, ai) in axes" :key="axis.key">
        <line :x1="xFor(ai)" :x2="xFor(ai)" :y1="padTop" :y2="vbHeight - padBottom" class="parallel-coords__axis-line" />
        <text :x="xFor(ai)" :y="padTop - 8" text-anchor="middle" class="parallel-coords__axis-range">
          {{ axis.max.toFixed(axis.max >= 100 ? 0 : 1) }}
        </text>
        <text :x="xFor(ai)" :y="vbHeight - padBottom + 14" text-anchor="middle" class="parallel-coords__axis-range">
          {{ axis.min.toFixed(axis.min >= 100 ? 0 : 1) }}
        </text>
        <text
          :x="xFor(ai)"
          :y="vbHeight - padBottom + 22"
          text-anchor="end"
          class="parallel-coords__axis-label"
          :transform="`rotate(-40 ${xFor(ai)} ${vbHeight - padBottom + 22})`"
        >
          {{ axis.label }}
        </text>
      </g>

      <!-- Station lines -->
      <g
        v-for="s in seriesRender"
        :key="s.siteId"
        class="parallel-coords__series"
        :class="{
          'parallel-coords__series--dim': isDimmed(s.siteId),
          'parallel-coords__series--active': isActive(s.siteId),
        }"
        @click="emit('select-station', s.siteId)"
        @mouseenter="hovered = s.siteId"
        @mouseleave="hovered = null"
      >
        <polyline
          v-for="(seg, si) in s.segments"
          :key="'hit' + si"
          :points="seg"
          fill="none"
          stroke="transparent"
          stroke-width="12"
        />
        <polyline
          v-for="(seg, si) in s.segments"
          :key="si"
          :points="seg"
          fill="none"
          :stroke="s.color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle v-for="(p, pi) in s.points" :key="pi" :cx="p.x" :cy="p.y" r="2.5" :fill="s.color" />
        <title>{{ s.siteId }}</title>
      </g>
    </svg>

    <div v-if="highlighted" class="parallel-coords__hint">
      <span class="parallel-coords__hint-dot" :style="{ background: colorFor(highlighted) }" />
      {{ highlighted }}
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface ParallelAxis {
  key: string;
  label: string;
  min: number;
  max: number;
}

export interface ParallelSeries {
  siteId: string;
  color: string;
  /** Aligned 1:1 with `axes` — null means no reading for that parameter. */
  values: (number | null)[];
}

const props = defineProps<{
  axes: ParallelAxis[];
  seriesList: ParallelSeries[];
  selectedSiteId?: string | null;
  /** Station IDs passing every active filter rule (see the Station Comparison
   *  filter panel) — when given a non-empty array, this drives dim/active
   *  instead of hover/click, so every matching station stays lit up at once
   *  rather than only the last-hovered one. */
  matchedSiteIds?: string[] | null;
}>();

const emit = defineEmits<{ 'select-station': [siteId: string] }>();

const vbWidth = 900;
const vbHeight = 400;
const padLeft = 24;
const padRight = 24;
const padTop = 24;
// Rotated (-40deg) axis labels like "Dissolved Oxygen" or "Total Dissolved
// Solids" need real room below the axis line — 46px wasn't enough and was
// clipping the bottom of longer labels (SVG clips content outside its
// viewBox by default, unlike most HTML elements).
const padBottom = 80;

const hovered = ref<string | null>(null);
const highlighted = computed(() => hovered.value ?? props.selectedSiteId ?? null);
const hasActiveFilters = computed(() => !!props.matchedSiteIds && props.matchedSiteIds.length > 0);

function isDimmed(siteId: string): boolean {
  if (hasActiveFilters.value) return !props.matchedSiteIds!.includes(siteId);
  return highlighted.value !== null && highlighted.value !== siteId;
}
function isActive(siteId: string): boolean {
  if (hasActiveFilters.value) return props.matchedSiteIds!.includes(siteId);
  return highlighted.value === siteId;
}

function colorFor(siteId: string): string {
  return props.seriesList.find((s) => s.siteId === siteId)?.color ?? '#ffffff';
}

function xFor(axisIndex: number): number {
  const span = vbWidth - padLeft - padRight;
  return padLeft + (axisIndex / Math.max(props.axes.length - 1, 1)) * span;
}

function yForValue(axisIndex: number, value: number): number {
  const axis = props.axes[axisIndex];
  if (!axis) return padTop;
  const range = axis.max - axis.min || 1;
  const clamped = Math.min(Math.max(value, axis.min), axis.max);
  return padTop + (1 - (clamped - axis.min) / range) * (vbHeight - padTop - padBottom);
}

// Each station's line breaks into separate segments wherever it's missing a
// reading for a parameter, rather than drawing straight through that axis —
// a continuous line skipping an axis would visually imply a direct
// relationship between the two axes on either side of the gap that was
// never actually measured.
const seriesRender = computed(() =>
  props.seriesList.map((s) => {
    const segments: string[] = [];
    let current: string[] = [];
    const points: { x: number; y: number }[] = [];
    s.values.forEach((v, ai) => {
      if (v === null) {
        if (current.length > 1) segments.push(current.join(' '));
        current = [];
        return;
      }
      const x = xFor(ai);
      const y = yForValue(ai, v);
      current.push(`${x},${y}`);
      points.push({ x, y });
    });
    if (current.length > 1) segments.push(current.join(' '));
    return { siteId: s.siteId, color: s.color, segments, points };
  }),
);
</script>

<style scoped>
/* The SVG below has a fixed 900px width (its internal point/label layout
   doesn't reflow sensibly at arbitrary widths) — on a phone-width screen
   that would otherwise force the whole page to scroll horizontally. This
   wrapper contains that scroll to just the chart itself, same pattern as
   CorrelationHeatmap.vue. */
.parallel-coords-wrap {
  overflow-x: auto;
  max-width: 100%;
}

.parallel-coords {
  position: relative;
}

.parallel-coords__svg {
  width: 900px;
  height: 400px;
  display: block;
  /* Safety net on top of the padBottom fix above — SVG clips overflow by
     default, so anything that still runs past the viewBox (an unusually
     long future parameter label, etc.) stays visible instead of vanishing. */
  overflow: visible;
}

.parallel-coords__axis-line {
  stroke: rgba(255, 255, 255, 0.22);
  stroke-width: 1.5;
}

.parallel-coords__axis-range {
  fill: rgba(255, 255, 255, 0.45);
  font-size: 8px;
}

.parallel-coords__axis-label {
  fill: rgba(255, 255, 255, 0.75);
  font-size: 9px;
  font-weight: 600;
}

/* Default opacity is well below 1 on purpose — with up to ~30 overlapping
   lines, full-opacity-by-default just turns into a solid tangle that's
   impossible to individually trace. Semi-transparent lines let overlaps
   show through as visible density instead of one opaque mass, so the chart
   reads clearly without needing to hover or filter first; hovering/filtering
   still pushes the lines that matter up to full opacity + a thicker stroke
   for a clear pop against the now much-fainter rest. */
.parallel-coords__series {
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.parallel-coords__series--dim {
  opacity: 0.08;
}

.parallel-coords__series--active {
  opacity: 1;
}
.parallel-coords__series--active polyline:nth-child(2) {
  stroke-width: 3;
}

.parallel-coords__hint {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(20, 20, 20, 0.85);
  color: #fff;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.parallel-coords__hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
  display: inline-block;
}
</style>
