<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Lake Lanao background -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />

    <!-- Dark overlay -->
    <div class="absolute-full bg-overlay" />

    <BackButton to="/researcher" />

    <!-- Main Content -->
    <div class="page-content full-width q-pa-md" style="max-width: 900px">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bolder text-white drop-shadow">
            <q-icon name="terrain" class="q-mr-sm" color="teal-3" />
            Bathymetry Survey
          </div>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-mt-xs">
            Submit depth soundings for Lake Lanao — cleaned automatically, then reviewed by an admin
          </p>
        </div>
      </div>

      <q-card class="glass-morph">
        <q-card-section class="q-pa-lg">
          <!-- Section 1: Survey details -->
          <div class="section-header q-mb-md">
            <div class="section-badge teal"><span class="section-number">1</span></div>
            <div>
              <div class="text-teal-3 text-weight-bold text-subtitle1">Survey Details</div>
              <div class="text-grey-5 text-caption">What this survey is and when it was taken</div>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-7">
              <q-input
                v-model="label"
                label="Survey Label *"
                dark outlined class="form-field"
                hint='e.g. "Nearshore Transect — Marawi, Sept 2026"'
                :rules="[(val) => !!val || 'A label is required']"
                lazy-rules
              >
                <template #prepend><q-icon name="label" color="teal-4" /></template>
              </q-input>
            </div>
            <div class="col-12 col-md-5">
              <q-input
                v-model="surveyDate"
                label="Survey Date *"
                type="date"
                dark outlined class="form-field"
                :rules="[(val) => !!val || 'Survey date is required']"
                lazy-rules
              >
                <template #prepend><q-icon name="event" color="teal-4" /></template>
              </q-input>
            </div>
          </div>

          <q-separator dark class="q-mb-lg section-sep" />

          <!-- Section 2: Depth soundings file -->
          <div class="section-header q-mb-md">
            <div class="section-badge teal"><span class="section-number">2</span></div>
            <div>
              <div class="text-teal-3 text-weight-bold text-subtitle1">Depth Soundings</div>
              <div class="text-grey-5 text-caption">Excel file with latitude, longitude, depth_m columns</div>
            </div>
          </div>

          <div
            class="column items-center justify-center q-pa-lg cursor-pointer bg-white rounded-borders"
            style="border: 2px dashed #ccc"
            @click="!file && fileInput?.click()"
          >
            <input type="file" ref="fileInput" accept=".xlsx,.xls" style="display: none" @change="onFileSelected" />
            <template v-if="!file">
              <q-icon name="cloud_upload" size="48px" color="teal-5" />
              <div class="text-subtitle2 text-grey-9 q-mt-sm text-center">Click to browse or drag file here</div>
            </template>
            <template v-else>
              <q-icon name="description" size="48px" color="teal-7" />
              <div class="text-subtitle2 text-grey-9 q-mt-sm text-center">{{ file.name }}</div>
              <div class="text-caption text-grey-6">{{ (file.size / 1024).toFixed(1) }} KB</div>
              <q-btn flat dense color="negative" icon="delete" label="Remove" class="q-mt-sm" @click.stop="clearFile" />
            </template>
          </div>
          <div class="text-caption text-negative q-mt-sm" v-if="parseError">
            <q-icon name="error" class="q-mr-xs" />{{ parseError }}
          </div>

          <div class="q-mt-sm text-center">
            <q-btn flat dense color="blue-3" icon="download" label="Download Template" href="/templates/depth-soundings-template.xlsx" target="_blank" />
          </div>

          <!-- Cleaning report -->
          <q-card v-if="cleanResult" flat bordered class="q-pa-md q-mt-md bg-grey-1 rounded-borders">
            <div class="text-subtitle2 text-teal-9 q-mb-sm">
              <q-icon name="cleaning_services" class="q-mr-xs" /> Cleaning report
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6 col-sm-3">
                <div class="text-h6 text-teal-9">{{ cleanResult.points.length }}</div>
                <div class="text-caption text-grey-7">Kept</div>
              </div>
              <div class="col-6 col-sm-3">
                <div class="text-h6" :class="parseSkipped ? 'text-warning' : 'text-grey-6'">{{ parseSkipped }}</div>
                <div class="text-caption text-grey-7">Invalid rows</div>
              </div>
              <div class="col-6 col-sm-3">
                <div class="text-h6" :class="cleanResult.duplicateCount ? 'text-warning' : 'text-grey-6'">{{ cleanResult.duplicateCount }}</div>
                <div class="text-caption text-grey-7">Duplicates</div>
              </div>
              <div class="col-6 col-sm-3">
                <div class="text-h6" :class="cleanResult.outsideLakeCount ? 'text-warning' : 'text-grey-6'">{{ cleanResult.outsideLakeCount }}</div>
                <div class="text-caption text-grey-7">Outside lake</div>
              </div>
            </div>
            <div v-if="cleanResult.outlierCount" class="text-caption text-warning q-mt-sm">
              <q-icon name="warning" class="q-mr-xs" />
              {{ cleanResult.outlierCount }} point{{ cleanResult.outlierCount === 1 ? '' : 's' }} flagged as statistical
              outliers (depth far from nearby soundings) and dropped — the admin will see this same report.
            </div>
            <div v-if="cleanResult.points.length < 3" class="text-caption text-negative q-mt-sm">
              <q-icon name="error" class="q-mr-xs" />
              Fewer than 3 points survived cleaning — not enough to submit a survey.
            </div>
          </q-card>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-lg q-pt-none">
          <q-btn
            unelevated color="teal" label="Submit for Review" icon="send"
            :loading="submitting"
            :disable="!canSubmit"
            @click="handleSubmit"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import BackButton from 'src/components/BackButton.vue';
