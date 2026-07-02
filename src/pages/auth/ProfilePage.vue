<template>
  <q-page class="q-pa-lg">
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
      style="filter: blur(5px) brightness(0.5); z-index: 0;"
    />
    
    <q-page-sticky position="top-right" :offset="[24, 24]" style="z-index: 9999;">
      <q-btn
        round
        unelevated
        icon="close"
        color="white"
        text-color="grey-9"
        size="md"
        class="close-modal-btn"
        @click="$router.push('/')"
      >
        <q-tooltip anchor="center left" self="center right" :offset="[10, 0]">Close</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <div class="row q-col-gutter-lg justify-center relative-position" style="z-index: 1;">
      <!-- Left Column - User Identity -->
      <div class="col-12 col-md-4">
        <q-card class="shadow-2 rounded-borders">
          <!-- Cover Image -->
          <div class="cover-image">
            <q-img
              src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
              class="full-width"
              style="height: 100px; filter: brightness(0.7)"
              fit="cover"
            />
          </div>

          <!-- User Info -->
          <q-card-section class="text-center relative-position">
            <q-avatar size="100px" class="profile-avatar shadow-5">
              <img :src="user.avatar || 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80'" />
            </q-avatar>

            <div v-if="isEditingProfile" class="q-mt-md row justify-center">
              <q-file outlined dense v-model="avatarFile" label="Update Photo" accept="image/*" style="max-width: 200px" color="primary">
                <template v-slot:prepend>
                  <q-icon name="photo_camera" />
                </template>
              </q-file>
            </div>

            <div class="text-h6 text-weight-bold q-mt-md text-grey-9">Jollymar A. Mark</div>
            <div class="text-subtitle2 text-grey-7">Mindanao State University - Main Campus</div>

            <q-badge color="teal" class="q-mt-sm q-pa-xs px-md" icon="verified">
              Verified Researcher
            </q-badge>
          </q-card-section>

          <q-separator />

          <!-- Stats Section -->
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm text-grey-8">
              <q-icon name="insights" class="q-mr-xs" /> Research Stats
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-4">
                <div class="stat-card text-center">
                  <div class="stat-value text-primary text-weight-bold">
                    9
                  </div>
                  <div class="stat-label text-caption text-grey-6">Uploads</div>
                </div>
              </div>
              <div class="col-4">
                <div class="stat-card text-center">
                  <div class="stat-value text-teal text-weight-bold">
                    7
                  </div>
                  <div class="stat-label text-caption text-grey-6">Layers</div>
                </div>
              </div>
              <div class="col-4">
                <div class="stat-card text-center">
                  <div class="stat-value text-deep-orange text-weight-bold">
                    6
                  </div>
                  <div class="stat-label text-caption text-grey-6">Reports</div>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Quick Actions -->
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm text-grey-8">
              <q-icon name="bolt" class="q-mr-xs" /> Quick Actions
            </div>
            <div class="column q-gutter-sm">
              <q-btn
                outline
                color="primary"
                icon="upload_file"
                label="Upload Data"
                class="full-width"
                no-caps
                unelevated
              />
              <q-btn
                outline
                color="teal"
                icon="add_chart"
                label="Create Report"
                class="full-width"
                no-caps
                unelevated
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column - Progress & Activity -->
      <div class="col-12 col-md-8">
        <q-card class="shadow-2 rounded-borders bg-blue-grey-1">
          <q-tabs
            v-model="tab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="settings" label="Profile Settings" icon="manage_accounts" />
            <q-tab name="activity" label="Research Activity" icon="history" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <!-- Profile Settings Tab -->
            <q-tab-panel name="settings">
              <div class="row items-center justify-between q-mb-md">
                <div class="text-h6 text-weight-medium">
                  <q-icon name="person" class="q-mr-sm" /> Profile Information
                </div>
                <div>
                  <q-btn v-if="!isEditingProfile" flat color="primary" label="Edit Profile" icon="edit" @click="isEditingProfile = true" />
                </div>
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input outlined v-model="user.name" label="Full Name" color="primary" :readonly="!isEditingProfile">
                    <template v-slot:prepend>
                      <q-icon name="person" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <q-input outlined v-model="user.email" label="Email Address" color="primary" :readonly="!isEditingProfile">
                    <template v-slot:prepend>
                      <q-icon name="email" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-input
                    outlined
                    v-model="user.institution"
                    label="Institution / Organization"
                    color="primary"
                    :readonly="!isEditingProfile"
                  >
                    <template v-slot:prepend>
                      <q-icon name="school" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12">
                  <q-input
                    outlined
                    v-model="user.bio"
                    label="Research Focus / Bio"
                    type="textarea"
                    rows="3"
                    color="primary"
                    :readonly="!isEditingProfile"
                  >
                    <template v-slot:prepend>
                      <q-icon name="description" />
                    </template>
                  </q-input>
                </div>
              </div>

              <!-- Inline Change Password -->
              <div v-if="isEditingProfile" class="q-mt-xl">
                <div class="text-h6 text-weight-medium q-mb-md">
                  <q-icon name="lock" class="q-mr-sm" /> Change Password
                </div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input outlined v-model="passwordForm.current" type="password" label="Current Password" color="primary">
                      <template v-slot:prepend><q-icon name="vpn_key" /></template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input outlined v-model="passwordForm.new" type="password" label="New Password" color="primary">
                      <template v-slot:prepend><q-icon name="lock" /></template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input outlined v-model="passwordForm.confirm" type="password" label="Confirm New Password" color="primary">
                      <template v-slot:prepend><q-icon name="lock_outline" /></template>
                    </q-input>
                  </div>
                </div>
              </div>
              
              <div v-if="isEditingProfile" class="q-mt-lg row q-gutter-sm">
                <q-btn color="primary" label="Save Changes" icon="save" unelevated @click="saveProfile" />
                <q-btn outline color="grey-7" label="Cancel" @click="cancelEdit" />
              </div>
            </q-tab-panel>

            <!-- Research Activity Tab -->
            <q-tab-panel name="activity">
              <!-- Timeline Section -->
              <div class="text-h6 q-mb-md text-weight-medium">
                <q-icon name="timeline" class="q-mr-sm" /> Research Timeline
              </div>

              <q-timeline color="primary" class="q-mb-lg">
                <q-timeline-entry
                  v-for="(activity, index) in timeline"
                  :key="index"
                  :title="activity.title"
                  :subtitle="activity.subtitle"
                  :icon="activity.icon"
                  :color="activity.color"
                >
                  <template v-slot:default>
                    <div class="text-body2 text-grey-8">
                      {{ activity.description }}
                    </div>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      <q-icon name="schedule" size="14px" class="q-mr-xs" />
                      {{ activity.timestamp }}
                    </div>
                  </template>
                </q-timeline-entry>
              </q-timeline>

              <q-separator class="q-my-lg" />

              <!-- Recent Uploads Section -->
              <div class="text-h6 q-mb-md text-weight-medium">
                <q-icon name="cloud_upload" class="q-mr-sm" /> Recent Uploads
              </div>

              <q-list bordered separator class="rounded-borders">
                <q-item v-for="(upload, index) in recentUploads" :key="index">
                  <q-item-section avatar>
                    <q-avatar
                      :color="getFileIcon(upload.fileType).color"
                      text-color="white"
                      :icon="getFileIcon(upload.fileType).icon"
                    />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ upload.fileName }}
                    </q-item-label>
                    <q-item-label caption> {{ upload.fileType }} • {{ upload.size }} </q-item-label>
                  </q-item-section>

                  <q-item-section side top>
                    <q-badge :label="upload.status" />
                    <div class="text-caption text-grey-6 q-mt-xs">
                      {{ upload.timestamp }}
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="q-mt-md text-center">
                <q-btn flat color="primary" label="View All Uploads" icon="arrow_forward" no-caps />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const tab = ref('settings');
