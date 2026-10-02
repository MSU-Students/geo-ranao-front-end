<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => $emit('update:modelValue', v)">
    <q-card class="bg-grey-10 text-white summary-card">
      <q-card-section class="bg-teal-9 row items-center q-pa-md">
        <div class="text-h6 row items-center">
          <q-icon name="summarize" size="24px" class="q-mr-sm" />
          Station Summary
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="$emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section class="q-pa-md scroll" style="flex: 1 1 auto; min-height: 0">
        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col-12 col-sm-6">
            <q-select
              :model-value="paramKey"
              @update:model-value="(v) => $emit('update:paramKey', v as string)"
              :options="paramSelectOptions"
              emit-value
              map-options
              dense
              outlined
              dark
              label="Parameter"
            />
          </div>
          <div class="col-12 col-sm-6 text-grey-4 text-caption">
            Sample counts and trend cover every reading on record for this parameter, not just the
            currently selected Reading Period — this is a lifetime-to-date summary per station.
          </div>
        </div>

        <q-table
          :rows="rows"
          :columns="columns"
          row-key="stationId"
          dark
          flat
          :rows-per-page-options="[12, 25, 0]"
          :pagination="{ rowsPerPage: 12, sortBy: 'sampleCount', descending: true }"
        >
          <template #body-cell-percentOfTotal="scopeProps">
            <q-td :props="scopeProps">
              <div class="row items-center no-wrap">
                <q-linear-progress
                  :value="scopeProps.value / 100"
                  color="teal-4"
                  track-color="grey-8"
                  class="q-mr-sm"
                  style="width: 60px"
                  rounded
                />
                {{ scopeProps.value.toFixed(1) }}%
              </div>
            </q-td>
          </template>

          <template #body-cell-trend="scopeProps">
            <q-td :props="scopeProps">
              <span :class="trendClass(scopeProps.value)">
                <q-icon :name="trendIcon(scopeProps.value)" size="18px" class="q-mr-xs" />
                {{ scopeProps.value }}
              </span>
            </q-td>
          </template>
        </q-table>

        <div class="text-caption text-grey-5 q-mt-sm">
          <q-icon name="info" size="14px" class="q-mr-xs" />
          Trend compares the average of each station's earlier readings against its more recent
          ones for the selected parameter — "Stable" means the shift is smaller than 5% of the
          parameter's plausible range, not that nothing moved at all.
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { allWaterQualityParams } from 'src/composables/useWaterQualityModel';
import type { StationSummaryRow } from 'src/composables/useStationSummary';

export type { StationSummaryRow };

// paramKey is a controlled prop (not a direct import of either page's own
// shared parameter ref) specifically so this dialog can be reused by pages
// that keep their "selected parameter" in different state — the Water
// Quality Dashboard's selectedParamKey and the interactive map's
// selectedColorParamKey are two separate refs, and this dialog has no
// business assuming which one a given caller means.
defineProps<{
  modelValue: boolean;
  rows: StationSummaryRow[];
  paramKey: string;
}>();
defineEmits<{ 'update:modelValue': [value: boolean]; 'update:paramKey': [value: string] }>();

const paramSelectOptions = allWaterQualityParams.map((p) => ({ label: p.label, value: p.key }));

const columns = [
  { name: 'stationId', label: 'Station', field: 'stationId', align: 'left' as const, sortable: true },
  {
    name: 'municipality',
    label: 'Nearest Municipality',
    field: 'municipality',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'sampleCount', label: 'Samples', field: 'sampleCount', align: 'right' as const, sortable: true },
  {
    name: 'percentOfTotal',
    label: '% of Total Sampling',
    field: 'percentOfTotal',
    align: 'left' as const,
    sortable: true,
  },
  { name: 'depths', label: 'Depths Sampled', field: 'depths', align: 'left' as const },
  { name: 'trend', label: 'Trend', field: 'trend', align: 'left' as const, sortable: true },
];

function trendIcon(trend: StationSummaryRow['trend']): string {
  if (trend === 'Increasing') return 'trending_up';
  if (trend === 'Decreasing') return 'trending_down';
  if (trend === 'Stable') return 'trending_flat';
  return 'help_outline';
}

// Deliberately neutral (not red/green) — "increasing" isn't universally good
// or bad, it depends on the parameter (rising dissolved oxygen is good,
// rising ammonia isn't), so color here signals direction only.
function trendClass(trend: StationSummaryRow['trend']): string {
  if (trend === 'Increasing') return 'text-blue-4';
  if (trend === 'Decreasing') return 'text-orange-4';
  if (trend === 'Stable') return 'text-grey-5';
  return 'text-grey-7';
}
</script>

<style scoped>
.summary-card {
  width: 900px;
  max-width: 95vw;
  /* Fixed (not max-) height so the inner .scroll section has a real
     constraint to scroll within — max-height alone lets the card just grow
     to fit its content instead of ever triggering the scrollbar. */
  height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
