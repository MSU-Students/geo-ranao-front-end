<template>
  <div class="trend-chart" @mousemove="onMouseMove" @mouseleave="hoverIndex = null">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" preserveAspectRatio="none" class="trend-chart__svg">
      <!-- Recessive gridlines -->
      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="padLeft"
        :x2="vbWidth - padRight"
        :y1="tick.y"
        :y2="tick.y"
        class="trend-chart__grid"
      />

      <!-- Line -->
      <polyline :points="linePoints" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Hover crosshair -->
      <g v-if="hoverIndex !== null">
        <line
          :x1="pointAt(hoverIndex).x"
          :x2="pointAt(hoverIndex).x"
          :y1="padTop"
          :y2="vbHeight - padBottom"
          class="trend-chart__crosshair"
        />
        <circle :cx="pointAt(hoverIndex).x" :cy="pointAt(hoverIndex).y" r="4" :fill="color" stroke="#ffffff" stroke-width="1.5" />
      </g>

      <!-- Invisible hit area -->
      <rect
        :x="padLeft"
        :y="padTop"
        :width="vbWidth - padLeft - padRight"
        :height="vbHeight - padTop - padBottom"
        fill="transparent"
      />
    </svg>

    <!-- X-axis month labels (every other month to avoid crowding) -->
    <div class="trend-chart__x-labels">
      <span
        v-for="(m, i) in months"
        :key="m"
        class="trend-chart__x-label"
        :class="{ 'trend-chart__x-label--hidden': i % 2 !== 0 && i !== months.length - 1 }"
      >
        {{ m.split(' ')[0] }}
      </span>
    </div>

    <!-- Hover tooltip -->
    <div
      v-if="hoverIndex !== null"
      class="trend-chart__tooltip"
      :style="{ left: `${(pointAt(hoverIndex).x / vbWidth) * 100}%` }"
    >
      <div class="trend-chart__tooltip-month">{{ months[hoverIndex] }}</div>
      <div class="trend-chart__tooltip-value">{{ values[hoverIndex]!.toFixed(decimals) }}{{ unit ? ' ' + unit : '' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    months: string[];
    values: number[];
    unit?: string;
    color?: string;
    decimals?: number;
  }>(),
  {
    unit: '',
    color: '#00897b',
    decimals: 1,
  },
);

const vbWidth = 600;
const vbHeight = 220;
const padLeft = 40;
const padRight = 12;
const padTop = 12;
const padBottom = 8;

const hoverIndex = ref<number | null>(null);

const valueRange = computed(() => {
  const min = Math.min(...props.values);
  const max = Math.max(...props.values);
  const span = max - min || 1;
  return { min: min - span * 0.15, max: max + span * 0.15 };
});

const yTicks = computed(() => {
  const { min, max } = valueRange.value;
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / steps;
    const y = padTop + (1 - i / steps) * (vbHeight - padTop - padBottom);
    return { value, y };
  });
});

function pointAt(i: number) {
  const { min, max } = valueRange.value;
  const range = max - min || 1;
  const plotWidth = vbWidth - padLeft - padRight;
  const x = padLeft + (i / Math.max(props.values.length - 1, 1)) * plotWidth;
  const value = props.values[i] ?? min;
  const y = padTop + (1 - (value - min) / range) * (vbHeight - padTop - padBottom);
  return { x, y };
}

const linePoints = computed(() =>
  props.values.map((_, i) => `${pointAt(i).x},${pointAt(i).y}`).join(' '),
);

function onMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const relX = ((e.clientX - rect.left) / rect.width) * vbWidth;
  const plotWidth = vbWidth - padLeft - padRight;
  const ratio = Math.min(Math.max((relX - padLeft) / plotWidth, 0), 1);
  const index = Math.round(ratio * (props.values.length - 1));
  hoverIndex.value = Math.min(Math.max(index, 0), props.values.length - 1);
}
</script>

<style scoped>
.trend-chart {
  position: relative;
}

.trend-chart__svg {
  width: 100%;
  height: 220px;
  display: block;
}

.trend-chart__grid {
  stroke: #e1e0d9;
  stroke-width: 1;
}

.trend-chart__crosshair {
  stroke: #c3c2b7;
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.trend-chart__x-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 2px;
}

.trend-chart__x-label {
  font-size: 0.65rem;
  color: #898781;
  flex: 1;
  text-align: center;
}

.trend-chart__x-label--hidden {
  visibility: hidden;
}

.trend-chart__tooltip {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.92);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.trend-chart__tooltip-month {
  color: #c3c2b7;
  font-size: 0.65rem;
}

.trend-chart__tooltip-value {
  font-weight: 700;
}
</style>
