<template>
  <q-dialog v-model="show" persistent>
    <q-card
      style="width: 700px; max-width: 95vw; max-height: 90vh; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;"
    >
      <q-card-section class="bg-teal-9 text-white row items-center q-pa-md" style="flex-shrink: 0;">
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
        class="unified-upload-stepper"
        style="flex: 1 1 auto; min-height: 0;"
      >
        <!-- STEP: Select Data Type -->
        <q-step
          name="type"
          title="Select Data Type"
          icon="category"
          :done="stepIndex('type') < stepIndex(step)"
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
            <q-btn unelevated color="teal-9" label="Continue" @click="step = 'method'" :disable="!selectedDataType" />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP: Choose Method -->
        <q-step
          name="method"
          title="Choose Method"
          icon="tune"
          :done="stepIndex('method') < stepIndex(step)"
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

        <!-- STEP: Fish Category (bulk upload only) -->
        <q-step
          v-if="selectedDataType === 'fish'"
          name="fishCategory"
          title="Fish Category"
          icon="set_meal"
          :done="stepIndex('fishCategory') < stepIndex(step)"
        >
          <div class="text-h6 text-teal-10 q-mb-sm text-center">What type of fish are you uploading?</div>
          <div class="text-body2 text-grey-7 text-center q-mb-lg">
            Each category has its own template — pick the one that matches your spreadsheet.
          </div>

          <div class="row q-col-gutter-md justify-center q-pa-md">
            <div class="col-12 col-sm-4">
              <q-card
                class="type-selector-card cursor-pointer"
                :class="{ 'active': selectedFishCategory === 'endemic' }"
                flat bordered
                @click="selectFishCategory('endemic')"
              >
                <q-card-section class="column items-center q-pa-md text-center">
                  <q-icon name="water" size="44px" color="teal-6" class="q-mb-sm" />
                  <div class="text-subtitle1 text-grey-9">Endemic Cyprinids</div>
                  <div class="text-caption text-grey-6 q-mt-xs">Native species of Lake Lanao</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-4">
              <q-card
                class="type-selector-card cursor-pointer"
                :class="{ 'active': selectedFishCategory === 'invasive' }"
                flat bordered
                @click="selectFishCategory('invasive')"
              >
                <q-card-section class="column items-center q-pa-md text-center">
                  <q-icon name="pest_control" size="44px" color="red-6" class="q-mb-sm" />
                  <div class="text-subtitle1 text-grey-9">Invasive Species</div>
                  <div class="text-caption text-grey-6 q-mt-xs">Non-native, introduced fish</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-sm-4">
              <q-card
                class="type-selector-card cursor-pointer"
                :class="{ 'active': selectedFishCategory === 'others' }"
                flat bordered
                @click="selectFishCategory('others')"
              >
                <q-card-section class="column items-center q-pa-md text-center">
                  <q-icon name="blender" size="44px" color="orange-6" class="q-mb-sm" />
                  <div class="text-subtitle1 text-grey-9">General / Others</div>
                  <div class="text-caption text-grey-6 q-mt-xs">Other fish species</div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-stepper-navigation class="text-right">
            <q-btn flat color="grey-8" label="Back" @click="step = 'method'" />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP: File Upload -->
        <q-step
          name="upload"
          title="Upload File"
          icon="upload_file"
          :done="stepIndex('upload') < stepIndex(step)"
        >
          <!-- Template download banner -->
          <div class="template-banner q-mb-lg">
            <div class="row items-center">
              <q-icon name="description" :color="selectedDataType === 'fish' ? fishCategoryColor : 'blue-7'" size="22px" class="q-mr-sm" />
              <div class="col">
                <div class="text-weight-medium text-grey-9" style="font-size:0.85rem;">
                  Don't have the template?
                </div>
                <div class="text-grey-6" style="font-size:0.75rem;">
                  Download the official {{ uploadTypeLabel }} Excel template
                </div>
                <div class="text-grey-6 q-mt-xs" style="font-size:0.72rem;">
                  <q-icon name="info" size="12px" class="q-mr-xs" />
                  <strong>Date Observed</strong> (YYYY-MM-DD) is required for every row — everything else may be left blank.
                  <template v-if="selectedDataType === 'fish' && selectedFishCategory !== 'others'">
                    Photo columns are for your own reference only; bulk upload doesn't attach image files.
                  </template>
                </div>
              </div>
              <q-btn
                flat
                dense
                icon="download"
                label="Download Template"
                :color="selectedDataType === 'fish' ? fishCategoryColor : 'blue-7'"
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
            <q-btn flat color="grey-8" label="Back" @click="handleBackFromUpload" class="q-mr-sm" />
            <q-space />
            <q-btn
              unelevated
              label="Continue"
              color="teal-9"
              icon="arrow_forward"
              :loading="parsingFile"
              :disable="!uploadFile"
              @click="proceedToReview"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP: Review & Confirm -->
        <q-step
          name="review"
          title="Review & Confirm"
          icon="fact_check"
        >
          <div v-if="reviewSummary">
            <div class="text-h6 text-teal-10 q-mb-sm text-center">
              {{ reviewSummary.validCount }} of {{ reviewSummary.totalDataRows }} rows are valid and will be submitted.
            </div>

            <q-banner v-if="reviewSummary.invalidRows.length > 0" class="bg-red-1 text-red-9 q-mb-md" rounded>
              <template #avatar><q-icon name="error" color="red-7" /></template>
              <div class="text-weight-bold q-mb-xs">
                {{ reviewSummary.invalidRows.length }} row(s) will be skipped:
              </div>
              <q-scroll-area style="height: 140px;">
                <div v-for="row in reviewSummary.invalidRows" :key="row.rowNumber" class="text-caption q-mb-xs">
                  Row {{ row.rowNumber }}: {{ row.reasons.join('; ') }}
                </div>
              </q-scroll-area>
            </q-banner>

            <q-banner v-if="reviewSummary.warningRows.length > 0" class="bg-orange-1 text-orange-9 q-mb-md" rounded>
              <template #avatar><q-icon name="warning" color="orange-7" /></template>
              <div class="text-weight-bold q-mb-xs">
                {{ reviewSummary.warningRows.length }} valid row(s) have flagged values:
              </div>
              <q-scroll-area style="height: 140px;">
                <div v-for="(row, i) in reviewSummary.warningRows" :key="i" class="text-caption q-mb-xs">
                  {{ row.label }}: {{ row.warnings.join('; ') }}
                </div>
              </q-scroll-area>
            </q-banner>

            <div v-if="reviewSummary.validCount === 0" class="text-center text-negative q-my-md">
              No valid rows found in this file. Please fix the errors above and re-upload.
            </div>
          </div>

          <q-stepper-navigation class="text-right q-mt-md row items-center">
            <q-btn flat color="grey-8" label="Back" @click="step = 'upload'" class="q-mr-sm" />
            <q-space />
            <q-btn
              unelevated
              :label="`Confirm & Submit ${reviewSummary?.validCount ?? 0} Record${reviewSummary?.validCount === 1 ? '' : 's'}`"
              color="teal-9"
              icon="cloud_done"
              :loading="submittingBatch"
              :disable="!reviewSummary || reviewSummary.validCount === 0"
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
import { parseWaterQualityWorkbook, type WaterQualityUploadParseResult } from 'src/composables/useWaterQualityUpload';
import { submitWaterQualityBatch } from 'src/composables/useWaterQualityReadings';
import {
  parseFishObservationWorkbook,
  type FishBulkCategory,
  type FishUploadParseResult,
} from 'src/composables/useFishObservationUpload';
import { submitFishObservationBatch } from 'src/composables/useFishObservations';

