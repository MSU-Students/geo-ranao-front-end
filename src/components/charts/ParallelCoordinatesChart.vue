<template>
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
          'parallel-coords__series--dim': highlighted && highlighted !== s.siteId,
          'parallel-coords__series--active': highlighted === s.siteId,
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
          stroke-width="1.75"
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
}>();

const emit = defineEmits<{ 'select-station': [siteId: string] }>();

const vbWidth = 900;
const vbHeight = 340;
const padLeft = 24;
const padRight = 24;
const padTop = 24;
const padBottom = 46;

const hovered = ref<string | null>(null);
const highlighted = computed(() => hovered.value ?? props.selectedSiteId ?? null);

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
.parallel-coords {
  position: relative;
}

.parallel-coords__svg {
  width: 900px;
  height: 340px;
  display: block;
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

.parallel-coords__series {
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.parallel-coords__series--dim {
  opacity: 0.12;
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
