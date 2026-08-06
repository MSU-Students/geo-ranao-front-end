<template>
  <q-dialog v-model="show" persistent>
    <q-card style="width: 700px; max-width: 90vw; border-radius: 12px; overflow: hidden;">
      <q-card-section class="bg-teal-9 text-white row items-center q-pa-md">
        <div class="text-h6 row items-center">
          <q-icon name="cloud_upload" size="24px" class="q-mr-sm" />
          Upload Research Data
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cancelUpload" />
      </q-card-section>

      <q-stepper
        v-model="step"
        color="teal-8"
        animated
        flat
        header-class="text-weight-bold"
      >
        <!-- STEP 1: Select Data Type -->
        <q-step
          :name="1"
          title="Select Data Type"
          icon="category"
          :done="step > 1"
        >
          <div class="text-h6 text-teal-10 q-mb-sm text-center">What type of data are you uploading?</div>
          <div class="text-body2 text-grey-7 text-center q-mb-lg">Select the appropriate category for your dataset to ensure correct processing.</div>

          <div class="row q-col-gutter-lg justify-center q-pa-md">
            <div class="col-12 col-sm-6">
              <q-card
                class="type-selector-card cursor-pointer"
                :class="{ 'active': selectedDataType === 'fish' }"
                flat bordered
                @click="selectDataType('fish')"
              >
                <q-card-section class="column items-center q-pa-lg text-center">
                  <q-icon name="phishing" size="64px" color="teal-6" class="q-mb-md" />
                  <div class="text-h6 text-grey-9">Fish Observation</div>
                  <div class="text-caption text-grey-6 q-mt-sm">Species count, invasive species, fish catch records</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-6">
              <q-card
                class="type-selector-card cursor-pointer"
                :class="{ 'active': selectedDataType === 'water' }"
                flat bordered
                @click="selectDataType('water')"
              >
                <q-card-section class="column items-center q-pa-lg text-center">
                  <q-icon name="water_drop" size="64px" color="blue-6" class="q-mb-md" />
                  <div class="text-h6 text-grey-9">Water Quality</div>
                  <div class="text-caption text-grey-6 q-mt-sm">pH, temperature, dissolved oxygen, nutrients</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-stepper-navigation class="text-right">
            <q-btn unelevated color="teal-9" label="Continue" @click="step = 2" :disable="!selectedDataType" />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP 2: Choose Method -->
        <q-step
          :name="2"
          title="Choose Method"
          icon="tune"
          :done="step > 2"
        >
          <div class="text-h6 text-teal-10 q-mb-sm text-center">How would you like to submit your data?</div>
          <div class="text-body2 text-grey-7 text-center q-mb-lg">
            Fill out a guided form one record at a time, or upload a spreadsheet with many records at once.
          </div>

          <div class="row q-col-gutter-lg justify-center q-pa-md">
            <div class="col-12 col-sm-6">
              <q-card class="type-selector-card cursor-pointer" flat bordered @click="chooseMethod('manual')">
                <q-card-section class="column items-center q-pa-lg text-center">
                  <q-icon name="edit_note" size="64px" color="teal-6" class="q-mb-md" />
                  <div class="text-h6 text-grey-9">Manual Input</div>
                  <div class="text-caption text-grey-6 q-mt-sm">Fill out a guided form for a single record</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-6">
              <q-card class="type-selector-card cursor-pointer" flat bordered @click="chooseMethod('file')">
                <q-card-section class="column items-center q-pa-lg text-center">
                  <q-icon name="upload_file" size="64px" color="blue-6" class="q-mb-md" />
                  <div class="text-h6 text-grey-9">File Upload</div>
                  <div class="text-caption text-grey-6 q-mt-sm">Upload a spreadsheet with multiple records</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-stepper-navigation class="text-right">
            <q-btn flat color="grey-8" label="Back" @click="handleBackFromMethod" />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP 3: File Upload -->
        <q-step
          :name="3"
          title="Upload File"
          icon="upload_file"
          :done="step > 3"
        >
          <!-- Template download banner -->
          <div class="template-banner q-mb-lg">
            <div class="row items-center">
              <q-icon name="description" :color="selectedDataType === 'fish' ? 'teal-7' : 'blue-7'" size="22px" class="q-mr-sm" />
              <div class="col">
                <div class="text-weight-medium text-grey-9" style="font-size:0.85rem;">
                  Don't have the template?
                </div>
                <div class="text-grey-6" style="font-size:0.75rem;">
                  Download the official {{ selectedDataType === 'fish' ? 'Fish Observation' : 'Water Quality' }} Excel template
                </div>
                <div v-if="selectedDataType === 'water'" class="text-grey-6 q-mt-xs" style="font-size:0.72rem;">
                  <q-icon name="info" size="12px" class="q-mr-xs" />
                  <strong>site_id</strong>, <strong>date</strong> (YYYY-MM-DD), and <strong>depth_m</strong> are required for every row — everything else may be left blank.
                </div>
              </div>
              <q-btn
                flat
                dense
                icon="download"
                label="Download Template"
                :color="selectedDataType === 'fish' ? 'teal-7' : 'blue-7'"
                size="sm"
                @click="downloadTemplate"
              />
            </div>
          </div>

          <!-- Drag & Drop Zone -->
          <div
            class="upload-dropzone column items-center justify-center q-pa-xl cursor-pointer"
            :class="{ 'has-file': !!uploadFile, 'has-error': !!uploadError }"
            @dragover.prevent
            @drop="handleFileDrop"
            @click="!uploadFile && triggerFileUpload()"
          >
            <input
              type="file"
              ref="fileInputEl"
              class="hidden"
              accept=".xlsx,.xls"
              @change="handleFileInput"
            />

            <template v-if="!uploadFile">
              <div class="drop-icon-bg q-mb-md flex flex-center">
                <q-icon name="cloud_upload" size="48px" :color="selectedDataType === 'fish' ? 'teal-5' : 'blue-5'" />
              </div>
              <div class="text-h6 text-grey-9 q-mb-xs">Click or drag Excel file to upload</div>
              <div class="text-body2 text-grey-6">Only .xlsx or .xls files are supported</div>

              <div class="text-negative text-caption q-mt-sm" v-if="uploadError">
                <q-icon name="error" /> {{ uploadError }}
              </div>
            </template>

            <template v-else>
              <q-icon name="insert_drive_file" size="64px" color="teal-6" class="q-mb-md" />
              <div class="text-h6 text-grey-9">{{ uploadFile.name }}</div>
              <div class="text-body2 text-grey-6 q-mb-md">{{ formatFileSize(uploadFile.size) }}</div>

              <q-btn flat color="negative" icon="delete" label="Remove File" @click.stop="uploadFile = null" />
            </template>
          </div>

          <q-stepper-navigation class="text-right q-mt-md row items-center">
            <q-btn flat color="grey-8" label="Back" @click="step = 2" class="q-mr-sm" />
            <q-space />
            <q-btn
              v-if="selectedDataType === 'water'"
              unelevated
              label="Continue"
              color="teal-9"
              icon="arrow_forward"
              :loading="parsingFile"
              :disable="!uploadFile"
              @click="proceedToReview"
            />
            <q-btn
              v-else
              unelevated
              label="Upload Data"
              color="teal-9"
              icon="cloud_upload"
              @click="submitUpload"
              :disable="!uploadFile"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP 4: Review & Confirm (Water Quality only) -->
        <q-step
          v-if="selectedDataType === 'water'"
          :name="4"
          title="Review & Confirm"
          icon="fact_check"
        >
          <div v-if="uploadParseResult">
            <div class="text-h6 text-teal-10 q-mb-sm text-center">
              {{ uploadParseResult.validRows.length }} of {{ uploadParseResult.totalDataRows }} rows are valid and will be submitted.
            </div>

            <q-banner v-if="uploadParseResult.invalidRows.length > 0" class="bg-red-1 text-red-9 q-mb-md" rounded>
              <template #avatar><q-icon name="error" color="red-7" /></template>
              <div class="text-weight-bold q-mb-xs">
                {{ uploadParseResult.invalidRows.length }} row(s) will be skipped:
              </div>
              <q-scroll-area style="height: 140px;">
                <div v-for="row in uploadParseResult.invalidRows" :key="row.rowNumber" class="text-caption q-mb-xs">
                  Row {{ row.rowNumber }}: {{ row.reasons.join('; ') }}
                </div>
              </q-scroll-area>
            </q-banner>

            <q-banner v-if="rowsWithWarnings.length > 0" class="bg-orange-1 text-orange-9 q-mb-md" rounded>
              <template #avatar><q-icon name="warning" color="orange-7" /></template>
              <div class="text-weight-bold q-mb-xs">
                {{ rowsWithWarnings.length }} valid row(s) have flagged values:
              </div>
              <q-scroll-area style="height: 140px;">
                <div v-for="(row, i) in rowsWithWarnings" :key="i" class="text-caption q-mb-xs">
                  {{ row.siteId }} ({{ row.date }}): {{ row.warnings.join('; ') }}
                </div>
              </q-scroll-area>
            </q-banner>

            <div v-if="uploadParseResult.validRows.length === 0" class="text-center text-negative q-my-md">
              No valid rows found in this file. Please fix the errors above and re-upload.
            </div>
          </div>

          <q-stepper-navigation class="text-right q-mt-md row items-center">
            <q-btn flat color="grey-8" label="Back" @click="step = 3" class="q-mr-sm" />
            <q-space />
            <q-btn
              unelevated
              :label="`Confirm & Submit ${uploadParseResult?.validRows.length ?? 0} Readings`"
              color="teal-9"
              icon="cloud_done"
              :disable="!uploadParseResult || uploadParseResult.validRows.length === 0"
              @click="confirmBatchSubmit"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useAdminStore } from 'src/stores/admin';