const $q = useQuasar();
const router = useRouter();
const submittingBatch = ref(false);

type StepName = 'type' | 'method' | 'fishCategory' | 'upload' | 'review';
// Order used only to derive each q-step's :done state from the current step.
const STEP_ORDER: StepName[] = ['type', 'method', 'fishCategory', 'upload', 'review'];
function stepIndex(name: StepName): number {
  return STEP_ORDER.indexOf(name);
}

const show = ref(false);
const step = ref<StepName>('type');
const selectedDataType = ref<'fish' | 'water' | ''>('');
const selectedFishCategory = ref<FishBulkCategory | ''>('');
// true when opened directly into Step "method" via openFor() — Back on that
// step then closes the dialog instead of returning to a "type" step the user
// never saw.
const skippedTypeStep = ref(false);
const uploadFile = ref<File | null>(null);
const uploadError = ref('');
const fileInputEl = ref<HTMLInputElement | null>(null);
const waterParseResult = ref<WaterQualityUploadParseResult | null>(null);
const fishParseResult = ref<FishUploadParseResult | null>(null);
const parsingFile = ref(false);

const fishCategoryLabel = computed(() => {
  if (selectedFishCategory.value === 'endemic') return 'Endemic Cyprinids';
  if (selectedFishCategory.value === 'invasive') return 'Invasive Species';
  if (selectedFishCategory.value === 'others') return 'General / Others';
  return '';
});

const fishCategoryColor = computed(() => {
  if (selectedFishCategory.value === 'endemic') return 'teal-7';
  if (selectedFishCategory.value === 'invasive') return 'red-7';
  if (selectedFishCategory.value === 'others') return 'orange-7';
  return 'teal-7';
});

const uploadTypeLabel = computed(() =>
  selectedDataType.value === 'fish' ? fishCategoryLabel.value : 'Water Quality',
);

// A single shape the Review step renders from, regardless of which parser
// (water quality or fish observation) produced the result.
const reviewSummary = computed(() => {
  if (selectedDataType.value === 'water' && waterParseResult.value) {
    const result = waterParseResult.value;
    return {
      totalDataRows: result.totalDataRows,
      validCount: result.validRows.length,
      invalidRows: result.invalidRows,
      warningRows: result.validRows
        .filter((r) => r.warnings.length > 0)
        .map((r) => ({ label: `${r.siteId} (${r.date})`, warnings: r.warnings })),
    };
  }
  if (selectedDataType.value === 'fish' && fishParseResult.value) {
    const result = fishParseResult.value;
    return {
      totalDataRows: result.totalDataRows,
      validCount: result.validRows.length,
      invalidRows: result.invalidRows,
      warningRows: result.validRows
        .filter((r) => r.warnings.length > 0)
        .map((r) => ({
          label: `${r.speciesScientific ?? r.speciesCommon ?? fishCategoryLabel.value} (${r.dateObserved})`,
          warnings: r.warnings,
        })),
    };
  }
  return null;
});

