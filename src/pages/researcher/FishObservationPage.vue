<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Lake Lanao background -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />

    <!-- Dark overlay -->
    <div class="absolute-full bg-overlay" />

    <!-- Main Content -->
    <div class="z-top full-width q-pa-md" style="max-width: 960px">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <q-btn flat round icon="arrow_back" color="white" class="q-mr-sm" @click="$router.back()" />
        <div>
          <div class="text-h5 text-weight-bolder text-white drop-shadow">
            <q-icon name="set_meal" class="q-mr-sm" color="blue-3" />
            Fish Observation
          </div>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-mt-xs">
            Log a new fish sighting with field data for Lake Lanao GIS records
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <q-card class="glass-morph">
        <q-card-section>
          <!-- ── Section: Field Metadata ── -->
          <div class="section-label q-mb-md">
            <q-icon name="place" color="blue-3" class="q-mr-xs" />
            <span class="text-blue-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
              Field Metadata
            </span>
          </div>

          <div class="row q-col-gutter-md q-mb-lg">
            <!-- Date of Observation (required) -->
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.dateObserved"
                label="Date of Observation *"
                type="date"
                dark
                outlined
                class="form-field"
                :rules="[(val) => !!val || 'Date of Observation is required']"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="event" color="blue-4" />
                </template>
              </q-input>
            </div>

            <!-- Station / Location ID (required) -->
            <div class="col-12 col-md-4">
              <q-input
                v-model="form.stationId"
                label="Station / Location ID *"
                dark
                outlined
                class="form-field"
                hint="e.g. LL-ST-01"
                :rules="[(val) => !!val || 'Station ID is required']"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="pin_drop" color="blue-4" />
                </template>
              </q-input>
            </div>

            <!-- Depth -->
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="form.depth"
                label="Depth (meters)"
                type="number"
                min="0"
                step="0.1"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="vertical_align_bottom" color="blue-4" />
                </template>
                <template #append>
                  <span class="text-grey-5 text-caption">m</span>
                </template>
              </q-input>
            </div>

            <!-- Latitude (required) -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.latitude"
                label="Latitude *"
                type="number"
                step="0.000001"
                dark
                outlined
                class="form-field"
                hint="Decimal degrees — e.g. 7.9900"
                :rules="[
                  (val) => (val !== null && val !== '') || 'Latitude is required',
                  (val) => (val >= -90 && val <= 90) || 'Must be between -90 and 90',
                ]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="my_location" color="blue-4" />
                </template>
              </q-input>
            </div>

            <!-- Longitude (required) -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.longitude"
                label="Longitude *"
                type="number"
                step="0.000001"
                dark
                outlined
                class="form-field"
                hint="Decimal degrees — e.g. 124.0700"
                :rules="[
                  (val) => (val !== null && val !== '') || 'Longitude is required',
                  (val) => (val >= -180 && val <= 180) || 'Must be between -180 and 180',
                ]"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="my_location" color="blue-4" />
                </template>
              </q-input>
            </div>

            <!-- Coordinate preview pill -->
            <div class="col-12" v-if="form.latitude && form.longitude">
              <div class="coord-pill row items-center no-wrap q-gutter-xs">
                <q-icon name="gps_fixed" color="teal-4" size="14px" />
                <span class="text-teal-3 text-caption text-weight-medium">
                  GIS Point: {{ Number(form.latitude).toFixed(6) }},
                  {{ Number(form.longitude).toFixed(6) }}
                </span>
              </div>
            </div>

            <!-- Observation Method -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.observationMethod"
                :options="observationMethodOptions"
                label="Observation Method"
                dark
                outlined
                clearable
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="visibility" color="blue-4" />
                </template>
              </q-select>
            </div>

            <!-- Placeholder for alignment -->
            <div class="col-12 col-md-6 hidden-xs" />
          </div>

          <q-separator dark class="q-mb-lg section-sep" />

          <!-- ── Section: Species Information ── -->
          <div class="section-label q-mb-md">
            <q-icon name="set_meal" color="blue-3" class="q-mr-xs" />
            <span class="text-blue-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
              Species Information
            </span>
          </div>

          <div class="row q-col-gutter-md q-mb-lg">
            <!-- Species Name -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.speciesName"
                label="Species Name"
                dark
                outlined
                class="form-field"
                hint="Common or scientific name — Optional"
              >
                <template #prepend>
                  <q-icon name="biotech" color="blue-4" />
                </template>
              </q-input>
            </div>

            <!-- Life Stage -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.lifeStage"
                :options="lifeStageOptions"
                label="Life Stage"
                dark
                outlined
                clearable
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="auto_awesome_motion" color="blue-4" />
                </template>
              </q-select>
            </div>

            <!-- Count / Abundance -->
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="form.count"
                label="Count / Abundance"
                type="number"
                min="0"
                dark
                outlined
                class="form-field"
                hint="Number of individuals — Optional"
              >
                <template #prepend>
                  <q-icon name="tag" color="blue-4" />
                </template>
              </q-input>
            </div>

            <!-- Weight -->
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="form.weight"
                label="Weight"
                type="number"
                min="0"
                step="0.01"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="scale" color="blue-4" />
                </template>
                <template #append>
                  <q-select
                    v-model="form.weightUnit"
                    :options="weightUnitOptions"
                    dark
                    borderless
                    dense
                    class="weight-unit-select"
                    style="min-width: 55px"
                  />
                </template>
              </q-input>
            </div>
          </div>

          <q-separator dark class="q-mb-lg section-sep" />

          <!-- ── Section: Additional Notes ── -->
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div class="section-label q-mb-md">
                <q-icon name="notes" color="blue-3" class="q-mr-xs" />
                <span
                  class="text-blue-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing"
                >
                  Remarks
                </span>
              </div>
              <q-input
                v-model="form.notes"
                label="Field Notes / Remarks"
                type="textarea"
                :rows="3"
                dark
                outlined
                class="form-field"
                hint="Optional — describe habitat, behavior, environmental conditions, etc."
              />
            </div>

            <!-- Photo upload -->
            <div class="col-12">
              <q-file
                v-model="form.photos"
                label="Upload Field Photos (optional)"
                dark
                outlined
                multiple
                accept="image/*"
                class="form-field"
                counter
              >
                <template #prepend>
                  <q-icon name="photo_camera" color="blue-4" />
                </template>
              </q-file>
            </div>

            <!-- Required note -->
            <div class="col-12">
              <p class="text-grey-5 text-caption q-mb-md">
                <q-icon name="info" size="xs" class="q-mr-xs" />
                Fields marked with <strong class="text-white">*</strong> are required. All other
                fields accept null input.
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="col-12 col-md-6">
              <q-btn
                outline
                rounded
                color="grey-4"
                label="Reset Form"
                icon="restart_alt"
                class="full-width q-py-sm"
                size="md"
                @click="resetForm"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-btn
                color="blue-7"
                label="Submit Fish Observation"
                icon="upload"
                unelevated
                rounded
                class="full-width q-py-sm"
                size="md"
                :loading="submitting"
                @click="handleSubmit"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const submitting = ref(false);

