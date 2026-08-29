<template>
  <q-page class="profile-root">
    <!-- Background -->
    <div class="profile-bg">
      <q-img
        src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
        class="absolute-full"
        style="filter: blur(1px) brightness(0.95); transform: scale(1.05);"
        fit="cover"
      />
      <div class="bg-overlay absolute-full" />
    </div>

    <BackButton to="/map" :offset="false" />

    <!-- Main Container -->
    <div class="profile-container">
      <div class="single-card bright-panel column">
        <!-- ══ TOP SECTION (Identity) ══ -->
        <div class="top-section col-auto">
          <div class="cover-strip" />

          <div class="profile-header row items-start q-pa-md">
            <!-- Avatar (fixed placeholder — no upload; the backend user record has no avatar field to save one to) -->
            <div class="avatar-col q-mr-md relative-position" style="width: 84px; height: 84px;">
              <q-avatar size="84px" class="avatar-img shadow-3 relative-position">
                <img src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80" />
              </q-avatar>
              <div class="online-dot bg-teal" />
            </div>

            <!-- User Info & Details — sourced from the logged-in account, not placeholder data -->
            <div class="user-info-col col">
              <div class="text-h5 text-weight-bold text-teal-10 q-mb-xs">
                {{ authStore.user?.username ?? 'Researcher' }}
              </div>
              <div class="text-subtitle2 text-teal-8">{{ authStore.user?.affiliation }}</div>

              <div class="info-fields row q-gutter-md">
                <div class="info-row">
                  <q-icon name="email" size="16px" class="info-icon" />
                  <span class="info-val">{{ authStore.user?.email }}</span>
                </div>
                <div class="info-row">
                  <q-icon name="school" size="16px" class="info-icon" />
                  <span class="info-val">{{ authStore.user?.role }}</span>
                </div>
                <div v-if="authStore.user?.departmentRole" class="info-row">
                  <q-icon name="work" size="16px" class="info-icon" />
                  <span class="info-val">{{ authStore.user.departmentRole }}</span>
                </div>
                <div v-if="statusLabel" class="info-row">
                  <q-icon name="verified" size="16px" class="info-icon" />
                  <span class="info-val">{{ statusLabel }}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="stats-col col-auto row items-center">
              <q-btn
                unelevated
                round
                color="teal-8"
                text-color="white"
                icon="upload_file"
                size="md"
                @click="openUploadDialog"
              >
                <q-tooltip>Upload Data</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <q-separator color="grey-3" />

        <!-- ══ MY CONTRIBUTIONS (this researcher's own submissions — real data) ══ -->
        <div class="bottom-section col column q-pa-lg">
          <div class="row items-center q-mb-md">
            <q-icon name="assignment_ind" size="20px" class="q-mr-xs text-teal-9" />
            <span class="text-subtitle1 text-weight-bold text-teal-9">My Contributions</span>
          </div>

          <div class="row items-center q-mb-md q-gutter-sm">
            <span class="text-grey-8 text-weight-medium q-mr-sm">Filter:</span>
            <q-btn
              v-for="opt in filterOptions"
              :key="opt.value"
              :color="contributionFilter === opt.value ? opt.color : 'grey-5'"
              :flat="contributionFilter !== opt.value"
              :unelevated="contributionFilter === opt.value"
              :label="opt.label"
              :icon="opt.value === 'water' ? 'water_drop' : undefined"
              size="sm"
              rounded
              @click="contributionFilter = opt.value"
            />
          </div>

          <div v-if="contributionsError" class="text-center text-grey-6 q-pa-xl col">
            <q-icon name="error_outline" size="40px" class="q-mb-sm" />
            <div>Couldn't load your contributions. Try refreshing the page.</div>
          </div>

          <template v-else>
            <template v-if="contributionFilter !== 'water'">
              <div v-if="contributionFilter === 'all'" class="text-subtitle2 text-weight-bold text-teal-8 q-mb-sm">
                Fish Observations
              </div>
              <q-table
                :rows="filteredFishContributions"
                :columns="fishColumns"
                :loading="contributionsLoading"
                row-key="id"
                flat
                bordered
                :rows-per-page-options="[10, 20, 50]"
                class="contributions-table q-mb-lg"
              >
                <template #body-cell-detail="props">
                  <q-td :props="props">
                    <span class="detail-text">{{ props.row.detail }}</span>
                    <q-tooltip v-if="props.row.detail.length > 36">{{ props.row.detail }}</q-tooltip>
                  </q-td>
                </template>

                <template #body-cell-type="props">
                  <q-td :props="props">
                    <q-badge :color="getTypeColor(props.row.type)" :label="getTypeLabel(props.row.type)" />
                  </q-td>
                </template>

                <template #body-cell-reviewStatus="props">
                  <q-td :props="props">
                    <q-badge
                      :color="getReviewStatusColor(props.row.reviewStatus)"
                      :label="getReviewStatusLabel(props.row.reviewStatus)"
                    />
                  </q-td>
                </template>

                <template #no-data>
                  <div class="full-width text-center text-grey-6 q-pa-lg">
                    {{ contributionsLoading ? 'Loading…' : "You haven't submitted any fish observations yet." }}
                  </div>
                </template>
              </q-table>
            </template>

            <template v-if="contributionFilter === 'all' || contributionFilter === 'water'">
              <div v-if="contributionFilter === 'all'" class="text-subtitle2 text-weight-bold text-teal-8 q-mb-sm">
                Water Quality Readings
              </div>
              <q-table
                :rows="waterContributions"
                :columns="waterColumns"
                :loading="contributionsLoading"
                row-key="id"
                flat
                bordered
                :rows-per-page-options="[10, 20, 50]"
                class="contributions-table"
              >
                <template #body-cell-reviewStatus="props">
                  <q-td :props="props">
                    <q-badge
                      :color="getReviewStatusColor(props.row.reviewStatus)"
                      :label="getReviewStatusLabel(props.row.reviewStatus)"
                    />
                  </q-td>
                </template>

                <template #no-data>
                  <div class="full-width text-center text-grey-6 q-pa-lg">
                    {{ contributionsLoading ? 'Loading…' : "You haven't submitted any water quality readings yet." }}
                  </div>
                </template>
              </q-table>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Upload Data Dialog -->
    <UploadDataDialog ref="uploadDialogRef" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import BackButton from 'src/components/BackButton.vue';
import UploadDataDialog from 'src/components/UploadDataDialog.vue';
import { useAuthStore } from 'src/stores/auth';
import {
  fetchFishObservations,
  CONSERVATION_STATUS_LABELS,
  type FishCategory,
  type ReviewStatus,
} from 'src/composables/useFishObservations';
import { fetchWaterQualityReadings, type WaterQualityReading } from 'src/composables/useWaterQualityReadings';
import { allWaterQualityParams, formatReading, depthLabel } from 'src/composables/useWaterQualityModel';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

// No profile page for admins — MainLayout's header already keeps them from
// navigating here, but this covers a typed URL or bookmark too.
onMounted(() => {
  if (authStore.user?.role === 'Admin') {
    router.replace('/admin').catch((err) => {
      console.error('Navigation error:', err);
    });
  }
});

const statusLabel = computed(() => {
  switch (authStore.user?.status) {
    case 'verified':
      return 'Verified Researcher';
    case 'pending':
      return 'Pending Verification';
    case 'suspended':
      return 'Suspended';
    case 'rejected':
      return 'Application Rejected';
    default:
      return '';
  }
});

const uploadDialogRef = ref<InstanceType<typeof UploadDataDialog> | null>(null);
function openUploadDialog() {
  uploadDialogRef.value?.open();
}

// ─── MY CONTRIBUTIONS ───
// This researcher's own fish observations + water quality readings, fetched
// live via the same `mine: true` API filter the rest of the app already
// uses — no edit/delete actions here because neither API exposes them for a
// researcher's own records (only admin approve/reject).
//
// Fish and water quality get their own tables with their own column shapes
// (matching how the admin's batch-detail view lays out water parameters as
// dedicated columns) rather than forcing both into one generic Title/Detail
// row — a fish observation and a 13-parameter water reading don't actually
// share a natural row shape.
type FishContributionType = 'endemic' | 'invasive' | 'general';
type ContributionFilterValue = 'all' | FishContributionType | 'water';

interface FishContributionRow {
  id: string;
  type: FishContributionType;
  title: string;
  detail: string;
  reviewStatus: ReviewStatus;
  location: string;
  date: string;
}

const fishColumns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left' as const, sortable: true },
  { name: 'detail', label: 'Detail', field: 'detail', align: 'left' as const },
  { name: 'type', label: 'Type', field: 'type', align: 'center' as const, sortable: true },
  { name: 'reviewStatus', label: 'Review Status', field: 'reviewStatus', align: 'center' as const, sortable: true },
  { name: 'location', label: 'Location', field: 'location', align: 'left' as const },
  { name: 'date', label: 'Date Observed', field: 'date', align: 'center' as const, sortable: true },
];

