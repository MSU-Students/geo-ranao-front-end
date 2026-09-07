<template>
  <q-dialog v-model="show" persistent>
    <q-card
      style="width: 700px; max-width: 95vw; max-height: 90vh; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;"
    >
      <q-card-section class="bg-teal-9 text-white row items-center q-pa-md" style="flex-shrink: 0;">
        <div class="text-h6 row items-center">
          <q-icon name="terrain" size="24px" class="q-mr-sm" />
          Upload Bathymetry Survey
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
        <!-- STEP: Survey Details -->
        <q-step name="details" title="Survey Details" icon="edit_note" :done="stepIndex('details') < stepIndex(step)">
          <div class="text-h6 text-teal-10 q-mb-sm text-center">What is this survey?</div>
          <div class="text-body2 text-grey-7 text-center q-mb-lg">
            A short label and the date the soundings were taken.
          </div>

          <div class="q-px-md">
            <q-input
              v-model="label"
              label="Survey Label *"
              outlined
              class="q-mb-md"
              hint='e.g. "Nearshore Transect — Marawi, Sept 2026"'
            >
              <template #prepend><q-icon name="label" color="teal-7" /></template>
            </q-input>
            <q-input v-model="surveyDate" label="Survey Date *" type="date" outlined>
              <template #prepend><q-icon name="event" color="teal-7" /></template>
            </q-input>
          </div>

          <q-stepper-navigation class="text-right">
            <q-btn
              unelevated color="teal-9" label="Continue"
              :disable="!label || !surveyDate"
              @click="step = 'upload'"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP: Upload File -->
        <q-step name="upload" title="Upload File" icon="upload_file" :done="stepIndex('upload') < stepIndex(step)">
          <!-- Template download banner -->
          <div class="template-banner q-mb-lg">
            <div class="row items-center">
              <q-icon name="description" color="orange-7" size="22px" class="q-mr-sm" />
              <div class="col">
                <div class="text-weight-medium text-grey-9" style="font-size:0.85rem;">
                  Don't have the template?
                </div>
                <div class="text-grey-6" style="font-size:0.75rem;">
                  Download the depth-soundings Excel template
                </div>
                <div class="text-grey-6 q-mt-xs" style="font-size:0.72rem;">
                  <q-icon name="info" size="12px" class="q-mr-xs" />
                  Columns: <strong>latitude</strong>, <strong>longitude</strong>, <strong>depth_m</strong>.
                </div>
              </div>
              <q-btn
                flat dense icon="download" label="Download Template" color="orange-7" size="sm"
                href="/templates/depth-soundings-template.xlsx" target="_blank"
              />
            </div>
          </div>

          <!-- Drag & Drop Zone -->
          <div
            class="upload-dropzone column items-center justify-center q-pa-xl cursor-pointer"
            :class="{ 'has-file': !!file, 'has-error': !!uploadError }"
            @dragover.prevent
            @drop="handleFileDrop"
            @click="!file && fileInputEl?.click()"
          >
            <input type="file" ref="fileInputEl" class="hidden" accept=".xlsx,.xls" @change="handleFileInput" />

            <template v-if="!file">
              <div class="drop-icon-bg q-mb-md flex flex-center">
                <q-icon name="cloud_upload" size="48px" color="orange-5" />
              </div>
              <div class="text-h6 text-grey-9 q-mb-xs">Click or drag Excel file to upload</div>
              <div class="text-body2 text-grey-6">Only .xlsx or .xls files are supported</div>
              <div class="text-negative text-caption q-mt-sm" v-if="uploadError">
                <q-icon name="error" /> {{ uploadError }}
              </div>
            </template>
            <template v-else>
              <q-icon name="insert_drive_file" size="64px" color="teal-6" class="q-mb-md" />
              <div class="text-h6 text-grey-9">{{ file.name }}</div>
              <div class="text-body2 text-grey-6 q-mb-md">{{ formatFileSize(file.size) }}</div>
              <q-btn flat color="negative" icon="delete" label="Remove File" @click.stop="clearFile" />
            </template>
          </div>

          <q-stepper-navigation class="text-right q-mt-md row items-center">
            <q-btn flat color="grey-8" label="Back" @click="step = 'details'" class="q-mr-sm" />
            <q-space />
            <q-btn
              unelevated label="Continue" color="teal-9" icon="arrow_forward"
              :loading="cleaning"
              :disable="!file"
              @click="proceedToReview"
            />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP: Review & Confirm -->
        <q-step name="review" title="Review & Confirm" icon="fact_check">
          <div v-if="cleanResult">
            <div class="text-h6 text-teal-10 q-mb-sm text-center">
              {{ cleanResult.points.length }} sounding{{ cleanResult.points.length === 1 ? '' : 's' }} will be published to the map.
            </div>

            <q-banner v-if="parseSkipped > 0" class="bg-red-1 text-red-9 q-mb-md" rounded>
              <template #avatar><q-icon name="error" color="red-7" /></template>
              <div class="text-weight-bold">{{ parseSkipped }} row(s) skipped — missing or invalid latitude/longitude/depth.</div>
            </q-banner>

            <q-banner v-if="cleanedTotal > 0" class="bg-orange-1 text-orange-9 q-mb-md" rounded>
              <template #avatar><q-icon name="warning" color="orange-7" /></template>
              <div class="text-weight-bold q-mb-xs">{{ cleanedTotal }} point(s) dropped while cleaning:</div>
              <div class="text-caption">
                {{ cleanResult.duplicateCount }} duplicate, {{ cleanResult.outsideLakeCount }} outside the lake,
                {{ cleanResult.outlierCount }} statistical outlier{{ cleanResult.outlierCount === 1 ? '' : 's' }}.
              </div>
            </q-banner>

            <div v-if="cleanResult.points.length < 3" class="text-center text-negative q-my-md">
              Fewer than 3 points survived cleaning — not enough to publish a survey.
            </div>
            <div v-else class="text-center text-grey-7 text-caption q-mt-md">
              This publishes immediately — the map will show these contours right away.
            </div>
          </div>

          <q-stepper-navigation class="text-right q-mt-md row items-center">
            <q-btn flat color="grey-8" label="Back" @click="step = 'upload'" class="q-mr-sm" />
            <q-space />
            <q-btn
              unelevated
              :label="`Publish ${cleanResult?.points.length ?? 0} Sounding${cleanResult?.points.length === 1 ? '' : 's'}`"
              color="teal-9"
              icon="cloud_done"
              :loading="submitting"
              :disable="!cleanResult || cleanResult.points.length < 3"
              @click="confirmSubmit"
            />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { parseDepthExcel } from 'src/composables/useMapDataUpload';
