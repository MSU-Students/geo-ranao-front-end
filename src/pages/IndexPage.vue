<template>
  <q-page class="relative-position overflow-hidden" style="min-height: 100vh">
    <!-- ═══════════════════════════════════════════════ -->
    <!-- MAIN DASHBOARD (Map + Control Panel)           -->
    <!-- ═══════════════════════════════════════════════ -->

    <!-- Leaflet Map Container -->
    <div ref="mapContainer" class="absolute-full map-container" />

    <!-- Toggle Button -->
    <transition name="fade-btn" appear>
      <q-btn
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

    <!-- Recenter Button — jumps back to Lake Lanao if you've panned/zoomed away -->
    <transition name="fade-btn" appear>
      <q-btn
        class="recenter-btn"
        round
        unelevated
        size="md"
        icon="my_location"
        @click="resetMapView"
      >
        <q-tooltip anchor="center left" self="center right" :offset="[10, 0]">
          Recenter on Lake Lanao
        </q-tooltip>
      </q-btn>
    </transition>

    <!-- Floating Control Panel (Left Side — Toggleable, BRIGHT THEME) -->
    <transition name="slide-panel">
      <div v-if="showPanel" class="control-panel">
        <q-card class="bright-panel full-height column no-wrap">
          <!-- Panel Header -->
          <q-card-section class="q-pb-xs">
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
                  Hover a site for a quick look, click for full details. Use the slider to browse
                  monthly readings.
                </div>

                <!-- Monthly Time Slider -->
                <div class="text-caption text-grey-6 q-mb-xs">
                  Reading Period:
                  <span class="text-weight-bold text-teal-8">{{ selectedMonthLabel }}</span>
                </div>
                <div class="q-px-sm q-mb-lg">
                  <q-slider
                    v-model="selectedMonthIndex"
                    :min="0"
                    :max="months.length - 1"
                    :step="1"
                    snap
                    markers
                    color="teal"
                    track-size="4px"
                    thumb-size="16px"
                  />
                  <div class="row justify-between text-caption text-grey-5">
                    <span>{{ months[0] }}</span>
                    <span>{{ months[months.length - 1] }}</span>
                  </div>
                </div>

                <!-- Color Sites By Parameter -->
                <div class="text-caption text-grey-6 q-mb-xs">Color Sites By Parameter</div>
                <q-select
                  v-model="selectedColorParamKey"
                  :options="colorParamOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  dense
                  rounded
                  outlined
                  placeholder="None (default colors)"
                  class="q-mb-xs"
                  color="teal"
                >
                  <template #prepend>
                    <q-icon name="tune" color="grey-5" size="xs" />
                  </template>
                </q-select>
                <div v-if="selectedColorParam" class="row q-gutter-md q-mb-md q-mt-xs">
                  <div v-for="level in STATUS_LEVELS" :key="level" class="row items-center no-wrap">
                    <span class="status-dot" :style="{ background: STATUS_COLORS[level] }" />
                    <span class="text-caption text-grey-7 q-ml-xs">{{ STATUS_LABELS[level] }}</span>
                  </div>
                </div>

                <!-- Coverage Heatmap -->
                <div v-if="selectedColorParam" class="q-mb-md">
                  <q-toggle v-model="showHeatmap" color="teal" dense>
                    <span class="text-caption text-grey-8">Show Coverage Heatmap</span>
                  </q-toggle>
                  <div class="text-caption text-grey-5 q-mt-xs">
                    Colors show the estimated status across the whole lake; areas that fade to
                    transparent are far from any sampling site — a coordinate gap, not a
                    reading.
                  </div>
                </div>

                <!-- Sampling Depth -->
                <div class="text-caption text-grey-6 q-mb-xs">
                  <q-icon name="vertical_align_bottom" size="14px" class="q-mr-xs" />Sampling Depth
                </div>
                <q-select
                  v-model="selectedDepthM"
                  :options="DEPTH_OPTIONS"
                  emit-value
                  map-options
                  dense
                  rounded
                  outlined
                  class="q-mb-xs"
                  color="teal"
                >
                  <template #prepend>
                    <q-icon name="layers" color="grey-5" size="xs" />
                  </template>
                </q-select>
                <div class="text-caption text-grey-5 q-mb-md">
                  Readings vary with depth (e.g. cooler, less-oxygenated water below the
                  thermocline). Applies to marker colors, tooltips, and the site detail panel.
                </div>

                <div class="text-caption text-grey-5 q-mb-md">
                  Click anywhere inside the lake for an estimated reading (select a parameter above
                  first).
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
                      <q-avatar
                        :color="isRiverSite(site.siteId) ? 'deep-orange-8' : 'blue-7'"
                        text-color="white"
                        size="36px"
                      >
                        <q-icon :name="isRiverSite(site.siteId) ? 'waves' : 'pin_drop'" size="18px" />
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
                      <q-badge
                        :style="{
                          background: siteStatusBadge(site.siteId).background,
                          color: 'white',
                        }"
                        :label="siteStatusBadge(site.siteId).label"
                      />
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
                  <q-icon name="public" class="q-mr-xs" /> Base Map
                </div>
                <q-btn-toggle
                  v-model="selectedBaseLayer"
                  spread
                  dense
                  no-caps
                  unelevated
                  toggle-color="teal"
                  color="white"
                  text-color="grey-8"
                  :options="
                    baseLayerOptions.map((o) => ({
                      label: o.name,
                      value: o.id,
                      icon: o.icon,
                      stack: true,
                    }))
                  "
                  class="base-layer-toggle q-mb-md"
                />
                <q-separator class="q-mb-md" />

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
      <div v-if="selectedFish || selectedWaterSite" class="detail-panel">
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
                <q-avatar
                  :color="isRiverSite(selectedWaterSite.siteId) ? 'deep-orange-8' : 'blue-7'"
                  size="56px"
                  class="q-mr-md"
                >
                  <q-icon
                    :name="isRiverSite(selectedWaterSite.siteId) ? 'waves' : 'opacity'"
                    size="md"
                    color="white"
                  />
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

              <template v-if="!isRiverSite(selectedWaterSite.siteId)">
                <div class="text-caption text-grey-6 q-mb-xs">
                  <q-icon name="vertical_align_bottom" size="14px" class="q-mr-xs" />Depth
                </div>
                <q-select
                  v-model="selectedDepthM"
                  :options="DEPTH_OPTIONS"
                  emit-value
                  map-options
                  dense
                  rounded
                  outlined
                  class="q-mb-md"
                  color="teal"
                >
                  <template #prepend>
                    <q-icon name="layers" color="grey-5" size="xs" />
                  </template>
                </q-select>
              </template>

              <q-banner dense class="bg-teal-1 text-teal-9 q-mb-md rounded-borders">
                <template #avatar>
                  <q-icon name="calendar_month" color="teal-8" />
                </template>
                Reading period: <strong>{{ selectedMonthLabel }}</strong> at
                <strong>{{ isRiverSite(selectedWaterSite.siteId) ? 'Surface' : depthLabel(selectedDepthM) }}</strong>
                <div class="text-caption text-grey-7">
                  Simulated values — real monthly readings are not connected yet.
                  <template v-if="isRiverSite(selectedWaterSite.siteId)">
                    Tributary rivers are sampled at the surface only.
                  </template>
                </div>
              </q-banner>

              <div v-for="group in waterQualityParameterGroups" :key="group.title" class="q-mb-md">
                <div class="text-caption text-weight-bold q-mb-xs" :class="`text-${group.color}`">
                  <q-icon :name="group.icon" size="14px" class="q-mr-xs" />{{ group.title }}
                </div>
                <q-list dense class="q-gutter-y-xs">
                  <q-item v-for="p in group.params" :key="p.label" class="q-px-none">
                    <q-item-section>
                      <q-item-label caption class="text-grey-6">
                        {{ p.label }}{{ p.unit ? ` (${p.unit})` : '' }}
                      </q-item-label>
                      <q-item-label class="text-grey-9 text-weight-medium">
                        {{ mockReading(selectedWaterSite.siteId, selectedMonthIndex, p, effectiveDepthFor(selectedWaterSite.siteId)) }}
                      </q-item-label>
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
        v-if="authStore.isLoggedIn && authStore.user?.role !== 'Admin'"
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

    <UploadDataDialog ref="uploadDialogRef" />

    <!-- ═══ PARAMETER READING MODAL (click anywhere inside the lake) ═══ -->
    <q-dialog v-model="showParameterModal">
      <q-card v-if="parameterModalData" class="parameter-modal-card">
        <div class="parameter-modal-header" :style="{ background: parameterModalData.color }">
          <q-icon name="water_drop" size="28px" color="white" />
          <div class="text-white text-weight-bold text-subtitle1 q-mt-xs">
            {{ parameterModalData.statusLabel }}
          </div>
        </div>
        <q-card-section>
          <div class="text-caption text-grey-6">
            {{ parameterModalData.paramLabel }} · {{ selectedMonthLabel }} ·
            {{ parameterModalData.depthLabel }}
          </div>
          <div class="text-h4 text-weight-bold text-grey-9 q-mt-xs">
            {{ parameterModalData.valueText }}
          </div>
          <div class="text-caption text-grey-5 q-mt-sm">
            Estimated at {{ parameterModalData.lat.toFixed(5) }},
            {{ parameterModalData.lng.toFixed(5) }}
          </div>
          <div class="text-caption text-grey-5 q-mt-xs">
            Interpolated from nearby sampling sites — simulated data, not a direct measurement.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="grey-7" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { TRIBUTARY_RIVER_SITES, TRIBUTARY_RIVER_SITE_IDS } from 'src/composables/useWaterQualityModel';
import UploadDataDialog from 'src/components/UploadDataDialog.vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// ═══ CONSERVATION STATUS COLORS (IUCN scale) ═══
const STATUS_PIN_COLORS: Record<string, string> = {
  CR: '#D32F2F', // Critically Endangered — red
  EN: '#F57C00', // Endangered — amber
  VU: '#FFA000', // Vulnerable — orange
  NT: '#7CB342', // Near Threatened — yellow-green
  LC: '#43A047', // Least Concern — green
};