interface WaterContributionRow {
  id: string;
  siteId: string;
  depthM: number;
  date: string;
  reviewStatus: ReviewStatus;
  notes: string | null | undefined;
  values: Partial<Record<string, number>>;
}

const fishContributions = ref<FishContributionRow[]>([]);
const waterContributions = ref<WaterContributionRow[]>([]);
const contributionsLoading = ref(true);
const contributionsError = ref(false);

function fishTypeFor(category: FishCategory): FishContributionType {
  if (category === 'ENDEMIC') return 'endemic';
  if (category === 'INVASIVE') return 'invasive';
  return 'general';
}

onMounted(async () => {
  try {
    const [fish, water] = await Promise.all([
      fetchFishObservations({ mine: true }),
      fetchWaterQualityReadings({ mine: true }),
    ]);

    const fishRows: FishContributionRow[] = fish.map((obs) => {
      const title = obs.speciesCommon || obs.speciesScientific || 'Unidentified catch';
      const detail =
        obs.speciesScientific && obs.speciesScientific !== title
          ? obs.speciesScientific
          : CONSERVATION_STATUS_LABELS[obs.conservationStatus];
      return {
        id: `fish-${obs.id}`,
        type: fishTypeFor(obs.category),
        title,
        detail,
        reviewStatus: obs.reviewStatus,
        location:
          obs.latitude != null && obs.longitude != null
            ? `${obs.latitude.toFixed(4)}, ${obs.longitude.toFixed(4)}`
            : '—',
        date: obs.dateObserved,
      };
    });

    const waterRows: WaterContributionRow[] = water.map((reading) => {
      const values: Partial<Record<string, number>> = {};
      for (const param of allWaterQualityParams) {
        const value = reading[param.key as keyof WaterQualityReading];
        if (typeof value === 'number') values[param.key] = value;
      }
      return {
        id: `wq-${reading.id}`,
        siteId: reading.siteId,
        depthM: reading.depthM,
        date: reading.dateObserved,
        reviewStatus: reading.reviewStatus,
        notes: reading.notes,
        values,
      };
    });

    fishContributions.value = fishRows.sort((a, b) => b.date.localeCompare(a.date));
    waterContributions.value = waterRows.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error('Failed to load contributions:', err);
    contributionsError.value = true;
    $q.notify({
      type: 'negative',
      message: "Couldn't load your contributions.",
      position: 'top',
    });
  } finally {
    contributionsLoading.value = false;
  }
});

