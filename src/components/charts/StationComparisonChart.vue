<template>
  <div class="station-compare">
    <div v-for="group in groups" :key="group.zone" class="station-compare__group">
      <div class="station-compare__group-title">{{ group.zone }} ({{ group.entries.length }})</div>

      <div
        v-for="entry in group.entries"
        :key="entry.siteId"
        class="station-compare__row"
        :class="{ 'station-compare__row--selected': entry.siteId === selectedSiteId }"
        @click="emit('select-station', entry.siteId)"
      >
        <span class="station-compare__label">{{ entry.siteId }}</span>
        <div class="station-compare__track">
          <div
            v-if="guidelineValue !== undefined"
            class="station-compare__guideline"
            :style="{ left: pct(guidelineValue) + '%' }"
          />
          <div
            class="station-compare__bar"
            :style="{ width: pct(entry.value) + '%', background: STATUS_COLORS[entry.status] }"
          />
        </div>
        <span class="station-compare__value">{{ entry.value.toFixed(decimals) }}{{ unit }}</span>
        <q-tooltip anchor="top middle" self="bottom middle">
          {{ entry.siteId }} — {{ entry.value.toFixed(decimals) }}{{ unit }} ({{ STATUS_LABELS[entry.status] }})
        </q-tooltip>
      </div>

      <div v-if="group.entries.length === 0" class="station-compare__empty">No stations in this zone.</div>
    </div>

    <div class="row q-gutter-md q-mt-md">
      <div v-for="level in STATUS_LEVELS" :key="level" class="row items-center no-wrap">
        <span class="station-compare__dot" :style="{ background: STATUS_COLORS[level] }" />
        <span class="text-caption text-grey-4 q-ml-xs">{{ STATUS_LABELS[level] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_LEVELS,
  type StatusLevel,
} from 'src/composables/useWaterQualityModel';

export interface StationComparisonEntry {
  siteId: string;
  value: number;
  status: StatusLevel;
  zone: 'Nearshore' | 'Offshore';
}

const props = withDefaults(
  defineProps<{
    entries: StationComparisonEntry[];
    unit?: string;
    decimals?: number;
    guidelineValue?: number | undefined;
    selectedSiteId?: string | null;
  }>(),
  {
    unit: '',
    decimals: 1,
    selectedSiteId: null,
  },
);

const emit = defineEmits<{ 'select-station': [siteId: string] }>();

const maxValue = computed(() => {
  const values = props.entries.map((e) => e.value);
  const dataMax = Math.max(...values, 0);
  const max = props.guidelineValue !== undefined ? Math.max(dataMax, props.guidelineValue) : dataMax;
  return max * 1.15 || 1;
});

function pct(value: number): number {
  return Math.min((value / maxValue.value) * 100, 100);
}

const groups = computed(() => {
  const byZone = (zone: 'Nearshore' | 'Offshore') =>
    props.entries.filter((e) => e.zone === zone).sort((a, b) => b.value - a.value);
  return [
    { zone: 'Nearshore' as const, entries: byZone('Nearshore') },
    { zone: 'Offshore' as const, entries: byZone('Offshore') },
  ];
});
</script>

<style scoped>
.station-compare__group {
  margin-bottom: 14px;
}

.station-compare__group-title {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
}

.station-compare__row {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.station-compare__row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.station-compare__row--selected {
  background: rgba(38, 166, 154, 0.18);
  outline: 1px solid rgba(38, 166, 154, 0.5);
}

.station-compare__label {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.station-compare__track {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.station-compare__bar {
  height: 100%;
  border-radius: 5px;
  transition: width 0.2s ease;
}

.station-compare__guideline {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: #fab219;
  opacity: 0.9;
  z-index: 1;
}

.station-compare__value {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.68rem;
  text-align: right;
  white-space: nowrap;
}

.station-compare__empty {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.72rem;
  padding: 4px;
}

.station-compare__dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
