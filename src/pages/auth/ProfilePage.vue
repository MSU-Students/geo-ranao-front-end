<template>
  <q-page class="profile-root">
    <!-- Background -->
    <div class="profile-bg">
      <q-img
        src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
        class="absolute-full"
        style="filter: blur(1px) brightness(0.95); transform: scale(1.05);"
        fit="cover"
      />
      <div class="bg-overlay absolute-full" />
    </div>

    <BackButton to="/map" :offset="false" />

    <!-- Main Container -->
    <div class="profile-container">
      <div class="single-card bright-panel column">
        
        <!-- ══ TOP SECTION (Identity - 1st Picture Content) ══ -->
        <div class="top-section col-auto">
          <!-- Cover strip -->
          <div class="cover-strip" />
          
          <div class="profile-header row items-start q-pa-md">
            <!-- Avatar -->
            <div class="avatar-col q-mr-md relative-position" style="width: 84px; height: 84px;">
              <q-avatar size="84px" class="avatar-img shadow-3 relative-position">
                <img :src="avatarPreview || user.avatar || 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80'" />
              </q-avatar>
              <div class="online-dot bg-teal" />

              <!-- Hidden file input -->
              <q-file
                v-show="false"
                ref="fileInputRef"
                v-model="avatarFile"
                accept="image/*"
                @update:model-value="onAvatarSelected"
              />
            </div>
            
            <!-- User Info & Details -->
            <div class="user-info-col col">
              <div class="text-h5 text-weight-bold text-teal-10 q-mb-xs">{{ user.name }}</div>
              <div class="text-subtitle2 text-teal-8">{{ user.institution }}</div>
              
              <div class="info-fields row q-gutter-md">
                <div class="info-row">
                  <q-icon name="badge" size="16px" class="info-icon" />
                  <span class="info-val">{{ user.username }}</span>
                </div>
                <div class="info-row">
                  <q-icon name="email" size="16px" class="info-icon" />
                  <span class="info-val">{{ user.email }}</span>
                </div>
                <div class="info-row">
                  <q-icon name="school" size="16px" class="info-icon" />
                  <span class="info-val">{{ user.role }}</span>
                </div>
              </div>
            </div>
            
            <!-- Stats & Actions -->
            <div class="stats-col col-auto row items-center">
              <div class="action-icons row q-gutter-sm q-mr-lg">
                <q-btn outline round color="teal-8" icon="edit" size="md" @click="openEditDialog">
                  <q-tooltip>Edit Profile</q-tooltip>
                </q-btn>
                
                <q-btn outline round color="teal-6" icon="upload_file" size="md">
                  <q-tooltip>Upload Data</q-tooltip>
                </q-btn>
                <q-btn unelevated round color="teal-8" text-color="white" icon="add_chart" size="md">
                  <q-tooltip>New Report</q-tooltip>
                </q-btn>
              </div>
              
              <div class="stats-row row items-center justify-center">
                <div class="stat-pill column items-center">
                  <span class="stat-num text-teal-8">9</span>
                  <span class="stat-lbl">Uploads</span>
                </div>
                <div class="stat-divider" />
                <div class="stat-pill column items-center">
                  <span class="stat-num text-teal-6">7</span>
                  <span class="stat-lbl">Layers</span>
                </div>
                <div class="stat-divider" />
                <div class="stat-pill column items-center">
                  <span class="stat-num text-orange-8">6</span>
                  <span class="stat-lbl">Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <q-separator color="grey-3" />

        <!-- ══ BOTTOM SECTION (Research Activity) ══ -->
        <div class="bottom-section col column">
          <div class="tab-content col relative-position">
            <div class="activity-tab fit q-pa-lg">
                <div class="activity-grid fit">
                  <!-- Timeline -->
                  <div class="activity-col col column">
                    <div class="col-title text-teal-9 q-mb-md col-auto">
                      <q-icon name="timeline" size="20px" class="q-mr-xs" />
                      <span class="text-subtitle1 text-weight-bold">Research Timeline</span>
                    </div>
                    <q-scroll-area class="col">
                      <div class="timeline-list q-pr-md">
                      <div v-for="(item, i) in timeline" :key="i" class="timeline-item">
                        <div class="tl-dot" :class="`dot-${item.color}`">
                          <q-icon :name="item.icon" size="14px" />
                        </div>
                        <div class="tl-line" v-if="i < timeline.length - 1" />
                        <div class="tl-body">
                          <div class="tl-title text-teal-10">{{ item.title }}</div>
                          <div class="tl-sub text-teal-7">{{ item.subtitle }}</div>
                          <div class="tl-desc text-grey-8">{{ item.description }}</div>
                          <div class="tl-time text-grey-6">
                            <q-icon name="schedule" size="12px" class="q-mr-xs" />
                            {{ item.timestamp }}
                          </div>
                        </div>
                        </div>
                      </div>
                    </q-scroll-area>
                  </div>

                  <!-- Recent Uploads -->
                  <div class="activity-col col column">
                    <div class="col-title text-teal-9 q-mb-md col-auto">
                      <q-icon name="cloud_upload" size="20px" class="q-mr-xs" />
                      <span class="text-subtitle1 text-weight-bold">Recent Uploads</span>
                    </div>
                    <q-scroll-area class="col">
                      <div class="uploads-list q-pr-md">
                      <div v-for="(upload, i) in recentUploads" :key="i" class="upload-item bg-white shadow-1">
                        <div class="upload-icon-wrap" :class="`icon-${getFileIcon(upload.fileType).color}`">
                          <q-icon :name="getFileIcon(upload.fileType).icon" size="20px" />
                        </div>
                        <div class="upload-info">
                          <div class="upload-name text-teal-10">{{ upload.fileName }}</div>
                          <div class="upload-meta text-grey-6">{{ upload.fileType }} · {{ upload.size }}</div>
                        </div>
                        <div class="upload-right">
                          <span class="upload-status" :class="`status-${upload.status.toLowerCase()}`">
                            {{ upload.status }}
                          </span>
                          <div class="upload-date text-grey-6">{{ upload.timestamp }}</div>
                        </div>
                        </div>
                      </div>
                    </q-scroll-area>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <q-dialog v-model="editDialog" persistent>
      <q-card style="width: 600px; max-width: 90vw; border-radius: 12px;">
        <q-card-section class="bg-teal-9 text-white row items-center">
          <div class="text-h6">Edit Profile</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="cancelEdit" />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md">
            <!-- Avatar Edit -->
            <div class="col-12 flex flex-center q-mb-sm">
              <q-avatar size="100px" class="avatar-img shadow-3 relative-position cursor-pointer" @click="triggerFileInput">
                <img :src="avatarPreview || user.avatar || 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80'" />
                <div class="avatar-edit-overlay absolute-full flex flex-center">
                  <q-icon name="photo_camera" size="32px" color="white" />
                </div>
              </q-avatar>
            </div>
            
            <div class="col-12 col-md-6">
              <q-input outlined dense v-model="editForm.name" label="Full Name" color="teal" />
            </div>
            <div class="col-12 col-md-6">
              <q-input outlined dense v-model="editForm.email" label="Email Address" color="teal" />
            </div>
            <div class="col-12">
              <q-input outlined dense v-model="editForm.institution" label="Institution / Organization" color="teal" />
            </div>
            <div class="col-12">
              <q-input outlined dense v-model="editForm.bio" type="textarea" rows="3" label="Research Focus / Bio" color="teal" />
            </div>

            <div class="col-12 q-mt-md">
              <div class="section-divider row items-center q-mb-sm">
                <q-separator class="col" color="grey-4" />
                <span class="q-px-md text-caption text-weight-bold text-teal-9 text-uppercase">Change Password</span>
                <q-separator class="col" color="grey-4" />
              </div>
            </div>
            
            <div class="col-12">
              <q-input outlined dense v-model="passwordForm.current" type="password" label="Current Password" color="teal">
                <template v-slot:prepend><q-icon name="vpn_key" size="18px" color="teal" /></template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input outlined dense v-model="passwordForm.new" type="password" label="New Password" color="teal">
                <template v-slot:prepend><q-icon name="lock" size="18px" color="teal" /></template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-input outlined dense v-model="passwordForm.confirm" type="password" label="Confirm Password" color="teal">
                <template v-slot:prepend><q-icon name="lock_outline" size="18px" color="teal" /></template>
              </q-input>
            </div>

          </div>
        </q-card-section>

        <q-card-actions align="right" class="bg-grey-1 q-pa-md">
          <q-btn flat label="Cancel" color="grey-8" v-close-popup @click="cancelEdit" />
          <q-btn unelevated label="Save Changes" color="teal-9" @click="saveProfile" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BackButton from 'src/components/BackButton.vue';

