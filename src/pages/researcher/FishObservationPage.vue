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
            <q-icon name="set_meal" class="q-mr-sm" color="blue-3" />
            Fish Observation
          </div>
          <p class="text-grey-3 drop-shadow-soft q-mb-none q-mt-xs">
            Log a new fish sighting with field data for Lake Lanao GIS records
          </p>
        </div>
      </div>

      <!-- STEP 1: Category Selection -->
      <q-card class="glass-morph q-mb-md" v-if="!selectedCategory">
        <q-card-section class="q-pa-lg">
          <div class="text-h6 text-white text-center q-mb-xs">What type of fish are you observing?</div>
          <div class="text-grey-4 text-body2 text-center q-mb-xl">
            Select a category to load the appropriate observation form.
          </div>

          <div class="row q-col-gutter-lg justify-center">
            <!-- Endemic Cyprinids -->
            <div class="col-12 col-sm-4">
              <q-card
                class="category-card cursor-pointer"
                flat bordered
                @click="selectCategory('endemic')"
              >
                <q-card-section class="column items-center q-pa-xl text-center">
                  <div class="cat-icon-bg teal-bg q-mb-lg flex flex-center">
                    <q-icon name="water" size="36px" color="teal-4" />
                  </div>
                  <div class="text-h6 text-white">Endemic Cyprinids</div>
                  <div class="text-caption text-grey-5 q-mt-sm">
                    Native species of Lake Lanao — science &amp; local names, morphometrics
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Invasive Species -->
            <div class="col-12 col-sm-4">
              <q-card
                class="category-card cursor-pointer"
                flat bordered
                @click="selectCategory('invasive')"
              >
                <q-card-section class="column items-center q-pa-xl text-center">
                  <div class="cat-icon-bg red-bg q-mb-lg flex flex-center">
                    <q-icon name="pest_control" size="36px" color="red-4" />
                  </div>
                  <div class="text-h6 text-white">Invasive Species</div>
                  <div class="text-caption text-grey-5 q-mt-sm">
                    Non-native, introduced fish — morphometrics &amp; location data
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Others / General -->
            <div class="col-12 col-sm-4">
              <q-card
                class="category-card cursor-pointer"
                flat bordered
                @click="selectCategory('others')"
              >
                <q-card-section class="column items-center q-pa-xl text-center">
                  <div class="cat-icon-bg orange-bg q-mb-lg flex flex-center">
                    <q-icon name="blender" size="36px" color="orange-4" />
                  </div>
                  <div class="text-h6 text-white">General / Others</div>
                  <div class="text-caption text-grey-5 q-mt-sm">
                    Other fish species — location, depth &amp; abundance data
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- STEP 2: Form based on category -->
      <template v-else>
        <!-- Category breadcrumb / back -->
        <div class="row items-center q-mb-md">
          <q-btn
            flat round dense icon="arrow_back" color="white"
            @click="selectedCategory = ''"
            class="q-mr-sm"
          />
          <q-chip
            :color="categoryColor"
            text-color="white"
            :icon="categoryIcon"
            :label="categoryLabel"
            size="md"
          />
          <q-space />
          <q-btn
            flat dense color="blue-3" icon="auto_fix_high" label="Load Sample Data"
            @click="loadSampleData" size="sm" class="q-mr-sm"
          >
            <q-tooltip>Pre-fill with example data</q-tooltip>
          </q-btn>
          <q-btn flat dense color="grey-4" icon="restart_alt" label="Reset" @click="resetForm" size="sm" />
        </div>

        <q-card class="glass-morph">
          <q-card-section>

            <!-- ══════════════════════════════════
                 ENDEMIC CYPRINIDS FORM
            ══════════════════════════════════ -->
            <template v-if="selectedCategory === 'endemic'">
              <!-- Section A: Species -->
              <div class="section-label q-mb-md">
                <q-icon name="biotech" color="teal-3" class="q-mr-xs" />
                <span class="text-teal-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  A. Species
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.endemic.speciesScientific"
                    label="Science Name"
                    dark outlined class="form-field"
                    hint="e.g. Puntius binotatus"
                  >
                    <template #prepend><q-icon name="biotech" color="teal-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.endemic.speciesLocal"
                    label="Local Name"
                    dark outlined class="form-field"
                    hint="e.g. Igat, Palongpalungan"
                  >
                    <template #prepend><q-icon name="translate" color="teal-4" /></template>
                  </q-input>
                </div>
              </div>

              <q-separator dark class="q-mb-lg section-sep" />

              <!-- Section B: Morphometric Characteristics -->
              <div class="section-label q-mb-md">
                <q-icon name="straighten" color="teal-3" class="q-mr-xs" />
                <span class="text-teal-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  B. Morphometric Characteristics
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.endemic.trueLength"
                    label="True Length — TL (cm)"
                    type="number" min="0" step="0.1"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="straighten" color="teal-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.endemic.bodyDepth"
                    label="Body Depth — BD (cm)"
                    type="number" min="0" step="0.1"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="height" color="teal-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.endemic.weight"
                    label="Weight — W (g)"
                    type="number" min="0" step="0.01"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="scale" color="teal-4" /></template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-file
                    v-model="form.endemic.photos"
                    label="Photo (lateral, dorsal, ventral, anterior, posterior)"
                    dark outlined multiple accept="image/*" class="form-field" counter
                  >
                    <template #prepend><q-icon name="photo_camera" color="teal-4" /></template>
                  </q-file>
                </div>
              </div>

              <q-separator dark class="q-mb-lg section-sep" />

              <!-- Section C: Location -->
              <div class="section-label q-mb-md">
                <q-icon name="place" color="teal-3" class="q-mr-xs" />
                <span class="text-teal-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  C. Location
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.endemic.municipal"
                    label="Municipal"
                    dark outlined class="form-field"
                    hint="e.g. Lanao del Sur"
                  >
                    <template #prepend><q-icon name="location_city" color="teal-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.endemic.barangay"
                    label="Barangay"
                    dark outlined class="form-field"
                  >
                    <template #prepend><q-icon name="place" color="teal-4" /></template>
                  </q-input>
                </div>
              </div>
            </template>

            <!-- ══════════════════════════════════
                 INVASIVE SPECIES FORM
            ══════════════════════════════════ -->
            <template v-else-if="selectedCategory === 'invasive'">
              <!-- Section A: Species -->
              <div class="section-label q-mb-md">
                <q-icon name="biotech" color="red-3" class="q-mr-xs" />
                <span class="text-red-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  A. Species
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12">
                  <q-input
                    v-model="form.invasive.speciesName"
                    label="Species Name"
                    dark outlined class="form-field"
                    hint="Science or common name"
                  >
                    <template #prepend><q-icon name="biotech" color="red-4" /></template>
                  </q-input>
                </div>
              </div>

              <q-separator dark class="q-mb-lg section-sep" />

              <!-- Section B: Morphometric Characteristics -->
              <div class="section-label q-mb-md">
                <q-icon name="straighten" color="red-3" class="q-mr-xs" />
                <span class="text-red-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  B. Morphometric Characteristics
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.invasive.trueLength"
                    label="True Length — TL (cm)"
                    type="number" min="0" step="0.1"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="straighten" color="red-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.invasive.bodyDepth"
                    label="Body Depth — BD (cm)"
                    type="number" min="0" step="0.1"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="height" color="red-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.invasive.weight"
                    label="Weight — W (g)"
                    type="number" min="0" step="0.01"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="scale" color="red-4" /></template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-file
                    v-model="form.invasive.photos"
                    label="Photo (lateral, dorsal, ventral, anterior, posterior)"
                    dark outlined multiple accept="image/*" class="form-field" counter
                  >
                    <template #prepend><q-icon name="photo_camera" color="red-4" /></template>
                  </q-file>
                </div>
              </div>

              <q-separator dark class="q-mb-lg section-sep" />

              <!-- Section C: Location -->
              <div class="section-label q-mb-md">
                <q-icon name="place" color="red-3" class="q-mr-xs" />
                <span class="text-red-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  C. Location
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.invasive.municipal"
                    label="Municipal"
                    dark outlined class="form-field"
                  >
                    <template #prepend><q-icon name="location_city" color="red-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.invasive.barangay"
                    label="Barangay"
                    dark outlined class="form-field"
                  >
                    <template #prepend><q-icon name="place" color="red-4" /></template>
                  </q-input>
                </div>
              </div>
            </template>

            <!-- ══════════════════════════════════
                 OTHERS / GENERAL FORM
            ══════════════════════════════════ -->
            <template v-else-if="selectedCategory === 'others'">
              <!-- Section A: Location -->
              <div class="section-label q-mb-md">
                <q-icon name="gps_fixed" color="orange-3" class="q-mr-xs" />
                <span class="text-orange-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  A. Location
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.others.coordinates"
                    label="Coordinates"
                    dark outlined class="form-field"
                    hint="e.g. 7.9900, 124.0700"
                  >
                    <template #prepend><q-icon name="gps_fixed" color="orange-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.number="form.others.depth"
                    label="Depth (m)"
                    type="number" min="0" step="0.1"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="vertical_align_bottom" color="orange-4" /></template>
                  </q-input>
                </div>
              </div>

              <q-separator dark class="q-mb-lg section-sep" />

              <!-- Section B: Abundance -->
              <div class="section-label q-mb-md">
                <q-icon name="format_list_numbered" color="orange-3" class="q-mr-xs" />
                <span class="text-orange-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                  B. Abundance
                </span>
              </div>
              <div class="row q-col-gutter-md q-mb-lg">
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.others.weight"
                    label="Weight (g)"
                    type="number" min="0" step="0.01"
                    dark outlined class="form-field" hint="Optional"
                  >
                    <template #prepend><q-icon name="scale" color="orange-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model.number="form.others.number"
                    label="Number"
                    type="number" min="0"
                    dark outlined class="form-field"
                    hint="Count of individuals"
                  >
                    <template #prepend><q-icon name="tag" color="orange-4" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-4">
                  <q-input
                    v-model="form.others.size"
                    label="Size"
                    dark outlined class="form-field"
                    hint="e.g. Small, Medium, Large"
                  >
                    <template #prepend><q-icon name="straighten" color="orange-4" /></template>
                  </q-input>
                </div>
              </div>
            </template>

            <q-separator dark class="q-mb-lg section-sep" />

            <!-- Observation Details (shared) -->
            <div class="section-label q-mb-md">
              <q-icon name="event" color="blue-3" class="q-mr-xs" />
              <span class="text-blue-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                Observation Details
              </span>
            </div>
            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.dateObserved"
                  label="Date Observed *"
                  type="date"
                  dark outlined class="form-field"
                  :rules="[(val) => !!val || 'Date Observed is required']"
                  lazy-rules
                >
                  <template #prepend><q-icon name="event" color="blue-4" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6" v-if="selectedCategory !== 'others'">
                <q-select
                  v-model="form.conservationStatus"
                  :options="conservationStatusOptions"
                  label="Conservation Status"
                  dark outlined emit-value map-options class="form-field"
                  hint="Optional"
                >
                  <template #prepend><q-icon name="shield" color="blue-4" /></template>
                </q-select>
              </div>
              <div class="col-12 col-md-6" v-if="selectedCategory !== 'others'">
                <q-input
                  v-model.number="form.latitude"
                  label="Latitude"
                  type="number" step="0.000001"
                  dark outlined class="form-field"
                  hint="Optional — needed to show this observation on the map"
                >
                  <template #prepend><q-icon name="my_location" color="blue-4" /></template>
                </q-input>
              </div>
              <div class="col-12 col-md-6" v-if="selectedCategory !== 'others'">
                <q-input
                  v-model.number="form.longitude"
                  label="Longitude"
                  type="number" step="0.000001"
                  dark outlined class="form-field"
                  hint="Optional — needed to show this observation on the map"
                >
                  <template #prepend><q-icon name="my_location" color="blue-4" /></template>
                </q-input>
              </div>
            </div>

            <q-separator dark class="q-mb-lg section-sep" />

            <!-- Remarks (shared) -->
            <div class="section-label q-mb-md">
              <q-icon name="notes" color="blue-3" class="q-mr-xs" />
              <span class="text-blue-3 text-weight-bold text-subtitle2 text-uppercase letter-spacing">
                Remarks
              </span>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model="form.notes"
                  label="Field Notes / Remarks"
                  type="textarea"
                  :rows="3"
                  dark outlined class="form-field"
                  hint="Optional — habitat, behavior, environmental conditions, etc."
                />
              </div>

              <div class="col-12">
                <p class="text-grey-5 text-caption q-mb-md">
                  <q-icon name="info" size="xs" class="q-mr-xs" />
                  Date Observed is required. Everything else is optional — fill in what applies.
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="col-12 col-md-6">
                <q-btn
                  outline rounded color="grey-4"
                  label="Reset Form" icon="restart_alt"
                  class="full-width q-py-sm" size="md"
                  @click="resetForm"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-btn
                  :color="categoryColor"
                  label="Submit Fish Observation" icon="upload"
                  unelevated rounded
                  class="full-width q-py-sm" size="md"
                  :loading="submitting"
                  @click="handleSubmit"
                />
              </div>
            </div>

          </q-card-section>
        </q-card>
      </template>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';