const contributionFilter = ref<ContributionFilterValue>('all');

const filteredFishContributions = computed(() =>
  fishContributions.value.filter(
    (c) => contributionFilter.value === 'all' || c.type === contributionFilter.value,
  ),
);

// Only columns for parameters this researcher actually recorded at least
// once — showing all 13 possible parameters as columns regardless of
// whether any reading used them would just be a wall of "—".
const waterParamColumns = computed(() =>
  allWaterQualityParams
    .filter((param) => waterContributions.value.some((row) => row.values[param.key] != null))
    .map((param) => ({
      name: param.key,
      label: param.unit ? `${param.label} (${param.unit})` : param.label,
      field: (row: WaterContributionRow) => row.values[param.key],
      format: (val: number | undefined) => (val != null ? formatReading(val, param) : '—'),
      align: 'center' as const,
      sortable: true,
    })),
);

const hasWaterNotes = computed(() => waterContributions.value.some((row) => row.notes));

const waterColumns = computed(() => [
  { name: 'siteId', label: 'Site', field: 'siteId', align: 'left' as const, sortable: true },
  {
    name: 'depth',
    label: 'Depth',
    field: (row: WaterContributionRow) => depthLabel(row.depthM),
    align: 'center' as const,
    sortable: true,
  },
  { name: 'date', label: 'Date Observed', field: 'date', align: 'center' as const, sortable: true },
  { name: 'reviewStatus', label: 'Review Status', field: 'reviewStatus', align: 'center' as const, sortable: true },
  ...waterParamColumns.value,
  ...(hasWaterNotes.value
    ? [{ name: 'notes', label: 'Notes', field: 'notes' as const, align: 'left' as const }]
    : []),
]);