const editDialog = ref(false);
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string>('');
const fileInputRef = ref<any>(null);
const passwordForm = ref({ current: '', new: '', confirm: '' });

const editForm = ref({
  name: '',
  email: '',
  institution: '',
  bio: ''
});

function openEditDialog() {
  editForm.value = {
    name: user.value.name,
    email: user.value.email,
    institution: user.value.institution,
    bio: user.value.bio
  };
  editDialog.value = true;
}

function triggerFileInput() {
  fileInputRef.value?.pickFiles();
}

function onAvatarSelected(file: File | null) {
  if (file) {
    avatarPreview.value = URL.createObjectURL(file);
  } else {
    avatarPreview.value = '';
  }
}

function saveProfile() {
  user.value.name = editForm.value.name;
  user.value.email = editForm.value.email;
  user.value.institution = editForm.value.institution;
  user.value.bio = editForm.value.bio;
  
  if (avatarPreview.value) {
    user.value.avatar = avatarPreview.value;
  }
  
  passwordForm.value = { current: '', new: '', confirm: '' };
  editDialog.value = false;
}

function cancelEdit() {
  avatarFile.value = null;
  avatarPreview.value = '';
  passwordForm.value = { current: '', new: '', confirm: '' };
  editDialog.value = false;
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
    description: 'Created spatial interpolation map for nitrate concentrations across Lake Lanao basin using IDW method.',
    icon: 'terrain',
    color: 'teal',
    timestamp: 'Apr 8, 2026 — 2:30 PM',
  },
  {
    title: 'Updated Sampling Coordinates',
    subtitle: 'Field Data Collection',
    description: 'Added 5 new GPS coordinates for sampling stations in the western region of Lake Lanao.',
    icon: 'gps_fixed',
    color: 'blue',
    timestamp: 'Apr 5, 2026 — 11:15 AM',
  },
  {
    title: 'Uploaded Water Quality Data',
    subtitle: 'Site A — March 2026',
    description: 'Batch upload of pH, dissolved oxygen, and temperature readings from 15 sampling points.',
    icon: 'science',
    color: 'purple',
    timestamp: 'Apr 1, 2026 — 4:45 PM',
  },
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
/* ═══════════════════════════════════════
   ROOT & BACKGROUND
═══════════════════════════════════════ */
.profile-root {
  position: fixed;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  background: #f0f4f4; /* Light fallback */
}

