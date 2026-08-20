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
    <div class="page-content full-width q-pa-md" style="max-width: 960px">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bolder text-white drop-shadow">
            <q-icon name="opacity" class="q-mr-sm" color="teal-3" />
            Water Quality
          </div>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-mt-xs">
            Record water quality parameters from Lake Lanao field sampling
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <q-card class="glass-morph">
        <q-card-section>
          <!-- ════════════════════════════════════
               SECTION 1 · FIELD DATA
               ════════════════════════════════════ -->
          <div class="section-header q-mb-md">
            <div class="section-badge teal">
              <span class="section-number">1</span>
            </div>
            <div>
              <div class="text-teal-3 text-weight-bold text-subtitle1">Field Data</div>
              <div class="text-grey-5 text-caption">Location, date, and sampling context</div>
            </div>
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
                  <q-icon name="event" color="teal-4" />
                </template>
              </q-input>
            </div>

            <!-- Station (required) — fixed sampling sites, coordinates aren't freely editable -->
            <div class="col-12 col-md-4">
              <q-select
                v-model="form.siteId"
                :options="stationOptionsFiltered"
                label="Station *"
                dark
                outlined
                emit-value
                map-options
                use-input
                input-debounce="0"
                @filter="filterStations"
                class="form-field"
                hint="Fixed sampling site"
                :rules="[(val) => !!val || 'Station is required']"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="pin_drop" color="teal-4" />
                </template>
              </q-select>
            </div>

            <!-- Depth -->
            <div class="col-12 col-md-4">
              <q-select
                v-model="form.depthM"
                :options="DEPTH_OPTIONS"
                label="Depth *"
                emit-value
                map-options
                dark
                outlined
                class="form-field"
                :rules="[(val) => val !== null || 'Depth is required']"
                lazy-rules
              >
                <template #prepend>
                  <q-icon name="vertical_align_bottom" color="teal-4" />
                </template>
              </q-select>
            </div>

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
                  <q-icon name="event" color="teal-4" />
                </template>
              </q-input>
            </div>

            <!-- Coordinate preview pill (derived from the selected station) -->
            <div class="col-12" v-if="selectedStation">
              <div class="coord-pill row items-center no-wrap q-gutter-xs">
                <q-icon name="gps_fixed" color="teal-4" size="14px" />
                <span class="text-teal-3 text-caption text-weight-medium">
                  GIS Point: {{ selectedStation.latitude.toFixed(6) }}, {{ selectedStation.longitude.toFixed(6) }}
                </span>
              </div>
            </div>
          </div>

          <q-separator dark class="q-mb-lg section-sep" />

          <!-- ════════════════════════════════════
               SECTION 2 · PHYSICO-CHEMICAL DATA
               ════════════════════════════════════ -->
          <div class="section-header q-mb-md">
            <div class="section-badge blue">
              <span class="section-number">2</span>
            </div>
            <div>
              <div class="text-blue-3 text-weight-bold text-subtitle1">Physico-Chemical Data</div>
              <div class="text-grey-5 text-caption">
                Physical and chemical water parameters — all optional
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mb-lg">
            <!-- Dissolved Oxygen -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.dissolvedOxygen"
                label="Dissolved Oxygen (DO)"
                type="number"
                min="0"
                step="0.01"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="bubble_chart" color="blue-4" />
                </template>
                <template #append>
                  <span class="unit-label">ppm</span>
                </template>
              </q-input>
            </div>

            <!-- Temperature -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.temperature"
                label="Temperature"
                type="number"
                step="0.1"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="thermostat" color="blue-4" />
                </template>
                <template #append>
                  <span class="unit-label">°C</span>
                </template>
              </q-input>
            </div>

            <!-- pH -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.ph"
                label="pH Level"
                type="number"
                min="0"
                max="14"
                step="0.01"
                dark
                outlined
                class="form-field"
                hint="Optional (0–14)"
              >
                <template #prepend>
                  <q-icon name="science" color="blue-4" />
                </template>
                <template #append>
                  <span class="unit-label">pH</span>
                </template>
              </q-input>
            </div>

            <!-- Turbidity -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.turbidity"
                label="Turbidity"
                type="number"
                min="0"
                step="0.1"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="water" color="blue-4" />
                </template>
                <template #append>
                  <span class="unit-label">NTU</span>
                </template>
              </q-input>
            </div>

            <!-- Conductivity -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.conductivity"
                label="Conductivity"
                type="number"
                min="0"
                step="0.1"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="electric_bolt" color="blue-4" />
                </template>
                <template #append>
                  <span class="unit-label">µS/cm</span>
                </template>
              </q-input>
            </div>

            <!-- Total Dissolved Solids -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.tds"
                label="Total Dissolved Solids"
                type="number"
                min="0"
                step="0.1"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="grain" color="blue-4" />
                </template>
                <template #append>
                  <span class="unit-label">mg/L</span>
                </template>
              </q-input>
            </div>

            <!-- Total Suspended Solids -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.tss"
                label="Total Suspended Solids"
                type="number"
                min="0"
                step="0.1"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="filter_drama" color="blue-4" />
                </template>
                <template #append>
                  <span class="unit-label">mg/L</span>
                </template>
              </q-input>
            </div>
          </div>

          <q-separator dark class="q-mb-lg section-sep" />

          <!-- ════════════════════════════════════
               SECTION 3 · NUTRIENTS
               ════════════════════════════════════ -->
          <div class="section-header q-mb-md">
            <div class="section-badge green">
              <span class="section-number">3</span>
            </div>
            <div>
              <div class="text-green-3 text-weight-bold text-subtitle1">Nutrients</div>
              <div class="text-grey-5 text-caption">
                Dissolved nutrient concentrations — all optional
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mb-lg">
            <!-- Phosphate -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.phosphate"
                label="Phosphate (PO₄³⁻)"
                type="number"
                min="0"
                step="0.001"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="hexagon" color="green-4" />
                </template>
                <template #append>
                  <span class="unit-label">mg/L</span>
                </template>
              </q-input>
            </div>

            <!-- Ammonia -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.ammonia"
                label="Ammonia (NH₃)"
                type="number"
                min="0"
                step="0.001"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="hexagon" color="green-4" />
                </template>
                <template #append>
                  <span class="unit-label">mg/L</span>
                </template>
              </q-input>
            </div>

            <!-- Nitrate -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.nitrate"
                label="Nitrate (NO₃⁻)"
                type="number"
                min="0"
                step="0.001"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="hexagon" color="green-4" />
                </template>
                <template #append>
                  <span class="unit-label">mg/L</span>
                </template>
              </q-input>
            </div>

            <!-- Nitrite -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.nitrite"
                label="Nitrite (NO₂⁻)"
                type="number"
                min="0"
                step="0.001"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="hexagon" color="green-4" />
                </template>
                <template #append>
                  <span class="unit-label">mg/L</span>
                </template>
              </q-input>
            </div>

            <!-- Sulfate -->
            <div class="col-12 col-sm-6 col-md-4">
              <q-input
                v-model.number="form.sulfate"
                label="Sulfate (SO₄²⁻)"
                type="number"
                min="0"
                step="0.001"
                dark
                outlined
                class="form-field"
                hint="Optional"
              >
                <template #prepend>
                  <q-icon name="hexagon" color="green-4" />
                </template>
                <template #append>
                  <span class="unit-label">mg/L</span>
                </template>
              </q-input>
            </div>
          </div>

          <q-separator dark class="q-mb-lg section-sep" />

          <!-- ════════════════════════════════════
               SECTION 4 · PHOTOSYNTHETIC PIGMENT
               ════════════════════════════════════ -->
          <div class="section-header q-mb-md">
            <div class="section-badge amber">
              <span class="section-number">4</span>
            </div>
            <div>
              <div class="text-amber-3 text-weight-bold text-subtitle1">Photosynthetic Pigment</div>
              <div class="text-grey-5 text-caption">Algal biomass indicator — optional</div>
            </div>
          </div>

          <div class="row q-col-gutter-md q-mb-lg">
            <!-- Chlorophyll-a -->
            <div class="col-12 col-md-5">
              <q-input
                v-model.number="form.chlorophyll"
                label="Chlorophyll-a"
                type="number"
                min="0"
                step="0.001"
                dark
                outlined
                class="form-field"
                hint="Optional — phytoplankton biomass proxy"
              >
                <template #prepend>
                  <q-icon name="eco" color="amber-4" />
                </template>
                <template #append>
                  <span class="unit-label">µg/L</span>
                </template>
              </q-input>
            </div>
          </div>

          <q-separator dark class="q-mb-lg section-sep" />

          <!-- ── Remarks & Submit ── -->
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="form.notes"
                label="Field Notes / Remarks (optional)"
                type="textarea"
                :rows="3"
                dark
                outlined
                class="form-field"
                hint="Weather conditions, sampling method, equipment used, anomalies, etc."
              >
                <template #prepend>
                  <q-icon name="notes" color="teal-4" />
                </template>
              </q-input>
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
                color="teal"
                label="Submit Water Quality Data"
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';
import { fetchStations, useStations } from 'src/composables/useStations';
import { DEPTH_OPTIONS } from 'src/composables/useWaterQualityModel';
import { submitWaterQualityReading } from 'src/composables/useWaterQualityReadings';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const submitting = ref(false);

