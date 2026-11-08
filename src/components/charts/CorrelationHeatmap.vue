<template>
  <div class="corr-heatmap-wrap">
    <p v-if="selected" class="corr-heatmap__selected-note">
      <q-icon name="touch_app" size="14px" class="q-mr-xs" />
      {{ labels[selected.ri] }} × {{ labels[selected.ci] }} — r =
      {{ matrix[selected.ri]?.[selected.ci]?.r?.toFixed(3) ?? 'n/a' }}
      <q-btn flat dense round icon="close" size="xs" class="q-ml-xs" @click="selected = null" />
    </p>
    <div class="corr-heatmap" :style="{ gridTemplateColumns: `120px repeat(${labels.length}, 1fr)` }">
      <div class="corr-heatmap__corner" />
      <div
        v-for="(label, ci) in labels"
        :key="'col-' + label"
        class="corr-heatmap__col-label"
        :class="{ 'corr-heatmap__label--active': selected && selected.ci === ci }"
      >
        <span>{{ label }}</span>
      </div>
      <template v-for="(rowLabel, ri) in labels" :key="'row-' + rowLabel">
        <div
          class="corr-heatmap__row-label"
          :class="{ 'corr-heatmap__label--active': selected && selected.ri === ri }"
        >
          {{ rowLabel }}
        </div>
        <div
          v-for="(cell, ci) in matrix[ri]"
          :key="ci"
          class="corr-heatmap__cell"
          :class="{
            'corr-heatmap__cell--selected': selected && selected.ri === ri && selected.ci === ci,
            'corr-heatmap__cell--aligned':
              selected && !(selected.ri === ri && selected.ci === ci) && (selected.ri === ri || selected.ci === ci),
          }"
          :style="{ background: colorFor(cell.r) }"
          @click="selectCell(ri, ci)"
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
import { ref } from 'vue';

export interface CorrelationCell {
  r: number | null;
  n: number;
}

defineProps<{
  labels: string[];
  /** matrix[row][col] — must be labels.length x labels.length. */
  matrix: CorrelationCell[][];
}>();

// Clicking a cell highlights the row/column headers it connects, so it's
// obvious at a glance which two parameters a given cell is comparing instead
// of having to trace across the grid by eye.
const selected = ref<{ ri: number; ci: number } | null>(null);
function selectCell(ri: number, ci: number) {
  selected.value = selected.value && selected.value.ri === ri && selected.value.ci === ci ? null : { ri, ci };
}

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
  cursor: pointer;
  box-sizing: border-box;
  border: 2px solid transparent;
}

.corr-heatmap__cell--selected {
  border-color: #ffd54f;
}

.corr-heatmap__cell--aligned {
  border-color: rgba(255, 213, 79, 0.45);
}

.corr-heatmap__label--active {
  color: #ffd54f;
  font-weight: 700;
}

.corr-heatmap__selected-note {
  display: flex;
  align-items: center;
  margin: 0 0 10px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 213, 79, 0.12);
  color: #ffd54f;
  font-size: 0.78rem;
  font-weight: 600;
  width: fit-content;
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
