<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Same Lake Lanao background as FishDashboardPage -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />

    <!-- Dark overlay for readability -->
    <div class="absolute-full bg-overlay" />

    <BackButton to="/map" />

    <!-- Main Content -->
    <div class="page-content full-width q-pa-md" style="max-width: 1300px">
      <!-- Page Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <h4 class="text-weight-bolder q-my-xs text-white drop-shadow">
            <q-icon name="assessment" class="q-mr-sm" color="teal-3" />
            Researcher Report
          </h4>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-ml-xs">
            Export approved Lake Lanao water quality and fish observation data for your own analysis
          </p>
        </div>
        <div v-if="authStore.isLoggedIn" class="researcher-badge glass-morph q-pa-sm q-px-md">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-avatar color="teal-8" text-color="white" size="36px">
              <q-icon name="person" />
            </q-avatar>
            <div>
              <div class="text-white text-weight-medium text-body2">
                {{ authStore.displayName }}
              </div>
              <q-badge color="teal" label="Verified Researcher" icon="verified" class="q-mt-xs" />
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <!-- Generate Report -->
        <div class="col-12 col-md-7">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="text-white text-h6 text-weight-bold q-mb-md">
                <q-icon name="summarize" color="teal-3" class="q-mr-sm" />
                Generate Report
              </div>

              <q-select
                v-model="dataset"
                :options="datasetOptions"
                label="Dataset"
                dark
                outlined
                emit-value
                map-options
                class="form-field q-mb-md"
              />

              <q-select
                v-model="scope"
                :options="scopeOptions"
                label="Scope"
                dark
                outlined
                emit-value
                map-options
                class="form-field q-mb-md"
              />

              <q-select
                v-model="dateRange"
                :options="dateRangeOptions"
                label="Date Range"
                dark
                outlined
                class="form-field q-mb-md"
              />

              <q-select
                v-if="dataset === 'water'"
                v-model="selectedStations"
                :options="stationOptions"
                label="Stations"
                hint="Leave empty for all stations"
                dark
                outlined
                multiple
                use-chips
                class="form-field q-mb-md"
              />

              <q-select
                v-if="dataset === 'fish'"
                v-model="selectedCategories"
                :options="categoryOptions"
                label="Categories"
                hint="Leave empty for all categories"
                dark
                outlined
                multiple
                emit-value
                map-options
                use-chips
                class="form-field q-mb-md"
              />

              <q-btn
                color="blue-7"
                label="Export as CSV"
                icon="table_chart"
                unelevated
                rounded
                :loading="exporting"
                class="full-width q-py-sm"
                @click="handleExportCsv"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Recent Reports -->
        <div class="col-12 col-md-5">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="text-white text-h6 text-weight-bold q-mb-md">
                <q-icon name="history" color="teal-3" class="q-mr-sm" />
                Recent Reports
              </div>

              <q-list dark separator>
                <q-item v-for="report in recentReports" :key="report.id" class="report-item">
                  <q-item-section avatar>
                    <q-icon name="description" color="teal-4" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-white text-weight-medium">
                      {{ report.label }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-4">
                      {{ formatTimestamp(report.timestamp) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-if="recentReports.length === 0">
                  <q-item-section class="text-grey-5">
                    No reports generated yet on this device.
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';
import { fetchWaterQualityReadings, type WaterQualityReading } from 'src/composables/useWaterQualityReadings';
import {
  fetchFishObservations,
  CONSERVATION_STATUS_LABELS,
  type FishObservation,
  type FishCategory,
} from 'src/composables/useFishObservations';
import { allWaterQualityParams, READING_START_YEAR } from 'src/composables/useWaterQualityModel';
import { useStations, fetchStations } from 'src/composables/useStations';
import {
  toCsv,
  triggerDownload,
  withinDateRange,
  buildYearRangeOptions,
  loadRecentReports,
  recordRecentReport,
  type DateRangeOption,
  type RecentReportEntry,
} from 'src/composables/useReportExport';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const RECENT_REPORTS_KEY = 'researcher-report-recent';

// ─── Filters ───
const dataset = ref<'water' | 'fish'>('water');
const datasetOptions = [
  { label: 'Water Quality', value: 'water' },
  { label: 'Fish Observation', value: 'fish' },
];

const scope = ref<'all' | 'mine'>('all');
const scopeOptions = [
  { label: 'All Approved Data', value: 'all' },
  { label: 'My Submissions Only', value: 'mine' },
];

const dateRange = ref<DateRangeOption>('All Time');
const dateRangeOptions = buildYearRangeOptions(READING_START_YEAR);

const { stations } = useStations();
const stationOptions = computed(() => stations.value.map((s) => s.siteId));
const selectedStations = ref<string[]>([]);

const categoryOptions: { label: string; value: FishCategory }[] = [
  { label: 'Endemic', value: 'ENDEMIC' },
  { label: 'Invasive', value: 'INVASIVE' },
  { label: 'General', value: 'GENERAL' },
];
const selectedCategories = ref<FishCategory[]>([]);

const exporting = ref(false);
const recentReports = ref<RecentReportEntry[]>([]);

// ─── Access Guard ───
// Report downloads here read the same approved data the public map already
// shows, but this page is meant for logged-in researchers/admins specifically
// — without this check, anyone who navigated straight to /researcher could
// use what's labeled a researcher tool.
onMounted(() => {
  if (!authStore.isLoggedIn) {
    $q.notify({ type: 'negative', message: 'Please log in to access the Researcher Portal.', position: 'top' });
    router.replace('/auth/login').catch((err) => {
      console.error('Navigation error:', err);
    });
    return;
  }

  fetchStations().catch((err) => console.error('Failed to load stations:', err));
  recentReports.value = loadRecentReports(RECENT_REPORTS_KEY);
});

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildWaterRows(readings: WaterQualityReading[]) {
  const filtered = readings.filter(
    (r) =>
      withinDateRange(r.dateObserved, dateRange.value) &&
      (selectedStations.value.length === 0 || selectedStations.value.includes(r.siteId)),
  );
  const rows = filtered.map((r) => {
    const row: Record<string, unknown> = { siteId: r.siteId, dateObserved: r.dateObserved, depthM: r.depthM };
    for (const p of allWaterQualityParams) row[p.key] = r[p.key as keyof WaterQualityReading] ?? '';
    row['notes'] = r.notes ?? '';
    return row;
  });
  const headers = [
    { label: 'Station', field: 'siteId' },
    { label: 'Date', field: 'dateObserved' },
    { label: 'Depth (m)', field: 'depthM' },
    ...allWaterQualityParams.map((p) => ({ label: p.unit ? `${p.label} (${p.unit})` : p.label, field: p.key })),
    { label: 'Notes', field: 'notes' },
  ];
  return { rows, headers };
}

function buildFishRows(observations: FishObservation[]) {
  const filtered = observations.filter(
    (o) =>
      withinDateRange(o.dateObserved ?? undefined, dateRange.value) &&
      (selectedCategories.value.length === 0 || selectedCategories.value.includes(o.category)),
  );
  const rows = filtered.map((o) => ({
    category: o.category,
    speciesScientific: o.speciesScientific ?? '',
    speciesCommon: o.speciesCommon ?? '',
    conservationStatus: CONSERVATION_STATUS_LABELS[o.conservationStatus],
    dateObserved: o.dateObserved,
    coordinates: o.coordinates ?? '',
    municipal: o.municipal ?? '',
    barangay: o.barangay ?? '',
    trueLengthCm: o.trueLengthCm ?? '',
    bodyDepthCm: o.bodyDepthCm ?? '',
    weightG: o.weightG ?? '',
  }));
  const headers = [
    { label: 'Category', field: 'category' },
    { label: 'Scientific Name', field: 'speciesScientific' },
    { label: 'Common Name', field: 'speciesCommon' },
    { label: 'Conservation Status', field: 'conservationStatus' },
    { label: 'Date Observed', field: 'dateObserved' },
    { label: 'Coordinates', field: 'coordinates' },
    { label: 'Municipality', field: 'municipal' },
    { label: 'Barangay', field: 'barangay' },
    { label: 'True Length (cm)', field: 'trueLengthCm' },
    { label: 'Body Depth (cm)', field: 'bodyDepthCm' },
    { label: 'Weight (g)', field: 'weightG' },
  ];
  return { rows, headers };
}

async function handleExportCsv() {
  exporting.value = true;
  try {
    const mine = scope.value === 'mine';
    let rows: Record<string, unknown>[];
    let headers: { label: string; field: string }[];
    let datasetLabel: string;

    if (dataset.value === 'water') {
      const readings = await fetchWaterQualityReadings({ status: 'APPROVED', mine });
      ({ rows, headers } = buildWaterRows(readings));
      datasetLabel = 'Water Quality';
    } else {
      const observations = await fetchFishObservations({ status: 'APPROVED', mine });
      ({ rows, headers } = buildFishRows(observations));
      datasetLabel = 'Fish Observation';
    }

    if (rows.length === 0) {
      $q.notify({ type: 'warning', message: `No records found for "${dateRange.value}".`, position: 'top' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    triggerDownload(toCsv(rows, headers), `researcher-report-${dataset.value}-${today}.csv`, 'text/csv');

    const label = `Researcher Report — ${datasetLabel} — ${dateRange.value}`;
    recentReports.value = recordRecentReport(RECENT_REPORTS_KEY, label);
    $q.notify({ type: 'positive', message: `${label} downloaded (${rows.length} records).`, position: 'top' });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to generate the report.',
      position: 'top',
    });
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.glass-morph {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

.bg-overlay {
  background: rgba(0, 0, 0, 0.55);
}

.drop-shadow {
  text-shadow: 0px 4px 10px rgba(0, 0, 0, 0.6);
}

.drop-shadow-soft {
  text-shadow: 0px 2px 5px rgba(0, 0, 0, 0.4);
}

/* Researcher badge on header */
.researcher-badge {
  border-radius: 12px !important;
}

/* Form field styling */
.form-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06);
}

.form-field :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.5);
}

/* Report items */
.report-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* Z-index for content above background */
.page-content {
  position: relative;
  z-index: 1;
  padding-top: 88px;
}
</style>
