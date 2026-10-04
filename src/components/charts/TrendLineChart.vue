<template>
  <div class="trendline-chart" @mousemove="onMouseMove" @mouseleave="hoverIndex = null">
    <svg :viewBox="`0 0 ${vbWidth} ${vbHeight}`" preserveAspectRatio="none" class="trendline-chart__svg">
      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="padLeft"
        :x2="vbWidth - padRight"
        :y1="tick.y"
        :y2="tick.y"
        class="trendline-chart__grid"
      />
      <text
        v-for="tick in yTicks"
        :key="'yl' + tick.value"
        :x="padLeft - 6"
        :y="tick.y + 3"
        class="trendline-chart__axis-label"
        text-anchor="end"
      >
        {{ tick.value.toFixed(decimals) }}
      </text>

      <!-- Linear-regression trend line, fit to the first series only. -->
      <line
        v-if="trendLine"
        :x1="trendLine.x1"
        :y1="trendLine.y1"
        :x2="trendLine.x2"
        :y2="trendLine.y2"
        class="trendline-chart__trend"
      />

      <g v-for="s in seriesRender" :key="s.key">
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
      </g>

      <!-- Hover crosshair -->
      <line
        v-if="hoverIndex !== null"
        :x1="xFor(hoverIndex)"
        :x2="xFor(hoverIndex)"
        :y1="padTop"
        :y2="vbHeight - padBottom"
        class="trendline-chart__crosshair"
      />
      <g v-if="hoverIndex !== null">
        <circle
          v-for="s in seriesRender"
          :key="s.key"
          v-show="s.points[hoverIndex!]"
          :cx="s.points[hoverIndex!]?.x"
          :cy="s.points[hoverIndex!]?.y"
          r="3.5"
          :fill="s.color"
          stroke="#ffffff"
          stroke-width="1.2"
        />
      </g>

      <rect
        :x="padLeft"
        :y="padTop"
        :width="plotWidth"
        :height="plotHeight"
        fill="transparent"
      />
    </svg>

    <div class="trendline-chart__x-labels">
      <span
        v-for="(m, i) in months"
        :key="m"
        class="trendline-chart__x-label"
        :style="{ visibility: i % xLabelSkip === 0 || i === months.length - 1 ? 'visible' : 'hidden' }"
      >
        {{ m }}
      </span>
    </div>

    <div v-if="hoverIndex !== null" class="trendline-chart__tooltip" :style="{ left: `${(xFor(hoverIndex) / vbWidth) * 100}%` }">
      <div class="trendline-chart__tooltip-month">{{ months[hoverIndex] }}</div>
      <div v-for="s in seriesRender" :key="s.key" v-show="s.points[hoverIndex!]" class="trendline-chart__tooltip-row">
        <span class="trendline-chart__tooltip-dot" :style="{ background: s.color }" />
        {{ s.label }}: <strong>{{ s.points[hoverIndex!]?.value.toFixed(decimals) }}{{ unit ? ` ${unit}` : '' }}</strong>
      </div>
    </div>

    <div class="trendline-chart__legend">
      <div v-for="s in series" :key="s.key" class="trendline-chart__legend-item">
        <span class="trendline-chart__legend-dot" :style="{ background: s.color }" />
        {{ s.label }}
      </div>
      <div v-if="trend" class="trendline-chart__legend-item">
        <span class="trendline-chart__legend-dash" />
        Linear trend ({{ series[0]?.label }})
      </div>
    </div>

    <div v-if="trend" class="trendline-chart__trend-caption">
      {{ series[0]?.label }} trend: {{ trend.perYear >= 0 ? '+' : '' }}{{ trend.perYear.toFixed(decimals) }}
      {{ unit }}/year over this period{{ trendDirectionNote }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  values: (number | null)[];
}

const props = withDefaults(
  defineProps<{
    months: string[];
    series: TrendSeries[];
    trend?: { slope: number; intercept: number; perYear: number } | null;
    unit?: string;
    decimals?: number;
  }>(),
  { unit: '', decimals: 1, trend: null },
);

const vbWidth = 600;
const vbHeight = 240;
const padLeft = 40;
const padRight = 12;
const padTop = 12;
const padBottom = 8;

const hoverIndex = ref<number | null>(null);

const plotWidth = vbWidth - padLeft - padRight;
const plotHeight = vbHeight - padTop - padBottom;

