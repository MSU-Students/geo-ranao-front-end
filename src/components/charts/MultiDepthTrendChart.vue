<template>
  <div class="multi-trend-chart">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" preserveAspectRatio="none" class="multi-trend-chart__svg">
      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="padLeft"
        :x2="vbWidth - padRight"
        :y1="tick.y"
        :y2="tick.y"
        class="multi-trend-chart__grid"
      />
      <text
        v-for="tick in yTicks"
        :key="'yl' + tick.value"
        :x="padLeft - 6"
        :y="tick.y + 3"
        class="multi-trend-chart__axis-label"
        text-anchor="end"
      >
        {{ tick.value.toFixed(decimals) }}
      </text>

      <g v-for="s in seriesRender" :key="s.depth">
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
      </g>
    </svg>

    <div class="multi-trend-chart__x-labels">
      <span
        v-for="(m, i) in months"
        :key="m"
        class="multi-trend-chart__x-label"
        :class="{ 'multi-trend-chart__x-label--hidden': i % 2 !== 0 && i !== months.length - 1 }"
      >
        {{ m.split(' ')[0] }}
      </span>
    </div>

    <div class="multi-trend-chart__legend">
      <div v-for="s in series" :key="s.depth" class="multi-trend-chart__legend-item">
        <span class="multi-trend-chart__legend-dot" :style="{ background: s.color }" />
        {{ s.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface DepthSeries {
  depth: number;
  label: string;
  color: string;
  /** Aligned 1:1 with `months` — null means no reading that month, not zero. */
  values: (number | null)[];
}

const props = withDefaults(
  defineProps<{
    months: string[];
    series: DepthSeries[];
    decimals?: number;
  }>(),
  { decimals: 1 },
);

const vbWidth = 600;
const vbHeight = 240;
const padLeft = 40;
const padRight = 12;
const padTop = 12;
const padBottom = 8;

const valueRange = computed(() => {
  const allValues = props.series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  if (allValues.length === 0) return { min: 0, max: 1 };
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const span = dataMax - dataMin || 1;
  return { min: dataMin - span * 0.15, max: dataMax + span * 0.15 };
});

function xFor(i: number): number {
  const plotWidth = vbWidth - padLeft - padRight;
  return padLeft + (i / Math.max(props.months.length - 1, 1)) * plotWidth;
}
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

// Each series breaks into separate polyline segments at a null gap rather
// than interpolating straight across a month nobody sampled at that depth —
// a continuous line through a gap would silently invent a trend that was
// never actually observed.
const seriesRender = computed(() =>
  props.series.map((s) => {
    const segments: string[] = [];
    let current: string[] = [];
    const points: { x: number; y: number }[] = [];
    s.values.forEach((v, i) => {
      if (v === null) {
        if (current.length > 1) segments.push(current.join(' '));
        current = [];
        return;
      }
      const x = xFor(i);
      const y = yFor(v);
      current.push(`${x},${y}`);
      points.push({ x, y });
    });
    if (current.length > 1) segments.push(current.join(' '));
    return { depth: s.depth, color: s.color, segments, points };
  }),
);
</script>

<style scoped>
.multi-trend-chart {
  position: relative;
}

.multi-trend-chart__svg {
  width: 100%;
  height: 240px;
  display: block;
}

.multi-trend-chart__grid {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.multi-trend-chart__axis-label {
  fill: rgba(255, 255, 255, 0.75);
  font-size: 8px;
}

.multi-trend-chart__x-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 2px;
}

.multi-trend-chart__x-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
  text-align: center;
}

.multi-trend-chart__x-label--hidden {
  visibility: hidden;
}

.multi-trend-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  justify-content: center;
}

.multi-trend-chart__legend-item {
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

.multi-trend-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  display: inline-block;
}
</style>