function getTypeLabel(type: ContributionFilterValue): string {
  switch (type) {
    case 'endemic':
      return 'Endemic';
    case 'invasive':
      return 'Invasive';
    case 'general':
      return 'General';
    case 'water':
      return 'Water Quality';
    default:
      return 'All';
  }
}

function getTypeColor(type: ContributionFilterValue): string {
  switch (type) {
    case 'endemic':
      return 'blue-7';
    case 'invasive':
      return 'orange-8';
    case 'general':
      return 'grey-7';
    case 'water':
      return 'teal-6';
    default:
      return 'teal-8';
  }
}

const CONTRIBUTION_FILTER_VALUES: ContributionFilterValue[] = ['endemic', 'invasive', 'general', 'water'];
const filterOptions = computed(() => [
  { value: 'all' as const, label: 'All', color: 'teal-8' },
  ...CONTRIBUTION_FILTER_VALUES.map((t) => ({ value: t, label: getTypeLabel(t), color: getTypeColor(t) })),
]);

function getReviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pending Review';
  }
}

function getReviewStatusColor(status: ReviewStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    default:
      return 'blue-grey-6';
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════
   ROOT & BACKGROUND
═══════════════════════════════════════ */
.profile-root {
  position: fixed;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background: #f0f4f4; /* Light fallback */
}

.profile-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bg-overlay {
  background: linear-gradient(135deg, rgba(240, 248, 248, 0.55) 0%, rgba(210, 235, 235, 0.45) 100%);
  backdrop-filter: blur(1px);
  z-index: 1;
}

/* ═══════════════════════════════════════
   MAIN LAYOUT
═══════════════════════════════════════ */
.profile-container {
  position: relative;
  z-index: 2;
  width: calc(100vw - 48px);
  max-width: 960px;
  height: calc(100vh - 48px);
  max-height: 820px;
  display: flex;
}

/* ═══════════════════════════════════════
   BRIGHT PANEL (Theme from Landing Page)
═══════════════════════════════════════ */
.bright-panel {
  background: rgba(255, 255, 255, 0.97) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* Quasar's "column" class is flex-flow: column wrap, not just
     flex-direction: column — nowrap here too so .bottom-section can never
     wrap into a second row-of-columns beside .top-section. */
  flex-wrap: nowrap;
}

/* ═══════════════════════════════════════
   TOP SECTION (Identity)
═══════════════════════════════════════ */
.top-section {
  position: relative;
}

.cover-strip {
  height: 50px;
  background: linear-gradient(135deg, #00695c 0%, #26a69a 100%) !important;
  flex-shrink: 0;
}

.avatar-img {
  border: 4px solid white;
  background: white;
  overflow: hidden;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border: 3px solid white;
  border-radius: 50%;
  z-index: 10;
}

.info-fields {
  margin-top: 4px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  color: #26a69a;
}

.info-val {
  color: #546e7a;
  font-size: 0.8rem;
  font-weight: 500;
}

/* ── CONTRIBUTIONS TABLE ──
   .bottom-section and .contributions-table are flex items whose default
   min-width is `auto`, so a wide table (6 columns, plus a long joined
   "Detail" string) was forcing them past .bright-panel's edge instead of
   shrinking — the overflow then rendered outside the card rather than being
   contained, since the clipping ancestor never actually got the chance to
   clip a box that had already grown past it. min-width: 0 lets both shrink
   below their content's natural width; width/max-width: 100% then forces
   q-table's own internal width (which otherwise still sized itself off its
   content, min-width: 0 alone wasn't enough to override that) down to
   whatever .bottom-section actually has available; overflow-x: auto scrolls
   the table itself (not the card) for whatever still doesn't fit. */
.bottom-section {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  /* Quasar's "column" utility (used here and on .bright-panel) sets
     flex-flow: column wrap, not just flex-direction: column — when this
     section's content (filter row + a growing water-quality table) needed
     more height than the fixed-height card had available, it wrapped into a
     second column rendered beside the filters instead of scrolling below
     them. nowrap forces normal single-column stacking; overflow-y then
     scrolls whatever still doesn't fit vertically. */
  flex-wrap: nowrap;
  overflow-y: auto;
}
.contributions-table {
  border-radius: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
}
.detail-text {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  vertical-align: middle;
}
</style>