// ═══ INLINE SVG MAP-PIN BUILDERS ═══
// Fish marker: circle with a small fish inside
function fishPinSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <filter id="fs" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
    </filter>
    <circle cx="20" cy="20" r="18"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#fs)"/>
    <g transform="translate(20,20)" fill="#fff">
      <ellipse rx="7" ry="4" />
      <polygon points="7,-1 11,-4 11,4 7,1" />
      <circle cx="-3" cy="-1" r="1" fill="${color}"/>
    </g>
  </svg>`;
}

function makeFishIcon(statusShort: string): L.DivIcon {
  const color = STATUS_PIN_COLORS[statusShort] ?? '#78909C';
  return L.divIcon({
    className: '',
    html: fishPinSvg(color),
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
    tooltipAnchor: [0, -13],
  });
}

// Water-quality marker: circle with a water droplet inside. Recolorable —
// when a parameter is selected (Water tab → Color Sites By Parameter), each
// site's pin switches to its good/warning/serious/critical status color.
const WATER_PIN_COLOR = '#0277BD'; // rich cerulean blue — default when no parameter is selected
const waterPinIconCache = new Map<string, L.DivIcon>();

function makeWaterPinIcon(color: string): L.DivIcon {
  let icon = waterPinIconCache.get(color);
  if (icon) return icon;

  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
    <filter id="ws" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
    </filter>
    <circle cx="18" cy="18" r="16"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#ws)"/>
    <path d="M18 9 Q22 15 22 18.5 A4 4 0 0 1 14 18.5 Q14 15 18 9Z"
          fill="#fff" opacity="0.95"/>
  </svg>`;

  icon = L.divIcon({
    className: '',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    tooltipAnchor: [0, -12],
  });
  waterPinIconCache.set(color, icon);
  return icon;
}

// Tributary-river marker: same pin size/style as the lake water-quality
// markers, but a wavy-lines glyph instead of a droplet and a distinct default
// color — so the 6 fixed river sampling points read as visually different
// from the 24 lake sites at a glance. Also recolorable by parameter/status.
const RIVER_PIN_COLOR = '#D84315'; // deep orange — default when no parameter is selected; kept distinct from the depth-zone palette (purple/brown/green) and the lake pin blue
const riverPinIconCache = new Map<string, L.DivIcon>();