function resetState() {
  step.value = 'type';
  selectedDataType.value = '';
  selectedFishCategory.value = '';
  skippedTypeStep.value = false;
  uploadFile.value = null;
  uploadError.value = '';
  waterParseResult.value = null;
  fishParseResult.value = null;
  parsingFile.value = false;
}

/** Open on the "type" step — the caller doesn't know the data type yet. */
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
  step.value = 'method';
  show.value = true;
}

defineExpose({ open, openFor });

function selectDataType(type: 'fish' | 'water') {
  selectedDataType.value = type;
  step.value = 'method';
}

function handleBackFromMethod() {
  if (skippedTypeStep.value) {
    show.value = false;
  } else {
    step.value = 'type';
  }
}

function handleBackFromUpload() {
  step.value = selectedDataType.value === 'fish' ? 'fishCategory' : 'method';
}

function selectFishCategory(category: FishBulkCategory) {
  selectedFishCategory.value = category;
  step.value = 'upload';
}

function chooseMethod(method: 'manual' | 'file') {
  if (method === 'manual') {
    const target = selectedDataType.value === 'fish' ? '/researcher/upload/fish' : '/researcher/upload/water-quality';
    show.value = false;
    router.push(target).catch((err) => console.error('Navigation error:', err));
    return;
  }
  step.value = selectedDataType.value === 'fish' ? 'fishCategory' : 'upload';
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

const FISH_TEMPLATE_FILES: Record<FishBulkCategory, string> = {
  endemic: 'endemic cyprinids template.xlsx',
  invasive: 'invasive species template.xlsx',
  others: 'general species template.xlsx',
};

function downloadTemplate() {
  const isFish = selectedDataType.value === 'fish';
  let filename: string;
  if (isFish && selectedFishCategory.value) {
    filename = FISH_TEMPLATE_FILES[selectedFishCategory.value];
  } else {
    filename = 'water quality template.xlsx';
  }
  const href = `/templates/${filename}`;

  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  $q.notify({
    message: 'Template download started.',
    color: isFish ? fishCategoryColor.value : 'blue-7',
    icon: 'download',
    position: 'top',
    timeout: 2000,
  });
}

async function proceedToReview() {
  if (!uploadFile.value) {
    uploadError.value = 'Please upload a file first.';
    return;
  }
  parsingFile.value = true;
  uploadError.value = '';
  try {
    if (selectedDataType.value === 'water') {
      waterParseResult.value = await parseWaterQualityWorkbook(uploadFile.value);
    } else if (selectedDataType.value === 'fish' && selectedFishCategory.value) {
      fishParseResult.value = await parseFishObservationWorkbook(uploadFile.value, selectedFishCategory.value);
    } else {
      return;
    }
    step.value = 'review';
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read this file.';
    uploadError.value = message;
    $q.notify({ type: 'negative', message, position: 'top', timeout: 3000 });
  } finally {
    parsingFile.value = false;
  }
}

async function confirmBatchSubmit() {
  submittingBatch.value = true;
  try {
    if (selectedDataType.value === 'water') {
      const result = waterParseResult.value;
      if (!result || result.validRows.length === 0) return;
      await submitWaterQualityBatch(result.validRows);
      $q.notify({
        message: `${result.validRows.length} water quality readings submitted for review.`,
        color: 'teal-7',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      });
    } else if (selectedDataType.value === 'fish') {
      const result = fishParseResult.value;
      if (!result || result.validRows.length === 0) return;
      await submitFishObservationBatch(result.validRows);
      $q.notify({
        message: `${result.validRows.length} fish observations submitted for review.`,
        color: 'teal-7',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      });
    }
    cancelUpload();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to submit batch.',
      position: 'top',
      timeout: 4000,
    });
  } finally {
    submittingBatch.value = false;
  }
}
</script>

<style scoped>
.unified-upload-stepper {
  display: flex;
  flex-direction: column;
}
.unified-upload-stepper :deep(.q-stepper__header) {
  flex-shrink: 0;
}
.unified-upload-stepper :deep(.q-stepper__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

/* On narrow screens the default header wraps each step tab onto its own
   full-width row (Quasar's col-grow), eating most of the viewport before
   any step content is visible. Keep it a single compact scrollable strip. */
@media (max-width: 599px) {
  .unified-upload-stepper :deep(.q-stepper__header) {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .unified-upload-stepper :deep(.q-stepper__tab) {
    flex: 0 0 auto;
    width: auto;
    padding-left: 12px;
    padding-right: 12px;
  }
  .unified-upload-stepper :deep(.q-stepper__tab .q-stepper__title) {
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .unified-upload-stepper :deep(.q-stepper__tab .q-stepper__dot) {
    margin-right: 6px;
  }
}

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
