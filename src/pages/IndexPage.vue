<template>
  <q-page class="relative-position overflow-hidden" style="min-height: 100vh">
    <!-- ═══════════════════════════════════════════════ -->
    <!-- HERO WELCOME OVERLAY (Landing Page)            -->
    <!-- ═══════════════════════════════════════════════ -->
    <transition name="hero-fade">
      <div v-if="showWelcomeOverlay" class="absolute-full z-max hero-overlay">
        <q-img
          src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
          class="absolute-full"
          fit="cover"
          style="filter: brightness(0.4)"
        />

        <div class="particles-container absolute-full">
          <div v-for="n in 20" :key="n" class="particle" :style="particleStyle(n)" />
        </div>

        <div class="absolute-full flex flex-center">
          <div class="text-center q-pa-xl hero-content" style="position: relative; z-index: 5">
            <div class="q-mb-lg">
              <q-avatar size="90px" class="hero-logo-avatar">
                <q-icon name="water_drop" size="50px" color="white" />
              </q-avatar>
            </div>

            <h1 class="hero-title q-mb-none">RANAO FISHNET</h1>
            <div class="hero-divider q-mx-auto q-my-md" />
            <p class="hero-subtitle q-mb-xs">Profiling and Mapping of Lake Lanao Fishes</p>
            <p class="hero-description q-mb-xl">
              A Web-Based GIS Platform for Ecological Research and Conservation
            </p>

            <q-btn unelevated rounded size="lg" class="explore-btn q-px-xl" @click="enterDashboard">
              <q-icon name="travel_explore" class="q-mr-sm" size="sm" />
              Explore the Map
            </q-btn>

            <div class="row q-gutter-xl justify-center q-mt-xl">
              <div class="hero-stat" v-for="stat in heroStats" :key="stat.label">
                <div class="hero-stat-value">{{ stat.value }}</div>
                <div class="hero-stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════════════ -->
    <!-- MAIN DASHBOARD (Map + Control Panel)           -->
    <!-- ═══════════════════════════════════════════════ -->

    <!-- Leaflet Map Container -->
    <div ref="mapContainer" class="absolute-full map-container" />

    <!-- Toggle Button -->
    <transition name="fade-btn">
      <q-btn
        v-if="!showWelcomeOverlay"
        class="toggle-panel-btn"
        :class="{ 'toggle-btn--shifted': showPanel }"
        round
        unelevated
        size="md"
        :icon="showPanel ? 'chevron_left' : 'menu'"
        @click="showPanel = !showPanel"
      >
        <q-tooltip v-if="!showPanel" anchor="center right" self="center left" :offset="[10, 0]">
          Open Dashboard
        </q-tooltip>
      </q-btn>
    </transition>

    <!-- Floating Control Panel (Left Side — Toggleable, BRIGHT THEME) -->
    <transition name="slide-panel">
      <div v-if="showPanel && !showWelcomeOverlay" class="control-panel">
        <q-card class="bright-panel full-height column no-wrap">
          <!-- Panel Header -->
          <q-card-section class="q-pb-xs">
            <div class="row items-center no-wrap justify-between">
              <div class="row items-center no-wrap">
                <q-avatar
                  size="36px"
                  class="q-mr-sm"
                  style="background: linear-gradient(135deg, #00897b, #26a69a)"
                >
                  <q-icon name="water_drop" size="20px" color="white" />
                </q-avatar>
                <div>
                  <div class="text-subtitle1 text-grey-9 text-weight-bold" style="line-height: 1.2">
                    Ranao FishNet
                  </div>
                  <div class="text-grey-6 text-caption">Ecological Dashboard</div>
                </div>
              </div>
              <q-btn
                flat
                dense
                round
                icon="close"
                color="grey-6"
                size="sm"
                @click="showPanel = false"
              />
            </div>
          </q-card-section>

          <q-separator class="q-mx-md" />

          <!-- Tabs -->
          <q-card-section class="q-py-sm q-px-sm">
            <q-tabs
              v-model="activeTab"
              dense
              class="panel-tabs"
              active-color="teal-8"
              indicator-color="teal"
              align="justify"
              narrow-indicator
            >
              <q-tab name="fish" icon="set_meal" label="Fish" />
              <q-tab name="water" icon="opacity" label="Water" />
              <q-tab name="layers" icon="layers" label="Layers" />
            </q-tabs>
          </q-card-section>

          <q-separator class="q-mx-md" />

          <!-- Tab Content (Scrollable) -->
          <q-card-section class="col q-pa-none overflow-auto">
            <q-tab-panels v-model="activeTab" animated class="bg-transparent full-height">
              <!-- ═══ FISH TAB ═══ -->
              <q-tab-panel name="fish" class="q-pa-md">
                <q-select
                  v-model="selectedSpeciesFilter"
                  :options="speciesOptionsFiltered"
                  multiple
                  use-chips
                  use-input
                  @filter="filterFn"
                  dense
                  rounded
                  outlined
                  placeholder="Search specific fish..."
                  class="q-mb-md"
                  color="teal"
                >
                  <template #prepend>
                    <q-icon name="search" color="grey-5" size="xs" />
                  </template>
                </q-select>

                <!-- Filter Chips -->
                <div class="row q-gutter-xs q-mb-md">
                  <q-chip
                    v-for="f in fishFilters"
                    :key="f.value"
                    :color="activeFilter === f.value ? f.activeColor : 'grey-3'"
                    :text-color="activeFilter === f.value ? 'white' : 'grey-8'"
                    size="sm"
                    clickable
                    class="filter-chip"
                    @click="activeFilter = f.value"
                  >
                    <q-icon :name="f.icon" size="14px" class="q-mr-xs" />
                    {{ f.label }}
                  </q-chip>
                </div>

                <!-- Species List -->
                <q-list class="species-list q-gutter-y-xs">
                  <q-item
                    v-for="fish in filteredSpecies"
                    :key="fish.id"
                    clickable
                    class="species-item rounded-borders"
                    :class="{ 'species-item--active': selectedFish?.id === fish.id }"
                    @click="selectFish(fish)"
                  >
                    <q-item-section avatar>
                      <q-avatar
                        :color="fish.type === 'endemic' ? 'blue-7' : 'orange-7'"
                        text-color="white"
                        size="36px"
                      >
                        <q-icon name="set_meal" size="18px" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold text-grey-9" style="font-size: 0.85rem">
                        {{ fish.commonName }}
                      </q-item-label>
                      <q-item-label
                        caption
                        class="text-italic text-grey-6"
                        style="font-size: 0.7rem"
                      >
                        {{ fish.scientificName }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge
                        :color="getStatusColor(fish.status)"
                        :label="fish.statusShort"
                        class="text-weight-bold"
                        style="font-size: 0.6rem"
                      />
                    </q-item-section>
                  </q-item>

                  <q-item v-if="filteredSpecies.length === 0">
                    <q-item-section class="text-center text-grey-5 q-py-lg">
                      No species found.
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-tab-panel>

              <!-- ═══ WATER QUALITY TAB ═══ -->
              <q-tab-panel name="water" class="q-pa-md">
                <div class="text-subtitle2 text-teal-8 text-weight-bold q-mb-md">
                  <q-icon name="science" class="q-mr-xs" /> Water Quality Sampling Sites
                </div>
                <div class="text-grey-6 text-caption q-mb-md">
                  Hover a site for a quick look, click for full details. Physico-chemical,
                  nutrient, and pigment readings are not yet available.
                </div>

                <q-select
                  v-model="selectedSiteFilter"
                  :options="siteOptionsFiltered"
                  multiple
                  use-chips
                  use-input
                  @filter="filterSiteFn"
                  dense
                  rounded
                  outlined
                  placeholder="Search specific site..."
                  class="q-mb-md"
                  color="teal"
                >
                  <template #prepend>
                    <q-icon name="search" color="grey-5" size="xs" />
                  </template>
                </q-select>

                <!-- Sampling Zone Layer Toggles -->
                <div class="text-caption text-grey-6 q-mb-xs">Sampling Zone Layers</div>
                <div class="row q-gutter-xs q-mb-md">
                  <q-chip
                    v-for="layer in waterDepthLayers"
                    :key="layer.id"
                    :color="layer.active ? waterZoneColors[layer.id] : 'grey-3'"
                    :text-color="layer.active ? 'white' : 'grey-8'"
                    size="sm"
                    clickable
                    class="filter-chip"
                    @click="layer.active = !layer.active"
                  >
                    <q-icon :name="waterZoneIcons[layer.id]" size="14px" class="q-mr-xs" />
                    {{ layer.name }}
                  </q-chip>
                </div>

                <!-- Additional Reference Layers -->
                <div class="text-caption text-grey-6 q-mb-xs">Additional Layers</div>
                <q-list class="q-mb-md q-gutter-y-xs">
                  <q-item
                    v-for="layer in waterExtraLayers"
                    :key="layer.id"
                    tag="label"
                    class="species-item rounded-borders"
                  >
                    <q-item-section avatar>
                      <q-toggle v-model="layer.active" color="teal" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-grey-9" style="font-size: 0.8rem">{{
                        layer.name
                      }}</q-item-label>
                      <q-item-label caption class="text-grey-6" style="font-size: 0.7rem">{{
                        layer.description
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-separator class="q-mb-md" />

                <!-- Sampling Sites List -->
                <q-list class="q-gutter-y-xs">
                  <q-item
                    v-for="site in filteredWaterSites"
                    :key="site.siteId"
                    clickable
                    class="species-item rounded-borders"
                    :class="{ 'species-item--active': selectedWaterSite?.siteId === site.siteId }"
                    @click="selectWaterSite(site)"
                  >
                    <q-item-section avatar>
                      <q-avatar color="blue-7" text-color="white" size="36px">
                        <q-icon name="pin_drop" size="18px" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold text-grey-9" style="font-size: 0.85rem">
                        {{ site.siteId }}
                      </q-item-label>
                      <q-item-label caption class="text-grey-6">
                        Station: {{ site.stationId }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="grey-5" label="No data yet" />
                    </q-item-section>
                  </q-item>

                  <q-item v-if="filteredWaterSites.length === 0">
                    <q-item-section class="text-center text-grey-5 q-py-lg">
                      {{
                        waterQualitySites.length === 0
                          ? 'Loading sampling sites...'
                          : 'No sites found.'
                      }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-tab-panel>

              <!-- ═══ LAYERS TAB ═══ -->
              <q-tab-panel name="layers" class="q-pa-md">
                <div class="text-subtitle2 text-teal-8 text-weight-bold q-mb-md">
                  <q-icon name="layers" class="q-mr-xs" /> Map Layers
                </div>
                <q-list>
                  <q-item v-for="layer in exceptionLayers" :key="layer.id" tag="label">
                    <q-item-section avatar>
                      <q-toggle v-model="layer.active" color="teal" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-grey-9">{{ layer.name }}</q-item-label>
                      <q-item-label caption class="text-grey-6">{{
                        layer.description
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-tab-panel>
            </q-tab-panels>
          </q-card-section>

          <!-- Panel Footer -->
          <q-card-section class="q-pt-none q-pb-sm">
            <q-separator class="q-mb-sm" />
            <div class="row items-center justify-between">
              <div class="text-grey-6 text-caption">
                <q-icon name="info" size="xs" class="q-mr-xs" />
                {{ filteredSpecies.length }} species shown
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </transition>

    <!-- ═══ DETAIL POPUP (Right Side — BRIGHT THEME) ═══ -->
    <transition name="slide-detail">
      <div v-if="(selectedFish || selectedWaterSite) && !showWelcomeOverlay" class="detail-panel">
        <q-card class="bright-panel full-height column">
          <q-card-section class="q-pb-sm">
            <div class="row items-center justify-between">
              <span class="text-subtitle1 text-grey-9 text-weight-bold">
                {{ selectedFish ? 'Species Profile' : 'Sampling Site' }}
              </span>
              <q-btn
                flat
                dense
                round
                icon="close"
                color="grey-6"
                size="sm"
                @click="closeDetailPanel"
              />
            </div>
          </q-card-section>

          <q-separator class="q-mx-md" />

          <q-card-section class="col overflow-auto">
            <!-- Fish Detail -->
            <template v-if="selectedFish">
              <div class="row items-center q-mb-md">
                <q-avatar
                  :color="selectedFish.type === 'endemic' ? 'blue-7' : 'orange-7'"
                  size="56px"
                  class="q-mr-md"
                >
                  <q-icon name="set_meal" size="md" color="white" />
                </q-avatar>
                <div>
                  <div class="text-grey-9 text-weight-bold text-h6" style="line-height: 1.2">
                    {{ selectedFish.commonName }}
                  </div>
                  <div class="text-grey-6 text-italic text-caption">
                    {{ selectedFish.scientificName }}
                  </div>
                  <q-badge
                    :color="selectedFish.type === 'endemic' ? 'blue-7' : 'orange-7'"
                    :label="
                      selectedFish.type === 'endemic' ? 'Endemic Cyprinid' : 'Invasive Species'
                    "
                    class="q-mt-xs"
                  />
                </div>
              </div>

              <q-list dense class="q-gutter-y-xs">
                <q-item v-for="d in selectedFishDetails" :key="d.label" class="q-px-none">
                  <q-item-section avatar>
                    <q-icon :name="d.icon" color="teal-7" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption class="text-grey-6">{{ d.label }}</q-item-label>
                    <q-item-label class="text-grey-9 text-weight-medium">{{
                      d.value
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="q-mt-lg">
                <div class="text-caption text-grey-6 q-mb-xs">Conservation Status</div>
                <q-linear-progress
                  :value="getConservationValue(selectedFish.status)"
                  :color="getStatusColor(selectedFish.status)"
                  track-color="grey-3"
                  rounded
                  size="10px"
                />
                <div
                  class="text-caption text-weight-bold q-mt-xs"
                  :class="`text-${getStatusColor(selectedFish.status)}`"
                >
                  {{ selectedFish.status }}
                </div>
              </div>
            </template>

            <!-- Water Quality Site Detail -->
            <template v-else-if="selectedWaterSite">
              <div class="row items-center q-mb-md">
                <q-avatar color="blue-7" size="56px" class="q-mr-md">
                  <q-icon name="opacity" size="md" color="white" />
                </q-avatar>
                <div>
                  <div class="text-grey-9 text-weight-bold text-h6" style="line-height: 1.2">
                    {{ selectedWaterSite.siteId }}
                  </div>
                  <div class="text-grey-6 text-caption">
                    Station: {{ selectedWaterSite.stationId }}
                  </div>
                  <q-badge
                    v-if="selectedWaterZone"
                    color="blue-7"
                    :label="selectedWaterZone"
                    class="q-mt-xs"
                  />
                </div>
              </div>

              <q-list dense class="q-gutter-y-xs q-mb-md">
                <q-item class="q-px-none">
                  <q-item-section avatar>
                    <q-icon name="place" color="teal-7" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption class="text-grey-6">Coordinates</q-item-label>
                    <q-item-label class="text-grey-9 text-weight-medium">
                      {{ selectedWaterSite.lat.toFixed(5) }}, {{ selectedWaterSite.lng.toFixed(5) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-for="group in waterQualityParameterGroups" :key="group.title" class="q-mb-md">
                <div
                  class="text-caption text-weight-bold q-mb-xs"
                  :class="`text-${group.color}`"
                >
                  <q-icon :name="group.icon" size="14px" class="q-mr-xs" />{{ group.title }}
                </div>
                <q-list dense class="q-gutter-y-xs">
                  <q-item v-for="p in group.params" :key="p.label" class="q-px-none">
                    <q-item-section>
                      <q-item-label caption class="text-grey-6">
                        {{ p.label }}{{ p.unit ? ` (${p.unit})` : '' }}
                      </q-item-label>
                      <q-item-label class="text-grey-5 text-italic">Not available</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </template>
          </q-card-section>
        </q-card>
      </div>
    </transition>

    <!-- ═══ ADD DATA DROPDOWN BUTTON (for logged-in researchers) ═══ -->
    <transition name="fade-btn">
      <q-btn
        v-if="!showWelcomeOverlay && authStore.isLoggedIn"
        class="add-data-btn"
        :class="{ 'add-data-btn--shifted': showPanel }"
        unelevated
        size="sm"
        icon="add"
        color="teal"
        no-caps
      >
        <q-menu anchor="bottom left" self="top left" :offset="[0, 6]">
          <q-list style="min-width: 190px">
            <q-item clickable v-close-popup @click="goToFishObservation">
              <q-item-section avatar>
                <q-icon name="set_meal" color="blue-7" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Fish Observation</q-item-label>
                <q-item-label caption>Log a new fish sighting</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="goToWaterQuality">
              <q-item-section avatar>
                <q-icon name="opacity" color="teal-7" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Water Quality</q-item-label>
                <q-item-label caption>Record water quality data</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </transition>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ═══ STATE ═══
const showWelcomeOverlay = ref(true);
const activeTab = ref('fish');
const fishSearch = ref('');
const activeFilter = ref('all');
const showPanel = ref(false);
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;

// ═══ LAYER GROUPS (for toggling markers on/off) ═══
let fishLayerGroup: L.LayerGroup | null = null;
let lakeBoundaryLayerGroup: L.LayerGroup | null = null;
let wqAllLayerGroup: L.GeoJSON | null = null;
let wqAbove40LayerGroup: L.GeoJSON | null = null;
let wqBelow40LayerGroup: L.GeoJSON | null = null;
let wqTributaryLayerGroup: L.GeoJSON | null = null;
let lakeStationsLayerGroup: L.GeoJSON | null = null;
let tributariesLayerGroup: L.GeoJSON | null = null;

// ═══ HERO STATS ═══
const heroStats = [
  { value: '24', label: 'Species Recorded' },
  { value: '18', label: 'Endemic Cyprinids' },
  { value: '6', label: 'Invasive Species' },
  { value: '12', label: 'Critically Endangered' },
];

// ═══ FISH DATA ═══
interface Fish {
  id: number;
  commonName: string;
  scientificName: string;
  type: 'endemic' | 'invasive';
  status: string;
  statusShort: string;
  length: string;
  weight: string;
  location: string;
  date: string;
  lat: number;
  lng: number;
}

const selectedFish = ref<Fish | null>(null);

const species: Fish[] = [
  {
    id: 1,
    commonName: 'Pait',
    scientificName: 'Puntius sirang',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '8–12 cm',
    weight: '20–50 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 7.98,
    lng: 124.05,
  },
  {
    id: 2,
    commonName: 'Igat',
    scientificName: 'Anguilla marmorata',
    type: 'endemic',
    status: 'Endangered',
    statusShort: 'EN',
    length: '60–100 cm',
    weight: '1–3 kg',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 8.02,
    lng: 124.08,
  },
  {
    id: 3,
    commonName: 'Banak',
    scientificName: 'Puntius lanaoensis',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '10–15 cm',
    weight: '30–80 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 7.95,
    lng: 124.02,
  },
  {
    id: 4,
    commonName: 'Ludong',
    scientificName: 'Puntius tumba',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '7–10 cm',
    weight: '15–40 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 8.01,
    lng: 124.12,
  },
  {
    id: 5,
    commonName: 'Tarong',
    scientificName: 'Puntius tras',
    type: 'endemic',
    status: 'Endangered',
    statusShort: 'EN',
    length: '8–13 cm',
    weight: '20–60 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 7.96,
    lng: 124.06,
  },
  {
    id: 6,
    commonName: 'Nile Tilapia',
    scientificName: 'Oreochromis niloticus',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '20–40 cm',
    weight: '0.5–2 kg',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 8.0,
    lng: 124.04,
  },
  {
    id: 7,
    commonName: 'Common Carp',
    scientificName: 'Cyprinus carpio',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '30–60 cm',
    weight: '1–4 kg',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 7.97,
    lng: 124.1,
  },
  {
    id: 8,
    commonName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '2–5 cm',
    weight: '< 5 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
    lat: 8.03,
    lng: 124.07,
  },
];

const selectedSpeciesFilter = ref<string[]>([]);
const allSpeciesNames = species.map(s => s.commonName);
const speciesOptionsFiltered = ref<string[]>(allSpeciesNames);

function filterFn(val: string, update: (callback: () => void) => void) {
  if (val === '') {
    update(() => {
      speciesOptionsFiltered.value = allSpeciesNames;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    speciesOptionsFiltered.value = allSpeciesNames.filter(v => v.toLowerCase().indexOf(needle) > -1);
  });
}

const fishFilters = [
  { value: 'all', label: 'All', icon: 'filter_list', activeColor: 'teal-7' },
  { value: 'endemic', label: 'Endemic', icon: 'crisis_alert', activeColor: 'blue-7' },
  { value: 'invasive', label: 'Invasive', icon: 'warning', activeColor: 'orange-7' },
];

const filteredSpecies = computed(() =>
  species.filter((f) => {
    const matchFilter = activeFilter.value === 'all' || f.type === activeFilter.value;
    const matchSpecific =
      selectedSpeciesFilter.value.length === 0 ||
      selectedSpeciesFilter.value.includes(f.commonName);
    return matchFilter && matchSpecific;
  }),
);

const selectedFishDetails = computed(() =>
  selectedFish.value
    ? [
        { label: 'Length', value: selectedFish.value.length, icon: 'straighten' },
        { label: 'Weight', value: selectedFish.value.weight, icon: 'scale' },
        { label: 'Location', value: selectedFish.value.location, icon: 'place' },
        { label: 'Date Recorded', value: selectedFish.value.date, icon: 'calendar_today' },
      ]
    : [],
);

// ═══ WATER QUALITY SAMPLING SITES (loaded from GeoJSON) ═══
interface WaterQualitySiteProps {
  SITE_ID: string;
  STATION_ID: string;
  LONGITUDE: number;
  LATITUDE: number;
}

interface WaterQualitySite {
  siteId: string;
  stationId: string;
  lat: number;
  lng: number;
}

const waterQualitySites = ref<WaterQualitySite[]>([]);
const selectedWaterSite = ref<WaterQualitySite | null>(null);

function selectWaterSite(site: WaterQualitySite) {
  selectedWaterSite.value = site;
  selectedFish.value = null;
  if (map) map.flyTo([site.lat, site.lng], 15, { duration: 1.2 });
}

// ── Site search (mirrors the Fish tab's search-by-name q-select) ──
const selectedSiteFilter = ref<string[]>([]);
const allSiteIds = computed(() => waterQualitySites.value.map((s) => s.siteId));
const siteOptionsFiltered = ref<string[]>([]);

watch(
  waterQualitySites,
  () => {
    siteOptionsFiltered.value = allSiteIds.value;
  },
  { immediate: true },
);

function filterSiteFn(val: string, update: (callback: () => void) => void) {
  if (val === '') {
    update(() => {
      siteOptionsFiltered.value = allSiteIds.value;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    siteOptionsFiltered.value = allSiteIds.value.filter((v) => v.toLowerCase().includes(needle));
  });
}

const filteredWaterSites = computed(() =>
  waterQualitySites.value.filter(
    (site) => selectedSiteFilter.value.length === 0 || selectedSiteFilter.value.includes(site.siteId),
  ),
);

// SITE_ID -> depth zone label, filled in as the Above/Below/Tributary GeoJSON files load.
const siteDepthZone = new Map<string, string>();

const selectedWaterZone = computed(() =>
  selectedWaterSite.value ? siteDepthZone.get(selectedWaterSite.value.siteId) : undefined,
);

const waterQualityParameterGroups = [
  {
    title: 'Physico-Chemical',
    icon: 'science',
    color: 'teal-8',
    params: [
      { label: 'Temperature', unit: '°C' },
      { label: 'pH', unit: '' },
      { label: 'Turbidity', unit: 'NTU' },
      { label: 'Conductivity', unit: 'µS/cm' },
      { label: 'TDS', unit: 'mg/L' },
      { label: 'TSS', unit: 'mg/L' },
    ],
  },
  {
    title: 'Nutrients',
    icon: 'grain',
    color: 'blue-8',
    params: [
      { label: 'Phosphate', unit: 'mg/L' },
      { label: 'Ammonia', unit: 'mg/L' },
      { label: 'Nitrate', unit: 'mg/L' },
      { label: 'Nitrite', unit: 'mg/L' },
      { label: 'Sulfate', unit: 'mg/L' },
    ],
  },
  {
    title: 'Photosynthetic Pigment',
    icon: 'eco',
    color: 'green-8',
    params: [{ label: 'Chlorophyll-a', unit: 'µg/L' }],
  },
];

function waterQualityTooltipHtml(props: WaterQualitySiteProps): string {
  const zone = siteDepthZone.get(props.SITE_ID);
  return `
    <div style="font-family: Roboto, sans-serif; min-width: 170px;">
      <strong style="color:#0288D1;">${props.SITE_ID}</strong><br>
      <span style="color:#666;">Station: ${props.STATION_ID}</span><br>
      <span style="color:#666;">Coordinates: ${props.LATITUDE.toFixed(5)}, ${props.LONGITUDE.toFixed(5)}</span>
      ${zone ? `<br><span style="color:#666;">Depth Zone: ${zone}</span>` : ''}
    </div>
  `;
}

function createWaterQualitySiteLayer(geojson: GeoJSON.GeoJsonObject, color: string): L.GeoJSON {
  return L.geoJSON(geojson, {
    pointToLayer: (_feature, latlng) =>
      L.circleMarker(latlng, {
        radius: 7,
        weight: 2,
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.9,
      }),
    onEachFeature: (feature, layer) => {
      const props = feature.properties as WaterQualitySiteProps;
      layer.bindTooltip(waterQualityTooltipHtml(props), {
        sticky: true,
        direction: 'top',
        offset: [0, -8],
      });
      layer.on('click', () => {
        selectWaterSite({
          siteId: props.SITE_ID,
          stationId: props.STATION_ID,
          lat: props.LATITUDE,
          lng: props.LONGITUDE,
        });
      });
    },
  });
}

// ═══ MAP LAYERS ═══
interface MapLayer {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

const mapLayers = ref<MapLayer[]>([
  {
    id: 'fish',
    name: 'Fish Observations',
    description: 'Endemic & invasive species markers',
    active: true,
  },
  {
    id: 'lakeBoundary',
    name: 'Lake Lanao Boundary',
    description: 'Official OSM outline of Lake Lanao',
    active: false,
  },
  {
    id: 'wqAll',
    name: 'All Water Quality Sites',
    description: 'Every water quality sampling point',
    active: true,
  },
  {
    id: 'wqAbove40',
    name: 'Sites Above 40m Depth',
    description: 'Sampling points deeper than 40m',
    active: false,
  },
  {
    id: 'wqBelow40',
    name: 'Sites Below 40m Depth',
    description: 'Sampling points shallower than 40m',
    active: false,
  },
  {
    id: 'wqTributary',
    name: 'Tributary Sampling Sites',
    description: 'Sampling points along tributaries',
    active: false,
  },
  {
    id: 'lakeStations',
    name: 'Lake Monitoring Stations',
    description: 'Lake zone boundaries (hover for details)',
    active: false,
  },
  {
    id: 'tributaries',
    name: 'Lake Tributaries',
    description: 'Rivers feeding into Lake Lanao',
    active: false,
  },
]);

// Layers shown in the "Layers" tab (kept separate from the Water tab's own layer controls).
const exceptionLayerIds = ['fish', 'lakeBoundary', 'wqAll'];
const exceptionLayers = computed(() =>
  mapLayers.value.filter((l) => exceptionLayerIds.includes(l.id)),
);

// Depth-zone sampling layers, surfaced as filter chips in the Water tab.
const waterDepthLayerIds = ['wqAbove40', 'wqBelow40', 'wqTributary'];
const waterDepthLayers = computed(() =>
  mapLayers.value.filter((l) => waterDepthLayerIds.includes(l.id)),
);
const waterZoneColors: Record<string, string> = {
  wqAbove40: 'purple-7',
  wqBelow40: 'brown-6',
  wqTributary: 'green-8',
};
const waterZoneIcons: Record<string, string> = {
  wqAbove40: 'vertical_align_bottom',
  wqBelow40: 'vertical_align_top',
  wqTributary: 'alt_route',
};

// Non-site reference layers, surfaced as toggles in the Water tab.
const waterExtraLayerIds = ['lakeStations', 'tributaries'];
const waterExtraLayers = computed(() =>
  mapLayers.value.filter((l) => waterExtraLayerIds.includes(l.id)),
);

// ═══ HELPERS ═══
function getStatusColor(status: string): string {
  switch (status) {
    case 'Critically Endangered':
      return 'red-7';
    case 'Endangered':
      return 'orange-7';
    case 'Vulnerable':
      return 'yellow-8';
    default:
      return 'green-7';
  }
}

function getConservationValue(status: string): number {
  switch (status) {
    case 'Critically Endangered':
      return 0.95;
    case 'Endangered':
      return 0.7;
    case 'Vulnerable':
      return 0.4;
    default:
      return 0.15;
  }
}

function selectFish(fish: Fish) {
  selectedFish.value = fish;
  selectedWaterSite.value = null;
  if (map) {
    map.flyTo([fish.lat, fish.lng], 13, { duration: 1.2 });
  }
}

function closeDetailPanel() {
  selectedFish.value = null;
  selectedWaterSite.value = null;
}

function particleStyle(n: number) {
  const size = 2 + Math.random() * 4;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${6 + Math.random() * 10}s`,
  };
}

// ═══ MAP INITIALIZATION ═══
function initMap() {
  if (!mapContainer.value || map) return;

  map = L.map(mapContainer.value, {
    center: [7.99, 124.07],
    zoom: 12,
    zoomControl: false,
  });

  // Light-mode map tiles (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // ── Create Fish Layer Group ──
  fishLayerGroup = L.layerGroup();
  renderFishMarkers();

  // ── Create Lake Lanao Boundary Layer Group (from GeoJSON) ──
  lakeBoundaryLayerGroup = L.layerGroup();
  fetch('/geo/lake-lanao.geojson')
    .then((res) => res.json())
    .then((geojson: GeoJSON.GeoJsonObject) => {
      const boundaryLayer = L.geoJSON(geojson, {
        style: {
          color: '#0288D1',
          weight: 2.5,
          fillColor: '#4FC3F7',
          fillOpacity: 0.15,
        },
      });
      boundaryLayer.bindPopup('Lake Lanao Boundary');
      lakeBoundaryLayerGroup!.addLayer(boundaryLayer);
      syncLayerVisibility();
    })
    .catch((err) => {
      console.error('Failed to load Lake Lanao boundary GeoJSON:', err);
    });

  // ── Water Quality Sampling Sites (points) ──
  // Load the depth-classified subsets first so their SITE_IDs are known before the
  // "All Sites" layer (shown by default) builds tooltips that reference the depth zone.
  function fetchDepthZone(url: string, zoneLabel: string, color: string) {
    return fetch(url)
      .then((res) => res.json())
      .then((geojson: GeoJSON.FeatureCollection) => {
        geojson.features.forEach((feature) => {
          const props = feature.properties as unknown as WaterQualitySiteProps;
          siteDepthZone.set(props.SITE_ID, zoneLabel);
        });
        return createWaterQualitySiteLayer(geojson, color);
      })
      .catch((err) => {
        console.error(`Failed to load ${url}:`, err);
        return null;
      });
  }

  Promise.all([
    fetchDepthZone('/geo/WQ-Sampling-Sites-Above-40m-Depth.geojson', 'Above 40m Depth', '#7B1FA2'),
    fetchDepthZone('/geo/WQ-Sampling-Sites-Below-40m-Depth.geojson', 'Below 40m Depth', '#8D6E63'),
    fetchDepthZone('/geo/WQ-Sampling-Sites-Tributary.geojson', 'Tributary', '#2E7D32'),
  ])
    .then(([aboveLayer, belowLayer, tributaryLayer]) => {
      wqAbove40LayerGroup = aboveLayer;
      wqBelow40LayerGroup = belowLayer;
      wqTributaryLayerGroup = tributaryLayer;
      syncLayerVisibility();

      return fetch('/geo/WQ-All-Sampling-Sites.geojson')
        .then((res) => res.json())
        .then((geojson: GeoJSON.FeatureCollection) => {
          waterQualitySites.value = geojson.features.map((feature) => {
            const props = feature.properties as unknown as WaterQualitySiteProps;
            const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates as [
              number,
              number,
            ];
            return { siteId: props.SITE_ID, stationId: props.STATION_ID, lat, lng };
          });
          wqAllLayerGroup = createWaterQualitySiteLayer(geojson, '#0288D1');
          syncLayerVisibility();
        });
    })
    .catch((err) => console.error('Failed to load water quality sampling sites GeoJSON:', err));

  // ── Lake Monitoring Station Zones (polygons — hover to highlight + show info) ──
  fetch('/geo/Lake-Station.geojson')
    .then((res) => res.json())
    .then((geojson: GeoJSON.GeoJsonObject) => {
      const stationLayer = L.geoJSON(geojson, {
        style: {
          color: '#00838F',
          weight: 1.5,
          fillColor: '#4DD0E1',
          fillOpacity: 0.08,
        },
        onEachFeature: (feature, layer) => {
          const name = (feature.properties?.name as string) ?? 'Station';
          layer.bindTooltip(
            `<div style="font-family: Roboto, sans-serif;"><strong>${name}</strong><br><span style="color:#666;">Lake Monitoring Zone</span></div>`,
            { sticky: true },
          );
          layer.on('mouseover', () => {
            (layer as L.Path).setStyle({ weight: 3.5, color: '#006064', fillOpacity: 0.2 });
          });
          layer.on('mouseout', () => {
            stationLayer.resetStyle(layer as L.Path);
          });
        },
      });
      lakeStationsLayerGroup = stationLayer;
      syncLayerVisibility();
    })
    .catch((err) => console.error('Failed to load Lake-Station GeoJSON:', err));

  // ── Lake Tributaries (rivers) ──
  fetch('/geo/Lake-Tributaries.geojson')
    .then((res) => res.json())
    .then((geojson: GeoJSON.GeoJsonObject) => {
      tributariesLayerGroup = L.geoJSON(geojson, {
        style: { color: '#1976D2', weight: 2 },
        onEachFeature: (feature, layer) => {
          const name = (feature.properties?.name as string) ?? 'Tributary';
          layer.bindTooltip(`<strong>${name}</strong>`, { sticky: true });
        },
      });
      syncLayerVisibility();
    })
    .catch((err) => console.error('Failed to load Lake-Tributaries GeoJSON:', err));

  // ── Apply initial layer visibility ──
  syncLayerVisibility();
}

function syncLayerVisibility() {
  if (!map) return;

  const layerGroups: Record<string, L.Layer | null> = {
    fish: fishLayerGroup,
    lakeBoundary: lakeBoundaryLayerGroup,
    wqAll: wqAllLayerGroup,
    wqAbove40: wqAbove40LayerGroup,
    wqBelow40: wqBelow40LayerGroup,
    wqTributary: wqTributaryLayerGroup,
    lakeStations: lakeStationsLayerGroup,
    tributaries: tributariesLayerGroup,
  };

  for (const layerConfig of mapLayers.value) {
    const group = layerGroups[layerConfig.id];
    if (!group || !map) continue;
    if (layerConfig.active) {
      if (!map.hasLayer(group)) map.addLayer(group);
    } else {
      if (map.hasLayer(group)) map.removeLayer(group);
    }
  }
}

function renderFishMarkers() {
  if (!fishLayerGroup) return;
  fishLayerGroup.clearLayers();

  filteredSpecies.value.forEach((fish) => {
    const markerColor = fish.type === 'endemic' ? '#1565C0' : '#E65100';
    const icon = L.divIcon({
      className: 'fish-marker',
      html: `<div style="background:${markerColor}; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marker = L.marker([fish.lat, fish.lng], { icon });
    marker.bindPopup(`
      <div style="font-family: Roboto, sans-serif; min-width: 160px;">
        <strong>${fish.commonName}</strong><br>
        <em style="color:#888;">${fish.scientificName}</em><br>
        <span style="color:${markerColor}; font-weight:bold;">${fish.type === 'endemic' ? 'Endemic' : 'Invasive'}</span> ·
        <span>${fish.statusShort}</span>
      </div>
    `);
    marker.on('click', () => {
      selectedFish.value = fish;
      selectedWaterSite.value = null;
    });
    fishLayerGroup!.addLayer(marker);
  });
}

// Watch filteredSpecies and re-render map markers when filter/search changes
watch(filteredSpecies, () => {
  renderFishMarkers();
});

function enterDashboard() {
  showWelcomeOverlay.value = false;
  nextTick(() => {
    initMap();
    setTimeout(() => {
      map?.invalidateSize();
    }, 400);
  });
}

onMounted(() => {
  // If navigated with ?explore=true, skip the welcome overlay and go straight to map
  if (route.query.explore === 'true') {
    enterDashboard();
  }
});

// Watch layer toggle changes and sync map visibility
watch(
  mapLayers,
  () => {
    syncLayerVisibility();
  },
  { deep: true },
);

// Re-invalidate map size when panel opens/closes
watch(showPanel, () => {
  setTimeout(() => map?.invalidateSize(), 300);
});

function goToFishObservation() {
  router.push('/researcher/upload/fish');
}

function goToWaterQuality() {
  router.push('/researcher/upload/water-quality');
}
</script>

<style scoped>
/* ═══════════════════════════════════ */
/* HERO OVERLAY                       */
/* ═══════════════════════════════════ */
.hero-overlay {
  z-index: 9999;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
  letter-spacing: 6px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
}

.hero-divider {
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #26a69a, transparent);
}

.hero-subtitle {
  font-size: 1.3rem;
  font-weight: 400;
  color: #e0e0e0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.hero-description {
  font-size: 0.95rem;
  color: #9e9e9e;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.hero-logo-avatar {
  background: linear-gradient(135deg, #00695c, #26a69a) !important;
  box-shadow: 0 4px 30px rgba(38, 166, 154, 0.4);
}

.explore-btn {
  background: linear-gradient(135deg, #00695c 0%, #26a69a 100%) !important;
  color: white;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1rem;
  box-shadow: 0 4px 25px rgba(38, 166, 154, 0.5);
  transition: all 0.3s ease;
}
.explore-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 35px rgba(38, 166, 154, 0.7);
}

.hero-stat {
  text-align: center;
}
.hero-stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #26a69a;
  text-shadow: 0 0 20px rgba(38, 166, 154, 0.3);
}
.hero-stat-label {
  font-size: 0.7rem;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Floating Particles */
.particles-container {
  pointer-events: none;
  z-index: 1;
}
.particle {
  position: absolute;
  background: rgba(38, 166, 154, 0.3);
  border-radius: 50%;
  animation: float-particle linear infinite;
}
@keyframes float-particle {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(0.3);
    opacity: 0;
  }
}

/* ═══════════════════════════════════ */
/* MAP                                */
/* ═══════════════════════════════════ */
.map-container {
  z-index: 0;
  background: #f0f0f0;
}

/* ═══════════════════════════════════ */
/* TOGGLE BUTTON                      */
/* ═══════════════════════════════════ */
.toggle-panel-btn {
  position: absolute;
  top: 72px;
  left: 16px;
  z-index: 1001;
  background: white !important;
  color: #00897b !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toggle-panel-btn:hover {
  background: #e0f2f1 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.toggle-btn--shifted {
  left: 408px;
}

/* ═══════════════════════════════════ */
/* BRIGHT PANEL                       */
/* ═══════════════════════════════════ */
.control-panel {
  position: absolute;
  top: 60px;
  left: 12px;
  bottom: 12px;
  width: 380px;
  z-index: 1000;
  pointer-events: auto;
}

.bright-panel {
  background: rgba(255, 255, 255, 0.97) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.panel-tabs :deep(.q-tab) {
  text-transform: none;
  font-weight: 600;
  font-size: 0.8rem;
  color: #78909c;
  min-height: 36px;
}

/* ═══════════════════════════════════ */
/* SPECIES LIST ITEMS                 */
/* ═══════════════════════════════════ */
.species-item {
  background: #f8fffe;
  border: 1px solid #e0f2f1;
  transition: all 0.2s ease;
  min-height: 52px;
}
.species-item:hover {
  background: #e0f2f1;
  border-color: #80cbc4;
}
.species-item--active {
  background: #e0f2f1 !important;
  border-color: #26a69a !important;
  border-left: 3px solid #00897b;
}

.filter-chip {
  font-size: 0.7rem;
  transition: all 0.2s ease;
}

/* ═══════════════════════════════════ */
/* DETAIL PANEL (Right)               */
/* ═══════════════════════════════════ */
.detail-panel {
  position: absolute;
  top: 60px;
  right: 12px;
  bottom: 12px;
  width: 340px;
  z-index: 1000;
  pointer-events: auto;
}

/* ═══════════════════════════════════ */
/* FADE BUTTON TRANSITION             */
/* ═══════════════════════════════════ */
.fade-btn-enter-active {
  transition: opacity 0.5s ease 0.8s;
}
.fade-btn-leave-active {
  transition: opacity 0.3s ease;
}
.fade-btn-enter-from,
.fade-btn-leave-to {
  opacity: 0;
}

/* ═══════════════════════════════════ */
/* TRANSITIONS                        */
/* ═══════════════════════════════════ */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 1s ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.slide-panel-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-leave-active {
  transition: all 0.4s ease-in;
}
.slide-panel-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-panel-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-detail-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-detail-leave-active {
  transition: all 0.3s ease-in;
}
.slide-detail-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-detail-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ═══════════════════════════════════ */
/* RESPONSIVE                         */
/* ═══════════════════════════════════ */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
    letter-spacing: 3px;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
  .toggle-panel-btn {
    top: 72px;
    left: 12px;
  }
  .toggle-btn--shifted {
    left: calc(100% - 60px);
  }
  .control-panel {
    width: calc(100% - 24px);
    top: auto;
    bottom: 12px;
    left: 12px;
    height: 50vh;
  }
  .detail-panel {
    width: calc(100% - 24px);
    top: auto;
    bottom: 12px;
    right: 12px;
    height: 50vh;
  }
  .hero-stat-value {
    font-size: 1.2rem;
  }
}

/* ═══════════════════════════════════ */
/* ADD DATA BUTTON                    */
/* ═══════════════════════════════════ */
.add-data-btn {
  position: absolute;
  top: 120px;
  left: 16px;
  z-index: 1001;
  box-shadow: 0 2px 12px rgba(0, 150, 136, 0.35);
  border-radius: 50px !important;
  font-weight: 600;
  font-size: 0.78rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 14px 14px;
}
.add-data-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(0, 150, 136, 0.5);
}
.add-data-btn--shifted {
  left: 408px;
}
</style>