const isEditingProfile = ref(false);
const avatarFile = ref<File | null>(null);
const passwordForm = ref({ current: '', new: '', confirm: '' });

function saveProfile() {
  // Save logic here
  isEditingProfile.value = false;
}

function cancelEdit() {
  isEditingProfile.value = false;
}

interface User {
  name: string;
  username: string;
  email: string;
  role: string;
  institution: string;
  avatar: string;
  bio: string;
}


interface TimelineItem {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  timestamp: string;
}

interface Upload {
  fileName: string;
  fileType: string;
  size: string;
  status: string;
  timestamp: string;
}

const user = ref<User>({
  name: 'Dr. Juan Dela Cruz',
  username: 'jdelacruz_msu',
  email: 'j.delacruz@msumain.edu.ph',
  role: 'Researcher',
  institution: 'Mindanao State University - Main Campus',
  avatar: '',
  bio: 'Specializing in water quality analysis and limnological studies of Lake Lanao. Focus on nitrate and phosphorous level monitoring.',
});

const timeline = ref<TimelineItem[]>([
  {
    title: 'Generated Interpolated Map',
    subtitle: 'Nitrate Levels Analysis',
    description:
      'Created spatial interpolation map for nitrate concentrations across Lake Lanao basin using IDW method.',
    icon: 'terrain',
    color: 'teal',
    timestamp: 'Apr 8, 2026 - 2:30 PM',
  },
  {
    title: 'Updated Sampling Station Coordinates',
    subtitle: 'Field Data Collection',
    description:
      'Added 5 new GPS coordinates for sampling stations in the western region of Lake Lanao.',
    icon: 'gps_fixed',
    color: 'primary',
    timestamp: 'Apr 5, 2026 - 11:15 AM',
  },
  {
    title: 'Uploaded Water Quality Data',
    subtitle: 'Site A - March 2026',
    description:
      'Batch upload of pH, dissolved oxygen, and temperature readings from 15 sampling points.',
    icon: 'science',
    color: 'blue',
    timestamp: 'Apr 1, 2026 - 4:45 PM',
  }
]);

