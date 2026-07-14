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
            <q-icon name="science" class="q-mr-sm" color="teal-3" />
            Researcher Portal
          </h4>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-ml-xs">
            Submit, manage, and review ecological field data for Lake Lanao
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

      <!-- Tab Navigation -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-4 q-mb-md"
        active-color="teal-4"
        indicator-color="teal"
        narrow-indicator
        align="left"
      >
        <q-tab name="all" label="All Submissions" icon="list_alt" />
        <q-tab v-if="authStore.isLoggedIn" name="my" label="My Submissions" icon="assignment_ind" />
        <q-tab name="reports" label="Reports & Exports" icon="assessment" />
      </q-tabs>

      <q-separator dark class="q-mb-md" style="opacity: 0.2" />

      <!-- Tab Panels -->
      <q-tab-panels
        v-model="activeTab"
        animated
        class="bg-transparent"
        style="min-height: 500px"
      >
        <!-- ===== TAB 1: All Submissions ===== -->
        <q-tab-panel name="all" class="q-px-none">
          <q-card class="glass-morph">
            <q-card-section>
              <!-- Filter Chips -->
              <div class="row items-center q-mb-md q-gutter-sm">
                <span class="text-grey-3 text-weight-medium q-mr-sm">Filter:</span>
                <q-btn
                  :color="activeFilter === 'all' ? 'teal' : 'grey-6'"
                  :flat="activeFilter !== 'all'"
                  :unelevated="activeFilter === 'all'"
                  label="All"
                  size="sm"
                  rounded
                  @click="activeFilter = 'all'"
                />
                <q-btn
                  :color="activeFilter === 'endemic' ? 'blue' : 'grey-6'"
                  :flat="activeFilter !== 'endemic'"
                  :unelevated="activeFilter === 'endemic'"
                  label="Endemic"
                  size="sm"
                  rounded
                  @click="activeFilter = 'endemic'"
                />
                <q-btn
                  :color="activeFilter === 'invasive' ? 'orange' : 'grey-6'"
                  :flat="activeFilter !== 'invasive'"
                  :unelevated="activeFilter === 'invasive'"
                  label="Invasive"
                  size="sm"
                  rounded
                  @click="activeFilter = 'invasive'"
                />
              </div>

              <!-- Data Table -->
              <q-table
                :rows="filteredAllSubmissions"
                :columns="allTableColumns"
                row-key="id"
                dark
                flat
                :rows-per-page-options="[10, 20, 50]"
                class="submissions-table"
              >
                <!-- Researcher column -->
                <template #body-cell-researcher="props">
                  <q-td :props="props">
                    <div class="row items-center no-wrap q-gutter-xs">
                      <q-avatar size="22px" color="teal-8" text-color="white">
                        <q-icon name="person" size="14px" />
                      </q-avatar>
                      <span>{{ props.row.researcher }}</span>
                    </div>
                  </q-td>
                </template>

                <!-- Type column badge -->
                <template #body-cell-type="props">
                  <q-td :props="props">
                    <q-badge
                      :color="props.row.type === 'endemic' ? 'blue' : 'orange'"
                      :label="props.row.type === 'endemic' ? 'Endemic' : 'Invasive'"
                    />
                  </q-td>
                </template>

                <!-- Conservation Status badge -->
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      :color="getStatusColor(props.row.status)"
                      :label="props.row.status"
                    />
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- ===== TAB 2: My Submissions (logged in only) ===== -->
        <q-tab-panel v-if="authStore.isLoggedIn" name="my" class="q-px-none">
          <q-card class="glass-morph">
            <q-card-section>
              <!-- Filter Chips -->
              <div class="row items-center q-mb-md q-gutter-sm">
                <span class="text-grey-3 text-weight-medium q-mr-sm">Filter:</span>
                <q-btn
                  :color="myFilter === 'all' ? 'teal' : 'grey-6'"
                  :flat="myFilter !== 'all'"
                  :unelevated="myFilter === 'all'"
                  label="All"
                  size="sm"
                  rounded
                  @click="myFilter = 'all'"
                />
                <q-btn
                  :color="myFilter === 'endemic' ? 'blue' : 'grey-6'"
                  :flat="myFilter !== 'endemic'"
                  :unelevated="myFilter === 'endemic'"
                  label="Endemic"
                  size="sm"
                  rounded
                  @click="myFilter = 'endemic'"
                />
                <q-btn
                  :color="myFilter === 'invasive' ? 'orange' : 'grey-6'"
                  :flat="myFilter !== 'invasive'"
                  :unelevated="myFilter === 'invasive'"
                  label="Invasive"
                  size="sm"
                  rounded
                  @click="myFilter = 'invasive'"
                />
              </div>

              <!-- Data Table -->
              <q-table
                :rows="filteredMySubmissions"
                :columns="myTableColumns"
                row-key="id"
                dark
                flat
                :rows-per-page-options="[10, 20, 50]"
                class="submissions-table"
              >
                <!-- Type column badge -->
                <template #body-cell-type="props">
                  <q-td :props="props">
                    <q-badge
                      :color="props.row.type === 'endemic' ? 'blue' : 'orange'"
                      :label="props.row.type === 'endemic' ? 'Endemic' : 'Invasive'"
                    />
                  </q-td>
                </template>

                <!-- Conservation Status badge -->
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      :color="getStatusColor(props.row.status)"
                      :label="props.row.status"
                    />
                  </q-td>
                </template>

                <!-- Actions column -->
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn
                      flat
                      round
                      dense
                      icon="edit"
                      color="teal"
                      size="sm"
                      @click="handleEdit(props.row)"
                    >
                      <q-tooltip>Edit</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="red"
                      size="sm"
                      @click="handleDelete(props.row.id)"
                    >
                      <q-tooltip>Delete</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- ===== TAB 3: Reports & Exports ===== -->
        <q-tab-panel name="reports" class="q-px-none">
          <div class="row q-col-gutter-md">
            <!-- Generate Report -->
            <div class="col-12 col-md-6">
              <q-card class="glass-morph full-height">
                <q-card-section>
                  <div class="text-white text-h6 text-weight-bold q-mb-md">
                    <q-icon name="summarize" color="teal-3" class="q-mr-sm" />
                    Generate Report
                  </div>

                  <q-select
                    v-model="reportType"
                    :options="reportTypeOptions"
                    label="Report Type"
                    dark
                    outlined
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

                  <q-btn
                    color="teal"
                    label="Generate PDF Report"
                    icon="picture_as_pdf"
                    unelevated
                    rounded
                    class="full-width q-py-sm"
                  />
                  <q-btn
                    color="blue-7"
                    label="Export as CSV"
                    icon="table_chart"
                    unelevated
                    rounded
                    class="full-width q-py-sm q-mt-sm"
                  />
                </q-card-section>
              </q-card>
            </div>

            <!-- Recent Reports -->
            <div class="col-12 col-md-6">
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
                          {{ report.title }}
                        </q-item-label>
                        <q-item-label caption class="text-grey-4">
                          {{ report.caption }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn
                          flat
                          round
                          dense
                          icon="download"
                          color="teal"
                          size="sm"
                        >
                          <q-tooltip>Download</q-tooltip>
                        </q-btn>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';

const $q = useQuasar();
const route = useRoute();
const authStore = useAuthStore();

// ─── Tab State ───
const activeTab = ref('all');

onMounted(() => {
  if (route.query.tab === 'my' && authStore.isLoggedIn) {
    activeTab.value = 'my';
  }
});

// ─── Submission Interface ───
interface Submission {
  id: number;
  commonName: string;
  scientificName: string;
  type: 'endemic' | 'invasive';
  status: string;
  length: string;
  weight: string;
  location: string;
  date: string;
  researcher: string;
}

// ─── All Submissions Data (from multiple researchers) ───
const allSubmissions = ref<Submission[]>([
  {
    id: 1,
    commonName: 'Pait',
    scientificName: 'Puntius sirang',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '10',
    weight: '35',
    location: '7.9900, 124.0500',
    date: '2025-05-12',
    researcher: 'Jollymar A. Mark',
  },
  {
    id: 2,
    commonName: 'Igat',
    scientificName: 'Anguilla marmorata',
    type: 'endemic',
    status: 'Endangered',
    length: '78',
    weight: '1800',
    location: '8.0200, 124.0800',
    date: '2025-04-28',
    researcher: 'Dr. Juan Dela Cruz',
  },
  {
    id: 3,
    commonName: 'Banak',
    scientificName: 'Puntius lanaoensis',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '12',
    weight: '55',
    location: '7.9500, 124.0200',
    date: '2025-06-01',
    researcher: 'Jollymar A. Mark',
  },
  {
    id: 4,
    commonName: 'Nile Tilapia',
    scientificName: 'Oreochromis niloticus',
    type: 'invasive',
    status: 'Least Concern',
    length: '28',
    weight: '850',
    location: '8.0000, 124.0400',
    date: '2025-06-10',
    researcher: 'Maria S. Santos',
  },
  {
    id: 5,
    commonName: 'Common Carp',
    scientificName: 'Cyprinus carpio',
    type: 'invasive',
    status: 'Least Concern',
    length: '42',
    weight: '2200',
    location: '7.9700, 124.1000',
    date: '2025-03-18',
    researcher: 'Dr. Juan Dela Cruz',
  },
  {
    id: 6,
    commonName: 'Ludong',
    scientificName: 'Puntius tumba',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '9',
    weight: '28',
    location: '8.0100, 124.1200',
    date: '2025-05-22',
    researcher: 'Maria S. Santos',
  },
  {
    id: 7,
    commonName: 'Tarong',
    scientificName: 'Puntius tras',
    type: 'endemic',
    status: 'Endangered',
    length: '11',
    weight: '45',
    location: '7.9600, 124.0600',
    date: '2025-06-15',
    researcher: 'Jollymar A. Mark',
  },
  {
    id: 8,
    commonName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    type: 'invasive',
    status: 'Least Concern',
    length: '3',
    weight: '2',
    location: '8.0300, 124.0700',
    date: '2025-04-05',
    researcher: 'Dr. Juan Dela Cruz',
  },
]);

// ─── My Submissions (logged-in user only) ───
const mySubmissions = ref<Submission[]>([
  {
    id: 101,
    commonName: 'Pait',
    scientificName: 'Puntius sirang',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '10',
    weight: '35',
    location: '7.9900, 124.0500',
    date: '2025-05-12',
    researcher: 'You',
  },
  {
    id: 102,
    commonName: 'Banak',
    scientificName: 'Puntius lanaoensis',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '12',
    weight: '55',
    location: '7.9500, 124.0200',
    date: '2025-06-01',
    researcher: 'You',
  },
  {
    id: 103,
    commonName: 'Nile Tilapia',
    scientificName: 'Oreochromis niloticus',
    type: 'invasive',
    status: 'Least Concern',
    length: '28',
    weight: '850',
    location: '8.0000, 124.0400',
    date: '2025-06-10',
    researcher: 'You',
  },
  {
    id: 104,
    commonName: 'Tarong',
    scientificName: 'Puntius tras',
    type: 'endemic',
    status: 'Endangered',
    length: '11',
    weight: '45',
    location: '7.9600, 124.0600',
    date: '2025-06-15',
    researcher: 'You',
  },
]);

// ─── Table Columns (All Submissions — includes Researcher) ───
const allTableColumns = [
  { name: 'id', label: '#', field: 'id', align: 'left' as const, sortable: true },
  { name: 'researcher', label: 'Researcher', field: 'researcher', align: 'left' as const, sortable: true },
  { name: 'commonName', label: 'Species (Common Name)', field: 'commonName', align: 'left' as const, sortable: true },
  { name: 'scientificName', label: 'Scientific Name', field: 'scientificName', align: 'left' as const, sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'center' as const, sortable: true },
  { name: 'status', label: 'Conservation Status', field: 'status', align: 'center' as const, sortable: true },
  { name: 'length', label: 'Length (cm)', field: 'length', align: 'center' as const, sortable: true },
  { name: 'weight', label: 'Weight (g)', field: 'weight', align: 'center' as const, sortable: true },
  { name: 'location', label: 'Coordinates', field: 'location', align: 'left' as const },
  { name: 'date', label: 'Date Observed', field: 'date', align: 'center' as const, sortable: true },
];

// ─── Table Columns (My Submissions — includes Actions) ───
const myTableColumns = [
  { name: 'id', label: '#', field: 'id', align: 'left' as const, sortable: true },
  { name: 'commonName', label: 'Species (Common Name)', field: 'commonName', align: 'left' as const, sortable: true },
  { name: 'scientificName', label: 'Scientific Name', field: 'scientificName', align: 'left' as const, sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'center' as const, sortable: true },
  { name: 'status', label: 'Conservation Status', field: 'status', align: 'center' as const, sortable: true },
  { name: 'length', label: 'Length (cm)', field: 'length', align: 'center' as const, sortable: true },
  { name: 'weight', label: 'Weight (g)', field: 'weight', align: 'center' as const, sortable: true },
  { name: 'location', label: 'Coordinates', field: 'location', align: 'left' as const },
  { name: 'date', label: 'Date Observed', field: 'date', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

// ─── Table Filters ───
const activeFilter = ref('all');
const myFilter = ref('all');

const filteredAllSubmissions = computed(() =>
  allSubmissions.value.filter((f) => {
    if (activeFilter.value === 'all') return true;
    return f.type === activeFilter.value;
  }),
);

const filteredMySubmissions = computed(() =>
  mySubmissions.value.filter((f) => {
    if (myFilter.value === 'all') return true;
    return f.type === myFilter.value;
  }),
);

function getStatusColor(status: string): string {
  switch (status) {
    case 'Critically Endangered': return 'red';
    case 'Endangered': return 'orange';
    case 'Vulnerable': return 'yellow-8';
    case 'Least Concern': return 'green';
    default: return 'grey';
  }
}

// ─── Action Stubs ───
function handleEdit(fish: Submission) {
  $q.notify({
    message: `Editing record for ${fish.commonName}...`,
    color: 'teal',
    icon: 'edit',
    position: 'top',
    timeout: 2000,
  });
  console.log('Edit:', fish);
}

function handleDelete(id: number) {
  $q.notify({
    message: `Record #${id} deleted.`,
    color: 'red-6',
    icon: 'delete',
    position: 'top',
    timeout: 2000,
  });
  mySubmissions.value = mySubmissions.value.filter((s) => s.id !== id);
  console.log('Deleted:', id);
}

// ─── Reports Tab ───
const reportType = ref(null);
const dateRange = ref(null);

const reportTypeOptions = [
  'Species Summary',
  'Conservation Status Report',
  'Invasive Species Alert',
  'Water Quality Correlation',
];

const dateRangeOptions = [
  'Last 30 Days',
  'Last 6 Months',
  'Year 2024',
  'All Time',
];

const recentReports = [
  { id: 1, title: 'Species Summary — June 2025', caption: 'Generated by Jollymar A. Mark' },
  { id: 2, title: 'Conservation Status Report — Q2 2025', caption: 'Generated by Dr. Juan Dela Cruz' },
  { id: 3, title: 'Invasive Species Alert — May 2025', caption: 'Generated by Maria S. Santos' },
  { id: 4, title: 'Water Quality Correlation — 2024', caption: 'Generated by Dr. Juan Dela Cruz' },
];
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

/* Table styling */
.submissions-table {
  background: transparent !important;
}

.submissions-table :deep(.q-table__top),
.submissions-table :deep(.q-table__bottom),
.submissions-table :deep(thead tr th) {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
}

.submissions-table :deep(tbody tr td) {
  color: rgba(255, 255, 255, 0.85);
}

.submissions-table :deep(tbody tr:hover td) {
  background: rgba(255, 255, 255, 0.08);
}

.submissions-table :deep(.q-table__bottom) {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
