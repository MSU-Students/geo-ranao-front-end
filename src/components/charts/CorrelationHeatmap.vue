<template>
  <div class="corr-heatmap-wrap">
    <div class="corr-heatmap" :style="{ gridTemplateColumns: `120px repeat(${labels.length}, 1fr)` }">
      <div class="corr-heatmap__corner" />
      <div v-for="label in labels" :key="'col-' + label" class="corr-heatmap__col-label">
        <span>{{ label }}</span>
      </div>
      <template v-for="(rowLabel, ri) in labels" :key="'row-' + rowLabel">
        <div class="corr-heatmap__row-label">{{ rowLabel }}</div>
        <div
          v-for="(cell, ci) in matrix[ri]"
          :key="ci"
          class="corr-heatmap__cell"
          :style="{ background: colorFor(cell.r) }"
        >
          <span class="corr-heatmap__value" :class="{ 'corr-heatmap__value--light': textIsLight(cell.r) }">
            {{ cell.r !== null ? cell.r.toFixed(2) : '—' }}
          </span>
          <q-tooltip>
            {{ rowLabel }} × {{ labels[ci] }}<br />
            r = {{ cell.r !== null ? cell.r.toFixed(3) : 'n/a' }} (n = {{ cell.n }} paired readings)
          </q-tooltip>
        </div>
      </template>
    </div>

    <div class="corr-heatmap__legend">
      <span class="corr-heatmap__legend-label">−1</span>
      <div class="corr-heatmap__legend-gradient" />
      <span class="corr-heatmap__legend-label">0</span>
      <div class="corr-heatmap__legend-gradient corr-heatmap__legend-gradient--pos" />
      <span class="corr-heatmap__legend-label">+1</span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface CorrelationCell {
  r: number | null;
  n: number;
}

defineProps<{
  labels: string[];
  /** matrix[row][col] — must be labels.length x labels.length. */
  matrix: CorrelationCell[][];
}>();

// Diverging scale: negative -> blue, 0 -> near-white, positive -> red.
function colorFor(r: number | null): string {
  if (r === null) return 'rgba(255, 255, 255, 0.06)';
  const t = Math.min(Math.abs(r), 1);
  if (r < 0) return `rgb(${Math.round(255 - t * 176)}, ${Math.round(255 - t * 176)}, 255)`;
  return `rgb(255, ${Math.round(255 - t * 176)}, ${Math.round(255 - t * 176)})`;
}

function textIsLight(r: number | null): boolean {
  return r !== null && Math.abs(r) > 0.55;
}
</script>

<style scoped>
.corr-heatmap-wrap {
  overflow-x: auto;
}

.corr-heatmap {
  display: grid;
  gap: 2px;
  min-width: 760px;
}

.corr-heatmap__corner {
  background: transparent;
}

.corr-heatmap__col-label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
  padding-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  max-height: 90px;
}

.corr-heatmap__row-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  padding-right: 6px;
  white-space: nowrap;
}

.corr-heatmap__cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: default;
}

.corr-heatmap__value {
  font-size: 0.62rem;
  font-weight: 600;
  color: #1a1a1a;
}

.corr-heatmap__value--light {
  color: #ffffff;
}

.corr-heatmap__legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  max-width: 320px;
}

.corr-heatmap__legend-label {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.78);
}

.corr-heatmap__legend-gradient {
  flex: 1;
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(to right, rgb(79, 79, 255), rgb(255, 255, 255));
}

.corr-heatmap__legend-gradient--pos {
  background: linear-gradient(to right, rgb(255, 255, 255), rgb(255, 79, 79));
}
</style>
