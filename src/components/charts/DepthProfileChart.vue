<template>
  <div class="depth-chart" @mousemove="onMouseMove" @mouseleave="hoverIndex = null">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" preserveAspectRatio="none" class="depth-chart__svg">
      <!-- Recessive gridlines -->
      <line
        v-for="tick in xTicks"
        :key="'gx' + tick.value"
        :x1="tick.x"
        :x2="tick.x"
        :y1="padTop"
        :y2="vbHeight - padBottom"
        class="depth-chart__grid"
      />
      <line
        v-for="tick in yTicks"
        :key="'gy' + tick.depth"
        :x1="padLeft"
        :x2="vbWidth - padRight"
        :y1="tick.y"
        :y2="tick.y"
        class="depth-chart__grid"
      />

      <!-- Value-axis labels (top) -->
      <text
        v-for="tick in xTicks"
        :key="'xl' + tick.value"
        :x="tick.x"
        :y="padTop - 8"
        class="depth-chart__axis-label"
        text-anchor="middle"
      >
        {{ tick.value.toFixed(decimals) }}
      </text>

      <!-- Depth-axis labels (left) -->
      <text
        v-for="tick in yTicks"
        :key="'yl' + tick.depth"
        :x="padLeft - 6"
        :y="tick.y + 3"
        class="depth-chart__axis-label"
        text-anchor="end"
      >
        {{ tick.depth }}m
      </text>

      <!-- Guideline reference line -->
      <line
        v-if="guidelineValue !== undefined"
        :x1="xFor(guidelineValue)"
        :x2="xFor(guidelineValue)"
        :y1="padTop"
        :y2="vbHeight - padBottom"
        class="depth-chart__guideline"
      />

      <!-- Profile line -->
      <polyline :points="linePoints" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle v-for="p in points" :key="p.depth" :cx="xFor(p.value)" :cy="yFor(p.depth)" r="3" :fill="color" stroke="#0a1929" stroke-width="1" />

      <!-- Hover crosshair -->
      <g v-if="hoverIndex !== null">
        <line
          :x1="padLeft"
          :x2="vbWidth - padRight"
          :y1="yFor(points[hoverIndex]!.depth)"
          :y2="yFor(points[hoverIndex]!.depth)"
          class="depth-chart__crosshair"
        />
        <circle :cx="xFor(points[hoverIndex]!.value)" :cy="yFor(points[hoverIndex]!.depth)" r="5" :fill="color" stroke="#ffffff" stroke-width="1.5" />
      </g>

      <!-- Invisible hit area -->
      <rect :x="padLeft" :y="padTop" :width="vbWidth - padLeft - padRight" :height="vbHeight - padTop - padBottom" fill="transparent" />
    </svg>

    <!-- Hover tooltip -->
    <div
      v-if="hoverIndex !== null"
      class="depth-chart__tooltip"
      :style="{ left: `${(xFor(points[hoverIndex]!.value) / vbWidth) * 100}%`, top: `${(yFor(points[hoverIndex]!.depth) / vbHeight) * 100}%` }"
    >
      <div class="depth-chart__tooltip-depth">{{ points[hoverIndex]!.depth }} m</div>
      <div class="depth-chart__tooltip-value">{{ points[hoverIndex]!.value.toFixed(decimals) }}{{ unit ? ' ' + unit : '' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface DepthChartPoint {
  depth: number;
  value: number;
}

const props = withDefaults(
  defineProps<{
    points: DepthChartPoint[];
    unit?: string;
    color?: string;
    decimals?: number;
    guidelineValue?: number | undefined;
  }>(),
  {
    unit: '',
    color: '#4dd0e1',
    decimals: 1,
  },
);

const vbWidth = 260;
const vbHeight = 280;
const padLeft = 34;
const padRight = 10;
const padTop = 22;
const padBottom = 10;

const hoverIndex = ref<number | null>(null);

const valueRange = computed(() => {
  const values = props.points.map((p) => p.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const min = props.guidelineValue !== undefined ? Math.min(dataMin, props.guidelineValue) : dataMin;
  const max = props.guidelineValue !== undefined ? Math.max(dataMax, props.guidelineValue) : dataMax;
  const span = max - min || 1;
  return { min: min - span * 0.12, max: max + span * 0.12 };
});

const depthRange = computed(() => {
  const depths = props.points.map((p) => p.depth);
  return { min: 0, max: Math.max(...depths, 1) };
});

function xFor(value: number): number {
  const { min, max } = valueRange.value;
  const range = max - min || 1;
  return padLeft + ((value - min) / range) * (vbWidth - padLeft - padRight);
}

function yFor(depth: number): number {
  const { min, max } = depthRange.value;
  const range = max - min || 1;
  return padTop + ((depth - min) / range) * (vbHeight - padTop - padBottom);
}

const xTicks = computed(() => {
  const { min, max } = valueRange.value;
  const steps = 3;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / steps;
    return { value, x: xFor(value) };
  });
});

const yTicks = computed(() => props.points.map((p) => ({ depth: p.depth, y: yFor(p.depth) })));

const linePoints = computed(() =>
  props.points.map((p) => `${xFor(p.value)},${yFor(p.depth)}`).join(' '),
);

function onMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const relY = ((e.clientY - rect.top) / rect.height) * vbHeight;
  let closest = 0;
  let closestDist = Infinity;
  props.points.forEach((p, i) => {
    const dist = Math.abs(yFor(p.depth) - relY);
    if (dist < closestDist) {
      closestDist = dist;
      closest = i;
    }
  });
  hoverIndex.value = closest;
}
</script>

<style scoped>
.depth-chart {
  position: relative;
}

.depth-chart__svg {
  width: 100%;
  height: 280px;
  display: block;
}

.depth-chart__grid {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}

.depth-chart__axis-label {
  fill: rgba(255, 255, 255, 0.55);
  font-size: 8px;
}

.depth-chart__guideline {
  stroke: #fab219;
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
  opacity: 0.8;
}

.depth-chart__crosshair {
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.depth-chart__tooltip {
  position: absolute;
  transform: translate(-50%, -130%);
  background: rgba(20, 20, 20, 0.92);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.depth-chart__tooltip-depth {
  color: #c3c2b7;
  font-size: 0.65rem;
}

.depth-chart__tooltip-value {
  font-weight: 700;
}
</style>