const recentUploads = ref<Upload[]>([
  {
    fileName: 'lanao_nitrate_mar2026.csv',
    fileType: 'CSV',
    size: '2.4 MB',
    status: 'Published',
    timestamp: 'Apr 1, 2026',
  },
  {
    fileName: 'sampling_points_west.geojson',
    fileType: 'GeoJSON',
    size: '856 KB',
    status: 'Published',
    timestamp: 'Apr 5, 2026',
  },
  {
    fileName: 'ph_levels_batch_0420.csv',
    fileType: 'CSV',
    size: '1.1 MB',
    status: 'Processing',
    timestamp: 'Apr 10, 2026',
  },
  {
    fileName: 'temperature_readings_err.csv',
    fileType: 'CSV',
    size: '450 KB',
    status: 'Error',
    timestamp: 'Apr 9, 2026',
  },
]);

function getFileIcon(fileType: string): { icon: string; color: string } {
  switch (fileType) {
    case 'CSV':
      return { icon: 'table_chart', color: 'green' };
    case 'GeoJSON':
      return { icon: 'map', color: 'purple' };
    default:
      return { icon: 'insert_drive_file', color: 'grey' };
  }
}
</script>

<style scoped>
.close-modal-btn {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s ease;
}
.close-modal-btn:hover {
  transform: scale(1.1);
  background-color: #f5f5f5 !important;
}

.rounded-borders {
  border-radius: 12px;
}

.cover-image {
  overflow: hidden;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.profile-avatar {
  margin-top: -50px;
  border: 4px solid white;
  background: white;
}

.stat-card {
  padding: 12px 8px;
  background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.q-timeline__entry--icon) {
  background: white;
  border: 2px solid currentColor;
}
</style>
