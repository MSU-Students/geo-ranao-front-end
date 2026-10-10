<template>
  <div class="mt-chart" @mousemove="onMouseMove" @mouseleave="hoverIndex = null">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" preserveAspectRatio="none" class="mt-chart__svg">
      <!-- Recessive gridlines -->
      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="padLeft"
        :x2="vbWidth - padRight"
        :y1="tick.y"
        :y2="tick.y"
        class="mt-chart__grid"
      />
      <text v-for="tick in yTicks" :key="'yl' + tick.value" :x="padLeft - 6" :y="tick.y + 3" class="mt-chart__axis-label" text-anchor="end">
        {{ formatTick(tick.value) }}
      </text>

      <!-- Guideline reference line — line/area modes only (count-based stack mode has no such threshold) -->
      <g v-if="mode !== 'stack' && guidelineValue !== undefined">
        <line :x1="padLeft" :x2="vbWidth - padRight" :y1="guidelineY" :y2="guidelineY" class="mt-chart__guideline" />
        <text :x="vbWidth - padRight" :y="guidelineY - 4" class="mt-chart__guideline-label" text-anchor="end">
          {{ guidelineLabel || 'Guideline' }}
        </text>
      </g>

      <!-- Stack mode: one stacked bar per month -->
      <template v-if="mode === 'stack'">
        <g v-for="(month, i) in months" :key="month" class="mt-chart__bar-group">
          <rect
            v-for="seg in stackSegments(i)"
            :key="seg.status"
            :x="barX(i)"
            :y="seg.y"
            :width="barWidth"
            :height="seg.h"
            :fill="seg.color"
            class="mt-chart__segment"
            :class="{ 'mt-chart__segment--dim': hoverIndex !== null && hoverIndex !== i }"
          />
        </g>
      </template>

      <!-- Line/Area modes -->
      <template v-else>
        <path v-if="mode === 'area'" :d="areaPath" :fill="color" class="mt-chart__area" />
        <polyline :points="linePoints" fill="none" :stroke="color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle
          v-for="(month, i) in months"
          :key="'pt' + month"
          :cx="pointAt(i).x"
          :cy="pointAt(i).y"
          r="3"
          :fill="color"
          stroke="#16212e"
          stroke-width="1.2"
        />
      </template>

      <!-- Hover crosshair -->
      <line
        v-if="hoverIndex !== null"
        :x1="barX(hoverIndex) + barWidth / 2"
        :x2="barX(hoverIndex) + barWidth / 2"
        :y1="padTop"
        :y2="vbHeight - padBottom"
        class="mt-chart__crosshair"
      />

      <rect :x="padLeft" :y="padTop" :width="vbWidth - padLeft - padRight" :height="vbHeight - padTop - padBottom" fill="transparent" />
    </svg>

    <div class="mt-chart__x-labels">
      <span
        v-for="(month, i) in months"
        :key="month"
        class="mt-chart__x-label"
        :class="{ 'mt-chart__x-label--hidden': months.length > 8 && i % 2 !== 0 && i !== months.length - 1 }"
      >
        {{ month.split(' ')[0] }}
      </span>
    </div>

    <div v-if="months.length === 0" class="mt-chart__empty">No readings available for this parameter yet.</div>

    <!-- Hover tooltip -->
    <div v-if="hoverIndex !== null" class="mt-chart__tooltip" :style="{ left: `${((barX(hoverIndex) + barWidth / 2) / vbWidth) * 100}%` }">
      <div class="mt-chart__tooltip-month">{{ months[hoverIndex] }}</div>
      <template v-if="mode === 'stack'">
        <div v-for="status in STATUS_LEVELS" :key="status" class="mt-chart__tooltip-row">
          <span class="mt-chart__legend-dot" :style="{ background: STATUS_COLORS[status] }" />
          <span>{{ STATUS_LABELS[status] }}:</span>
          <strong>{{ statusCounts[status]?.[hoverIndex] ?? 0 }}</strong>
        </div>
      </template>
      <div v-else class="mt-chart__tooltip-value">
        {{ average[hoverIndex] !== null && average[hoverIndex] !== undefined ? average[hoverIndex]!.toFixed(decimals) : '—' }}{{ unit ? ' ' + unit : '' }}
      </div>
    </div>

    <!-- Legend -->
    <div v-if="mode === 'stack'" class="mt-chart__legend">
      <div v-for="status in STATUS_LEVELS" :key="status" class="mt-chart__legend-item">
        <span class="mt-chart__legend-dot" :style="{ background: STATUS_COLORS[status] }" />
        <span>{{ STATUS_LABELS[status] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { STATUS_COLORS, STATUS_LABELS, STATUS_LEVELS, type StatusLevel } from 'src/composables/useWaterQualityModel';

const props = withDefaults(
  defineProps<{
    months: string[];
    average: (number | null)[];
    statusCounts: Record<StatusLevel, number[]>;
    mode: 'stack' | 'line' | 'area';
    unit?: string;
    color?: string;
    decimals?: number;
    guidelineValue?: number | undefined;
    guidelineLabel?: string;
  }>(),
  {
    unit: '',
    color: '#4dd0e1',
    decimals: 1,
  },
);

const vbWidth = 600;
const vbHeight = 240;
const padLeft = 42;
const padRight = 12;
const padTop = 14;
const padBottom = 8;

const hoverIndex = ref<number | null>(null);

const plotWidth = computed(() => vbWidth - padLeft - padRight);
const plotHeight = computed(() => vbHeight - padTop - padBottom);
const slotWidth = computed(() => plotWidth.value / Math.max(props.months.length, 1));
const barWidth = computed(() => Math.min(Math.max(slotWidth.value * 0.5, 6), 64));

function barX(i: number): number {
  return padLeft + slotWidth.value * i + (slotWidth.value - barWidth.value) / 2;
}

// ── Stack mode: count-based y domain ──
const stackTotals = computed(() => props.months.map((_, i) => STATUS_LEVELS.reduce((s, st) => s + (props.statusCounts[st]?.[i] ?? 0), 0)));
const stackMax = computed(() => Math.max(...stackTotals.value, 1));

function stackSegments(i: number) {
  const total = stackTotals.value[i] ?? 0;
  let cumulative = 0;
  const segs: { status: StatusLevel; color: string; y: number; h: number }[] = [];
  for (const status of STATUS_LEVELS) {
    const count = props.statusCounts[status]?.[i] ?? 0;
    const h = total > 0 ? (count / stackMax.value) * plotHeight.value : 0;
    cumulative += count;
    const topFraction = total > 0 ? cumulative / stackMax.value : 0;
    const y = vbHeight - padBottom - topFraction * plotHeight.value;
    segs.push({ status, color: STATUS_COLORS[status], y, h });
  }
  return segs;
}

// ── Line/Area mode: continuous value y domain ──
const valueRange = computed(() => {
  const vals = props.average.filter((v): v is number => v !== null);
  if (vals.length === 0) {
    const v = props.guidelineValue ?? 0;
    return { min: v - 1, max: v + 1 };
  }
  const dataMin = Math.min(...vals);
  const dataMax = Math.max(...vals);
  const min = props.guidelineValue !== undefined ? Math.min(dataMin, props.guidelineValue) : dataMin;
  const max = props.guidelineValue !== undefined ? Math.max(dataMax, props.guidelineValue) : dataMax;
  const span = max - min || 1;
  return { min: min - span * 0.15, max: max + span * 0.15 };
});

const guidelineY = computed(() => {
  if (props.guidelineValue === undefined) return 0;
  const { min, max } = valueRange.value;
  const range = max - min || 1;
  return padTop + (1 - (props.guidelineValue - min) / range) * plotHeight.value;
});

function pointAt(i: number) {
  const { min, max } = valueRange.value;
  const range = max - min || 1;
  const x = barX(i) + barWidth.value / 2;
  const value = props.average[i] ?? min;
  const y = padTop + (1 - (value - min) / range) * plotHeight.value;
  return { x, y };
}

const linePoints = computed(() => props.months.map((_, i) => `${pointAt(i).x},${pointAt(i).y}`).join(' '));

const areaPath = computed(() => {
  if (props.months.length === 0) return '';
  const baseline = vbHeight - padBottom;
  const pts = props.months.map((_, i) => pointAt(i));
  const top = pts.map((p) => `${p.x},${p.y}`).join(' L ');
  return `M ${pts[0]!.x},${baseline} L ${top} L ${pts[pts.length - 1]!.x},${baseline} Z`;
});

// ── Shared y-axis ticks (domain depends on mode) ──
const yTicks = computed(() => {
  const steps = 4;
  if (props.mode === 'stack') {
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = (stackMax.value * i) / steps;
      const y = vbHeight - padBottom - (i / steps) * plotHeight.value;
      return { value, y };
    });
  }
  const { min, max } = valueRange.value;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / steps;
    const y = padTop + (1 - i / steps) * plotHeight.value;
    return { value, y };
  });
});