import { submitFishObservation, type ConservationStatus } from 'src/composables/useFishObservations';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const submitting = ref(false);

const conservationStatusOptions: { label: string; value: ConservationStatus }[] = [
  { label: 'Not Evaluated', value: 'NOT_EVALUATED' },
  { label: 'Critically Endangered', value: 'CRITICALLY_ENDANGERED' },
  { label: 'Endangered', value: 'ENDANGERED' },
  { label: 'Vulnerable', value: 'VULNERABLE' },
  { label: 'Least Concern', value: 'LEAST_CONCERN' },
];

// Redirect if not logged in
if (!authStore.isLoggedIn) {
  $q.notify({
    message: 'Please log in to submit observations.',
    color: 'warning',
    icon: 'lock',
    position: 'top',
  });
  void router.replace('/auth/login');
}

// ─── Category selection ───
const selectedCategory = ref('');

function selectCategory(cat: string) {
  selectedCategory.value = cat;
  resetForm();
}

const categoryLabel = computed(() => {
  if (selectedCategory.value === 'endemic') return 'Endemic Cyprinids';
  if (selectedCategory.value === 'invasive') return 'Invasive Species';
  return 'General / Others';
});

const categoryColor = computed(() => {
  if (selectedCategory.value === 'endemic') return 'teal-7';
  if (selectedCategory.value === 'invasive') return 'red-7';
  return 'orange-7';
});

