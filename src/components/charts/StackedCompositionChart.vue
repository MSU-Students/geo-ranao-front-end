<template>
  <div class="composition-chart">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" preserveAspectRatio="none" class="composition-chart__svg">
      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="padLeft"
        :x2="vbWidth - padRight"
        :y1="tick.y"
        :y2="tick.y"
        class="composition-chart__grid"
      />
      <text
        v-for="tick in yTicks"
        :key="'yl' + tick.value"
        :x="padLeft - 6"
        :y="tick.y + 3"
        class="composition-chart__axis-label"
        text-anchor="end"
      >
        {{ formatTick(tick.value) }}
      </text>

      <g v-for="bar in bars" :key="bar.month">
        <rect
          v-for="seg in bar.segments"
          :key="seg.key"
          :x="bar.x"
          :y="seg.y"
          :width="barWidth"
          :height="seg.h"
          :fill="seg.color"
          class="composition-chart__segment"
          :class="{ 'composition-chart__segment--dim': hover && (hover.month !== bar.month || hover.key !== seg.key) }"
          @mouseenter="hover = { month: bar.month, key: seg.key, label: seg.label, value: seg.value, x: bar.x + barWidth / 2, y: seg.y }"
          @mouseleave="hover = null"
        />
      </g>
    </svg>

    <div class="composition-chart__x-labels">
      <span
        v-for="(m, i) in months"
        :key="m"
        class="composition-chart__x-label"
        :class="{ 'composition-chart__x-label--hidden': i % 2 !== 0 && i !== months.length - 1 }"
      >
        {{ m.split(' ')[0] }}
      </span>
    </div>

    <div v-if="hover" class="composition-chart__tooltip" :style="{ left: `${(hover.x / vbWidth) * 100}%` }">
      <div class="composition-chart__tooltip-row"><span>{{ stackByLabel }}:</span> <strong>{{ hover.label }}</strong></div>
      <div class="composition-chart__tooltip-row"><span>Month:</span> <strong>{{ hover.month }}</strong></div>
      <div class="composition-chart__tooltip-row"><span>Readings:</span> <strong>{{ hover.value }}</strong></div>
    </div>

    <div class="composition-chart__legend">
      <div v-for="seg in segments" :key="seg.key" class="composition-chart__legend-item">
        <span class="composition-chart__legend-dot" :style="{ background: seg.color }" />
        {{ seg.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface CompositionSegment {
  key: string;
  label: string;
  color: string;
  /** Aligned 1:1 with `months`. */
  values: number[];
}

const props = withDefaults(
  defineProps<{
    months: string[];
    segments: CompositionSegment[];
    /** Shown in the hover tooltip's first row label, e.g. "Status", "Station", "Parameter". */
    stackByLabel?: string;
  }>(),
  { stackByLabel: 'Category' },
);

const vbWidth = 600;
const vbHeight = 260;
const padLeft = 40;
const padRight = 12;
const padTop = 12;
const padBottom = 8;

const hover = ref<{ month: string; key: string; label: string; value: number; x: number; y: number } | null>(null);

const plotWidth = computed(() => vbWidth - padLeft - padRight);
const plotHeight = computed(() => vbHeight - padTop - padBottom);
const slotWidth = computed(() => plotWidth.value / Math.max(props.months.length, 1));
const barWidth = computed(() => slotWidth.value * 0.62);

const totals = computed(() =>
  props.months.map((_, mi) => props.segments.reduce((sum, seg) => sum + (seg.values[mi] ?? 0), 0)),
);

const yMax = computed(() => Math.max(...totals.value, 1) * 1.08);

const yTicks = computed(() => {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = (yMax.value * i) / steps;
    const y = padTop + (1 - i / steps) * plotHeight.value;
    return { value, y };
  });
});

function formatTick(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`;
  return String(Math.round(v));
}

const bars = computed(() =>
  props.months.map((month, mi) => {
    const x = padLeft + mi * slotWidth.value + (slotWidth.value - barWidth.value) / 2;
    let cumulative = 0;
    const segs = props.segments.map((seg) => {
      const value = seg.values[mi] ?? 0;
      cumulative += value;
      const h = (value / yMax.value) * plotHeight.value;
      const y = padTop + plotHeight.value - (cumulative / yMax.value) * plotHeight.value;
      return { key: seg.key, label: seg.label, color: seg.color, value, y, h };
    });
    return { month, x, segments: segs };
  }),
);
</script>

<style scoped>
.composition-chart {
  position: relative;
}

.composition-chart__svg {
  width: 100%;
  height: 260px;
  display: block;
}

.composition-chart__grid {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.composition-chart__axis-label {
  fill: rgba(255, 255, 255, 0.75);
  font-size: 8px;
}

.composition-chart__segment {
  cursor: pointer;
  transition: opacity 0.12s ease;
}

.composition-chart__segment--dim {
  opacity: 0.35;
}

.composition-chart__x-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 2px;
}

.composition-chart__x-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
  text-align: center;
}

.composition-chart__x-label--hidden {
  visibility: hidden;
}

.composition-chart__tooltip {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.92);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: 2;
}

.composition-chart__tooltip-row {
  display: flex;
  gap: 6px;
}

.composition-chart__tooltip-row span {
  color: rgba(255, 255, 255, 0.75);
}

.composition-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  justify-content: center;
  max-height: 72px;
  overflow-y: auto;
}

.composition-chart__legend-item {
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

.composition-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  display: inline-block;
  flex-shrink: 0;
}
</style>
