<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Lake Lanao Background -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />
    <div class="absolute-full bg-overlay" />

    <BackButton to="/dashboard/fish" />

    <div class="page-content full-width q-pa-md" style="max-width: 1300px">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <h4 class="text-weight-bolder q-my-xs text-white drop-shadow">
          Fisheries Decision Support System
        </h4>
        <p class="text-grey-3 drop-shadow-soft q-mb-xs">
          Rule-based ecological priority indicators for Lake Lanao municipal waters & species conservation
        </p>
        <div class="text-caption text-teal-3 text-weight-medium">
          Evidence-based indicators derived from approved field observations (Reference Year: {{ assessment.latestAssessmentYear }})
        </div>
      </div>

      <!-- Quick Status Summary Cards -->
      <div class="row q-col-gutter-md q-mb-lg justify-center">
        <div
          v-for="stat in statusSummaryCards"
          :key="stat.code"
          class="col-6 col-sm-4 col-md-2"
        >
          <q-card
            class="glass-morph text-center q-pa-sm cursor-pointer"
            :class="{ 'card-active-filter': selectedStatusFilter === stat.code }"
            @click="toggleStatusFilter(stat.code)"
          >
            <q-icon :name="stat.meta.icon" :color="stat.meta.badgeColor" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ stat.count }}</div>
            <div class="text-grey-3 text-caption">{{ stat.meta.label }}</div>
          </q-card>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div class="row items-center justify-between glass-morph q-pa-md q-mb-md rounded-borders">
        <div class="row q-gutter-sm items-center">
          <q-select
            v-model="selectedStatusFilter"
            :options="statusFilterOptions"
            label="Filter Status"
            outlined
            dense
            dark
            emit-value
            map-options
            style="min-width: 200px"
          />
          <q-input
            v-model="searchMuni"
            dense
            dark
            outlined
            placeholder="Search municipality..."
            class="search-input"
          >
            <template #prepend>
              <q-icon name="search" color="grey-4" size="xs" />
            </template>
          </q-input>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            color="teal"
            icon="map"
            label="View Map Layers"
            size="sm"
            rounded
            unelevated
            @click="$router.push('/map')"
          />
        </div>
      </div>

      <!-- Municipality Status Grid -->
      <div class="row q-col-gutter-md q-mb-xl">
        <div
          v-for="m in filteredMunicipalities"
          :key="m.municipality"
          class="col-12 col-md-6"
        >
          <q-card class="glass-morph full-height column justify-between">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm">
                <div>
                  <div class="text-h6 text-white text-weight-bold">{{ m.municipality }}</div>
                  <div class="text-caption text-grey-4">
                    {{ m.totalRecords }} recorded observation(s) across {{ m.activeYears.length }} active year(s)
                  </div>
                </div>
                <q-chip
                  :color="m.meta.badgeColor"
                  text-color="white"
                  :icon="m.meta.icon"
                  size="sm"
                  class="text-weight-bold"
                >
                  {{ m.meta.label }}
                </q-chip>
              </div>

              <!-- Indicators Strip -->
              <div class="row q-col-gutter-xs text-caption q-my-sm">
                <div class="col-4">
                  <div class="text-grey-4">Endemic</div>
                  <div class="text-white text-weight-bold">{{ m.endemicCount }}</div>
                </div>
                <div class="col-4">
                  <div class="text-grey-4">Invasive</div>
                  <div class="text-white text-weight-bold">{{ m.invasiveCount }} ({{ m.invasiveSharePct }}%)</div>
                </div>
                <div class="col-4">
                  <div class="text-grey-4">Last Surveyed</div>
                  <div class="text-white text-weight-bold">{{ m.latestYearRecorded ?? 'None' }}</div>
                </div>
              </div>

              <q-separator dark class="q-my-sm" />

              <!-- Rule Findings -->
              <div class="q-mb-sm">
                <div class="text-caption text-weight-bold text-teal-3 q-mb-xs">Key Findings:</div>
                <ul class="q-my-none q-pl-md text-caption text-grey-3">
                  <li v-for="(f, idx) in m.findings" :key="idx">{{ f }}</li>
                </ul>
              </div>

              <!-- Recommended Intervention -->
              <div>
                <div class="text-caption text-weight-bold text-amber-3 q-mb-xs">Recommended Action:</div>
                <div class="text-caption text-grey-2 bg-black-20 q-pa-xs rounded-borders">
                  {{ m.meta.recommendedAction }}
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pt-none">
              <span class="text-caption text-italic text-grey-5" style="font-size: 11px">
                Scientific basis: {{ m.meta.rationale }}
              </span>
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <!-- Species Conservation Watchlist -->
      <div class="text-white text-h6 text-weight-bold q-mb-sm">
        <q-icon name="visibility" color="teal-3" class="q-mr-sm" />
        Species Conservation Watchlist
      </div>
      <p class="text-grey-4 text-caption q-mb-md">
        Specific species exhibiting critical observation patterns (absence from surveys or sudden invasive presence).
      </p>

      <q-card class="glass-morph q-mb-xl">
        <q-table
          :rows="assessment.watchlist"
          :columns="watchlistColumns"
          row-key="speciesScientific"
          dark
          flat
          dense
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #body-cell-statusFlag="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.statusFlag === 'EXTIRPATION_RISK' ? 'red-8' : 'orange-8'"
                :label="props.row.statusFlag === 'EXTIRPATION_RISK' ? 'Extirpation Risk' : 'Invasive Surge'"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BackButton from 'components/BackButton.vue';
