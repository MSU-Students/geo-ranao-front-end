<template>
  <div class="fish-year-chart" :class="{ 'fish-year-chart--dark': dark, 'fish-year-chart--light': !dark }">
    <div v-if="years.length === 0" class="text-center q-pa-md text-caption text-grey-5">
      No recorded observations available for this selection.
    </div>
    <div v-else class="fish-year-chart__container">
      <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" preserveAspectRatio="none" class="fish-year-chart__svg">
        <!-- Recessive horizontal gridlines -->
        <line
          v-for="tick in yTicks"
          :key="tick.value"
          :x1="padLeft"
          :x2="vbWidth - padRight"
          :y1="tick.y"
          :y2="tick.y"
          class="fish-year-chart__grid"
        />
        <!-- Y-axis labels -->
        <text
          v-for="tick in yTicks"
          :key="'yl' + tick.value"
          :x="padLeft - 6"
          :y="tick.y + 3"
          class="fish-year-chart__axis-label"
          text-anchor="end"
        >
          {{ formatTick(tick.value) }}
        </text>

        <!-- Bars -->
        <g v-for="bar in bars" :key="bar.year" class="fish-year-chart__bar-group" @click="emit('select-year', bar.year)">
          <!-- Selected Year Highlight Backdrop -->
          <rect
            v-if="selectedYear === bar.year"
            :x="bar.x - 4"
            :y="padTop"
            :width="barWidth + 8"
            :height="plotHeight"
            class="fish-year-chart__selection-backdrop"
            rx="4"
          />

          <!-- Stacked segments -->
          <rect
            v-for="seg in bar.segments"
            :key="seg.category"
            :x="bar.x"
            :y="seg.y"
            :width="barWidth"
            :height="seg.h"
            :fill="seg.color"
            class="fish-year-chart__segment"
            :class="{
              'fish-year-chart__segment--dim': hover && hover.year !== bar.year,
              'fish-year-chart__segment--active': selectedYear === bar.year,
            }"
            @mouseenter="
              hover = {
                year: bar.year,
                total: bar.total,
                endemic: bar.endemic,
                invasive: bar.invasive,
                general: bar.general,
                x: bar.x + barWidth / 2,
              }
            "
            @mouseleave="hover = null"
          />

          <!-- Top value label above bar -->
          <text
            v-if="bar.total > 0"
            :x="bar.x + barWidth / 2"
            :y="bar.topY - 4"
            class="fish-year-chart__bar-total"
            text-anchor="middle"
          >
            {{ bar.total }}
          </text>
        </g>
      </svg>

      <!-- X-axis Year Labels -->
      <div class="fish-year-chart__x-labels">
        <button
          v-for="y in years"
          :key="y"
          type="button"
          class="fish-year-chart__x-label"
          :class="{ 'fish-year-chart__x-label--selected': selectedYear === y }"
          @click="emit('select-year', y)"
        >
          {{ y }}
        </button>
      </div>

      <!-- Hover Tooltip -->
      <div
        v-if="hover"
        class="fish-year-chart__tooltip"
        :style="{ left: `${(hover.x / vbWidth) * 100}%` }"
      >
        <div class="fish-year-chart__tooltip-title">
          Year {{ hover.year }}
          <span v-if="selectedYear === hover.year" class="text-amber-4 text-weight-bold"> (Selected)</span>
        </div>
        <div class="fish-year-chart__tooltip-row">
          <span>Recorded observations:</span>
          <strong>{{ hover.total }}</strong>
        </div>
        <div class="fish-year-chart__tooltip-divider" />
        <div class="fish-year-chart__tooltip-row">
          <span class="fish-year-chart__legend-dot" style="background: #1565c0" />
          <span>Endemic:</span>
          <strong>{{ hover.endemic }}</strong>
        </div>
        <div class="fish-year-chart__tooltip-row">
          <span class="fish-year-chart__legend-dot" style="background: #d32f2f" />
          <span>Invasive:</span>
          <strong>{{ hover.invasive }}</strong>
        </div>
        <div class="fish-year-chart__tooltip-row">
          <span class="fish-year-chart__legend-dot" style="background: #f57c00" />
          <span>General catch:</span>
          <strong>{{ hover.general }}</strong>
        </div>
      </div>

      <!-- Legend -->
      <div class="fish-year-chart__legend">
        <div class="fish-year-chart__legend-item">
          <span class="fish-year-chart__legend-dot" style="background: #1565c0" />
          <span>Endemic ({{ categoryTotals.endemic }})</span>
        </div>
        <div class="fish-year-chart__legend-item">
          <span class="fish-year-chart__legend-dot" style="background: #d32f2f" />
          <span>Invasive ({{ categoryTotals.invasive }})</span>
        </div>
        <div class="fish-year-chart__legend-item">
          <span class="fish-year-chart__legend-dot" style="background: #f57c00" />
          <span>General ({{ categoryTotals.general }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { YearAggregation } from 'src/composables/useFishTimeSeries';

const props = withDefaults(
  defineProps<{
    years: number[];
    yearly: Record<number, YearAggregation>;
    selectedYear?: number | null;
    metric?: 'records' | 'individuals';
    dark?: boolean;
    height?: number;
  }>(),
  {
    selectedYear: null,
    metric: 'records',
    dark: true,
    height: 220,
  },
);

const emit = defineEmits<{
  'select-year': [year: number];
}>();

const vbWidth = 600;
const vbHeight = 220;
const padLeft = 38;
const padRight = 16;
const padTop = 18;
const padBottom = 10;

const hover = ref<{
  year: number;
  total: number;
  endemic: number;
  invasive: number;
  general: number;
  x: number;
} | null>(null);

const plotWidth = computed(() => vbWidth - padLeft - padRight);
const plotHeight = computed(() => vbHeight - padTop - padBottom);
const slotWidth = computed(() => plotWidth.value / Math.max(props.years.length, 1));
const barWidth = computed(() => Math.min(Math.max(slotWidth.value * 0.52, 14), 48));

// Extract totals per bar
const barTotals = computed(() =>
  props.years.map((y) => {
    const data = props.yearly[y];
    if (!data) return { year: y, total: 0, endemic: 0, invasive: 0, general: 0 };
    const m = props.metric;
    const endemic = data.byCategory.ENDEMIC[m];
    const invasive = data.byCategory.INVASIVE[m];
    const general = data.byCategory.GENERAL[m];
    const total = endemic + invasive + general;
    return { year: y, total, endemic, invasive, general };
  }),
);

const yMax = computed(() => {
  const maxVal = Math.max(...barTotals.value.map((b) => b.total), 1);
  return Math.ceil(maxVal * 1.15);
});

const yTicks = computed(() => {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = Math.round((yMax.value * i) / steps);
    const y = padTop + (1 - i / steps) * plotHeight.value;
    return { value, y };
  });
});