// Redirect if not logged in
if (!authStore.isLoggedIn) {
  $q.notify({
    message: 'Please log in to submit water quality data.',
    color: 'warning',
    icon: 'lock',
    position: 'top',
  });
  router.replace('/auth/login').catch((err) => {
    console.error('Navigation error:', err);
  });
}

// ─── Stations (fixed sampling sites) ───
const { stations } = useStations();
onMounted(() => {
  fetchStations().catch((err: unknown) => console.error('Failed to load stations:', err));
});

const stationOptions = computed(() =>
  stations.value.map((s) => ({ label: s.stationId ? `${s.siteId} (${s.stationId})` : s.siteId, value: s.siteId })),
);
const stationOptionsFiltered = ref(stationOptions.value);
watch(stationOptions, (opts) => {
  stationOptionsFiltered.value = opts;
});
function filterStations(val: string, update: (cb: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    stationOptionsFiltered.value = needle
      ? stationOptions.value.filter((o) => o.label.toLowerCase().includes(needle))
      : stationOptions.value;
  });
}

// ─── Form State ───
const form = reactive({
  // Section 1 – Field Data
  dateObserved: '',
  siteId: '',
  depthM: 0 as number | null,

  // Section 2 – Physico-Chemical
  dissolvedOxygen: null as number | null,
  temperature: null as number | null,
  ph: null as number | null,
  turbidity: null as number | null,
  conductivity: null as number | null,
  tds: null as number | null,
  tss: null as number | null,

  // Section 3 – Nutrients
  phosphate: null as number | null,
  ammonia: null as number | null,
  nitrate: null as number | null,
  nitrite: null as number | null,
  sulfate: null as number | null,

  // Section 4 – Photosynthetic Pigment
  chlorophyll: null as number | null,

  // Remarks
  notes: '',
});

