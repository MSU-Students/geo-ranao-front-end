<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Same Lake Lanao background as IndexPage -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />

    <!-- Dark overlay for readability -->
    <div class="absolute-full bg-overlay" />

    <BackButton to="/map" />

    <!-- Main Content -->
    <div class="page-content full-width q-pa-md" style="max-width: 1300px">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <h4 class="text-weight-bolder q-my-xs text-white drop-shadow">
          Fish Observation Dashboard
        </h4>
        <p class="text-grey-3 drop-shadow-soft q-mb-none">
          Profiling and mapping of Lake Lanao's endemic cyprinids and invasive species
        </p>
      </div>

      <!-- Summary Cards -->
      <div class="row q-col-gutter-md q-mb-md justify-center">
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="set_meal" color="teal-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">24</div>
            <div class="text-grey-3 text-caption">Total Species</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="crisis_alert" color="blue-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">18</div>
            <div class="text-grey-3 text-caption">Endemic Cyprinids</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="warning" color="orange-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">6</div>
            <div class="text-grey-3 text-caption">Invasive Species</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="dangerous" color="red-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">12</div>
            <div class="text-grey-3 text-caption">Critically Endangered</div>
          </q-card>
        </div>
      </div>

      <!-- Species List + Detail -->
      <div class="row q-col-gutter-md q-mb-md">
        <!-- Species List -->
        <div class="col-12 col-md-7">
          <q-card class="glass-morph">
            <q-card-section class="q-pb-sm">
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-white text-subtitle1 text-weight-medium">Species Profiles</span>
                <div class="row q-gutter-xs">
                  <q-btn
                    :color="activeFilter === 'all' ? 'teal' : 'white'"
                    :flat="activeFilter !== 'all'"
                    label="All"
                    size="xs"
                    rounded
                    unelevated
                    @click="activeFilter = 'all'"
                  />
                  <q-btn
                    :color="activeFilter === 'endemic' ? 'blue' : 'white'"
                    :flat="activeFilter !== 'endemic'"
                    label="Endemic"
                    size="xs"
                    rounded
                    unelevated
                    @click="activeFilter = 'endemic'"
                  />
                  <q-btn
                    :color="activeFilter === 'invasive' ? 'orange' : 'white'"
                    :flat="activeFilter !== 'invasive'"
                    label="Invasive"
                    size="xs"
                    rounded
                    unelevated
                    @click="activeFilter = 'invasive'"
                  />
                </div>
              </div>
              <q-input
                v-model="search"
                dense
                dark
                outlined
                placeholder="Search species..."
                class="search-input"
              >
                <template #prepend>
                  <q-icon name="search" color="grey-4" size="xs" />
                </template>
              </q-input>
            </q-card-section>

            <q-list dark separator style="max-height: 320px; overflow-y: auto">
              <q-item
                v-for="fish in filteredSpecies"
                :key="fish.id"
                clickable
                class="species-item"
                :class="{ 'selected-item': selectedFish?.id === fish.id }"
                @click="selectFish(fish)"
              >
                <q-item-section avatar>
                  <q-avatar
                    :color="fish.type === 'endemic' ? 'blue-8' : 'orange-8'"
                    text-color="white"
                    size="36px"
                  >
                    <q-icon name="set_meal" size="sm" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-white text-weight-medium">{{
                    fish.commonName
                  }}</q-item-label>
                  <q-item-label caption class="text-grey-4 text-italic">{{
                    fish.scientificName
                  }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="
                      fish.status === 'Critically Endangered'
                        ? 'red'
                        : fish.status === 'Endangered'
                          ? 'orange'
                          : 'green'
                    "
                    :label="fish.status"
                  />
                </q-item-section>
              </q-item>
              <q-item v-if="filteredSpecies.length === 0">
                <q-item-section class="text-center text-grey-4 q-py-lg"
                  >No species found.</q-item-section
                >
              </q-item>
            </q-list>
          </q-card>
        </div>

        <!-- Species Detail -->
        <div class="col-12 col-md-5">
          <q-card class="glass-morph full-height">
            <q-card-section v-if="selectedFish">
              <div class="text-white text-subtitle1 text-weight-medium q-mb-md">Species Detail</div>
              <div class="row items-center q-mb-md">
                <q-avatar
                  :color="selectedFish.type === 'endemic' ? 'blue-8' : 'orange-8'"
                  size="52px"
                  class="q-mr-md"
                >
                  <q-icon name="set_meal" size="md" color="white" />
                </q-avatar>
                <div>
                  <div class="text-white text-weight-bold">{{ selectedFish.commonName }}</div>
                  <div class="text-grey-4 text-italic text-caption">
                    {{ selectedFish.scientificName }}
                  </div>
                  <q-badge
                    :color="selectedFish.type === 'endemic' ? 'blue' : 'orange'"
                    :label="
                      selectedFish.type === 'endemic' ? 'Endemic Cyprinid' : 'Invasive Species'
                    "
                    class="q-mt-xs"
                  />
                </div>
              </div>
              <q-list dense dark>
                <q-item v-for="d in selectedFishDetails" :key="d.label" class="q-px-none">
                  <q-item-section>
                    <q-item-label caption class="text-grey-4">{{ d.label }}</q-item-label>
                    <q-item-label class="text-grey-2">{{ d.value }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-btn
                color="teal"
                label="View on GIS Map"
                icon="map"
                size="sm"
                unelevated
                rounded
                class="q-mt-md full-width"
                @click="$router.push('/map')"
              />
            </q-card-section>
            <q-card-section v-else class="text-center q-py-xl">
              <q-icon name="set_meal" size="xl" color="grey-5" />
              <div class="text-grey-4 q-mt-sm">Select a species to view its profile</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Conservation Status + Quick Actions -->
      <div class="row q-col-gutter-md">
        <!-- Conservation Status -->
        <div class="col-12 col-md-5">
          <q-card class="glass-morph">
            <q-card-section>
              <div class="text-white text-subtitle1 text-weight-medium q-mb-md">
                Conservation Status
              </div>
              <div v-for="s in conservationStats" :key="s.label" class="q-mb-sm">
                <div class="row justify-between q-mb-xs">
                  <span class="text-grey-3 text-caption">{{ s.label }}</span>
                  <span class="text-white text-caption text-weight-bold">{{ s.count }}</span>
                </div>
                <q-linear-progress
                  :value="s.count / 24"
                  :color="s.color"
                  track-color="grey-8"
                  rounded
                  size="8px"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Quick Actions -->
        <div class="col-12 col-md-7">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card class="glass-morph action-card" @click="$router.push('/map')">
                <q-card-section class="text-center q-pa-md">
                  <q-icon name="map" color="teal-3" size="lg" />
                  <div class="text-white text-weight-medium q-mt-sm">GIS Map</div>
                  <div class="text-grey-4 text-caption">View species locations</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card class="glass-morph action-card" @click="activeFilter = 'endemic'">
                <q-card-section class="text-center q-pa-md">
                  <q-icon name="crisis_alert" color="blue-3" size="lg" />
                  <div class="text-white text-weight-medium q-mt-sm">Endemic</div>
                  <div class="text-grey-4 text-caption">18 cyprinid species</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card class="glass-morph action-card" @click="activeFilter = 'invasive'">
                <q-card-section class="text-center q-pa-md">
                  <q-icon name="warning" color="orange-3" size="lg" />
                  <div class="text-white text-weight-medium q-mt-sm">Invasive</div>
                  <div class="text-grey-4 text-caption">6 recorded species</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BackButton from 'components/BackButton.vue';

const search = ref('');
const activeFilter = ref('all');

interface Fish {
  id: number;
  commonName: string;
  scientificName: string;
  type: 'endemic' | 'invasive';
  status: string;
  length: string;
  weight: string;
  location: string;
  date: string;
}

const selectedFish = ref<Fish | null>(null);

const species: Fish[] = [
  {
    id: 1,
    commonName: 'Pait',
    scientificName: 'Puntius sirang',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '8–12 cm',
    weight: '20–50 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
  {
    id: 2,
    commonName: 'Igat',
    scientificName: 'Anguilla marmorata',
    type: 'endemic',
    status: 'Endangered',
    length: '60–100 cm',
    weight: '1–3 kg',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
  {
    id: 3,
    commonName: 'Banak',
    scientificName: 'Puntius lanaoensis',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '10–15 cm',
    weight: '30–80 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
  {
    id: 4,
    commonName: 'Ludong',
    scientificName: 'Puntius tumba',
    type: 'endemic',
    status: 'Critically Endangered',
    length: '7–10 cm',
    weight: '15–40 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
  {
    id: 5,
    commonName: 'Tarong',
    scientificName: 'Puntius tras',
    type: 'endemic',
    status: 'Endangered',
    length: '8–13 cm',
    weight: '20–60 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
  {
    id: 6,
    commonName: 'Nile Tilapia',
    scientificName: 'Oreochromis niloticus',
    type: 'invasive',
    status: 'Least Concern',
    length: '20–40 cm',
    weight: '0.5–2 kg',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
  {
    id: 7,
    commonName: 'Common Carp',
    scientificName: 'Cyprinus carpio',
    type: 'invasive',
    status: 'Least Concern',
    length: '30–60 cm',
    weight: '1–4 kg',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
  {
    id: 8,
    commonName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    type: 'invasive',
    status: 'Least Concern',
    length: '2–5 cm',
    weight: '< 5 g',
    location: 'Lake Lanao, Lanao del Sur',
    date: '2024',
  },
];

const filteredSpecies = computed(() =>
  species.filter((f) => {
    const matchFilter = activeFilter.value === 'all' || f.type === activeFilter.value;
    const matchSearch =
      f.commonName.toLowerCase().includes(search.value.toLowerCase()) ||
      f.scientificName.toLowerCase().includes(search.value.toLowerCase());
    return matchFilter && matchSearch;
  }),
);

const selectedFishDetails = computed(() =>
  selectedFish.value
    ? [
        { label: 'True Length', value: selectedFish.value.length },
        { label: 'Weight', value: selectedFish.value.weight },
        { label: 'Location', value: selectedFish.value.location },
        { label: 'Conservation Status', value: selectedFish.value.status },
        { label: 'Date Recorded', value: selectedFish.value.date },
      ]
    : [],
);

const conservationStats = [
  { label: 'Critically Endangered', count: 12, color: 'red' },
  { label: 'Endangered', count: 5, color: 'orange' },
  { label: 'Vulnerable', count: 1, color: 'yellow' },
  { label: 'Least Concern', count: 6, color: 'green' },
];

function selectFish(fish: Fish) {
  selectedFish.value = fish;
}
</script>

<style scoped>
.page-content {
  position: relative;
  z-index: 1;
  padding-top: 88px;
}

.drop-shadow {
  text-shadow: 0px 4px 10px rgba(0, 0, 0, 0.6);
}

.drop-shadow-soft {
  text-shadow: 0px 2px 5px rgba(0, 0, 0, 0.4);
}

.bg-overlay {
  background: rgba(0, 0, 0, 0.55);
}

.glass-morph {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.action-card {
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-6px);
  background: rgba(255, 255, 255, 0.18) !important;
}

.species-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.selected-item {
  background: rgba(255, 255, 255, 0.12) !important;
  border-left: 3px solid #26a69a;
}

.search-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.08);
}
</style>