import { parseWaterQualityWorkbook, type WaterQualityUploadParseResult } from 'src/composables/useWaterQualityUpload';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();

const show = ref(false);
const step = ref(1);
const selectedDataType = ref<'fish' | 'water' | ''>('');
// true when opened directly into Step 2 via openFor() — Back on Step 2 then
// closes the dialog instead of returning to a Step 1 the user never saw.
const skippedTypeStep = ref(false);
const uploadFile = ref<File | null>(null);
const uploadError = ref('');
const fileInputEl = ref<HTMLInputElement | null>(null);
const uploadParseResult = ref<WaterQualityUploadParseResult | null>(null);
const parsingFile = ref(false);

const rowsWithWarnings = computed(
  () => uploadParseResult.value?.validRows.filter((r) => r.warnings.length > 0) ?? [],
);

function resetState() {
  step.value = 1;
  selectedDataType.value = '';
  skippedTypeStep.value = false;
  uploadFile.value = null;
  uploadError.value = '';
  uploadParseResult.value = null;
  parsingFile.value = false;
}

/** Open on Step 1 — the caller doesn't know the data type yet. */
function open() {
  resetState();
  show.value = true;
}

/** Open straight onto the method choice — the caller (e.g. a "Fish Observation"
 * / "Water Quality" menu item) already knows the data type. */