const categoryIcon = computed(() => {
  if (selectedCategory.value === 'endemic') return 'water';
  if (selectedCategory.value === 'invasive') return 'pest_control';
  return 'blender';
});

// ─── Form State ───
const form = reactive({
  endemic: {
    speciesScientific: '',
    speciesLocal: '',
    trueLength: null as number | null,
    bodyDepth: null as number | null,
    weight: null as number | null,
    photos: null as File[] | null,
    municipal: '',
    barangay: '',
  },
  invasive: {
    speciesName: '',
    trueLength: null as number | null,
    bodyDepth: null as number | null,
    weight: null as number | null,
    photos: null as File[] | null,
    municipal: '',
    barangay: '',
  },
  others: {
    coordinates: '',
    depth: null as number | null,
    weight: null as number | null,
    number: null as number | null,
    size: '',
  },
  dateObserved: '',
  conservationStatus: 'NOT_EVALUATED' as ConservationStatus,
  latitude: null as number | null,
  longitude: null as number | null,
  notes: '',
});

function resetForm() {
  form.endemic = {
    speciesScientific: '',
    speciesLocal: '',
    trueLength: null,
    bodyDepth: null,
    weight: null,
    photos: null,
    municipal: '',
    barangay: '',
  };
  form.invasive = {
    speciesName: '',
    trueLength: null,
    bodyDepth: null,
    weight: null,
    photos: null,
    municipal: '',
    barangay: '',
  };
  form.others = {
    coordinates: '',
    depth: null,
    weight: null,
    number: null,
    size: '',
  };
  form.dateObserved = '';
  form.conservationStatus = 'NOT_EVALUATED';
  form.latitude = null;
  form.longitude = null;
  form.notes = '';
}