import { cleanDepthPoints, loadLakePolygonRings, type CleanResult } from 'src/composables/useBathymetryClean';
import { submitBathymetrySurvey, type BathymetrySurvey } from 'src/composables/useBathymetrySurveys';

const $q = useQuasar();

type StepName = 'details' | 'upload' | 'review';
const STEP_ORDER: StepName[] = ['details', 'upload', 'review'];
function stepIndex(name: StepName): number {
  return STEP_ORDER.indexOf(name);
}

const emit = defineEmits<{ published: [survey: BathymetrySurvey] }>();

const show = ref(false);
const step = ref<StepName>('details');
const label = ref('');
const surveyDate = ref('');
const file = ref<File | null>(null);
const fileInputEl = ref<HTMLInputElement | null>(null);
const uploadError = ref('');
const parseSkipped = ref(0);
const cleanResult = ref<CleanResult | null>(null);
const cleaning = ref(false);
const submitting = ref(false);

const cleanedTotal = ref(0);

function resetState() {
  step.value = 'details';
  label.value = '';
  surveyDate.value = '';
  file.value = null;
  uploadError.value = '';
  parseSkipped.value = 0;
  cleanResult.value = null;
  cleaning.value = false;
  submitting.value = false;
}

function open() {
  resetState();
  show.value = true;
}
defineExpose({ open });

function clearFile() {
  file.value = null;
  uploadError.value = '';
  cleanResult.value = null;
}

function acceptFile(candidate: File) {
  const ext = candidate.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    file.value = candidate;
    uploadError.value = '';
  } else {
    uploadError.value = 'Only .xlsx or .xls files are accepted.';
  }
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault();
  const dropped = event.dataTransfer?.files?.[0];
  if (dropped) acceptFile(dropped);
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const chosen = input.files?.[0];
  if (chosen) acceptFile(chosen);
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(1)} MB`;
}

function cancelUpload() {
  show.value = false;
  resetState();
}

async function proceedToReview() {
  if (!file.value) return;
  cleaning.value = true;
  uploadError.value = '';
  try {
    const parsed = await parseDepthExcel(file.value);
    parseSkipped.value = parsed.skippedRows;
    const lakePolygonRings = await loadLakePolygonRings();
    const result = cleanDepthPoints(parsed.points, lakePolygonRings);
    cleanResult.value = result;
    cleanedTotal.value = result.duplicateCount + result.outsideLakeCount + result.outlierCount;
    step.value = 'review';
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read this file.';
    uploadError.value = message;
    $q.notify({ type: 'negative', message, position: 'top', timeout: 3000 });
  } finally {
    cleaning.value = false;
  }
}

async function confirmSubmit() {
  if (!cleanResult.value) return;
  submitting.value = true;
  try {
    const survey = await submitBathymetrySurvey({
      label: label.value,
      surveyDate: surveyDate.value,
      points: cleanResult.value.points,
      cleanedCount: parseSkipped.value + cleanedTotal.value,
    });
    $q.notify({
      type: 'positive',
      message: 'Bathymetry survey published to the map!',
      color: 'teal-7',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });
    emit('published', survey);
    cancelUpload();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to publish the survey.',
      position: 'top',
      timeout: 4000,
    });
  } finally {
    submitting.value = false;
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

.template-banner {
  background: #f8fbfb;
  border: 1px dashed #ffcc80;
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
  border-color: #fb8c00;
  background: #fff8f0;
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
  background: #fff3e0;
}
</style>