import { parseDepthExcel } from 'src/composables/useMapDataUpload';
import { cleanDepthPoints, loadLakePolygonRings, type CleanResult } from 'src/composables/useBathymetryClean';
import { submitBathymetrySurvey } from 'src/composables/useBathymetrySurveys';

const $q = useQuasar();
const router = useRouter();

const label = ref('');
const surveyDate = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(null);
const parseError = ref('');
const parseSkipped = ref(0);
const cleanResult = ref<CleanResult | null>(null);
const submitting = ref(false);

const canSubmit = computed(
  () => !!label.value && !!surveyDate.value && !!cleanResult.value && cleanResult.value.points.length >= 3,
);

function clearFile() {
  file.value = null;
  parseError.value = '';
  parseSkipped.value = 0;
  cleanResult.value = null;
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  file.value = target.files[0]!;
  target.value = '';
  parseError.value = '';
  cleanResult.value = null;

  try {
    const parsed = await parseDepthExcel(file.value);
    parseSkipped.value = parsed.skippedRows;
    const lakePolygonRings = await loadLakePolygonRings();
    cleanResult.value = cleanDepthPoints(parsed.points, lakePolygonRings);
  } catch (err) {
    parseError.value = err instanceof Error ? err.message : 'Failed to read the file.';
    file.value = null;
  }
}

async function handleSubmit() {
  if (!cleanResult.value) return;
  submitting.value = true;
  try {
    const droppedCount =
      parseSkipped.value + cleanResult.value.duplicateCount + cleanResult.value.outsideLakeCount + cleanResult.value.outlierCount;
    await submitBathymetrySurvey({
      label: label.value,
      surveyDate: surveyDate.value,
      points: cleanResult.value.points,
      cleanedCount: droppedCount,
    });
    $q.notify({
      type: 'positive',
      message: 'Bathymetry survey submitted for review!',
      color: 'teal-7',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });
    await router.push('/researcher');
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to submit the survey.',
      position: 'top',
      timeout: 4000,
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.glass-morph {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
}

.bg-overlay {
  background: rgba(0, 0, 0, 0.58);
}

.drop-shadow {
  text-shadow: 0px 4px 10px rgba(0, 0, 0, 0.6);
}

.drop-shadow-soft {
  text-shadow: 0px 2px 5px rgba(0, 0, 0, 0.4);
}

.page-content {
  position: relative;
  z-index: 1;
  padding-top: 88px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-badge {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-badge.teal {
  background: rgba(38, 166, 154, 0.25);
}

.section-number {
  color: #4db6ac;
  font-weight: 700;
}

.section-sep {
  opacity: 0.15;
}
</style>
