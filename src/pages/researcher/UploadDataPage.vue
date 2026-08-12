<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Same Lake Lanao background -->
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
      <div class="q-mb-lg">
        <span class="text-h5 text-weight-bolder text-white drop-shadow">
          <q-icon name="cloud_upload" class="q-mr-sm" color="teal-3" />
          Upload Fish Observation
        </span>
        <p class="text-grey-3 drop-shadow-soft q-mb-none q-mt-xs">
          Submit a new field observation record with GPS coordinates
        </p>
      </div>

      <!-- Form Card -->
      <q-card class="glass-morph">
        <q-card-section>
          <div class="text-white text-h6 text-weight-bold q-mb-md">
            <q-icon name="add_circle" color="teal-3" class="q-mr-sm" />
            New Observation
          </div>

          <div class="row q-col-gutter-md">
            <!-- Common Name -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.commonName"
                :options="speciesOptions"
                label="Common Name"
                dark
                outlined
                emit-value
                map-options
                class="form-field"
                @update:model-value="onSpeciesSelect"
              />
            </div>

            <!-- Scientific Name -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.scientificName"
                label="Scientific Name"
                dark
                outlined
                class="form-field"
              />
            </div>

            <!-- Type -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.type"
                :options="typeOptions"
                label="Type"
                dark
                outlined
                emit-value
                map-options
                class="form-field"
              />
            </div>

            <!-- Conservation Status -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.status"
                :options="statusOptions"
                label="Conservation Status"
                dark
                outlined
                emit-value
                map-options
                class="form-field"
              />
            </div>

            <!-- Length -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.length"
                label="True Length (cm)"
                type="number"
                dark
                outlined
                class="form-field"
              />
            </div>

            <!-- Weight -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.weight"
                label="Weight (g)"
                type="number"
                dark
                outlined
                class="form-field"
              />
            </div>

            <!-- Latitude -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.latitude"
                label="Latitude"
                type="number"
                step="0.000001"
                hint="e.g. 7.9900"
                dark
                outlined
                class="form-field"
              >
                <template #prepend>
                  <q-icon name="my_location" color="teal-4" />
                </template>
              </q-input>
            </div>

            <!-- Longitude -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.longitude"
                label="Longitude"
                type="number"
                step="0.000001"
                hint="e.g. 124.0700"
                dark
                outlined
                class="form-field"
              >
                <template #prepend>
                  <q-icon name="my_location" color="teal-4" />
                </template>
              </q-input>
            </div>

            <!-- Date Observed -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.dateObserved"
                label="Date Observed"
                type="date"
                dark
                outlined
                class="form-field"
              />
            </div>

            <!-- Placeholder for alignment -->
            <div class="col-12 col-md-6" />

            <!-- Field Notes -->
            <div class="col-12">
              <q-input
                v-model="form.notes"
                label="Field Notes / Remarks"
                type="textarea"
                :rows="3"
                dark
                outlined
                class="form-field"
              />
            </div>

            <!-- File Upload -->
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
                  <q-icon name="photo_camera" color="teal-4" />
                </template>
              </q-file>
            </div>

            <!-- Submit Button -->
            <div class="col-12">
              <q-btn
                color="teal"
                label="Submit Observation"
                icon="upload"
                unelevated
                rounded
                class="full-width q-py-sm"
                size="md"
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
import { reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

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

// ─── Species data for auto-fill ───
const speciesMap: Record<string, { scientificName: string; type: 'endemic' | 'invasive'; status: string }> = {
  'Pait': { scientificName: 'Puntius sirang', type: 'endemic', status: 'Critically Endangered' },
  'Igat': { scientificName: 'Anguilla marmorata', type: 'endemic', status: 'Endangered' },
  'Banak': { scientificName: 'Puntius lanaoensis', type: 'endemic', status: 'Critically Endangered' },
  'Ludong': { scientificName: 'Puntius tumba', type: 'endemic', status: 'Critically Endangered' },
  'Tarong': { scientificName: 'Puntius tras', type: 'endemic', status: 'Endangered' },
  'Nile Tilapia': { scientificName: 'Oreochromis niloticus', type: 'invasive', status: 'Least Concern' },
  'Common Carp': { scientificName: 'Cyprinus carpio', type: 'invasive', status: 'Least Concern' },
  'Guppy': { scientificName: 'Poecilia reticulata', type: 'invasive', status: 'Least Concern' },
};

const speciesOptions = [
  { label: 'Pait', value: 'Pait' },
  { label: 'Igat', value: 'Igat' },
  { label: 'Banak', value: 'Banak' },
  { label: 'Ludong', value: 'Ludong' },
  { label: 'Tarong', value: 'Tarong' },
  { label: 'Nile Tilapia', value: 'Nile Tilapia' },
  { label: 'Common Carp', value: 'Common Carp' },
  { label: 'Guppy', value: 'Guppy' },
  { label: 'Other', value: 'Other' },
];

const typeOptions = [
  { label: 'Endemic', value: 'endemic' },
  { label: 'Invasive', value: 'invasive' },
];

const statusOptions = [
  { label: 'Critically Endangered', value: 'Critically Endangered' },
  { label: 'Endangered', value: 'Endangered' },
  { label: 'Vulnerable', value: 'Vulnerable' },
  { label: 'Least Concern', value: 'Least Concern' },
];

// ─── Form State ───
const form = reactive({
  commonName: null as string | null,
  scientificName: '',
  type: null as string | null,
  status: null as string | null,
  length: null as number | null,
  weight: null as number | null,
  latitude: 7.99,
  longitude: 124.07,
  dateObserved: '',
  notes: '',
  photos: null as File[] | null,
});

function onSpeciesSelect(val: string) {
  if (val && val !== 'Other' && speciesMap[val]) {
    form.scientificName = speciesMap[val].scientificName;
    form.type = speciesMap[val].type;
    form.status = speciesMap[val].status;
  } else {
    form.scientificName = '';
    form.type = null;
    form.status = null;
  }
}

function resetForm() {
  form.commonName = null;
  form.scientificName = '';
  form.type = null;
  form.status = null;
  form.length = null;
  form.weight = null;
  form.latitude = 7.99;
  form.longitude = 124.07;
  form.dateObserved = '';
  form.notes = '';
  form.photos = null;
}

function handleSubmit() {
  $q.notify({
    type: 'positive',
    message: 'Observation submitted successfully!',
    color: 'teal',
    icon: 'check_circle',
    position: 'top',
    timeout: 3000,
  });
  resetForm();
}
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

.form-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06);
}

.form-field :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.5);
}

.page-content {
  position: relative;
  z-index: 1;
  padding-top: 88px;
}
</style>