.profile-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bg-overlay {
  background: linear-gradient(135deg, rgba(240, 248, 248, 0.55) 0%, rgba(210, 235, 235, 0.45) 100%);
  backdrop-filter: blur(1px);
  z-index: 1;
}

/* ═══════════════════════════════════════
   MAIN LAYOUT
═══════════════════════════════════════ */
.profile-container {
  position: relative;
  z-index: 2;
  width: calc(100vw - 48px);
  max-width: 960px;
  height: calc(100vh - 48px);
  max-height: 820px;
  display: flex;
}

/* ═══════════════════════════════════════
   BRIGHT PANEL (Theme from Landing Page)
═══════════════════════════════════════ */
.bright-panel {
  background: rgba(255, 255, 255, 0.97) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ═══════════════════════════════════════
   TOP SECTION (Identity)
═══════════════════════════════════════ */
.top-section {
  position: relative;
}

/* Cover strip */
.cover-strip {
  height: 50px;
  background: linear-gradient(135deg, #00695c 0%, #26a69a 100%) !important;
  flex-shrink: 0;
}

/* Avatar */
.avatar-img {
  border: 4px solid white;
  background: white;
  overflow: hidden;
}

.avatar-edit-overlay {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.avatar-edit-overlay:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: scale(1.02);
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border: 3px solid white;
  border-radius: 50%;
  z-index: 10;
}

/* Identity Info */
.info-fields {
  margin-top: 4px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  color: #26a69a;
}

.info-val {
  color: #546e7a;
  font-size: 0.8rem;
  font-weight: 500;
}

.bio-text {
  font-size: 0.85rem;
  line-height: 1.4;
  max-width: 500px;
}

/* Stats Row */
.stats-row {
  background: #f1f8f8;
  border-radius: 12px;
  padding: 12px 24px;
  border: 1px solid #e0f2f1;
}

.stat-pill {
  min-width: 60px;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #b2dfdb;
  margin: 0 16px;
}

.stat-num {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.stat-lbl {
  font-size: 0.65rem;
  color: #78909c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-top: 4px;
}



/* ── ACTIVITY TAB ── */
.activity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.activity-col {
  display: flex;
  flex-direction: column;
}

.col-title {
  display: flex;
  align-items: center;
}

/* Timeline */
.timeline-list {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.tl-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.dot-teal   { background: #26a69a; }
.dot-blue   { background: #42a5f5; }
.dot-purple { background: #ab47bc; }

.tl-line {
  position: absolute;
  left: 15px;
  top: 32px;
  width: 2px;
  height: calc(100% - 8px);
  background: #e0e0e0;
}

.tl-body {
  flex: 1;
  background: #f9fbfb;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e0f2f1;
}

.tl-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.tl-sub {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 2px;
}

.tl-desc {
  font-size: 0.8rem;
  margin-top: 6px;
  line-height: 1.4;
}

.tl-time {
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  margin-top: 8px;
}

/* Uploads */
.uploads-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.upload-item:hover {
  border-color: #b2dfdb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.upload-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-green  { background: #e8f5e9; color: #4caf50; }
.icon-purple { background: #f3e5f5; color: #9c27b0; }
.icon-grey   { background: #f5f5f5; color: #9e9e9e; }

.upload-name {
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.upload-meta {
  font-size: 0.75rem;
  margin-top: 2px;
}

.upload-status {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-published { background: #e8f5e9; color: #2e7d32; }
.status-processing { background: #fff3e0; color: #ef6c00; }
.status-error     { background: #ffebee; color: #c62828; }

.upload-date {
  font-size: 0.7rem;
  margin-top: 4px;
}

/* ═══════════════════════════════════════
   TRANSITIONS
═══════════════════════════════════════ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; max-height: 0; margin-top: 0 !important; }
.slide-down-enter-to,
.slide-down-leave-from { opacity: 1; max-height: 300px; }
</style>
