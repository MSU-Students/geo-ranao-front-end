<template>
  <div class="compliance-grid">
    <div class="compliance-grid__scroller">
      <div class="compliance-grid__inner" :style="{ gridTemplateColumns: `140px repeat(${months.length}, 1fr)` }">
        <div class="compliance-grid__corner" />
        <div v-for="m in months" :key="'h' + m" class="compliance-grid__month-header">{{ m.split(' ')[0] }}</div>

        <template v-for="row in rows" :key="row.siteId">
          <button
            type="button"
            class="compliance-grid__row-label"
            :class="{ 'compliance-grid__row-label--active': selectedSiteId === row.siteId }"
            @click="emit('select-station', row.siteId)"
          >
            {{ row.siteId }}
          </button>
          <div
            v-for="(cell, ci) in row.cells"
            :key="row.siteId + ci"
            class="compliance-grid__cell"
            :style="{ background: cell.status === 'no-data' ? NO_DATA_COLOR : STATUS_COLORS[cell.status] }"
            :title="`${row.siteId} — ${months[ci]}: ${cell.value !== null ? cell.value.toFixed(decimals) + unit : 'No data'} (${cell.status === 'no-data' ? 'No data' : STATUS_LABELS[cell.status]})`"
          />
        </template>
      </div>
    </div>

    <div class="row items-center q-gutter-md q-mt-sm justify-center">
      <div v-for="level in STATUS_LEVELS" :key="level" class="row items-center no-wrap">
        <span class="status-dot" :style="{ background: STATUS_COLORS[level] }" />
        <span class="text-caption text-grey-4 q-ml-xs">{{ STATUS_LABELS[level] }}</span>
      </div>
      <div class="row items-center no-wrap">
        <span class="status-dot" :style="{ background: NO_DATA_COLOR }" />
        <span class="text-caption text-grey-4 q-ml-xs">No data</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { STATUS_COLORS, STATUS_LABELS, STATUS_LEVELS, type StatusLevel } from 'src/composables/useWaterQualityModel';

export interface ComplianceCell {
  status: StatusLevel | 'no-data';
  value: number | null;
}
export interface ComplianceRow {
  siteId: string;
  cells: ComplianceCell[]; // aligned 1:1 with `months`
}

withDefaults(
  defineProps<{
    months: string[];
    rows: ComplianceRow[];
    selectedSiteId?: string | null;
    unit?: string;
    decimals?: number;
  }>(),
  { unit: '', decimals: 1, selectedSiteId: null },
);

const emit = defineEmits<{ 'select-station': [siteId: string] }>();

// Sites/months with zero approved readings show as this neutral grey rather
// than a fabricated status color — "no data" is a distinct state from "good".
const NO_DATA_COLOR = '#78909c';
</script>

<style scoped>
.compliance-grid__scroller {
  max-height: 420px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.compliance-grid__inner {
  display: grid;
  gap: 2px;
  padding: 4px;
}

.compliance-grid__corner {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgba(20, 20, 20, 0.9);
}

.compliance-grid__month-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(20, 20, 20, 0.9);
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 4px 0;
  white-space: nowrap;
}

.compliance-grid__row-label {
  position: sticky;
  left: 0;
  z-index: 1;
  background: rgba(20, 20, 20, 0.9);
  border: none;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.68rem;
  text-align: left;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compliance-grid__row-label:hover {
  background: rgba(255, 255, 255, 0.08);
}

.compliance-grid__row-label--active {
  color: #4dd0c8;
  font-weight: 700;
}

.compliance-grid__cell {
  min-height: 20px;
  border-radius: 2px;
}

.status-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