// Redirect if not logged in
if (!authStore.isLoggedIn) {
  $q.notify({
    message: 'Please log in to submit observations.',
    color: 'warning',
    icon: 'lock',
    position: 'top',
  });
  router.replace('/auth/login');
}

// ─── Options ───
const observationMethodOptions = [
  'Visual Census',
  'Electrofishing',
  'Gill Net',
  'Cast Net',
  'Hook and Line',
  'Underwater Survey (SCUBA)',
  'Snorkeling',
  'Fyke Net',
  'Trap Net',
  'Trawl',
  'Other',
];

const lifeStageOptions = ['Egg', 'Larva', 'Juvenile', 'Sub-adult', 'Adult', 'Unknown'];

const weightUnitOptions = ['g', 'kg'];

// ─── Form State ───
const form = reactive({
  dateObserved: '',
  stationId: '',
  latitude: null as number | null,
  longitude: null as number | null,
  depth: null as number | null,
  observationMethod: null as string | null,
  speciesName: '',
  count: null as number | null,
  lifeStage: null as string | null,
  weight: null as number | null,
  weightUnit: 'g',
  notes: '',
  photos: null as File[] | null,
});

function resetForm() {
  form.dateObserved = '';
  form.stationId = '';
  form.latitude = null;
  form.longitude = null;
  form.depth = null;
  form.observationMethod = null;
  form.speciesName = '';
  form.count = null;
  form.lifeStage = null;
  form.weight = null;
  form.weightUnit = 'g';
  form.notes = '';
  form.photos = null;
}

function handleSubmit() {
  // Validate required fields
  if (!form.dateObserved) {
    $q.notify({ type: 'negative', message: 'Date of Observation is required.', position: 'top' });
    return;
  }
  if (!form.stationId) {
    $q.notify({ type: 'negative', message: 'Station / Location ID is required.', position: 'top' });
    return;
  }
  if (form.latitude === null || form.latitude === undefined || form.latitude === ('' as unknown)) {
    $q.notify({ type: 'negative', message: 'Latitude is required.', position: 'top' });
    return;
  }
  if (
    form.longitude === null ||
    form.longitude === undefined ||
    form.longitude === ('' as unknown)
  ) {
    $q.notify({ type: 'negative', message: 'Longitude is required.', position: 'top' });
    return;
  }

  submitting.value = true;
  // Simulate API call
  setTimeout(() => {
    submitting.value = false;
    $q.notify({
      type: 'positive',
      message: 'Fish observation submitted successfully!',
      color: 'blue-7',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });
    resetForm();
  }, 1000);
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

.z-top {
  position: relative;
  z-index: 1;
}

.section-label {
  display: flex;
  align-items: center;
}

.letter-spacing {
  letter-spacing: 0.08em;
}

.section-sep {
  opacity: 0.15;
}

.form-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06);
}

.form-field :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.5);
}

.form-field :deep(.q-field__hint) {
  color: rgba(255, 255, 255, 0.3);
}

.coord-pill {
  display: inline-flex;
  background: rgba(38, 166, 154, 0.12);
  border: 1px solid rgba(38, 166, 154, 0.3);
  border-radius: 20px;
  padding: 4px 12px;
}

.weight-unit-select :deep(.q-field__control) {
  background: transparent;
  padding: 0;
}

.weight-unit-select :deep(.q-field__native) {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85em;
}
</style>
