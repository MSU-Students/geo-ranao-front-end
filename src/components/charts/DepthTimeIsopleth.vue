<template>
  <div class="isopleth">
    <div class="isopleth__row">
      <div class="isopleth__y-axis" :style="{ height: plotHeight + 'px' }">
        <span
          v-for="d in depthTicks"
          :key="d"
          class="isopleth__y-label"
          :style="{ top: `${yPct(d)}%` }"
        >{{ d }}m</span>
      </div>
      <div class="isopleth__columns" :style="{ height: plotHeight + 'px' }">
        <div
          v-for="col in columns"
          :key="col.month"
          class="isopleth__col"
          :class="{ 'isopleth__col--empty': col.points.length < 2 }"
          :style="col.points.length >= 2 ? { background: col.gradient } : {}"
        >
          <q-tooltip v-if="col.points.length" class="text-caption">
            <div class="text-weight-bold">{{ col.month }}</div>
            <div v-for="p in col.points" :key="p.depth">{{ p.depth }}m: {{ p.value.toFixed(decimals) }}{{ unit }}</div>
          </q-tooltip>
        </div>
      </div>
    </div>

    <div class="isopleth__x-axis">
      <div class="isopleth__y-axis-spacer" />
      <div class="isopleth__x-labels">
        <span v-for="col in columns" :key="'x' + col.month" class="isopleth__x-label">{{ col.month.split(' ')[0] }}</span>
      </div>
    </div>

    <div class="isopleth__legend">
      <span class="isopleth__legend-label">{{ valueRange.min.toFixed(decimals) }}{{ unit }}</span>
      <div class="isopleth__legend-gradient" />
      <span class="isopleth__legend-label">{{ valueRange.max.toFixed(decimals) }}{{ unit }}</span>
      <div class="isopleth__legend-swatch isopleth__col--empty" />
      <span class="isopleth__legend-label">= fewer than 2 depths sampled</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface IsoplethPoint {
  depth: number;
  value: number;
}
export interface IsoplethColumn {
  month: string;
  points: IsoplethPoint[]; // sorted by depth ascending
}

const props = withDefaults(
  defineProps<{
    columns: IsoplethColumn[];
    unit?: string;
    decimals?: number;
  }>(),
  { unit: '', decimals: 1 },
);

const plotHeight = 260;

const maxDepth = computed(() => {
  const depths = props.columns.flatMap((c) => c.points.map((p) => p.depth));
  return depths.length ? Math.max(...depths) : 20;
});

const depthTicks = computed(() => {
  const steps = 4;
  return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxDepth.value * i) / steps));
});

function yPct(depth: number): number {
  return (depth / (maxDepth.value || 1)) * 100;
}

const valueRange = computed(() => {
  const values = props.columns.flatMap((c) => c.points.map((p) => p.value));
  if (values.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...values), max: Math.max(...values) };
});

// Sequential blue -> tan -> red heat scale — low values read cool, high
// values read warm, matching common heatmap convention (not the
// good/warning/critical palette used elsewhere, since this is raw
// magnitude, not a DENR status).
const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [33, 102, 172]],
  [0.25, [103, 169, 207]],
  [0.5, [223, 194, 125]],
  [0.75, [230, 140, 55]],
  [1, [178, 24, 43]],
];
function heatColor(t: number): string {
  const clamped = Math.min(Math.max(t, 0), 1);
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const stop0 = HEAT_STOPS[i]!;
    const stop1 = HEAT_STOPS[i + 1]!;
    if (clamped >= stop0[0] && clamped <= stop1[0]) {
      const span = stop1[0] - stop0[0] || 1;
      const localT = (clamped - stop0[0]) / span;
      const r = Math.round(stop0[1][0] + (stop1[1][0] - stop0[1][0]) * localT);
      const g = Math.round(stop0[1][1] + (stop1[1][1] - stop0[1][1]) * localT);
      const b = Math.round(stop0[1][2] + (stop1[1][2] - stop0[1][2]) * localT);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return 'rgb(180, 180, 180)';
}

// Each month's column is its own smooth vertical gradient built from that
// month's real depth readings (interpolating vertically between depths is
// standard — depth is physically continuous). Columns are NOT interpolated
// against each other — each is one real, discrete sampling event, so
// blending across months would fabricate data for dates nobody sampled.
const columns = computed(() =>
  props.columns.map((col) => {
    const { min, max } = valueRange.value;
    const span = max - min || 1;
    const stops = col.points
      .slice()
      .sort((a, b) => a.depth - b.depth)
      .map((p) => `${heatColor((p.value - min) / span)} ${yPct(p.depth)}%`);
    return { ...col, gradient: `linear-gradient(to bottom, ${stops.join(', ')})` };
  }),
);
</script>

<style scoped>
.isopleth__row {
  display: flex;
}

.isopleth__y-axis {
  position: relative;
  width: 32px;
  flex-shrink: 0;
}

.isopleth__y-label {
  position: absolute;
  right: 6px;
  transform: translateY(-50%);
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.55);
}

.isopleth__columns {
  flex: 1;
  display: flex;
  gap: 1px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.isopleth__col {
  flex: 1;
  min-width: 8px;
}

.isopleth__col--empty {
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.03),
    rgba(255, 255, 255, 0.03) 4px,
    rgba(255, 255, 255, 0.08) 4px,
    rgba(255, 255, 255, 0.08) 8px
  );
}

.isopleth__x-axis {
  display: flex;
  margin-top: 4px;
}

.isopleth__y-axis-spacer {
  width: 32px;
  flex-shrink: 0;
}

.isopleth__x-labels {
  flex: 1;
  display: flex;
}

.isopleth__x-label {
  flex: 1;
  text-align: center;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.5);
}

.isopleth__legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  margin-left: 32px;
  max-width: 420px;
}

.isopleth__legend-label {
  font-size: 0.66rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

.isopleth__legend-gradient {
  flex: 1 1 100px;
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    rgb(33, 102, 172),
    rgb(103, 169, 207),
    rgb(223, 194, 125),
    rgb(230, 140, 55),
    rgb(178, 24, 43)
  );
}

.isopleth__legend-swatch {
  width: 16px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-left: 6px;
}
</style>