function formatTick(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

const bars = computed(() =>
  barTotals.value.map((b, idx) => {
    const x = padLeft + idx * slotWidth.value + (slotWidth.value - barWidth.value) / 2;
    const max = yMax.value || 1;

    // Segment heights
    const hEndemic = (b.endemic / max) * plotHeight.value;
    const hInvasive = (b.invasive / max) * plotHeight.value;
    const hGeneral = (b.general / max) * plotHeight.value;

    const yBase = padTop + plotHeight.value;
    const yEndemic = yBase - hEndemic;
    const yInvasive = yEndemic - hInvasive;
    const yGeneral = yInvasive - hGeneral;

    const segments = [
      { category: 'ENDEMIC', color: '#1565C0', y: yEndemic, h: hEndemic, value: b.endemic },
      { category: 'INVASIVE', color: '#D32F2F', y: yInvasive, h: hInvasive, value: b.invasive },
      { category: 'GENERAL', color: '#F57C00', y: yGeneral, h: hGeneral, value: b.general },
    ].filter((s) => s.h > 0);

    const topY = b.total > 0 ? yGeneral : yBase;

    return {
      year: b.year,
      x,
      topY,
      total: b.total,
      endemic: b.endemic,
      invasive: b.invasive,
      general: b.general,
      segments,
    };
  }),
);

const categoryTotals = computed(() => {
  let endemic = 0;
  let invasive = 0;
  let general = 0;
  for (const b of barTotals.value) {
    endemic += b.endemic;
    invasive += b.invasive;
    general += b.general;
  }
  return { endemic, invasive, general };
});
</script>

<style scoped>
.fish-year-chart {
  position: relative;
  width: 100%;
}

.fish-year-chart__svg {
  width: 100%;
  height: 220px;
  display: block;
}

.fish-year-chart--dark .fish-year-chart__grid {
  stroke: rgba(255, 255, 255, 0.16);
  stroke-width: 1;
}

.fish-year-chart--light .fish-year-chart__grid {
  stroke: rgba(0, 0, 0, 0.1);
  stroke-width: 1;
}

.fish-year-chart--dark .fish-year-chart__axis-label {
  fill: rgba(255, 255, 255, 0.75);
  font-size: 8px;
}

.fish-year-chart--light .fish-year-chart__axis-label {
  fill: rgba(0, 0, 0, 0.65);
  font-size: 8px;
}

.fish-year-chart__bar-group {
  cursor: pointer;
}

.fish-year-chart__selection-backdrop {
  fill: rgba(255, 215, 0, 0.18);
  stroke: rgba(255, 215, 0, 0.8);
  stroke-width: 1.5;
  stroke-dasharray: 3 3;
}

.fish-year-chart__segment {
  transition: opacity 0.15s ease;
  rx: 1;
}

.fish-year-chart__segment--dim {
  opacity: 0.35;
}

.fish-year-chart__segment--active {
  stroke: #fff;
  stroke-width: 1.2;
}

.fish-year-chart__bar-total {
  font-size: 8.5px;
  font-weight: 700;
  fill: rgba(255, 255, 255, 0.88);
}

.fish-year-chart--light .fish-year-chart__bar-total {
  fill: rgba(0, 0, 0, 0.8);
}

.fish-year-chart__x-labels {
  display: flex;
  justify-content: space-around;
  padding: 0 16px 0 38px;
  margin-top: 4px;
}

.fish-year-chart__x-label {
  background: transparent;
  border: 1px solid transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.fish-year-chart--light .fish-year-chart__x-label {
  color: rgba(0, 0, 0, 0.75);
}

.fish-year-chart__x-label:hover {
  background: rgba(255, 255, 255, 0.12);
}

.fish-year-chart__x-label--selected {
  background: #00897b;
  color: #fff !important;
  border-color: #26a69a;
}

.fish-year-chart__tooltip {
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  background: rgba(18, 22, 28, 0.95);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.72rem;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.fish-year-chart__tooltip-title {
  font-weight: 700;
  margin-bottom: 4px;
}

.fish-year-chart__tooltip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
}

.fish-year-chart__tooltip-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
  margin: 4px 0;
}

.fish-year-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  justify-content: center;
}

.fish-year-chart__legend-item {
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.8);
}

.fish-year-chart--light .fish-year-chart__legend-item {
  color: rgba(0, 0, 0, 0.75);
}

.fish-year-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 5px;
  display: inline-block;
}
</style>