function openFor(dataType: 'fish' | 'water') {
  resetState();
  selectedDataType.value = dataType;
  skippedTypeStep.value = true;
  step.value = 2;
  show.value = true;
}

defineExpose({ open, openFor });

function selectDataType(type: 'fish' | 'water') {
  selectedDataType.value = type;
  step.value = 2;
}

function handleBackFromMethod() {
  if (skippedTypeStep.value) {
    show.value = false;
  } else {
    step.value = 1;
  }
}

function chooseMethod(method: 'manual' | 'file') {
  if (method === 'manual') {
    const target = selectedDataType.value === 'fish' ? '/researcher/upload/fish' : '/researcher/upload/water-quality';
    show.value = false;
    router.push(target).catch((err) => console.error('Navigation error:', err));
    return;
  }
  step.value = 3;
}

function triggerFileUpload() {
  fileInputEl.value?.click();
}

function cancelUpload() {
  show.value = false;
  resetState();
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    uploadFile.value = file;
    uploadError.value = '';
  } else {
    uploadError.value = 'Only .xlsx or .xls files are accepted.';
  }
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    uploadFile.value = file;
    uploadError.value = '';
  } else {
    uploadError.value = 'Only .xlsx or .xls files are accepted.';
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(1)} MB`;
}

function downloadTemplate() {
  const isFish = selectedDataType.value === 'fish';
  const href = isFish
    ? '/templates/fish observation template.xlsx'
    : '/templates/water quality template.xlsx';
  const filename = isFish
    ? 'fish observation template.xlsx'
    : 'water quality template.xlsx';

  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  $q.notify({
    message: 'Template download started.',
    color: isFish ? 'teal-7' : 'blue-7',
    icon: 'download',
    position: 'top',
    timeout: 2000,
  });
}

// Fish bulk-upload parsing isn't built yet — this stays a stub, matching the
// app's existing (pre-this-change) behavior for that path.
function submitUpload() {
  if (!uploadFile.value) {
    uploadError.value = 'Please upload a file first.';
    return;
  }

  $q.notify({
    message: 'File successfully uploaded and sent for processing!',
    color: 'teal-7',
    icon: 'check_circle',
    position: 'top',
    timeout: 2500,
  });

  cancelUpload();
}

async function proceedToReview() {
  if (!uploadFile.value) {
    uploadError.value = 'Please upload a file first.';
    return;
  }
  parsingFile.value = true;
  uploadError.value = '';
  try {
    uploadParseResult.value = await parseWaterQualityWorkbook(uploadFile.value);
    step.value = 4;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read this file.';
    uploadError.value = message;
    $q.notify({ type: 'negative', message, position: 'top', timeout: 3000 });
  } finally {
    parsingFile.value = false;
  }
}

function confirmBatchSubmit() {
  const result = uploadParseResult.value;
  if (!result || result.validRows.length === 0) return;

  adminStore.recordWaterQualityBatchUpload(authStore.displayName, result.validRows);
  $q.notify({
    message: `${result.validRows.length} water quality readings submitted for review.`,
    color: 'teal-7',
    icon: 'check_circle',
    position: 'top',
    timeout: 3000,
  });

  cancelUpload();
}
</script>

<style scoped>
.type-selector-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 2px solid transparent;
  border-radius: 12px;
}
.type-selector-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #e0f2f1;
}
.type-selector-card.active {
  border-color: #26a69a;
  background-color: #f0fdfa;
}

.template-banner {
  background: #f8fbfb;
  border: 1px dashed #b2dfdb;
  border-radius: 8px;
  padding: 12px 16px;
}

.upload-dropzone {
  border: 2px dashed #b0bec5;
  border-radius: 12px;
  background: #fcfcfc;
  transition: all 0.2s;
  min-height: 250px;
}
.upload-dropzone:hover:not(.has-file) {
  border-color: #26a69a;
  background: #f0fdfa;
}
.upload-dropzone.has-file {
  border: 2px solid #26a69a;
  background: #f0fdfa;
}
.upload-dropzone.has-error {
  border-color: #ef5350;
  background: #fffafa;
}

.drop-icon-bg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e0f2f1;
}
</style>