function formatTick(value: number): string {
  if (props.mode === 'stack') return Math.round(value).toString();
  return value.toFixed(value < 10 ? 1 : 0);
}

function onMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const relX = ((e.clientX - rect.left) / rect.width) * vbWidth;
  const ratio = Math.min(Math.max((relX - padLeft) / plotWidth.value, 0), 1);
  const index = Math.floor(ratio * props.months.length);
  hoverIndex.value = Math.min(Math.max(index, 0), props.months.length - 1);
}
</script>

<style scoped>
.mt-chart {
  position: relative;
}

.mt-chart__svg {
  width: 100%;
  height: 240px;
  display: block;
}

.mt-chart__grid {
  stroke: rgba(255, 255, 255, 0.12);
  stroke-width: 1;
}

.mt-chart__axis-label {
  fill: rgba(255, 255, 255, 0.55);
  font-size: 9px;
}

.mt-chart__guideline {
  stroke: #fab219;
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
  opacity: 0.85;
}

.mt-chart__guideline-label {
  fill: #fab219;
  font-size: 9px;
  font-weight: 700;
}

.mt-chart__area {
  opacity: 0.22;
}

.mt-chart__segment {
  transition: opacity 0.15s ease;
}

.mt-chart__segment--dim {
  opacity: 0.45;
}

.mt-chart__crosshair {
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.mt-chart__x-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 2px;
}

.mt-chart__x-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.65);
  flex: 1;
  text-align: center;
}

.mt-chart__x-label--hidden {
  visibility: hidden;
}

.mt-chart__empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  padding: 24px 0;
}

.mt-chart__tooltip {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  background: rgba(10, 16, 22, 0.95);
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

.mt-chart__tooltip-month {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.65rem;
  margin-bottom: 2px;
}

.mt-chart__tooltip-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.mt-chart__tooltip-value {
  font-weight: 700;
}

.mt-chart__legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

.mt-chart__legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.75);
}

.mt-chart__legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
</style>