const selectedStation = computed(() => stations.value.find((s) => s.siteId === form.siteId) ?? null);

function resetForm() {
  form.dateObserved = '';
  form.siteId = '';
  form.depthM = 0;
  form.dissolvedOxygen = null;
  form.temperature = null;
  form.ph = null;
  form.turbidity = null;
  form.conductivity = null;
  form.tds = null;
  form.tss = null;
  form.phosphate = null;
  form.ammonia = null;
  form.nitrate = null;
  form.nitrite = null;
  form.sulfate = null;
  form.chlorophyll = null;
  form.notes = '';
}

async function handleSubmit() {
  if (!form.dateObserved) {
    $q.notify({ type: 'negative', message: 'Date of Observation is required.', position: 'top' });
    return;
  }
  if (!form.siteId) {
    $q.notify({ type: 'negative', message: 'Station is required.', position: 'top' });
    return;
  }
  if (form.depthM === null) {
    $q.notify({ type: 'negative', message: 'Depth is required.', position: 'top' });
    return;
  }

  submitting.value = true;
  try {
    await submitWaterQualityReading({
      siteId: form.siteId,
      dateObserved: form.dateObserved,
      depthM: form.depthM,
      dissolvedOxygen: form.dissolvedOxygen,
      temperature: form.temperature,
      ph: form.ph,
      turbidity: form.turbidity,
      conductivity: form.conductivity,
      tds: form.tds,
      tss: form.tss,
      phosphate: form.phosphate,
      ammonia: form.ammonia,
      nitrate: form.nitrate,
      nitrite: form.nitrite,
      sulfate: form.sulfate,
      chlorophyll: form.chlorophyll,
      notes: form.notes || undefined,
    });
    $q.notify({
      type: 'positive',
      message: 'Water quality data submitted for review!',
      color: 'teal',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });
    resetForm();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to submit water quality data.',
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

/* Section header row */
.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.section-badge {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-badge.teal {
  background: rgba(38, 166, 154, 0.25);
  border: 1.5px solid rgba(38, 166, 154, 0.5);
}
.section-badge.blue {
  background: rgba(66, 165, 245, 0.2);
  border: 1.5px solid rgba(66, 165, 245, 0.45);
}
.section-badge.green {
  background: rgba(102, 187, 106, 0.2);
  border: 1.5px solid rgba(102, 187, 106, 0.45);
}
.section-badge.amber {
  background: rgba(255, 202, 40, 0.2);
  border: 1.5px solid rgba(255, 202, 40, 0.45);
}

.section-number {
  font-weight: 800;
  font-size: 0.95rem;
  color: #fff;
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

.unit-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.78rem;
  white-space: nowrap;
}

.coord-pill {
  display: inline-flex;
  background: rgba(38, 166, 154, 0.12);
  border: 1px solid rgba(38, 166, 154, 0.3);
  border-radius: 20px;
  padding: 4px 12px;
}
</style>