import { fetchFishObservations, type FishObservation } from 'src/composables/useFishObservations';
import { loadMunicipalZones, type MunicipalZone } from 'src/composables/useMunicipalZones';
import {
  evaluateDecisionSupport,
  type DecisionSupportSummary,
} from 'src/composables/useDecisionSupport';
import { DECISION_STATUSES, type DecisionStatus } from 'src/config/decisionSupport';

const loading = ref(false);
const rawObservations = ref<FishObservation[]>([]);
const municipalZones = ref<MunicipalZone[]>([]);
const selectedStatusFilter = ref<string>('ALL');
const searchMuni = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    const [obs, zones] = await Promise.all([
      fetchFishObservations({ status: 'APPROVED' }),
      loadMunicipalZones().catch(() => [] as MunicipalZone[]),
    ]);
    rawObservations.value = obs;
    municipalZones.value = zones;
  } catch (err) {
    console.error('Failed to load decision support inputs:', err);
  } finally {
    loading.value = false;
  }
});

const assessment = computed<DecisionSupportSummary>(() => {
  return evaluateDecisionSupport(rawObservations.value, municipalZones.value);
});

const statusSummaryCards = computed(() => {
  const counts = assessment.value.byStatusCounts;
  return Object.values(DECISION_STATUSES).map((meta) => ({
    code: meta.code,
    meta,
    count: counts[meta.code] ?? 0,
  }));
});

const statusFilterOptions = [
  { label: 'All Statuses', value: 'ALL' },
  ...Object.values(DECISION_STATUSES).map((m) => ({ label: m.label, value: m.code })),
];

function toggleStatusFilter(code: string) {
  selectedStatusFilter.value = selectedStatusFilter.value === code ? 'ALL' : code;
}

const filteredMunicipalities = computed(() => {
  return assessment.value.municipalityResults.filter((m) => {
    const matchStatus =
      selectedStatusFilter.value === 'ALL' || m.status === selectedStatusFilter.value;
    const matchSearch =
      !searchMuni.value ||
      m.municipality.toLowerCase().includes(searchMuni.value.toLowerCase());
    return matchStatus && matchSearch;
  });
});

const watchlistColumns = [
  { name: 'speciesScientific', label: 'Scientific Name', field: 'speciesScientific', align: 'left' as const, sortable: true },
  { name: 'speciesCommon', label: 'Common Name', field: 'speciesCommon', align: 'left' as const, sortable: true },
  { name: 'category', label: 'Category', field: 'category', align: 'left' as const, sortable: true },
  { name: 'lastRecordedYear', label: 'Last Recorded', field: 'lastRecordedYear', align: 'center' as const, sortable: true },
  { name: 'statusFlag', label: 'Alert Flag', field: 'statusFlag', align: 'center' as const, sortable: true },
  { name: 'notes', label: 'Assessment Notes', field: 'notes', align: 'left' as const },
];
</script>

<style scoped>
.page-content {
  position: relative;
  z-index: 1;
  padding-top: 88px;
}

.drop-shadow {
  text-shadow: 0px 4px 10px rgba(0, 0, 0, 0.6);
}

.drop-shadow-soft {
  text-shadow: 0px 2px 5px rgba(0, 0, 0, 0.4);
}

.bg-overlay {
  background: rgba(0, 0, 0, 0.62);
}

.bg-black-20 {
  background: rgba(0, 0, 0, 0.25);
}

.glass-morph {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.card-active-filter {
  background: rgba(0, 150, 136, 0.25) !important;
  border: 1px solid rgba(0, 150, 136, 0.6) !important;
  transform: translateY(-2px);
}

.search-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.08);
}
</style>