// Adaptive label density — a multi-year history can span 100+ months, so a
// fixed "every other month" rule (fine for a 13-month window elsewhere on
// this dashboard) would be unreadable here.
const xLabelSkip = computed(() => Math.max(1, Math.ceil(props.months.length / 10)));

const trendDirectionNote = computed(() => {
  if (!props.trend) return '';
  if (Math.abs(props.trend.perYear) < 0.001) return ' — essentially flat';
  return props.trend.perYear < 0 ? ' — declining' : ' — rising';
});

const valueRange = computed(() => {
  const allValues = props.series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  // Include the trend line's endpoints so it's never clipped off-chart.
  if (props.trend) {
    const n = props.months.length;
    allValues.push(props.trend.intercept, props.trend.intercept + props.trend.slope * (n - 1));
  }
  if (allValues.length === 0) return { min: 0, max: 1 };
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const span = dataMax - dataMin || 1;
  return { min: dataMin - span * 0.12, max: dataMax + span * 0.12 };
});

function xFor(i: number): number {
  return padLeft + (i / Math.max(props.months.length - 1, 1)) * plotWidth;
}
function yFor(value: number): number {
  const { min, max } = valueRange.value;
  const range = max - min || 1;
  return padTop + (1 - (value - min) / range) * plotHeight;
}

const yTicks = computed(() => {
  const { min, max } = valueRange.value;
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / steps;
    return { value, y: yFor(value) };
  });
});

const trendLine = computed(() => {
  if (!props.trend || props.months.length < 2) return null;
  const n = props.months.length;
  return {
    x1: xFor(0),
    y1: yFor(props.trend.intercept),
    x2: xFor(n - 1),
    y2: yFor(props.trend.intercept + props.trend.slope * (n - 1)),
  };
});

// Null-gap segments — a continuous line through a month nobody sampled
// would silently invent a trend that was never actually observed.
const seriesRender = computed(() =>
  props.series.map((s) => {
    const segments: string[] = [];
    let current: string[] = [];
    const points: ({ x: number; y: number; value: number } | null)[] = [];
    s.values.forEach((v, i) => {
      if (v === null) {
        if (current.length > 1) segments.push(current.join(' '));
        current = [];
        points.push(null);
        return;
      }
      const x = xFor(i);
      const y = yFor(v);
      current.push(`${x},${y}`);
      points.push({ x, y, value: v });
    });
    if (current.length > 1) segments.push(current.join(' '));
    return { key: s.key, label: s.label, color: s.color, segments, points };
  }),
);

function onMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const relX = ((e.clientX - rect.left) / rect.width) * vbWidth;
  const ratio = Math.min(Math.max((relX - padLeft) / plotWidth, 0), 1);
  const index = Math.round(ratio * (props.months.length - 1));
  hoverIndex.value = Math.min(Math.max(index, 0), Math.max(props.months.length - 1, 0));
}
</script>

<style scoped>
.trendline-chart {
  position: relative;
}

.trendline-chart__svg {
  width: 100%;
  height: 240px;
  display: block;
}

.trendline-chart__grid {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.trendline-chart__axis-label {
  fill: rgba(255, 255, 255, 0.75);
  font-size: 8px;
}

.trendline-chart__trend {
  /* Matches ParameterTrendChart's own dashed-guideline color, so every
     dashed reference line on this dashboard reads the same way. */
  stroke: #fab219;
  stroke-width: 1.75;
  stroke-dasharray: 6 4;
  opacity: 0.85;
}

.trendline-chart__crosshair {
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.trendline-chart__x-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  margin-top: 2px;
}

.trendline-chart__x-label {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
  text-align: center;
  white-space: nowrap;
}

.trendline-chart__tooltip {
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

.trendline-chart__tooltip-month {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.65rem;
  margin-bottom: 2px;
}

.trendline-chart__tooltip-row {
  display: flex;
  align-items: center;
}

.trendline-chart__tooltip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 4px;
  display: inline-block;
  flex-shrink: 0;
}

.trendline-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  justify-content: center;
}

.trendline-chart__legend-item {
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

.trendline-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  display: inline-block;
}

.trendline-chart__legend-dash {
  width: 14px;
  height: 0;
  border-top: 2px dashed #fab219;
  margin-right: 4px;
  display: inline-block;
}

.trendline-chart__trend-caption {
  text-align: center;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 6px;
}
</style>
