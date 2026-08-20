<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Same Lake Lanao background as other researcher pages -->
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
      <div class="q-mb-lg text-center">
        <span class="text-h5 text-weight-bolder text-white drop-shadow">
          <q-icon name="cloud_upload" class="q-mr-sm" color="teal-3" />
          Upload Research Data
        </span>
        <p class="text-grey-3 drop-shadow-soft q-mb-none q-mt-xs">
          Choose what you're submitting for Lake Lanao field research
        </p>
      </div>

      <div class="row q-col-gutter-lg justify-center">
        <div class="col-12 col-sm-6">
          <q-card class="glass-morph type-card cursor-pointer" flat bordered @click="router.push('/researcher/upload/fish')">
            <q-card-section class="column items-center q-pa-xl text-center">
              <div class="cat-icon-bg teal-bg q-mb-lg flex flex-center">
                <q-icon name="set_meal" size="36px" color="teal-4" />
              </div>
              <div class="text-h6 text-white">Fish Observation</div>
              <div class="text-caption text-grey-5 q-mt-sm">
                Endemic, invasive, or general species — species data, morphometrics, photos
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-sm-6">
          <q-card class="glass-morph type-card cursor-pointer" flat bordered @click="router.push('/researcher/upload/water-quality')">
            <q-card-section class="column items-center q-pa-xl text-center">
              <div class="cat-icon-bg blue-bg q-mb-lg flex flex-center">
                <q-icon name="water_drop" size="36px" color="blue-4" />
              </div>
              <div class="text-h6 text-white">Water Quality</div>
              <div class="text-caption text-grey-5 q-mt-sm">
                pH, temperature, dissolved oxygen, nutrients at a fixed sampling station
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="text-center q-mt-xl">
        <q-separator dark class="q-mb-lg" style="opacity: 0.15" />
        <p class="text-grey-4 text-body2 q-mb-md">
          Have a spreadsheet with many readings at once instead?
        </p>
        <q-btn
          outline rounded color="grey-4"
          label="Bulk Upload from Spreadsheet" icon="upload_file"
          @click="uploadDialogRef?.open()"
        />
      </div>
    </div>

    <UploadDataDialog ref="uploadDialogRef" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';
import UploadDataDialog from 'src/components/UploadDataDialog.vue';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const uploadDialogRef = ref<InstanceType<typeof UploadDataDialog> | null>(null);

// Redirect if not logged in
if (!authStore.isLoggedIn) {
  $q.notify({
    message: 'Please log in to upload data.',
    color: 'warning',
    icon: 'lock',
    position: 'top',
  });
  router.replace('/auth/login').catch((err) => {
    console.error('Navigation error:', err);
  });
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

.type-card {
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.type-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.cat-icon-bg {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}

.teal-bg { background: rgba(38, 166, 154, 0.2); }
.blue-bg { background: rgba(66, 165, 245, 0.2); }
</style>