function loadSampleData() {
  form.dateObserved = new Date().toISOString().slice(0, 10);
  if (selectedCategory.value === 'endemic') {
    form.endemic.speciesScientific = 'Puntius lanaoensis';
    form.endemic.speciesLocal = 'Banak / Palongpalungan';
    form.endemic.trueLength = 18.4;
    form.endemic.bodyDepth = 5.2;
    form.endemic.weight = 95.0;
    form.endemic.municipal = 'Lanao del Sur';
    form.endemic.barangay = 'Bubong';
    form.conservationStatus = 'CRITICALLY_ENDANGERED';
    form.notes = 'Observed in shallow littoral zone near macrophytes. Water was clear, moderate current.';
  } else if (selectedCategory.value === 'invasive') {
    form.invasive.speciesName = 'Oreochromis niloticus (Nile Tilapia)';
    form.invasive.trueLength = 24.7;
    form.invasive.bodyDepth = 8.1;
    form.invasive.weight = 310.5;
    form.invasive.municipal = 'Marawi City';
    form.invasive.barangay = 'Rapasun';
    form.conservationStatus = 'LEAST_CONCERN';
    form.notes = 'Dense aggregation observed near shoreline. Likely displacing endemic cyprinids in this zone.';
  } else if (selectedCategory.value === 'others') {
    form.others.coordinates = '7.9823, 124.2701';
    form.others.depth = 4.5;
    form.others.weight = 520.0;
    form.others.number = 37;
    form.others.size = 'Medium';
    form.notes = 'Mixed catch. Species not identified at time of observation. Habitat: open pelagic zone.';
  }
  $q.notify({
    message: 'Sample data loaded!',
    color: 'blue-7',
    icon: 'auto_fix_high',
    position: 'top',
    timeout: 1500,
  });
}

