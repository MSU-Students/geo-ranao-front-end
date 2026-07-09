<template>
  <q-page
    class="q-pa-md flex flex-center relative-position overflow-hidden"
    :class="{ 'suspend-glass': anyDialogOpen }"
  >
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />
    <div class="absolute-full bg-overlay" />

    <div class="z-top full-width q-pa-md" style="max-width: 1400px">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-lg">
        <div>
          <h4 class="text-weight-bolder q-my-xs text-white drop-shadow">
            <q-icon name="admin_panel_settings" class="q-mr-sm" color="teal-3" />
            Admin Dashboard
          </h4>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-ml-xs">
            Manage researcher accounts, review submitted data, and monitor platform activity
          </p>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="row q-col-gutter-md q-mb-md justify-center">
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="hourglass_top" color="orange-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ pendingAccounts.length }}</div>
            <div class="text-grey-3 text-caption">Pending Accounts</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="groups" color="teal-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ activeResearchers.length }}</div>
            <div class="text-grey-3 text-caption">Active Researchers</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="fact_check" color="blue-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ pendingUploads.length }}</div>
            <div class="text-grey-3 text-caption">Uploads Awaiting Review</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="history" color="purple-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ adminStore.activityLogs.length }}</div>
            <div class="text-grey-3 text-caption">Logged Events</div>
          </q-card>
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
        <q-tab name="pending" label="Pending Accounts" icon="hourglass_top" />
        <q-tab name="accounts" label="Researcher Accounts" icon="groups" />
        <q-tab name="reviews" label="Review History" icon="fact_check" />
        <q-tab name="logs" label="Activity Logs" icon="history" />
        <q-tab name="reports" label="Reports & Map Exports" icon="assessment" />
      </q-tabs>

      <q-separator dark class="q-mb-md" style="opacity: 0.2" />

      <q-tab-panels v-model="activeTab" animated class="bg-transparent" style="min-height: 500px">
        <!-- ═══ TAB 1: Pending Accounts ═══ -->
        <q-tab-panel name="pending" class="q-px-none">
          <q-card class="glass-morph">
            <q-card-section>
              <q-table
                :rows="pendingAccounts"
                :columns="pendingColumns"
                row-key="id"
                dark
                flat
                :rows-per-page-options="[10, 20, 50]"
                class="submissions-table"
              >
                <template #body-cell-purposeOfRequest="props">
                  <q-td :props="props">
                    <span class="ellipsis-2-lines">{{ props.row.purposeOfRequest }}</span>
                  </q-td>
                </template>
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn
                      flat round dense icon="visibility" color="grey-4" size="sm"
                      @click="openDetail(props.row)"
                    >
                      <q-tooltip>View Application</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat round dense icon="check_circle" color="positive" size="sm"
                      @click="handleApprove(props.row)"
                    >
                      <q-tooltip>Approve</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat round dense icon="cancel" color="negative" size="sm"
                      @click="handleReject(props.row)"
                    >
                      <q-tooltip>Reject</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
                <template #no-data>
                  <div class="full-width text-center text-grey-5 q-pa-lg">
                    No pending applications.
                  </div>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- ═══ TAB 2: Researcher Accounts ═══ -->
        <q-tab-panel name="accounts" class="q-px-none">
          <q-card class="glass-morph">
            <q-card-section>
              <div class="row items-center q-mb-md q-gutter-sm">
                <span class="text-grey-3 text-weight-medium q-mr-sm">Filter:</span>
                <q-btn
                  v-for="opt in accountFilterOptions"
                  :key="opt.value"
                  :color="accountFilter === opt.value ? 'teal' : 'grey-6'"
                  :flat="accountFilter !== opt.value"
                  :unelevated="accountFilter === opt.value"
                  :label="opt.label"
                  size="sm"
                  rounded
                  @click="accountFilter = opt.value"
                />
              </div>

              <q-table
                :rows="filteredAccounts"
                :columns="accountColumns"
                row-key="id"
                dark
                flat
                :rows-per-page-options="[10, 20, 50]"
                class="submissions-table"
              >
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      :color="ACCOUNT_STATUS_COLORS[props.row.status as AccountStatus]"
                      :label="props.row.status"
                    />
                  </q-td>
                </template>
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn
                      v-if="props.row.status === 'verified'"
                      flat round dense icon="block" color="warning" size="sm"
                      @click="handleRevoke(props.row)"
                    >
                      <q-tooltip>Revoke Access</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat round dense icon="delete_forever" color="negative" size="sm"
                      @click="handleDelete(props.row)"
                    >
                      <q-tooltip>Delete Account</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
                <template #no-data>
                  <div class="full-width text-center text-grey-5 q-pa-lg">No accounts found.</div>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- ═══ TAB 3: Review History (Uploads) ═══ -->
        <q-tab-panel name="reviews" class="q-px-none">
          <q-card class="glass-morph">
            <q-card-section>
              <div class="row items-center q-mb-md q-gutter-sm">
                <span class="text-grey-3 text-weight-medium q-mr-sm">Status:</span>
                <q-btn
                  v-for="opt in uploadFilterOptions"
                  :key="opt.value"
                  :color="uploadFilter === opt.value ? 'teal' : 'grey-6'"
                  :flat="uploadFilter !== opt.value"
                  :unelevated="uploadFilter === opt.value"
                  :label="opt.label"
                  size="sm"
                  rounded
                  @click="uploadFilter = opt.value"
                />
              </div>

              <q-table
                :rows="filteredUploads"
                :columns="uploadColumns"
                row-key="id"
                dark
                flat
                :rows-per-page-options="[10, 20, 50]"
                class="submissions-table"
              >
                <template #body-cell-category="props">
                  <q-td :props="props">
                    <q-badge
                      :color="props.row.category === 'Fish Observation' ? 'blue' : 'teal'"
                      :label="props.row.category"
                    />
                  </q-td>
                </template>
                <template #body-cell-status="props">
                  <q-td :props="props">
                    <q-badge
                      :color="UPLOAD_STATUS_COLORS[props.row.status as UploadReviewStatus]"
                      :label="props.row.status"
                    />
                  </q-td>
                </template>
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn
                      v-if="props.row.status === 'pending'"
                      flat round dense icon="check_circle" color="positive" size="sm"
                      @click="handleApproveUpload(props.row)"
                    >
                      <q-tooltip>Approve</q-tooltip>
                    </q-btn>
                    <q-btn
                      v-if="props.row.status === 'pending'"
                      flat round dense icon="cancel" color="negative" size="sm"
                      @click="handleRejectUpload(props.row)"
                    >
                      <q-tooltip>Reject</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat round dense icon="download" color="teal-4" size="sm"
                      @click="downloadUploadGeoJson(props.row)"
                    >
                      <q-tooltip>Download Map Data</q-tooltip>
                    </q-btn>
                  </q-td>
                </template>
                <template #no-data>
                  <div class="full-width text-center text-grey-5 q-pa-lg">No uploads found.</div>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- ═══ TAB 4: Activity Logs ═══ -->
        <q-tab-panel name="logs" class="q-px-none">
          <q-card class="glass-morph">
            <q-card-section>
              <q-input
                v-model="logSearch"
                dark
                outlined
                dense
                clearable
                placeholder="Search by researcher, action, or detail..."
                class="form-field q-mb-md"
                style="max-width: 420px"
              >
                <template #prepend><q-icon name="search" color="grey-5" /></template>
              </q-input>

              <q-table
                :rows="filteredLogs"
                :columns="logColumns"
                row-key="id"
                dark
                flat
                :rows-per-page-options="[10, 20, 50]"
                class="submissions-table"
              >
                <template #body-cell-timestamp="props">
                  <q-td :props="props">{{ formatTimestamp(props.row.timestamp) }}</q-td>
                </template>
                <template #body-cell-action="props">
                  <q-td :props="props">
                    <q-badge
                      :color="SEVERITY_COLORS[props.row.severity as ActivitySeverity]"
                      :label="props.row.action"
                    />
                  </q-td>
                </template>
                <template #no-data>
                  <div class="full-width text-center text-grey-5 q-pa-lg">No matching activity.</div>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </q-tab-panel>

        <!-- ═══ TAB 5: Reports & Map Exports ═══ -->
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
                    @click="handleGeneratePdf"
                  />
                  <q-btn
                    color="blue-7"
                    label="Export as CSV"
                    icon="table_chart"
                    unelevated
                    rounded
                    class="full-width q-py-sm q-mt-sm"
                    @click="handleExportCsv"
                  />
                </q-card-section>
              </q-card>
            </div>

            <!-- Map Exports -->
            <div class="col-12 col-md-6">
              <q-card class="glass-morph full-height">
                <q-card-section>
                  <div class="text-white text-h6 text-weight-bold q-mb-md">
                    <q-icon name="map" color="teal-3" class="q-mr-sm" />
                    Map Exports
                  </div>
                  <p class="text-grey-4 text-caption q-mb-md">
                    Download geospatial data for reviewed submissions or the lake boundary layer.
                  </p>

                  <q-btn
                    color="teal"
                    label="Download All Reviewed Uploads (GeoJSON)"
                    icon="scatter_plot"
                    unelevated
                    rounded
                    class="full-width q-py-sm"
                    @click="handleDownloadReviewedMap"
                  />
                  <q-btn
                    color="blue-7"
                    label="Download Lake Boundary (GeoJSON)"
                    icon="polyline"
                    unelevated
                    rounded
                    class="full-width q-py-sm q-mt-sm"
                    @click="void handleDownloadLakeBoundary()"
                  />
                </q-card-section>
              </q-card>
            </div>

            <!-- Recent Exports -->
            <div class="col-12">
              <q-card class="glass-morph">
                <q-card-section>
                  <div class="text-white text-h6 text-weight-bold q-mb-md">
                    <q-icon name="history" color="teal-3" class="q-mr-sm" />
                    Recent Reports & Downloads
                  </div>

                  <q-list dark separator>
                    <q-item v-for="entry in recentExports" :key="entry.id" class="report-item">
                      <q-item-section avatar>
                        <q-icon
                          :name="entry.action === 'Downloaded Map' ? 'map' : 'description'"
                          color="teal-4"
                          size="sm"
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-white text-weight-medium">
                          {{ entry.detail }}
                        </q-item-label>
                        <q-item-label caption class="text-grey-4">
                          {{ entry.action }} — {{ formatTimestamp(entry.timestamp) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="recentExports.length === 0">
                      <q-item-section class="text-grey-5">
                        No reports or map exports generated yet.
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

    <!-- Reason Dialog (Reject / Revoke) -->
    <q-dialog v-model="reasonDialog.show">
      <q-card
        style="
          min-width: 420px;
          max-width: 90vw;
          background: #ffffff;
          isolation: isolate;
          transform: translateZ(0);
        ">
        <q-card-section>
          <div class="text-h6">{{ reasonDialog.title }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="reasonDialog.reason"
            type="textarea"
            autogrow
            filled
            label="Reason (optional)"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            :label="reasonDialog.confirmLabel"
            :color="reasonDialog.confirmColor"
            v-close-popup
            @click="confirmReasonDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Application Detail Dialog -->
    <q-dialog v-model="detailDialogShow">
      <q-card
        style="
          min-width: 420px;
          max-width: 90vw;
          background: #ffffff;
          isolation: isolate;
          transform: translateZ(0);
        " v-if="detailAccount">
        <q-card-section>
          <div class="text-h6">{{ detailAccount.fullName }}</div>
          <div class="text-caption text-grey-7">{{ detailAccount.email }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-sm">
          <div><b>Affiliation:</b> {{ detailAccount.affiliation }}</div>
          <div v-if="detailAccount.departmentRole">
            <b>Department / Role:</b> {{ detailAccount.departmentRole }}
          </div>
          <div><b>Purpose of Request:</b><br />{{ detailAccount.purposeOfRequest }}</div>
          <div><b>Submitted:</b> {{ detailAccount.submittedDate }}</div>
          <div v-if="detailAccount.reviewNote"><b>Review Note:</b> {{ detailAccount.reviewNote }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="grey-7" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import {
  useAdminStore,
  type ResearcherAccount,
  type UploadReviewItem,
  type AccountStatus,
  type UploadReviewStatus,
  type ActivitySeverity,
} from 'src/stores/admin';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();

// ─── Access Guard ───
onMounted(() => {
  if (authStore.user?.role !== 'Admin') {
    $q.notify({ type: 'negative', message: 'Admin access required.', position: 'top' });
    router.replace('/').catch((err) => {
      console.error('Navigation error:', err);
    });
  }
});

const activeTab = ref('pending');

// ─── Derived Lists ───
const pendingAccounts = computed(() =>
  adminStore.researcherAccounts.filter((a) => a.status === 'pending'),
);
const activeResearchers = computed(() =>
  adminStore.researcherAccounts.filter((a) => a.status === 'verified'),
);
const pendingUploads = computed(() => adminStore.uploadReviews.filter((u) => u.status === 'pending'));

// ─── Colors ───
const ACCOUNT_STATUS_COLORS: Record<AccountStatus, string> = {
  pending: 'orange',
  verified: 'positive',
  suspended: 'warning',
  rejected: 'negative',
};
const UPLOAD_STATUS_COLORS: Record<UploadReviewStatus, string> = {
  pending: 'orange',
  approved: 'positive',
  rejected: 'negative',
};
const SEVERITY_COLORS: Record<ActivitySeverity, string> = {
  neutral: 'blue-grey-6',
  positive: 'positive',
  warning: 'warning',
  negative: 'negative',
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

// ─── Table Columns ───
const pendingColumns = [
  { name: 'fullName', label: 'Applicant', field: 'fullName', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const },
  { name: 'affiliation', label: 'Affiliation', field: 'affiliation', align: 'left' as const, sortable: true },
  { name: 'purposeOfRequest', label: 'Purpose of Request', field: 'purposeOfRequest', align: 'left' as const },
  { name: 'submittedDate', label: 'Submitted', field: 'submittedDate', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

const accountColumns = [
  { name: 'fullName', label: 'Researcher', field: 'fullName', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const },
  { name: 'affiliation', label: 'Affiliation', field: 'affiliation', align: 'left' as const, sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const, sortable: true },
  { name: 'submittedDate', label: 'Submitted', field: 'submittedDate', align: 'center' as const, sortable: true },
  { name: 'reviewedDate', label: 'Reviewed', field: 'reviewedDate', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

const uploadColumns = [
  { name: 'researcher', label: 'Researcher', field: 'researcher', align: 'left' as const, sortable: true },
  { name: 'category', label: 'Category', field: 'category', align: 'center' as const, sortable: true },
  { name: 'title', label: 'Submission', field: 'title', align: 'left' as const },
  { name: 'location', label: 'Coordinates', field: 'location', align: 'left' as const },
  { name: 'submittedDate', label: 'Submitted', field: 'submittedDate', align: 'center' as const, sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

const logColumns = [
  { name: 'timestamp', label: 'Timestamp', field: 'timestamp', align: 'left' as const, sortable: true },
  { name: 'actor', label: 'Actor', field: 'actor', align: 'left' as const, sortable: true },
  { name: 'action', label: 'Action', field: 'action', align: 'center' as const, sortable: true },
  { name: 'detail', label: 'Detail', field: 'detail', align: 'left' as const },
];

// ─── Researcher Accounts Filter ───
const accountFilter = ref<'all' | AccountStatus>('all');
const accountFilterOptions: { label: string; value: 'all' | AccountStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Rejected', value: 'rejected' },
];
const filteredAccounts = computed(() =>
  adminStore.researcherAccounts.filter((a) => {
    if (a.status === 'pending') return false;
    return accountFilter.value === 'all' || a.status === accountFilter.value;
  }),
);

// ─── Review History Filter ───
const uploadFilter = ref<'all' | UploadReviewStatus>('all');
const uploadFilterOptions: { label: string; value: 'all' | UploadReviewStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];
const filteredUploads = computed(() =>
  adminStore.uploadReviews.filter(
    (u) => uploadFilter.value === 'all' || u.status === uploadFilter.value,
  ),
);

// ─── Activity Logs Search ───
const logSearch = ref('');
const filteredLogs = computed(() => {
  const needle = logSearch.value.trim().toLowerCase();
  if (!needle) return adminStore.activityLogs;
  return adminStore.activityLogs.filter(
    (l) =>
      l.actor.toLowerCase().includes(needle) ||
      l.action.toLowerCase().includes(needle) ||
      l.detail.toLowerCase().includes(needle),
  );
});

// ─── Reason Dialog (shared by Reject / Revoke actions) ───
const reasonDialog = reactive<{
  show: boolean;
  title: string;
  reason: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: ((reason: string) => void) | null;
}>({
  show: false,
  title: '',
  reason: '',
  confirmLabel: 'Confirm',
  confirmColor: 'primary',
  onConfirm: null,
});

function openReasonDialog(
  title: string,
  confirmLabel: string,
  confirmColor: string,
  onConfirm: (reason: string) => void,
) {
  reasonDialog.title = title;
  reasonDialog.reason = '';
  reasonDialog.confirmLabel = confirmLabel;
  reasonDialog.confirmColor = confirmColor;
  reasonDialog.onConfirm = onConfirm;
  reasonDialog.show = true;
}

function confirmReasonDialog() {
  reasonDialog.onConfirm?.(reasonDialog.reason.trim());
}

// ─── Application Detail Dialog ───
const detailAccount = ref<ResearcherAccount | null>(null);
const detailDialogShow = ref(false);
function openDetail(account: ResearcherAccount) {
  detailAccount.value = account;
  detailDialogShow.value = true;
}

// Chrome can mis-composite backdrop-filter blur behind a fixed-position
// dialog, letting the blurred cards show through it. Dropping the blur
// while any dialog is open avoids the glitch entirely.
const anyDialogOpen = computed(() => reasonDialog.show || detailDialogShow.value);

// ─── Account Actions ───
function handleApprove(account: ResearcherAccount) {
  adminStore.approveAccount(account.id);
  $q.notify({ type: 'positive', message: `${account.fullName} approved.`, position: 'top' });
}

function handleReject(account: ResearcherAccount) {
  openReasonDialog(`Reject ${account.fullName}'s application?`, 'Reject', 'negative', (reason) => {
    adminStore.rejectAccount(account.id, reason);
    $q.notify({ type: 'negative', message: `${account.fullName} rejected.`, position: 'top' });
  });
}

function handleRevoke(account: ResearcherAccount) {
  openReasonDialog(
    `Revoke ${account.fullName}'s researcher access?`,
    'Revoke',
    'warning',
    (reason) => {
      adminStore.revokeAccount(account.id, reason);
      $q.notify({ type: 'warning', message: `${account.fullName}'s access revoked.`, position: 'top' });
    },
  );
}

function handleDelete(account: ResearcherAccount) {
  $q.dialog({
    title: 'Delete Account',
    message: `Permanently delete ${account.fullName}'s account? This cannot be undone.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Delete', color: 'negative', flat: true },
  }).onOk(() => {
    adminStore.deleteAccount(account.id);
    $q.notify({ type: 'negative', message: `${account.fullName}'s account deleted.`, position: 'top' });
  });
}

// ─── Upload Review Actions ───
function handleApproveUpload(item: UploadReviewItem) {
  adminStore.reviewUpload(item.id, 'approved');
  $q.notify({ type: 'positive', message: 'Upload approved.', position: 'top' });
}

function handleRejectUpload(item: UploadReviewItem) {
  openReasonDialog(`Reject "${item.title}"?`, 'Reject', 'negative', (reason) => {
    adminStore.reviewUpload(item.id, 'rejected', reason);
    $q.notify({ type: 'negative', message: 'Upload rejected.', position: 'top' });
  });
}

// ─── File Download Helper ───
function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadUploadGeoJson(item: UploadReviewItem) {
  const [lat, lng] = item.location.split(',').map((s) => parseFloat(s.trim()));
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          researcher: item.researcher,
          category: item.category,
          title: item.title,
          status: item.status,
          submittedDate: item.submittedDate,
        },
        geometry: { type: 'Point', coordinates: [lng, lat] },
      },
    ],
  };
  triggerDownload(
    JSON.stringify(geojson, null, 2),
    `${item.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.geojson`,
    'application/geo+json',
  );
  adminStore.recordMapDownload('Admin', `${item.title} (map data)`);
  $q.notify({ type: 'positive', message: 'Map data downloaded.', position: 'top' });
}

// ─── Reports Tab ───
const reportType = ref('Account Activity Summary');
const dateRange = ref('All Time');

const reportTypeOptions = ['Account Activity Summary', 'Researcher Roster', 'Upload Review Summary'];
const dateRangeOptions = ['Last 30 Days', 'Last 6 Months', 'Year 2025', 'All Time'];

function toCsv(rows: Record<string, unknown>[], headers: { label: string; field: string }[]): string {
  const escape = (v: unknown) => {
    const str = v === null || v === undefined ? '' : String(v as string | number | boolean);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map((h) => escape(h.label)).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h.field])).join(','));
  }
  return lines.join('\n');
}

function handleExportCsv() {
  let rows: Record<string, unknown>[];
  let headers: { label: string; field: string }[];
  let filename: string;
  let label: string;

  if (reportType.value === 'Researcher Roster') {
    rows = adminStore.researcherAccounts;
    headers = [
      { label: 'Full Name', field: 'fullName' },
      { label: 'Email', field: 'email' },
      { label: 'Affiliation', field: 'affiliation' },
      { label: 'Status', field: 'status' },
      { label: 'Submitted', field: 'submittedDate' },
      { label: 'Reviewed', field: 'reviewedDate' },
    ];
    filename = 'researcher-roster.csv';
    label = 'Researcher Roster (CSV)';
  } else if (reportType.value === 'Upload Review Summary') {
    rows = adminStore.uploadReviews;
    headers = [
      { label: 'Researcher', field: 'researcher' },
      { label: 'Category', field: 'category' },
      { label: 'Title', field: 'title' },
      { label: 'Status', field: 'status' },
      { label: 'Submitted', field: 'submittedDate' },
    ];
    filename = 'upload-review-summary.csv';
    label = 'Upload Review Summary (CSV)';
  } else {
    rows = adminStore.activityLogs;
    headers = [
      { label: 'Timestamp', field: 'timestamp' },
      { label: 'Actor', field: 'actor' },
      { label: 'Action', field: 'action' },
      { label: 'Detail', field: 'detail' },
    ];
    filename = 'activity-log.csv';
    label = 'Account Activity Summary (CSV)';
  }

  triggerDownload(toCsv(rows, headers), filename, 'text/csv');
  adminStore.recordReportGenerated('Admin', label);
  $q.notify({ type: 'positive', message: `${label} downloaded.`, position: 'top' });
}

function handleGeneratePdf() {
  const label = `${reportType.value} (PDF)`;
  adminStore.recordReportGenerated('Admin', label);
  $q.notify({
    type: 'info',
    message: 'PDF report generation is not connected to a backend yet.',
    caption: 'This request was logged — use "Export as CSV" for a real download.',
    position: 'top',
    timeout: 4000,
  });
}

function handleDownloadReviewedMap() {
  const features = adminStore.uploadReviews.map((u) => {
    const [lat, lng] = u.location.split(',').map((s) => parseFloat(s.trim()));
    return {
      type: 'Feature',
      properties: {
        researcher: u.researcher,
        category: u.category,
        title: u.title,
        status: u.status,
        submittedDate: u.submittedDate,
      },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    };
  });
  const geojson = { type: 'FeatureCollection', features };
  triggerDownload(JSON.stringify(geojson, null, 2), 'reviewed-uploads-map.geojson', 'application/geo+json');
  adminStore.recordMapDownload('Admin', 'All Reviewed Uploads (GeoJSON)');
  $q.notify({ type: 'positive', message: 'Map data downloaded.', position: 'top' });
}

async function handleDownloadLakeBoundary() {
  try {
    const res = await fetch('/geo/lake-lanao.geojson');
    const text = await res.text();
    triggerDownload(text, 'lake-lanao.geojson', 'application/geo+json');
    adminStore.recordMapDownload('Admin', 'Lake Lanao Boundary (GeoJSON)');
    $q.notify({ type: 'positive', message: 'Lake boundary map downloaded.', position: 'top' });
  } catch (err) {
    console.error('Failed to download lake boundary:', err);
    $q.notify({ type: 'negative', message: 'Failed to download lake boundary.', position: 'top' });
  }
}

const recentExports = computed(() =>
  adminStore.activityLogs
    .filter((l) => l.action === 'Generated Report' || l.action === 'Downloaded Map')
    .slice(0, 6),
);
</script>

<style scoped>
.glass-morph {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  /* Isolates each blurred card on its own compositor layer — without this,
     Chrome can mis-order backdrop-filter blur against a later-painted
     fixed-position q-dialog and let the blurred content bleed through it. */
  transform: translateZ(0);
  isolation: isolate;
}

/* While a q-dialog is open, drop the blur so Chrome has nothing to
   mis-composite behind the fixed-position dialog. */
.suspend-glass .glass-morph {
  backdrop-filter: none !important;
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

.form-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06);
}

.form-field :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.5);
}

.report-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 320px;
}

.z-top {
  position: relative;
  z-index: 1;
}
</style>
