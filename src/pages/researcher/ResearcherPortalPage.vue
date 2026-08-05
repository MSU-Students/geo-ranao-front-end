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
            Reports &amp; Exports
          </h4>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-ml-xs">
            Generate and download research reports for Lake Lanao field data
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
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';

const authStore = useAuthStore();

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