// "7.9823, 124.2701" -> { latitude, longitude } — best-effort, silently
// leaves both undefined if the free-text field isn't in that shape.
function parseCoordinates(text: string): { latitude?: number; longitude?: number } {
  const parts = text.split(',').map((p) => Number(p.trim()));
  const [lat, lng] = parts;
  if (parts.length === 2 && lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return {};
}

async function handleSubmit() {
  if (!form.dateObserved) {
    $q.notify({ type: 'negative', message: 'Date Observed is required.', position: 'top' });
    return;
  }

  const data = new FormData();
  data.append('dateObserved', form.dateObserved);
  if (form.notes) data.append('notes', form.notes);

  let photos: File[] | null = null;

  if (selectedCategory.value === 'endemic') {
    data.append('category', 'ENDEMIC');
    data.append('conservationStatus', form.conservationStatus);
    if (form.endemic.speciesScientific) data.append('speciesScientific', form.endemic.speciesScientific);
    if (form.endemic.speciesLocal) data.append('speciesCommon', form.endemic.speciesLocal);
    if (form.endemic.trueLength !== null) data.append('trueLengthCm', String(form.endemic.trueLength));
    if (form.endemic.bodyDepth !== null) data.append('bodyDepthCm', String(form.endemic.bodyDepth));
    if (form.endemic.weight !== null) data.append('weightG', String(form.endemic.weight));
    if (form.endemic.municipal) data.append('municipal', form.endemic.municipal);
    if (form.endemic.barangay) data.append('barangay', form.endemic.barangay);
    if (form.latitude !== null) data.append('latitude', String(form.latitude));
    if (form.longitude !== null) data.append('longitude', String(form.longitude));
    photos = form.endemic.photos;
  } else if (selectedCategory.value === 'invasive') {
    data.append('category', 'INVASIVE');
    data.append('conservationStatus', form.conservationStatus);
    if (form.invasive.speciesName) data.append('speciesCommon', form.invasive.speciesName);
    if (form.invasive.trueLength !== null) data.append('trueLengthCm', String(form.invasive.trueLength));
    if (form.invasive.bodyDepth !== null) data.append('bodyDepthCm', String(form.invasive.bodyDepth));
    if (form.invasive.weight !== null) data.append('weightG', String(form.invasive.weight));
    if (form.invasive.municipal) data.append('municipal', form.invasive.municipal);
    if (form.invasive.barangay) data.append('barangay', form.invasive.barangay);
    if (form.latitude !== null) data.append('latitude', String(form.latitude));
    if (form.longitude !== null) data.append('longitude', String(form.longitude));
    photos = form.invasive.photos;
  } else if (selectedCategory.value === 'others') {
    data.append('category', 'GENERAL');
    const { latitude, longitude } = parseCoordinates(form.others.coordinates);
    if (latitude !== undefined) data.append('latitude', String(latitude));
    if (longitude !== undefined) data.append('longitude', String(longitude));
    if (form.others.depth !== null) data.append('depthM', String(form.others.depth));
    if (form.others.weight !== null) data.append('weightG', String(form.others.weight));
    if (form.others.number !== null) data.append('count', String(form.others.number));
    if (form.others.size) data.append('sizeCategory', form.others.size);
  } else {
    return;
  }

  if (photos) {
    for (const file of photos) data.append('photos', file);
  }

  submitting.value = true;
  try {
    await submitFishObservation(data);
    $q.notify({
      type: 'positive',
      message: 'Fish observation submitted for review!',
      color: 'blue-7',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });
    resetForm();
    selectedCategory.value = '';
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Failed to submit fish observation.',
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

/* ── Category selection cards ── */
.category-card {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.category-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.cat-icon-bg {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}

.teal-bg  { background: rgba(38, 166, 154, 0.2); }
.red-bg   { background: rgba(239, 83, 80, 0.2); }
.orange-bg { background: rgba(255, 167, 38, 0.2); }
</style>