function makeRiverPinIcon(color: string): L.DivIcon {
  let icon = riverPinIconCache.get(color);
  if (icon) return icon;

  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
    <filter id="rs" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
    </filter>
    <circle cx="18" cy="18" r="16"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#rs)"/>
    <path d="M9.5 14.5c1.7-2.2 3.4-2.2 5.1 0s3.4 2.2 5.1 0 3.4-2.2 5.1 0"
          stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>
    <path d="M9.5 19c1.7-2.2 3.4-2.2 5.1 0s3.4 2.2 5.1 0 3.4-2.2 5.1 0"
          stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>
    <path d="M9.5 23.5c1.7-2.2 3.4-2.2 5.1 0s3.4 2.2 5.1 0 3.4-2.2 5.1 0"
          stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>
  </svg>`;

  icon = L.divIcon({
    className: '',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    tooltipAnchor: [0, -12],
  });
  riverPinIconCache.set(color, icon);
  return icon;
}

// Every water-quality marker ever created, across every layer (All Sites +
// each depth zone) — lets recolorWaterLayers() update every pin in place
// instead of tearing the layers down and rebuilding them.
const waterSiteMarkerEntries: { siteId: string; defaultColor: string; marker: L.Marker }[] = [];
// River-site markers are separate: fixed at Surface depth, built once from a
// static coordinate list (not fetched from GeoJSON like the lake sites).
const riverSiteMarkerEntries: { siteId: string; marker: L.Marker }[] = [];
let riverSitesLayerGroup: L.LayerGroup | null = null;

const authStore = useAuthStore();
const $q = useQuasar();
const uploadDialogRef = ref<InstanceType<typeof UploadDataDialog> | null>(null);

// ═══ STATE ═══
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
let currentBaseTileLayer: L.TileLayer | null = null;
let heatmapOverlay: L.ImageOverlay | null = null;
let contourLinesLayerGroup: L.LayerGroup | null = null;
let contourFilledLayerGroup: L.LayerGroup | null = null;

// Lake Lanao boundary rings ([lat, lng][]) — populated once the boundary GeoJSON
// loads, used to detect "click anywhere inside the lake" for the reading popup.
let lakePolygonRings: [number, number][][] = [];

// ═══ FISH DATA ═══
interface Fish {
  id: number;
  commonName: string;
  scientificName: string;
  type: 'endemic' | 'invasive' | 'general';
  status: string;
  statusShort: string;
  length: string;
  weight: string;
  location: string;
  date: string;
  lat: number;
  lng: number;
  depth?: string;
  number?: string;
  size?: string;
  bodyDepth?: string;
  municipal?: string;
  barangay?: string;
  photos?: string;
}

const selectedFish = ref<Fish | null>(null);

const species: Fish[] = [
  // ENDEMIC
  {
    id: 1,
    commonName: 'Pait',
    scientificName: 'Puntius sirang',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '8.5 cm',
    bodyDepth: '2.1 cm',
    weight: '25 g',
    photos: 'Lateral, Dorsal',
    location: 'Lake Lanao, Lanao del Sur',
    municipal: 'Marawi City',
    barangay: 'Sagonsongan',
    date: '2026-05-12',
    lat: 7.872,
    lng: 124.145,
  },
  {
    id: 2,
    commonName: 'Igat',
    scientificName: 'Anguilla marmorata',
    type: 'endemic',
    status: 'Endangered',
    statusShort: 'EN',
    length: '65 cm',
    bodyDepth: '5.5 cm',
    weight: '1.2 kg',
    photos: 'All 5 angles',
    location: 'Ramain River Mouth',
    municipal: 'Ditsaan-Ramain',
    barangay: 'Buadi Ompig',
    date: '2026-04-20',
    lat: 7.963,
    lng: 124.275,
  },
  {
    id: 3,
    commonName: 'Banak',
    scientificName: 'Puntius lanaoensis',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '12 cm',
    bodyDepth: '3.4 cm',
    weight: '45 g',
    photos: 'Lateral only',
    location: 'Balindong, Lanao del Sur',
    municipal: 'Balindong',
    barangay: 'Lumbac',
    date: '2026-06-05',
    lat: 7.837,
    lng: 124.21,
  },
  {
    id: 4,
    commonName: 'Ludong',
    scientificName: 'Puntius tumba',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '9.2 cm',
    bodyDepth: '2.5 cm',
    weight: '30 g',
    photos: 'None',
    location: 'Taraka, Lanao del Sur',
    municipal: 'Taraka',
    barangay: 'Pitakus',
    date: '2026-07-01',
    lat: 7.908,
    lng: 124.23,
  },
  {
    id: 5,
    commonName: 'Tarong',
    scientificName: 'Puntius tras',
    type: 'endemic',
    status: 'Endangered',
    statusShort: 'EN',
    length: '11 cm',
    bodyDepth: '3.1 cm',
    weight: '38 g',
    photos: 'All 5 angles',
    location: 'Masiu, Lanao del Sur',
    municipal: 'Masiu',
    barangay: 'Binuang',
    date: '2026-06-15',
    lat: 7.855,
    lng: 124.188,
  },
  {
    id: 6,
    commonName: 'Baolan',
    scientificName: 'Puntius baoulan',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '13 cm',
    bodyDepth: '3.8 cm',
    weight: '50 g',
    photos: 'Lateral, Ventral',
    location: 'Binidayan',
    municipal: 'Binidayan',
    barangay: 'Picalilangan',
    date: '2026-03-10',
    lat: 7.82,
    lng: 124.16,
  },
  {
    id: 7,
    commonName: 'Bagangan',
    scientificName: 'Puntius clemensi',
    type: 'endemic',
    status: 'Vulnerable',
    statusShort: 'VU',
    length: '15 cm',
    bodyDepth: '4.2 cm',
    weight: '65 g',
    photos: 'All 5 angles',
    location: 'Marawi City Shoreline',
    municipal: 'Marawi City',
    barangay: 'Banggolo',
    date: '2026-02-28',
    lat: 7.995,
    lng: 124.285,
  },
  {
    id: 8,
    commonName: 'Diza',
    scientificName: 'Puntius diza',
    type: 'endemic',
    status: 'Endangered',
    statusShort: 'EN',
    length: '7.8 cm',
    bodyDepth: '2.0 cm',
    weight: '22 g',
    photos: 'Lateral',
    location: 'Tugaya',
    municipal: 'Tugaya',
    barangay: 'Sugod',
    date: '2026-05-22',
    lat: 7.88,
    lng: 124.15,
  },
  {
    id: 9,
    commonName: 'Katapa-tapa',
    scientificName: 'Puntius flavifuscus',
    type: 'endemic',
    status: 'Endangered',
    statusShort: 'EN',
    length: '10 cm',
    bodyDepth: '2.9 cm',
    weight: '35 g',
    photos: 'None',
    location: 'Ganassi',
    municipal: 'Ganassi',
    barangay: 'Poblacion',
    date: '2026-04-15',
    lat: 7.83,
    lng: 124.14,
  },
  {
    id: 10,
    commonName: 'Manalak',
    scientificName: 'Puntius manalak',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '14.5 cm',
    bodyDepth: '4.0 cm',
    weight: '58 g',
    photos: 'All 5 angles',
    location: 'Pualas',
    municipal: 'Pualas',
    barangay: 'Danugan',
    date: '2026-06-18',
    lat: 7.845,
    lng: 124.145,
  },
  {
    id: 11,
    commonName: 'Katolo',
    scientificName: 'Puntius katolo',
    type: 'endemic',
    status: 'Vulnerable',
    statusShort: 'VU',
    length: '12.5 cm',
    bodyDepth: '3.5 cm',
    weight: '48 g',
    photos: 'Lateral, Dorsal',
    location: 'Ditsaan-Ramain',
    municipal: 'Ditsaan-Ramain',
    barangay: 'Barimbingan',
    date: '2026-07-05',
    lat: 7.965,
    lng: 124.26,
  },
  {
    id: 12,
    commonName: 'Pait',
    scientificName: 'Puntius sirang',
    type: 'endemic',
    status: 'Critically Endangered',
    statusShort: 'CR',
    length: '10.5 cm',
    bodyDepth: '2.8 cm',
    weight: '32 g',
    photos: 'Lateral',
    location: 'Lumbatan',
    municipal: 'Lumbatan',
    barangay: 'Tambac',
    date: '2026-03-30',
    lat: 7.805,
    lng: 124.195,
  },

  // INVASIVE
  {
    id: 13,
    commonName: 'Nile Tilapia',
    scientificName: 'Oreochromis niloticus',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '22 cm',
    bodyDepth: '7.5 cm',
    weight: '350 g',
    photos: 'Lateral, Dorsal',
    location: 'Marantao',
    municipal: 'Marantao',
    barangay: 'Poblacion',
    date: '2026-06-10',
    lat: 7.94,
    lng: 124.252,
  },
  {
    id: 14,
    commonName: 'Common Carp',
    scientificName: 'Cyprinus carpio',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '45 cm',
    bodyDepth: '12 cm',
    weight: '1.5 kg',
    photos: 'All 5 angles',
    location: 'Saguiaran',
    municipal: 'Saguiaran',
    barangay: 'Maito Basak',
    date: '2026-05-05',
    lat: 7.983,
    lng: 124.285,
  },
  {
    id: 15,
    commonName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '3.5 cm',
    bodyDepth: '0.8 cm',
    weight: '3 g',
    photos: 'None',
    location: 'Balindong River inlet',
    municipal: 'Balindong',
    barangay: 'Salipongan',
    date: '2026-07-10',
    lat: 7.825,
    lng: 124.265,
  },
  {
    id: 16,
    commonName: 'Snakehead (Dalag)',
    scientificName: 'Channa striata',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '38 cm',
    bodyDepth: '6.5 cm',
    weight: '1.1 kg',
    photos: 'Lateral',
    location: 'Masiu Marshes',
    municipal: 'Masiu',
    barangay: 'Poblacion',
    date: '2026-06-25',
    lat: 7.86,
    lng: 124.2,
  },
  {
    id: 17,
    commonName: 'Walking Catfish',
    scientificName: 'Clarias batrachus',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '30 cm',
    bodyDepth: '5.2 cm',
    weight: '850 g',
    photos: 'Lateral, Ventral',
    location: 'Taraka River Delta',
    municipal: 'Taraka',
    barangay: 'Lumbac',
    date: '2026-04-12',
    lat: 7.915,
    lng: 124.24,
  },
  {
    id: 18,
    commonName: 'White Goby',
    scientificName: 'Glossogobius giuris',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '20 cm',
    bodyDepth: '4.5 cm',
    weight: '180 g',
    photos: 'All 5 angles',
    location: 'Marawi Harbor',
    municipal: 'Marawi City',
    barangay: 'Datu Saber',
    date: '2026-03-05',
    lat: 7.99,
    lng: 124.28,
  },
  {
    id: 19,
    commonName: 'Nile Tilapia',
    scientificName: 'Oreochromis niloticus',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '25 cm',
    bodyDepth: '8.2 cm',
    weight: '420 g',
    photos: 'Lateral',
    location: 'Binidayan',
    municipal: 'Binidayan',
    barangay: 'Poblacion',
    date: '2026-02-14',
    lat: 7.81,
    lng: 124.165,
  },
  {
    id: 20,
    commonName: 'Common Carp',
    scientificName: 'Cyprinus carpio',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '50 cm',
    bodyDepth: '14 cm',
    weight: '2.1 kg',
    photos: 'None',
    location: 'Pualas',
    municipal: 'Pualas',
    barangay: 'Badak',
    date: '2026-05-18',
    lat: 7.84,
    lng: 124.15,
  },
  {
    id: 21,
    commonName: 'Snakehead (Dalag)',
    scientificName: 'Channa striata',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '42 cm',
    bodyDepth: '7.1 cm',
    weight: '1.3 kg',
    photos: 'Lateral, Dorsal',
    location: 'Lumbatan',
    municipal: 'Lumbatan',
    barangay: 'Penal',
    date: '2026-07-08',
    lat: 7.795,
    lng: 124.185,
  },
  {
    id: 22,
    commonName: 'Nile Tilapia',
    scientificName: 'Oreochromis niloticus',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '18 cm',
    bodyDepth: '6.0 cm',
    weight: '250 g',
    photos: 'All 5 angles',
    location: 'Tugaya',
    municipal: 'Tugaya',
    barangay: 'Maibarom',
    date: '2026-06-30',
    lat: 7.885,
    lng: 124.155,
  },
  {
    id: 23,
    commonName: 'Guppy',
    scientificName: 'Poecilia reticulata',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '4 cm',
    bodyDepth: '1.0 cm',
    weight: '4 g',
    photos: 'Lateral',
    location: 'Marantao',
    municipal: 'Marantao',
    barangay: 'Inudaran',
    date: '2026-04-28',
    lat: 7.945,
    lng: 124.245,
  },
  {
    id: 24,
    commonName: 'Walking Catfish',
    scientificName: 'Clarias batrachus',
    type: 'invasive',
    status: 'Least Concern',
    statusShort: 'LC',
    length: '35 cm',
    bodyDepth: '6.1 cm',
    weight: '950 g',
    photos: 'Lateral, Anterior',
    location: 'Ditsaan-Ramain',
    municipal: 'Ditsaan-Ramain',
    barangay: 'Poblacion',
    date: '2026-05-02',
    lat: 7.97,
    lng: 124.265,
  },

  // GENERAL / OTHERS
  {
    id: 25,
    commonName: 'Other Species',
    scientificName: 'Mixed Catch',
    type: 'general',
    status: 'Not Evaluated',
    statusShort: 'NE',
    length: '-',
    weight: '20 kg',
    location: 'Open Pelagic Zone',
    date: '2026-07-12',
    lat: 7.92,
    lng: 124.22,
    depth: '15 m',
    number: '150',
    size: 'Small',
  },
  {
    id: 26,
    commonName: 'Other Species',
    scientificName: 'Mixed Catch',
    type: 'general',
    status: 'Not Evaluated',
    statusShort: 'NE',
    length: '-',
    weight: '5 kg',
    location: 'Littoral Zone (South)',
    date: '2026-07-05',
    lat: 7.815,
    lng: 124.19,
    depth: '2 m',
    number: '30',
    size: 'Medium',
  },
  {
    id: 27,
    commonName: 'Other Species',
    scientificName: 'Mixed Catch',
    type: 'general',
    status: 'Not Evaluated',
    statusShort: 'NE',
    length: '-',
    weight: '12 kg',
    location: 'Eastern Shoreline',
    date: '2026-06-20',
    lat: 7.89,
    lng: 124.27,
    depth: '5 m',
    number: '80',
    size: 'Mixed',
  },
  {
    id: 28,
    commonName: 'Other Species',
    scientificName: 'Mixed Catch',
    type: 'general',
    status: 'Not Evaluated',
    statusShort: 'NE',
    length: '-',
    weight: '8 kg',
    location: 'Northwestern Inlet',
    date: '2026-05-30',
    lat: 7.98,
    lng: 124.225,
    depth: '3 m',
    number: '45',
    size: 'Large',
  },
  {
    id: 29,
    commonName: 'Other Species',
    scientificName: 'Mixed Catch',
    type: 'general',
    status: 'Not Evaluated',
    statusShort: 'NE',
    length: '-',
    weight: '25 kg',
    location: 'Central Basin (Deep)',
    date: '2026-07-15',
    lat: 7.87,
    lng: 124.21,
    depth: '25 m',
    number: '200',
    size: 'Small',
  },
  {
    id: 30,
    commonName: 'Other Species',
    scientificName: 'Mixed Catch',
    type: 'general',
    status: 'Not Evaluated',
    statusShort: 'NE',
    length: '-',
    weight: '3.5 kg',
    location: 'Ramain Tributary',
    date: '2026-04-18',
    lat: 7.95,
    lng: 124.28,
    depth: '1.5 m',
    number: '20',
    size: 'Medium',
  },
];

const selectedSpeciesFilter = ref<string[]>([]);
const allSpeciesNames = species.map((s) => s.commonName);
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
    speciesOptionsFiltered.value = allSpeciesNames.filter(
      (v) => v.toLowerCase().indexOf(needle) > -1,
    );
  });
}

const fishFilters = [
  { value: 'all', label: 'All', icon: 'filter_list', activeColor: 'teal-7' },
  { value: 'endemic', label: 'Endemic', icon: 'crisis_alert', activeColor: 'blue-7' },
  { value: 'invasive', label: 'Invasive', icon: 'warning', activeColor: 'red-7' },
  { value: 'general', label: 'General', icon: 'blender', activeColor: 'orange-7' },
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

const selectedFishDetails = computed(() => {
  if (!selectedFish.value) return [];
  const f = selectedFish.value;
  if (f.type === 'general') {
    return [
      { label: 'Depth', value: f.depth || '-', icon: 'waves' },
      { label: 'Weight', value: f.weight, icon: 'scale' },
      { label: 'Number', value: f.number || '-', icon: 'tag' },
      { label: 'Size', value: f.size || '-', icon: 'straighten' },
      { label: 'Location', value: f.location, icon: 'place' },
      { label: 'Date', value: f.date, icon: 'calendar_today' },
    ];
  }
  return [
    { label: 'True Length (TL)', value: f.length, icon: 'straighten' },
    { label: 'Body Depth (BD)', value: f.bodyDepth || '-', icon: 'height' },
    { label: 'Weight (W)', value: f.weight, icon: 'scale' },
    { label: 'Photos', value: f.photos || 'None', icon: 'photo_camera' },
    { label: 'Municipal', value: f.municipal || '-', icon: 'location_city' },
    { label: 'Barangay', value: f.barangay || '-', icon: 'holiday_village' },
    { label: 'Date Recorded', value: f.date, icon: 'calendar_today' },
  ];
});

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
// Combines the 24 lake sites with the 6 fixed tributary rivers so both are
// searchable/selectable together, same as the user asked.
const allWaterAndRiverSites = computed<WaterQualitySite[]>(() => [
  ...waterQualitySites.value,
  ...TRIBUTARY_RIVER_SITES.map((r) => ({
    siteId: r.siteId,
    stationId: 'Tributary River',
    lat: r.lat,
    lng: r.lng,
  })),
]);

const selectedSiteFilter = ref<string[]>([]);
const allSiteIds = computed(() => allWaterAndRiverSites.value.map((s) => s.siteId));
const siteOptionsFiltered = ref<string[]>([]);

watch(
  allWaterAndRiverSites,
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
  allWaterAndRiverSites.value.filter(
    (site) =>
      selectedSiteFilter.value.length === 0 || selectedSiteFilter.value.includes(site.siteId),
  ),
);

// SITE_ID -> depth zone label, filled in as the Above/Below/Tributary GeoJSON files load.
const siteDepthZone = new Map<string, string>();

const selectedWaterZone = computed(() =>
  selectedWaterSite.value ? siteDepthZone.get(selectedWaterSite.value.siteId) : undefined,
);

// Reserved status palette — never reused for categorical series, always paired
// with an icon/label (never color alone).
type StatusLevel = 'good' | 'warning' | 'serious' | 'critical';

const STATUS_COLORS: Record<StatusLevel, string> = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};
const STATUS_LABELS: Record<StatusLevel, string> = {
  good: 'Good',
  warning: 'Warning',
  serious: 'Serious',
  critical: 'Critical',
};
const STATUS_LEVELS: StatusLevel[] = ['good', 'warning', 'serious', 'critical'];

// For parameters where higher = worse (pollutant/nutrient loading).
function ascendingStatus(
  value: number,
  goodMax: number,
  warningMax: number,
  seriousMax: number,
): StatusLevel {
  if (value <= goodMax) return 'good';
  if (value <= warningMax) return 'warning';
  if (value <= seriousMax) return 'serious';
  return 'critical';
}

// For parameters with an ideal middle band (both extremes are bad).
function centeredStatus(
  value: number,
  goodLo: number,
  goodHi: number,
  warningLo: number,
  warningHi: number,
  seriousLo: number,
  seriousHi: number,
): StatusLevel {
  if (value >= goodLo && value <= goodHi) return 'good';
  if (value >= warningLo && value <= warningHi) return 'warning';
  if (value >= seriousLo && value <= seriousHi) return 'serious';
  return 'critical';
}

// For parameters where lower = worse (depletion is the danger — e.g. dissolved oxygen).
function descendingStatus(
  value: number,
  goodMin: number,
  warningMin: number,
  seriousMin: number,
): StatusLevel {
  if (value >= goodMin) return 'good';
  if (value >= warningMin) return 'warning';
  if (value >= seriousMin) return 'serious';
  return 'critical';
}

interface WaterQualityParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  decimals: number;
  getStatus: (value: number) => StatusLevel;
}

const waterQualityParameterGroups: {
  title: string;
  icon: string;
  color: string;
  params: WaterQualityParam[];
}[] = [
  {
    title: 'Physico-Chemical',
    icon: 'science',
    color: 'teal-8',
    params: [
      {
        key: 'temperature',
        label: 'Temperature',
        unit: '°C',
        min: 24,
        max: 30,
        decimals: 1,
        getStatus: (v) => centeredStatus(v, 25.5, 27.5, 24.5, 28.5, 24, 29.5),
      },
      {
        key: 'ph',
        label: 'pH',
        unit: '',
        min: 6.5,
        max: 8.5,
        decimals: 1,
        getStatus: (v) => centeredStatus(v, 7.0, 7.6, 6.8, 7.9, 6.6, 8.2),
      },
      {
        key: 'turbidity',
        label: 'Turbidity',
        unit: 'NTU',
        min: 2,
        max: 25,
        decimals: 1,
        getStatus: (v) => ascendingStatus(v, 6, 11, 17),
      },
      {
        key: 'dissolvedOxygen',
        label: 'Dissolved Oxygen',
        unit: 'ppm',
        min: 1,
        max: 10,
        decimals: 1,
        getStatus: (v) => descendingStatus(v, 6, 5, 3),
      },
      {
        key: 'conductivity',
        label: 'Conductivity',
        unit: 'µS/cm',
        min: 100,
        max: 400,
        decimals: 0,
        getStatus: (v) => ascendingStatus(v, 175, 250, 325),
      },
      {
        key: 'tds',
        label: 'TDS',
        unit: 'mg/L',
        min: 50,
        max: 250,
        decimals: 0,
        getStatus: (v) => ascendingStatus(v, 100, 150, 200),
      },
      {
        key: 'tss',
        label: 'TSS',
        unit: 'mg/L',
        min: 5,
        max: 40,
        decimals: 1,
        getStatus: (v) => ascendingStatus(v, 12, 20, 30),
      },
    ],
  },
  {
    title: 'Nutrients',
    icon: 'grain',
    color: 'blue-8',
    params: [
      {
        key: 'phosphate',
        label: 'Phosphate',
        unit: 'mg/L',
        min: 0.01,
        max: 0.5,
        decimals: 2,
        getStatus: (v) => ascendingStatus(v, 0.08, 0.18, 0.32),
      },
      {
        key: 'ammonia',
        label: 'Ammonia',
        unit: 'mg/L',
        min: 0.01,
        max: 0.3,
        decimals: 2,
        getStatus: (v) => ascendingStatus(v, 0.04, 0.1, 0.18),
      },
      {
        key: 'nitrate',
        label: 'Nitrate',
        unit: 'mg/L',
        min: 0.1,
        max: 2,
        decimals: 2,
        getStatus: (v) => ascendingStatus(v, 0.4, 0.9, 1.4),
      },
      {
        key: 'nitrite',
        label: 'Nitrite',
        unit: 'mg/L',
        min: 0.01,
        max: 0.1,
        decimals: 3,
        getStatus: (v) => ascendingStatus(v, 0.025, 0.045, 0.07),
      },
      {
        key: 'sulfate',
        label: 'Sulfate',
        unit: 'mg/L',
        min: 5,
        max: 50,
        decimals: 1,
        getStatus: (v) => ascendingStatus(v, 15, 27, 38),
      },
    ],
  },
  {
    title: 'Photosynthetic Pigment',
    icon: 'eco',
    color: 'green-8',
    params: [
      {
        key: 'chlorophyll',
        label: 'Chlorophyll-a',
        unit: 'µg/L',
        min: 1,
        max: 15,
        decimals: 2,
        getStatus: (v) => ascendingStatus(v, 4, 8, 11),
      },
    ],
  },
];

// ── Monthly Time Slider (simulated readings — no real monthly dataset exists yet) ──
const months = [
  'Jan 2025',
  'Feb 2025',
  'Mar 2025',
  'Apr 2025',
  'May 2025',
  'Jun 2025',
  'Jul 2025',
  'Aug 2025',
  'Sep 2025',
  'Oct 2025',
  'Nov 2025',
  'Dec 2025',
  'Jan 2026',
];
const selectedMonthIndex = ref(months.length - 1);
const selectedMonthLabel = computed(() => months[selectedMonthIndex.value]);

// Deterministic pseudo-random in [0, 1), seeded by string so the same
// site + month + parameter always yields the same simulated reading.
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

// ─── DEPTH MODEL (mirrors src/composables/useWaterQualityModel.ts) ───
// The client's real field sampling uses these fixed depths, not a continuous
// profile — matches the "SURFACE / 5m / 10m / .../ 100m" convention in the
// actual data template.
const DEPTHS = [0, 5, 10, 15, 20, 40, 60, 80, 100];
function depthLabel(depthM: number): string {
  return depthM === 0 ? 'Surface' : `${depthM}m`;
}
const DEPTH_OPTIONS = DEPTHS.map((d) => ({ label: depthLabel(d), value: d }));
const selectedDepthM = ref(0);

// Direction + how much of a parameter's full min–max range it plausibly
// drifts between the surface and deep water, based on typical lake
// stratification behavior.
const DEPTH_TREND: Record<string, { direction: 1 | -1; sensitivity: number }> = {
  temperature: { direction: -1, sensitivity: 0.55 },
  ph: { direction: -1, sensitivity: 0.15 },
  turbidity: { direction: -1, sensitivity: 0.35 },
  dissolvedOxygen: { direction: -1, sensitivity: 0.75 },
  conductivity: { direction: 1, sensitivity: 0.25 },
  tds: { direction: 1, sensitivity: 0.25 },
  tss: { direction: 1, sensitivity: 0.2 },
  phosphate: { direction: 1, sensitivity: 0.6 },
  ammonia: { direction: 1, sensitivity: 0.65 },
  nitrate: { direction: -1, sensitivity: 0.4 },
  nitrite: { direction: 1, sensitivity: 0.3 },
  sulfate: { direction: 1, sensitivity: 0.2 },
  chlorophyll: { direction: -1, sensitivity: 0.8 },
};

function applyDepthEffect(
  surfaceValue: number,
  depthM: number,
  param: WaterQualityParam,
  siteId: string,
): number {
  if (depthM <= 0) return surfaceValue;
  const trend = DEPTH_TREND[param.key];
  if (!trend) return surfaceValue;
  const thermoclineDepth = 8 + seededRandom(`${siteId}|thermocline`) * 8; // 8–16m
  const curve = 1 / (1 + Math.exp(-(depthM - thermoclineDepth) / 6));
  const range = param.max - param.min;
  const shift = trend.direction * trend.sensitivity * range * curve;
  const jitter = (seededRandom(`${siteId}|${depthM}|${param.key}|jitter`) * 2 - 1) * range * 0.03;
  return surfaceValue + shift + jitter;
}

function generateReading(
  siteId: string,
  monthIndex: number,
  param: WaterQualityParam,
  depthM = 0,
): number {
  const r = seededRandom(`${siteId}|${monthIndex}|${param.key}`);
  const surfaceValue = param.min + r * (param.max - param.min);
  const value = applyDepthEffect(surfaceValue, depthM, param, siteId);
  return Math.min(Math.max(value, param.min), param.max);
}

function formatReading(value: number, param: WaterQualityParam): string {
  return `${value.toFixed(param.decimals)}${param.unit ? ' ' + param.unit : ''}`;
}

function mockReading(siteId: string, monthIndex: number, param: WaterQualityParam, depthM = 0): string {
  return formatReading(generateReading(siteId, monthIndex, param, depthM), param);
}

// ── Color-by-parameter map overlay (dropdown in the Water tab) ──
const allWaterParams = computed(() => waterQualityParameterGroups.flatMap((g) => g.params));
const colorParamOptions = computed(() => [
  { label: 'None (default colors)', value: null as string | null },
  ...allWaterParams.value.map((p) => ({
    label: p.unit ? `${p.label} (${p.unit})` : p.label,
    value: p.key as string | null,
  })),
]);
const selectedColorParamKey = ref<string | null>(null);
const selectedColorParam = computed(
  () => allWaterParams.value.find((p) => p.key === selectedColorParamKey.value) ?? null,
);

// Coverage heatmap for the selected parameter — off by default, only usable
// once a parameter is picked (see the "PARAMETER HEATMAP" section below).
const showHeatmap = ref(false);

// River sites are always Surface-only, regardless of the map's selected depth.
function effectiveDepthFor(siteId: string): number {
  return TRIBUTARY_RIVER_SITE_IDS.has(siteId) ? 0 : selectedDepthM.value;
}

function isRiverSite(siteId: string): boolean {
  return TRIBUTARY_RIVER_SITE_IDS.has(siteId);
}

function siteStatusBadge(siteId: string): { label: string; background: string } {
  const param = selectedColorParam.value;
  if (!param) return { label: 'No data yet', background: '#9e9e9e' };
  const value = generateReading(siteId, selectedMonthIndex.value, param, effectiveDepthFor(siteId));
  const status = param.getStatus(value);
  return {
    label: `${formatReading(value, param)} · ${STATUS_LABELS[status]}`,
    background: STATUS_COLORS[status],
  };
}

function getMarkerColor(siteId: string, defaultColor: string): string {
  const param = selectedColorParam.value;
  if (!param) return defaultColor;
  const value = generateReading(siteId, selectedMonthIndex.value, param, effectiveDepthFor(siteId));
  return STATUS_COLORS[param.getStatus(value)];
}

function recolorWaterLayers() {
  for (const entry of waterSiteMarkerEntries) {
    const color = getMarkerColor(entry.siteId, entry.defaultColor);
    entry.marker.setIcon(makeWaterPinIcon(color));
  }
  for (const entry of riverSiteMarkerEntries) {
    const color = getMarkerColor(entry.siteId, RIVER_PIN_COLOR);
    entry.marker.setIcon(makeRiverPinIcon(color));
  }
}

watch([selectedColorParam, selectedMonthIndex, selectedDepthM, showHeatmap], () => {
  recolorWaterLayers();
  renderHeatmapOverlay();
});

function waterQualityTooltipHtml(props: WaterQualitySiteProps): string {
  const zone = siteDepthZone.get(props.SITE_ID);
  const param = selectedColorParam.value;
  let paramLine = '';
  if (param) {
    const value = generateReading(props.SITE_ID, selectedMonthIndex.value, param, selectedDepthM.value);
    const status = param.getStatus(value);
    paramLine = `<br><span style="color:${STATUS_COLORS[status]}; font-weight:bold;">${param.label} @ ${depthLabel(selectedDepthM.value)}: ${formatReading(value, param)} (${STATUS_LABELS[status]})</span>`;
  }
  return `
    <div style="font-family: Roboto, sans-serif; min-width: 170px;">
      <strong style="color:#0288D1;">${props.SITE_ID}</strong><br>
      <span style="color:#666;">Station: ${props.STATION_ID}</span><br>
      <span style="color:#666;">Coordinates: ${props.LATITUDE.toFixed(5)}, ${props.LONGITUDE.toFixed(5)}</span>
      ${zone ? `<br><span style="color:#666;">Depth Zone: ${zone}</span>` : ''}
      ${paramLine}
    </div>
  `;
}

function createWaterQualitySiteLayer(
  geojson: GeoJSON.GeoJsonObject,
  defaultColor: string,
): L.GeoJSON {
  return L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      const siteId = (feature.properties as WaterQualitySiteProps).SITE_ID;
      const color = getMarkerColor(siteId, defaultColor);
      const marker = L.marker(latlng, { icon: makeWaterPinIcon(color) });
      waterSiteMarkerEntries.push({ siteId, defaultColor, marker });
      return marker;
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties as WaterQualitySiteProps;
      layer.bindTooltip(() => waterQualityTooltipHtml(props), {
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

// ═══ CLICK ANYWHERE INSIDE THE LAKE (single parameter at a time, from the dropdown/slider) ═══
function pointInRing(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const latI = ring[i]![0];
    const lngI = ring[i]![1];
    const latJ = ring[j]![0];
    const lngJ = ring[j]![1];
    const intersects =
      lngI > lng !== lngJ > lng && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Even-odd rule across all rings, so holes (if any) are respected.
function pointInPolygon(lat: number, lng: number, rings: [number, number][][]): boolean {
  let inside = false;
  for (const ring of rings) {
    if (pointInRing(lat, lng, ring)) inside = !inside;
  }
  return inside;
}

function extractPolygonRings(geojson: GeoJSON.FeatureCollection): [number, number][][] {
  const rings: [number, number][][] = [];
  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach((ring) => {
        rings.push(ring.map(([lng, lat]) => [lat, lng] as [number, number]));
      });
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          rings.push(ring.map(([lng, lat]) => [lat, lng] as [number, number]));
        });
      });
    }
  });
  return rings;
}

// Inverse-distance-weighted estimate of a parameter's value at any clicked
// point, from the real sampling sites' simulated readings — at the currently
// selected sampling depth, same as everywhere else on the map.
function interpolateValueAt(
  lat: number,
  lng: number,
  param: WaterQualityParam,
  monthIndex: number,
  depthM: number,
): number {
  const sites = waterQualitySites.value;
  if (sites.length === 0) return (param.min + param.max) / 2;
  let weightedSum = 0;
  let weightTotal = 0;
  for (const site of sites) {
    const dLat = site.lat - lat;
    const dLng = site.lng - lng;
    const weight = 1 / (dLat * dLat + dLng * dLng + 0.0001);
    weightedSum += generateReading(site.siteId, monthIndex, param, depthM) * weight;
    weightTotal += weight;
  }
  return weightedSum / weightTotal;
}

// ── Click anywhere inside the lake boundary to view an estimated reading ──
interface ParameterModalData {
  paramLabel: string;
  valueText: string;
  statusLabel: string;
  color: string;
  lat: number;
  lng: number;
  depthLabel: string;
}

const showParameterModal = ref(false);
const parameterModalData = ref<ParameterModalData | null>(null);

function handleMapClick(e: L.LeafletMouseEvent) {
  if (lakePolygonRings.length === 0) return;
  const { lat, lng } = e.latlng;
  if (!pointInPolygon(lat, lng, lakePolygonRings)) return;

  const param = selectedColorParam.value;
  if (!param) {
    $q.notify({
      type: 'warning',
      message: 'Select a water quality parameter first (Water tab → Color Sites By Parameter).',
      position: 'top',
    });
    return;
  }

  const value = interpolateValueAt(lat, lng, param, selectedMonthIndex.value, selectedDepthM.value);
  const status = param.getStatus(value);
  parameterModalData.value = {
    paramLabel: param.label,
    valueText: formatReading(value, param),
    statusLabel: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
    lat,
    lng,
    depthLabel: depthLabel(selectedDepthM.value),
  };
  showParameterModal.value = true;
}

// ═══ PARAMETER HEATMAP (visualizes estimated status + coverage gaps) ═══
// Same IDW model as the click-anywhere reading above, rendered as a colored
// overlay across the whole lake. Color = estimated status at that point;
// opacity fades out with distance from the nearest real sampling site, so
// stretches of open water far from any site read as blank/transparent
// (a coverage gap) instead of a falsely confident color.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function computeRingsBounds(
  rings: [number, number][][],
): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const ring of rings) {
    for (const [lat, lng] of ring) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }
  if (!isFinite(minLat) || !isFinite(minLng)) return null;
  return { minLat, maxLat, minLng, maxLng };
}

// How far (in km) the heatmap's color fades out around each sampling site —
// derived from the sites' own average nearest-neighbor spacing, so it auto-
// adapts if sites are added/removed rather than relying on a guessed constant.
const heatmapFadeRadiusKm = computed(() => {
  const sites = waterQualitySites.value;
  if (sites.length < 2) return 3;
  let total = 0;
  for (const site of sites) {
    let nearest = Infinity;
    for (const other of sites) {
      if (other === site) continue;
      const d = haversineKm(site.lat, site.lng, other.lat, other.lng);
      if (d < nearest) nearest = d;
    }
    total += nearest;
  }
  return (total / sites.length) * 1.4;
});

function renderHeatmapOverlay() {
  if (!map) return;

  if (heatmapOverlay) {
    map.removeLayer(heatmapOverlay);
    heatmapOverlay = null;
  }

  const param = selectedColorParam.value;
  if (
    !showHeatmap.value ||
    !param ||
    lakePolygonRings.length === 0 ||
    waterQualitySites.value.length === 0
  ) {
    return;
  }

  const bounds = computeRingsBounds(lakePolygonRings);
  if (!bounds) return;
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  if (latSpan <= 0 || lngSpan <= 0) return;

  // Longitude degrees are narrower than latitude degrees away from the
  // equator — correct for that so the raster grid isn't stretched.
  const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const lngCorrection = Math.max(Math.cos(midLatRad), 0.1);
  const correctedLngSpan = lngSpan * lngCorrection;
  const RES = 160;
  let width: number;
  let height: number;
  if (correctedLngSpan >= latSpan) {
    width = RES;
    height = Math.max(40, Math.round((RES * latSpan) / correctedLngSpan));
  } else {
    height = RES;
    width = Math.max(40, Math.round((RES * correctedLngSpan) / latSpan));
  }

  // Raster the raw status color + coverage opacity across the full bounding
  // box first...
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = width;
  rawCanvas.height = height;
  const rawCtx = rawCanvas.getContext('2d');
  if (!rawCtx) return;
  const imageData = rawCtx.createImageData(width, height);
  const data = imageData.data;

  const monthIndex = selectedMonthIndex.value;
  const depthM = selectedDepthM.value;
  // Standard deviation of each site's coverage contribution — derived from
  // the fade radius (itself derived from real site spacing above).
  const sigmaKm = heatmapFadeRadiusKm.value * 0.55;
  const sites = waterQualitySites.value;

  for (let py = 0; py < height; py++) {
    const lat = maxLat - (py / height) * latSpan;
    for (let px = 0; px < width; px++) {
      const lng = minLng + (px / width) * lngSpan;

      // Sum of each site's Gaussian contribution, rather than "distance to
      // the single nearest site" — a nearest-site model has a kink exactly
      // where the nearest site switches from one to another, which shows up
      // as a visible seam between neighboring sites. A sum of smooth
      // (Gaussian) contributions has no such seam anywhere.
      let coverage = 0;
      for (const site of sites) {
        const d = haversineKm(lat, lng, site.lat, site.lng);
        coverage += Math.exp(-(d * d) / (2 * sigmaKm * sigmaKm));
      }
      coverage = Math.min(coverage, 1);
      if (coverage <= 0.02) continue; // leave fully transparent — a coverage gap

      const value = interpolateValueAt(lat, lng, param, monthIndex, depthM);
      const status = param.getStatus(value);
      const hex = STATUS_COLORS[status];
      const idx = (py * width + px) * 4;
      data[idx] = parseInt(hex.slice(1, 3), 16);
      data[idx + 1] = parseInt(hex.slice(3, 5), 16);
      data[idx + 2] = parseInt(hex.slice(5, 7), 16);
      data[idx + 3] = Math.round(coverage * 0.75 * 255);
    }
  }
  rawCtx.putImageData(imageData, 0, 0);

  // ...then composite it through a clip mask shaped like the actual lake
  // boundary (putImageData ignores canvas clip paths, so this has to be a
  // second pass) so only the water gets painted, not the surrounding land.
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = height;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return;
  finalCtx.beginPath();
  for (const ring of lakePolygonRings) {
    ring.forEach(([lat, lng], i) => {
      const x = ((lng - minLng) / lngSpan) * width;
      const y = ((maxLat - lat) / latSpan) * height;
      if (i === 0) finalCtx.moveTo(x, y);
      else finalCtx.lineTo(x, y);
    });
    finalCtx.closePath();
  }
  finalCtx.clip('evenodd');
  // Soften the raster's remaining hard edges (status-color band transitions,
  // grid-resolution jaggedness) into a smooth blend.
  finalCtx.filter = 'blur(3px)';
  finalCtx.drawImage(rawCanvas, 0, 0);

  heatmapOverlay = L.imageOverlay(
    finalCanvas.toDataURL('image/png'),
    [
      [minLat, minLng],
      [maxLat, maxLng],
    ],
    { interactive: false, className: 'heatmap-overlay-img' },
  );
  heatmapOverlay.addTo(map);
}

// ═══ BATHYMETRY CONTOURS ═══
// No real depth survey exists for this project, so depth is modeled as a
// function of distance-to-shore, saturating toward a plausible max depth —
// giving a single-basin "bowl" shape with nested contour rings. Two toggle
// layers share the same underlying contour lines: one plain, one filled.
const CONTOUR_LEVELS = [20, 40, 60, 80, 100];
const CONTOUR_LINE_COLOR = '#E65100';
const CONTOUR_BAND_COLORS = ['#FFE0B2', '#FFB74D', '#FB8C00', '#E65100', '#BF360C'];
const CONTOUR_MAX_DEPTH_M = 110;

// Douglas-Peucker simplification — the real coastline has thousands of
// vertices, far more detail than a smooth depth field needs, and the
// per-grid-point distance-to-shore scan below is O(vertices) per point.
function simplifyRing(points: [number, number][], toleranceDeg: number): [number, number][] {
  if (points.length < 3) return points.slice();
  let maxDist = 0;
  let index = 0;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i]!, first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > toleranceDeg) {
    const left = simplifyRing(points.slice(0, index + 1), toleranceDeg);
    const right = simplifyRing(points.slice(index), toleranceDeg);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function perpendicularDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distanceToSegmentM(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

interface DepthGrid {
  width: number;
  height: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  values: Float32Array; // meters of depth, 0 outside the lake
}

let cachedDepthGrid: DepthGrid | null = null;

function buildDepthGrid(): DepthGrid | null {
  if (cachedDepthGrid) return cachedDepthGrid;
  if (lakePolygonRings.length === 0) return null;

  const bounds = computeRingsBounds(lakePolygonRings);
  if (!bounds) return null;
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  if (latSpan <= 0 || lngSpan <= 0) return null;

  const simplifiedRings = lakePolygonRings.map((ring) => simplifyRing(ring, 0.0008));

  const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const lngCorrection = Math.max(Math.cos(midLatRad), 0.1);
  const EARTH_R = 6371000;
  const toXY = (lat: number, lng: number): [number, number] => [
    lng * (Math.PI / 180) * EARTH_R * lngCorrection,
    lat * (Math.PI / 180) * EARTH_R,
  ];
  const simplifiedRingsXY = simplifiedRings.map((ring) => ring.map(([lat, lng]) => toXY(lat, lng)));

  const correctedLngSpan = lngSpan * lngCorrection;
  const RES = 220;
  let width: number;
  let height: number;
  if (correctedLngSpan >= latSpan) {
    width = RES;
    height = Math.max(40, Math.round((RES * latSpan) / correctedLngSpan));
  } else {
    height = RES;
    width = Math.max(40, Math.round((RES * correctedLngSpan) / latSpan));
  }

  function distanceToShoreM(px: number, py: number): number {
    let min = Infinity;
    for (const ring of simplifiedRingsXY) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [ax, ay] = ring[j]!;
        const [bx, by] = ring[i]!;
        const d = distanceToSegmentM(px, py, ax, ay, bx, by);
        if (d < min) min = d;
      }
    }
    return min;
  }

  const values = new Float32Array(width * height);
  const distances = new Float32Array(width * height);
  let maxDistM = 0;
  for (let row = 0; row < height; row++) {
    const lat = maxLat - (row / (height - 1)) * latSpan;
    for (let col = 0; col < width; col++) {
      const lng = minLng + (col / (width - 1)) * lngSpan;
      const idx = row * width + col;
      if (!pointInPolygon(lat, lng, simplifiedRings)) {
        distances[idx] = -1;
        continue;
      }
      const [px, py] = toXY(lat, lng);
      const d = distanceToShoreM(px, py);
      distances[idx] = d;
      if (d > maxDistM) maxDistM = d;
    }
  }

  const scaleM = maxDistM / 3.5;
  for (let i = 0; i < distances.length; i++) {
    const d = distances[i]!;
    values[i] = d < 0 ? 0 : CONTOUR_MAX_DEPTH_M * (1 - Math.exp(-d / scaleM));
  }

  cachedDepthGrid = { width, height, minLat, maxLat, minLng, maxLng, values };
  return cachedDepthGrid;
}

// Marching squares — extracts line segments where the depth field crosses a
// given contour level. Segments aren't stitched into continuous rings; each
// is rendered as its own 2-point line, which reads fine at map scale.
function marchContourLevel(grid: DepthGrid, level: number): [number, number][][] {
  const { width, height, values, minLat, maxLat, minLng, maxLng } = grid;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const latAt = (row: number) => maxLat - (row / (height - 1)) * latSpan;
  const lngAt = (col: number) => minLng + (col / (width - 1)) * lngSpan;
  const interp = (v0: number, v1: number) => (v0 === v1 ? 0.5 : (level - v0) / (v1 - v0));

  const segments: [number, number][][] = [];
  for (let row = 0; row < height - 1; row++) {
    const topLat = latAt(row);
    const botLat = latAt(row + 1);
    for (let col = 0; col < width - 1; col++) {
      const tl = values[row * width + col]!;
      const tr = values[row * width + col + 1]!;
      const bl = values[(row + 1) * width + col]!;
      const br = values[(row + 1) * width + col + 1]!;
      let idx = 0;
      if (tl > level) idx |= 8;
      if (tr > level) idx |= 4;
      if (br > level) idx |= 2;
      if (bl > level) idx |= 1;
      if (idx === 0 || idx === 15) continue;

      const leftLng = lngAt(col);
      const rightLng = lngAt(col + 1);
      const top: [number, number] = [topLat, leftLng + interp(tl, tr) * (rightLng - leftLng)];
      const bottom: [number, number] = [botLat, leftLng + interp(bl, br) * (rightLng - leftLng)];
      const left: [number, number] = [topLat + interp(tl, bl) * (botLat - topLat), leftLng];
      const right: [number, number] = [topLat + interp(tr, br) * (botLat - topLat), rightLng];

      switch (idx) {
        case 1:
        case 14:
          segments.push([left, bottom]);
          break;
        case 2:
        case 13:
          segments.push([bottom, right]);
          break;
        case 3:
        case 12:
          segments.push([left, right]);
          break;
        case 4:
        case 11:
          segments.push([top, right]);
          break;
        case 6:
        case 9:
          segments.push([top, bottom]);
          break;
        case 7:
        case 8:
          segments.push([top, left]);
          break;
        case 5:
          segments.push([top, left], [bottom, right]);
          break;
        case 10:
          segments.push([top, right], [left, bottom]);
          break;
      }
    }
  }
  return segments;
}

// Builds both toggleable contour layers once (cheap to leave built even when
// hidden — toggling them just adds/removes the pre-built layer group).
function buildContourLayers() {
  if (!map || contourLinesLayerGroup) return;
  const grid = buildDepthGrid();
  if (!grid) return;

  contourLinesLayerGroup = L.layerGroup();
  contourFilledLayerGroup = L.layerGroup();

  // ── Filled color bands, rasterized straight from the depth grid, then
  // clipped to the real coastline (putImageData ignores canvas clip paths,
  // so — same as the parameter heatmap above — this needs a second pass). ──
  const { width, height, minLat, maxLat, minLng, maxLng, values } = grid;
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = width;
  rawCanvas.height = height;
  const rawCtx = rawCanvas.getContext('2d');
  if (rawCtx) {
    const imageData = rawCtx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < values.length; i++) {
      const d = values[i]!;
      if (d <= 0) continue;
      let hex: string;
      if (d < 20) hex = CONTOUR_BAND_COLORS[0]!;
      else if (d < 40) hex = CONTOUR_BAND_COLORS[1]!;
      else if (d < 60) hex = CONTOUR_BAND_COLORS[2]!;
      else if (d < 80) hex = CONTOUR_BAND_COLORS[3]!;
      else hex = CONTOUR_BAND_COLORS[4]!;
      const idx = i * 4;
      data[idx] = parseInt(hex.slice(1, 3), 16);
      data[idx + 1] = parseInt(hex.slice(3, 5), 16);
      data[idx + 2] = parseInt(hex.slice(5, 7), 16);
      data[idx + 3] = Math.round(0.65 * 255);
    }
    rawCtx.putImageData(imageData, 0, 0);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      const latSpan = maxLat - minLat;
      const lngSpan = maxLng - minLng;
      finalCtx.beginPath();
      for (const ring of lakePolygonRings) {
        ring.forEach(([lat, lng], i) => {
          const x = ((lng - minLng) / lngSpan) * width;
          const y = ((maxLat - lat) / latSpan) * height;
          if (i === 0) finalCtx.moveTo(x, y);
          else finalCtx.lineTo(x, y);
        });
        finalCtx.closePath();
      }
      finalCtx.clip('evenodd');
      finalCtx.drawImage(rawCanvas, 0, 0);

      const filledOverlay = L.imageOverlay(
        finalCanvas.toDataURL('image/png'),
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { interactive: false, className: 'contour-filled-img' },
      );
      contourFilledLayerGroup.addLayer(filledOverlay);
    }
  }

  // ── Contour lines, shared by both layers — plain orange for the line-only
  // layer, redrawn in a lighter tone on top of the fill for definition. ──
  CONTOUR_LEVELS.forEach((level, i) => {
    const segments = marchContourLevel(grid, level);
    if (segments.length === 0) return;
    const weight = 1.2 + i * 0.35;

    const plainLine = L.polyline(segments, {
      color: CONTOUR_LINE_COLOR,
      weight,
      opacity: 0.85,
      interactive: false,
    });
    plainLine.bindTooltip(`${level}m depth contour`, { sticky: true });
    contourLinesLayerGroup!.addLayer(plainLine);

    const overlayLine = L.polyline(segments, {
      color: '#FFF3E0',
      weight: Math.max(1, weight - 0.6),
      opacity: 0.55,
      interactive: false,
    });
    contourFilledLayerGroup!.addLayer(overlayLine);
  });
}

// ═══ MAP LAYERS ═══
// ═══ BASE MAP (switchable tile provider) ═══
interface BaseLayerOption {
  id: string;
  name: string;
  icon: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

const baseLayerOptions: BaseLayerOption[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    icon: 'map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'google-streets',
    name: 'Google Maps',
    icon: 'map',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  {
    id: 'google-earth',
    name: 'Google Earth',
    icon: 'satellite_alt',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Earth',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
];

const selectedBaseLayer = ref<string>('osm');

function setBaseLayer(id: string) {
  if (!map) return;
  const option = baseLayerOptions.find((o) => o.id === id);
  if (!option) return;

  if (currentBaseTileLayer) {
    map.removeLayer(currentBaseTileLayer);
  }
  currentBaseTileLayer = L.tileLayer(option.url, {
    attribution: option.attribution,
    maxZoom: option.maxZoom,
    ...(option.subdomains ? { subdomains: option.subdomains } : {}),
  });
  currentBaseTileLayer.addTo(map);
  currentBaseTileLayer.bringToBack();
}

watch(selectedBaseLayer, (id) => setBaseLayer(id));

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
  {
    id: 'contourLines',
    name: 'Bathymetry Contours (Lines)',
    description: 'Modeled depth contours — 20/40/60/80/100m, lines only',
    active: false,
  },
  {
    id: 'contourFilled',
    name: 'Bathymetry Contours (Filled)',
    description: 'Modeled depth contours — filled color bands + lines',
    active: false,
  },
]);

// Layers shown in the "Layers" tab (kept separate from the Water tab's own layer controls).
const exceptionLayerIds = ['fish', 'lakeBoundary', 'wqAll', 'contourLines', 'contourFilled'];
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

// ═══ MAP INITIALIZATION ═══
const LAKE_LANAO_CENTER: [number, number] = [7.893111, 124.272778];
const DEFAULT_ZOOM = 12;

// Jumps the map back to Lake Lanao — an easy way back after panning/zooming away.
function resetMapView() {
  map?.flyTo(LAKE_LANAO_CENTER, DEFAULT_ZOOM, { duration: 1 });
}

function initMap() {
  if (!mapContainer.value || map) return;

  map = L.map(mapContainer.value, {
    center: LAKE_LANAO_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: false,
  });

  // Base map tiles — switchable via the Layers tab (OpenStreetMap / Google Maps / Google Earth)
  setBaseLayer(selectedBaseLayer.value);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Lets users click anywhere inside the lake to view an estimated reading for
  // the selected parameter (non-interactive layers, like the boundary outline
  // below, don't intercept this).
  map.on('click', handleMapClick);

  // ── Create Fish Layer Group ──
  fishLayerGroup = L.layerGroup();
  renderFishMarkers();

  // ── Create Lake Lanao Boundary Layer Group (from GeoJSON) ──
  lakeBoundaryLayerGroup = L.layerGroup();
  fetch('/geo/lake-lanao.geojson')
    .then((res) => res.json())
    .then((geojson: GeoJSON.FeatureCollection) => {
      const boundaryLayer = L.geoJSON(geojson, {
        style: {
          color: '#0288D1',
          weight: 2.5,
          fillColor: '#4FC3F7',
          fillOpacity: 0.15,
        },
        interactive: false,
      });
      lakeBoundaryLayerGroup!.addLayer(boundaryLayer);
      lakePolygonRings = extractPolygonRings(geojson);
      buildContourLayers();
      syncLayerVisibility();
      renderHeatmapOverlay();
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
            const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            return { siteId: props.SITE_ID, stationId: props.STATION_ID, lat, lng };
          });
          wqAllLayerGroup = createWaterQualitySiteLayer(geojson, WATER_PIN_COLOR);
          syncLayerVisibility();
          renderHeatmapOverlay();
        });
    })
    .catch((err) => console.error('Failed to load water quality sampling sites GeoJSON:', err));

  // ── Tributary river sites (fixed coordinates, always Surface — shown
  // alongside the lake water-quality sites, not a separately toggled layer). ──
  {
    const markers = TRIBUTARY_RIVER_SITES.map((site) => {
      const color = getMarkerColor(site.siteId, RIVER_PIN_COLOR);
      const marker = L.marker([site.lat, site.lng], { icon: makeRiverPinIcon(color) });
      marker.bindTooltip(
        `<div style="font-family: Roboto, sans-serif; min-width: 170px;">
          <strong style="color:${RIVER_PIN_COLOR};">${site.siteId}</strong><br>
          <span style="color:#666;">Tributary River — Surface only</span><br>
          <span style="color:#666;">Coordinates: ${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</span>
        </div>`,
        { sticky: true, direction: 'top', offset: [0, -8] },
      );
      marker.on('click', () => {
        selectWaterSite({
          siteId: site.siteId,
          stationId: 'Tributary River',
          lat: site.lat,
          lng: site.lng,
        });
      });
      riverSiteMarkerEntries.push({ siteId: site.siteId, marker });
      return marker;
    });
    riverSitesLayerGroup = L.layerGroup(markers);
    syncLayerVisibility();
  }

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

  // ── Lake Tributaries (the fixed rivers being sampled, plus the Sawir
  // wetland extent) — two source files merged into one toggle layer. ──
  Promise.all([
    fetch('/geo/River-Tributaries-Lake-Lanao.geojson').then((res) => res.json() as Promise<GeoJSON.FeatureCollection>),
    fetch('/geo/Sawir_Tributary.geojson').then((res) => res.json() as Promise<GeoJSON.FeatureCollection>),
  ])
    .then(([rivers, sawir]) => {
      const merged: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [...rivers.features, ...sawir.features],
      };
      tributariesLayerGroup = L.geoJSON(merged, {
        style: { color: '#1976D2', weight: 2, fillOpacity: 0.25 },
        onEachFeature: (feature, layer) => {
          const props = feature.properties ?? {};
          const name =
            (props.name as string | null) ??
            (props.wetland ? 'Sawir Tributary Wetland' : null) ??
            'Tributary';
          layer.bindTooltip(`<strong>${name}</strong>`, { sticky: true });
        },
      });
      syncLayerVisibility();
    })
    .catch((err) => console.error('Failed to load tributary river GeoJSON:', err));

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
    contourLines: contourLinesLayerGroup,
    contourFilled: contourFilledLayerGroup,
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

  // River sites share the "All Water Quality Sites" toggle rather than
  // getting a separate control — they show/hide together with the lake sites.
  if (riverSitesLayerGroup) {
    const wqAllActive = mapLayers.value.find((l) => l.id === 'wqAll')?.active ?? false;
    if (wqAllActive) {
      if (!map.hasLayer(riverSitesLayerGroup)) map.addLayer(riverSitesLayerGroup);
    } else if (map.hasLayer(riverSitesLayerGroup)) {
      map.removeLayer(riverSitesLayerGroup);
    }
  }
}

function renderFishMarkers() {
  if (!fishLayerGroup) return;
  fishLayerGroup.clearLayers();

  filteredSpecies.value.forEach((fish) => {
    const icon = makeFishIcon(fish.statusShort);

    const marker = L.marker([fish.lat, fish.lng], { icon });
    marker.bindPopup(`
      <div style="font-family: Roboto, sans-serif; min-width: 160px;">
        <strong>${fish.commonName}</strong><br>
        <em style="color:#888;">${fish.scientificName}</em><br>
        <span style="color:${fish.type === 'endemic' ? '#1565C0' : fish.type === 'invasive' ? '#D32F2F' : '#F57C00'}; font-weight:bold; text-transform: capitalize;">${fish.type}</span> ·
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

onMounted(() => {
  nextTick(() => {
    initMap();
    setTimeout(() => {
      map?.invalidateSize();
    }, 400);
  });
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
  uploadDialogRef.value?.openFor('fish');
}

function goToWaterQuality() {
  uploadDialogRef.value?.openFor('water');
}
</script>

<style scoped>
/* ═══════════════════════════════════ */
/* MAP                                */
/* ═══════════════════════════════════ */
.map-container {
  z-index: 0;
  background: #eef2f5;
}

/* ═══════════════════════════════════ */
/* TOGGLE BUTTON                      */
/* ═══════════════════════════════════ */
.toggle-panel-btn {
  position: absolute;
  top: 72px;
  left: 16px;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #0d9488 !important;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toggle-panel-btn:hover {
  background: rgba(240, 253, 250, 0.95) !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(13, 148, 136, 0.1);
  transform: scale(1.02);
}
.toggle-btn--shifted {
  left: 408px;
}

.recenter-btn {
  position: absolute;
  bottom: 92px;
  right: 10px;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #0d9488 !important;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.25s ease-out;
}
.recenter-btn:hover {
  background: rgba(240, 253, 250, 0.95) !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 8px 24px rgba(13, 148, 136, 0.1);
  transform: scale(1.02);
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

.base-layer-toggle :deep(.q-btn) {
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px !important;
  transition: all 0.2s ease-out;
  font-weight: 500;
}
.base-layer-toggle :deep(.q-btn:hover) {
  background: rgba(13, 148, 136, 0.06) !important;
}

.base-layer-toggle :deep(.q-btn__content) {
  font-size: 11px;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.bright-panel {
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(0, 0, 0, 0.06),
    0 16px 40px rgba(0, 0, 0, 0.08);
}

/* ─── Header ─── */
.bright-panel :deep(.q-card__section:first-child) {
  padding: 16px 20px 10px 20px;
}

.bright-panel :deep(.q-card__section:first-child .text-subtitle1) {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #1a1a2e;
}

.bright-panel :deep(.q-card__section:first-child .text-caption) {
  font-size: 0.72rem;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

/* Close button */
.bright-panel :deep(.q-card__section:first-child .q-btn--round) {
  transition: all 0.2s ease-out;
}
.bright-panel :deep(.q-card__section:first-child .q-btn--round:hover) {
  background: rgba(0, 0, 0, 0.06) !important;
  transform: scale(1.08);
}

/* ─── Separators ─── */
.bright-panel .q-separator {
  background: rgba(0, 0, 0, 0.06) !important;
}

/* ─── Tabs ─── */
.panel-tabs {
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  padding: 3px;
}

.panel-tabs :deep(.q-tab) {
  text-transform: none;
  font-weight: 600;
  font-size: 0.78rem;
  color: #64748b;
  min-height: 34px;
  border-radius: 10px;
  transition: all 0.22s ease-out;
  letter-spacing: 0.01em;
}

.panel-tabs :deep(.q-tab:hover) {
  color: #0d9488;
  background: rgba(13, 148, 136, 0.06);
}

.panel-tabs :deep(.q-tab--active) {
  color: #0d9488 !important;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.panel-tabs :deep(.q-tab__icon) {
  transition: transform 0.2s ease-out;
}

.panel-tabs :deep(.q-tab:hover .q-tab__icon) {
  transform: scale(1.08);
}

.panel-tabs :deep(.q-tab__indicator) {
  height: 0 !important;
}

/* ─── Tab Content ─── */
.bright-panel .q-tab-panels {
  background: transparent !important;
}

.bright-panel .q-tab-panel {
  padding: 16px 20px;
}

/* ─── Section Titles ─── */
.bright-panel .text-subtitle2 {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #0d9488 !important;
}

/* ─── Captions ─── */
.bright-panel .text-caption {
  font-size: 0.72rem;
  line-height: 1.5;
}

/* ─── Search / Select Inputs ─── */
.bright-panel :deep(.q-field--outlined .q-field__control) {
  border-radius: 12px;
  transition: all 0.22s ease-out;
  border-color: rgba(0, 0, 0, 0.08);
}

.bright-panel :deep(.q-field--outlined .q-field__control:hover) {
  border-color: rgba(13, 148, 136, 0.3);
}

.bright-panel :deep(.q-field--outlined.q-field--focused .q-field__control) {
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
}

.bright-panel :deep(.q-field__native::placeholder),
.bright-panel :deep(.q-field__input::placeholder) {
  color: #94a3b8;
  font-size: 0.78rem;
}

/* ─── Slider ─── */
.bright-panel :deep(.q-slider__track-container) {
  border-radius: 4px;
}

/* ═══════════════════════════════════ */
/* SPECIES LIST ITEMS                 */
/* ═══════════════════════════════════ */
.species-item {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 14px !important;
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out,
    background 0.2s ease-out,
    border-color 0.2s ease-out;
  min-height: 56px;
  padding: 4px 8px;
  margin-bottom: 6px;
}

.species-item:hover {
  background: rgba(240, 253, 250, 0.8);
  border-color: rgba(13, 148, 136, 0.15);
  transform: translateY(-1px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(13, 148, 136, 0.06);
}

.species-item--active {
  background: rgba(240, 253, 250, 0.95) !important;
  border-color: rgba(13, 148, 136, 0.25) !important;
  border-left: 3px solid #0d9488;
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.04),
    0 4px 12px rgba(13, 148, 136, 0.08);
}

/* Species card typography */
.species-item .text-weight-bold {
  font-weight: 650;
  color: #1e293b;
}

.species-item .text-italic {
  color: #94a3b8;
}

/* Badge styling */
.species-item :deep(.q-badge) {
  border-radius: 8px;
  padding: 3px 8px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* Avatar in cards */
.species-item :deep(.q-avatar) {
  border-radius: 12px;
}

/* ═══════════════════════════════════ */
/* FILTER CHIPS                       */
/* ═══════════════════════════════════ */
.filter-chip {
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 20px !important;
  letter-spacing: 0.01em;
  transition: all 0.22s ease-out;
  padding: 0 4px;
}

.filter-chip:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ═══════════════════════════════════ */
/* STATUS DOT                         */
/* ═══════════════════════════════════ */
.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

/* ═══════════════════════════════════ */
/* SCROLLBAR                          */
/* ═══════════════════════════════════ */
.bright-panel :deep(::-webkit-scrollbar) {
  width: 5px;
}

.bright-panel :deep(::-webkit-scrollbar-track) {
  background: transparent;
  margin: 8px 0;
}

.bright-panel :deep(::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  transition: background 0.2s;
}

.bright-panel :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.22);
}

/* ═══════════════════════════════════ */
/* FOOTER                             */
/* ═══════════════════════════════════ */
.bright-panel :deep(.q-card__section:last-child) {
  padding: 8px 20px 12px 20px;
}

.bright-panel :deep(.q-card__section:last-child .text-caption) {
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ═══════════════════════════════════ */
/* PARAMETER READING MODAL            */
/* ═══════════════════════════════════ */
.parameter-modal-card {
  width: 320px;
  border-radius: 18px;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 24px 48px rgba(0, 0, 0, 0.12);
}
.parameter-modal-header {
  padding: 20px;
  text-align: center;
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
.slide-panel-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 1, 1);
}
.slide-panel-enter-from {
  transform: translateX(-24px);
  opacity: 0;
}
.slide-panel-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

.slide-detail-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-detail-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.slide-detail-enter-from {
  transform: translateX(24px);
  opacity: 0;
}
.slide-detail-leave-to {
  transform: translateX(24px);
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
  box-shadow:
    0 2px 8px rgba(13, 148, 136, 0.25),
    0 8px 24px rgba(13, 148, 136, 0.15);
  border-radius: 50px !important;
  font-weight: 600;
  font-size: 0.78rem;
  transition: all 0.25s ease-out;
  padding: 14px 14px;
}
.add-data-btn:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow:
    0 4px 12px rgba(13, 148, 136, 0.3),
    0 12px 32px rgba(13, 148, 136, 0.2);
}
.add-data-btn--shifted {
  left: 408px;
}
</style>
