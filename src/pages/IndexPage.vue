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

                <q-separator class="q-my-md" />

                <!-- Fisheries Jurisdiction Layer -->
                <div class="text-caption text-grey-6 q-mb-xs">
                  <q-icon name="gavel" size="14px" class="q-mr-xs" />Fisheries Jurisdiction
                </div>
                <q-item tag="label" class="species-item rounded-borders q-mb-xs">
                  <q-item-section avatar>
                    <q-toggle v-model="municipalWaterLayer.active" color="teal" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-grey-9" style="font-size: 0.8rem">
                      Municipal Water Zones (~15km)
                    </q-item-label>
                    <q-item-label caption class="text-grey-6" style="font-size: 0.7rem">
                      Illustrative median-line division among lakeshore LGUs
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <div class="text-caption text-grey-5" style="font-size: 0.68rem; line-height: 1.4">
                  Modeled using RA 8550's 15km / equidistant-line method for adjacent municipal
                  waters, from real town coordinates — but Lake Lanao has no official municipal
                  water boundaries today, and this is a simplified nearest-town model, not a
                  cadastral survey. Treat it as a discussion starting point, not a legal
                  determination.
                </div>

                <q-item tag="label" class="species-item rounded-borders q-mt-sm">
                  <q-item-section avatar>
                    <q-toggle v-model="municipalityMarkerLayer.active" color="amber-8" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-grey-9" style="font-size: 0.8rem">
                      Municipality Markers
                    </q-item-label>
                    <q-item-label caption class="text-grey-6" style="font-size: 0.7rem">
                      Click a marker to view endemic &amp; invasive fish per municipality
                    </q-item-label>
                  </q-item-section>
                </q-item>
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
                  <q-btn-toggle
                    v-model="selectedYear"
                    spread
                    dense
                    no-caps
                    unelevated
                    toggle-color="teal"
                    color="white"
                    text-color="grey-8"
                    class="year-toggle q-mb-md"
                    :options="READING_YEARS.map((y) => ({ label: String(y), value: y }))"
                  />
                  <q-slider
                    v-model="selectedMonthInYear"
                    :min="0"
                    :max="11"
                    :step="1"
                    snap
                    markers
                    color="teal"
                    track-size="4px"
                    thumb-size="16px"
                  />
                  <div class="row justify-between text-caption text-grey-5 month-tick-row">
                    <span v-for="(label, i) in MONTH_NAMES" :key="i">{{ label }}</span>
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
                <div class="text-caption text-grey-6 q-mb-md">
                  Pulsing ring = Serious &nbsp;·&nbsp; <strong>!</strong> badge = Warning &nbsp;·&nbsp;
                  both = Critical — flagged on any parameter, pin color or not
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
                  Showing approved field readings — "No data" means this station wasn't sampled for that parameter this month.
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
                      <q-item-label
                        :class="
                          generateReading(selectedWaterSite.siteId, selectedMonthIndex, p, effectiveDepthFor(selectedWaterSite.siteId)) !== null
                            ? 'text-grey-9 text-weight-medium'
                            : 'text-grey-5 text-italic'
                        "
                      >
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

    <!-- ═══ BATHYMETRY DEPTH LEGEND (shown while the filled contour layer is on) ═══ -->
    <div
      v-if="showContourLegend"
      class="contour-legend"
      :class="{ 'contour-legend--shifted': !!(selectedFish || selectedWaterSite) }"
    >
      <div class="contour-legend-title">Depth (m)</div>
      <div class="contour-legend-body">
        <div class="contour-legend-gradient" :style="{ background: contourGradientCss }" />
        <div class="contour-legend-ticks">
          <span v-for="lvl in CONTOUR_LEVELS" :key="lvl">{{ lvl }}</span>
        </div>
      </div>
    </div>

    <UploadDataDialog ref="uploadDialogRef" />

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import {
  TRIBUTARY_RIVER_SITES,
  TRIBUTARY_RIVER_SITE_IDS,
  MONTH_NAMES,
  READING_YEARS,
  READING_START_YEAR,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_LEVELS,
  waterQualityParameterGroups,
  allWaterQualityParams,
  type WaterQualityParam,
  type StatusLevel,
} from 'src/composables/useWaterQualityModel';
import {
  fetchWaterQualityReadings,
  buildReadingLookup,
  getReading,
  type ReadingLookup,
} from 'src/composables/useWaterQualityReadings';
import {
  fetchFishObservations,
  CONSERVATION_STATUS_LABELS,
  CONSERVATION_STATUS_SHORT,
  type FishObservation,
} from 'src/composables/useFishObservations';
import {
  buildDepthGrid,
  colorForDepth,
  extractPolygonRings,
  pointInPolygon,
  type DepthGrid,
  CONTOUR_LEVELS,
  CONTOUR_LINE_COLOR,
  CONTOUR_LABEL_MIN_ZOOM
} from 'src/composables/useBathymetry';
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

// "Needs attention" decoration shared by water + river pins: a pulsing ring
// for serious, a static "!" badge for warning, both for critical — mirrors
// the Water Quality Dashboard's station map (StationMap.vue). Returned as
// SVG fragments so each pin builder can splice them into its own <svg>.
function attentionSvgFragments(color: string, attention: StatusLevel | null | undefined): {
  pulse: string;
  badge: string;
} {
  const pulse = attention === 'serious' || attention === 'critical';
  const badge = attention === 'warning' || attention === 'critical';
  return {
    pulse: pulse ? `<circle class="wq-pulse-ring" cx="18" cy="18" r="16" fill="${color}"/>` : '',
    badge: badge
      ? `<circle cx="29" cy="7" r="6.5" fill="#fff" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
         <text x="29" y="10" text-anchor="middle" font-size="10" font-weight="800" fill="#b5290a" font-family="sans-serif">!</text>`
      : '',
  };
}

// Water-quality marker: circle with a water droplet inside. Recolorable —
// when a parameter is selected (Water tab → Color Sites By Parameter), each
// site's pin switches to its good/warning/serious/critical status color.
const WATER_PIN_COLOR = '#0277BD'; // rich cerulean blue — default when no parameter is selected
const waterPinIconCache = new Map<string, L.DivIcon>();

function makeWaterPinIcon(color: string, attention?: StatusLevel | null): L.DivIcon {
  const cacheKey = `${color}|${attention ?? ''}`;
  let icon = waterPinIconCache.get(cacheKey);
  if (icon) return icon;

  const { pulse, badge } = attentionSvgFragments(color, attention);
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
    <filter id="ws" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
    </filter>
    ${pulse}
    <circle cx="18" cy="18" r="16"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#ws)"/>
    <path d="M18 9 Q22 15 22 18.5 A4 4 0 0 1 14 18.5 Q14 15 18 9Z"
          fill="#fff" opacity="0.95"/>
    ${badge}
  </svg>`;

  icon = L.divIcon({
    className: '',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    tooltipAnchor: [0, -12],
  });
  waterPinIconCache.set(cacheKey, icon);
  return icon;
}

// Tributary-river marker: same pin size/style as the lake water-quality
// markers, but a wavy-lines glyph instead of a droplet and a distinct default
// color — so the 6 fixed river sampling points read as visually different
// from the 24 lake sites at a glance. Also recolorable by parameter/status.
const RIVER_PIN_COLOR = '#D84315'; // deep orange — default when no parameter is selected; kept distinct from the depth-zone palette (purple/brown/green) and the lake pin blue
const riverPinIconCache = new Map<string, L.DivIcon>();

function makeRiverPinIcon(color: string, attention?: StatusLevel | null): L.DivIcon {
  const cacheKey = `${color}|${attention ?? ''}`;
  let icon = riverPinIconCache.get(cacheKey);
  if (icon) return icon;

  const { pulse, badge } = attentionSvgFragments(color, attention);
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36">
    <filter id="rs" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
    </filter>
    ${pulse}
    <circle cx="18" cy="18" r="16"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#rs)"/>
    <path d="M9.5 14.5c1.7-2.2 3.4-2.2 5.1 0s3.4 2.2 5.1 0 3.4-2.2 5.1 0"
          stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>
    <path d="M9.5 19c1.7-2.2 3.4-2.2 5.1 0s3.4 2.2 5.1 0 3.4-2.2 5.1 0"
          stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>
    <path d="M9.5 23.5c1.7-2.2 3.4-2.2 5.1 0s3.4 2.2 5.1 0 3.4-2.2 5.1 0"
          stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>
    ${badge}
  </svg>`;

  icon = L.divIcon({
    className: '',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    tooltipAnchor: [0, -12],
  });
  riverPinIconCache.set(cacheKey, icon);
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
const uploadDialogRef = ref<InstanceType<typeof UploadDataDialog> | null>(null);

// ═══ STATE ═══
const activeTab = ref('fish');
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
let contourLinesLayerGroup: L.LayerGroup | null = null;
let contourFilledLayerGroup: L.LayerGroup | null = null;
let contourLabelsLayerGroup: L.LayerGroup | null = null;
let municipalZonesLayerGroup: L.LayerGroup | null = null;
let municipalLabelsLayerGroup: L.LayerGroup | null = null;
let municipalityMarkersLayerGroup: L.LayerGroup | null = null;

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

// Real approved fish observations, mapped into this map's Fish shape.
// Observations without a latitude/longitude can't be placed on a map at all
// (unlike the two dashboards, which don't need coordinates) — those are
// skipped here, not fabricated a position.
const species = ref<Fish[]>([]);

function toMapFish(obs: FishObservation): Fish | null {
  if (obs.latitude == null || obs.longitude == null) return null;
  const type: Fish['type'] =
    obs.category === 'ENDEMIC' ? 'endemic' : obs.category === 'INVASIVE' ? 'invasive' : 'general';
  const fish: Fish = {
    id: obs.id,
    commonName:
      obs.speciesCommon || obs.speciesScientific || (type === 'general' ? 'Unidentified catch' : 'Unnamed species'),
    scientificName: obs.speciesScientific || '—',
    type,
    status: CONSERVATION_STATUS_LABELS[obs.conservationStatus],
    statusShort: CONSERVATION_STATUS_SHORT[obs.conservationStatus],
    length: obs.trueLengthCm != null ? `${obs.trueLengthCm} cm` : '-',
    weight: obs.weightG != null ? `${obs.weightG} g` : '-',
    location: [obs.municipal, obs.barangay].filter(Boolean).join(', ') || 'Lake Lanao',
    date: obs.dateObserved || 'Oct 14, 2025',
    lat: obs.latitude,
    lng: obs.longitude,
  };
  if (type === 'general') {
    if (obs.depthM != null) fish.depth = `${obs.depthM} m`;
    if (obs.count != null) fish.number = String(obs.count);
    if (obs.sizeCategory) fish.size = obs.sizeCategory;
  } else {
    if (obs.bodyDepthCm != null) fish.bodyDepth = `${obs.bodyDepthCm} cm`;
    if (obs.municipal) fish.municipal = obs.municipal;
    if (obs.barangay) fish.barangay = obs.barangay;
  }
  return fish;
}

onMounted(async () => {
  try {
    const observations = await fetchFishObservations({ status: 'APPROVED' });
    species.value = observations
      .map(toMapFish)
      .filter((f): f is Fish => f !== null);
  } catch (err) {
    console.error('Failed to load fish observations:', err);
  }
});

const selectedSpeciesFilter = ref<string[]>([]);
const allSpeciesNames = computed(() => [...new Set(species.value.map((s) => s.commonName))]);
const speciesOptionsFiltered = ref<string[]>(allSpeciesNames.value);
watch(allSpeciesNames, (names) => {
  speciesOptionsFiltered.value = names;
});

function filterFn(val: string, update: (callback: () => void) => void) {
  if (val === '') {
    update(() => {
      speciesOptionsFiltered.value = allSpeciesNames.value;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    speciesOptionsFiltered.value = allSpeciesNames.value.filter(
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
  species.value.filter((f) => {
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
// ── Monthly Time Slider (real approved readings; coverage varies by month) ──
// Reading Period picks a year (2025 onward, same range as the Water Quality
// Dashboard), then a month within that year.
const months = READING_YEARS.flatMap((year) => MONTH_NAMES.map((m) => `${m} ${year}`));
const nowForReadingPeriod = new Date();
const defaultReadingYear = READING_YEARS.includes(nowForReadingPeriod.getFullYear())
  ? nowForReadingPeriod.getFullYear()
  : READING_YEARS[READING_YEARS.length - 1]!;
const selectedYear = ref(defaultReadingYear);
const selectedMonthInYear = ref(
  defaultReadingYear === nowForReadingPeriod.getFullYear() ? nowForReadingPeriod.getMonth() : 0,
);
const selectedMonthIndex = computed(
  () => (selectedYear.value - READING_START_YEAR) * 12 + selectedMonthInYear.value,
);
const selectedMonthLabel = computed(() => months[selectedMonthIndex.value]);

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

// Sites/params/months with zero approved readings show as this neutral grey
// rather than a fabricated "good" status — "no data" is a distinct state.
const NO_DATA_COLOR = '#78909c';

// Real approved readings, fetched once and looked up by the same
// (siteId, monthIndex, param, depthM) signature every existing call site on
// this page already uses — so nothing downstream (markers, tooltips, the
// weighted interpolation surface) needed to change signatures, only how a
// missing reading is handled. A site/month/depth with no real reading
// returns null — every consumer below shows/colors that as "No Data" rather
// than inventing a value.
const readingsLookup = ref<ReadingLookup>(new Map());
onMounted(async () => {
  try {
    const readings = await fetchWaterQualityReadings({ status: 'APPROVED' });
    readingsLookup.value = buildReadingLookup(readings);
    // Readings load independently of the site GeoJSON — markers may already
    // be on the map (colored/attention-flagged as "no data") by the time
    // this resolves, so refresh them now rather than waiting for the user
    // to touch the month/depth/param controls.
    recolorWaterLayers();
  } catch (err) {
    console.error('Failed to load water quality readings:', err);
  }
});

function generateReading(
  siteId: string,
  monthIndex: number,
  param: WaterQualityParam,
  depthM = 0,
): number | null {
  return getReading(readingsLookup.value, siteId, monthIndex, param, depthM);
}

function formatReading(value: number, param: WaterQualityParam): string {
  return `${value.toFixed(param.decimals)}${param.unit ? ' ' + param.unit : ''}`;
}

function mockReading(siteId: string, monthIndex: number, param: WaterQualityParam, depthM = 0): string {
  const value = generateReading(siteId, monthIndex, param, depthM);
  return value !== null ? formatReading(value, param) : 'No data';
}

// ── Color-by-parameter map overlay (dropdown in the Water tab) ──
const allWaterParams = computed(() => allWaterQualityParams);
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
  if (value === null) return { label: 'No Data', background: NO_DATA_COLOR };
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
  return value !== null ? STATUS_COLORS[param.getStatus(value)] : NO_DATA_COLOR;
}

interface SiteAttentionInfo {
  status: StatusLevel;
  paramLabel: string;
  formattedValue: string;
}

// Worst status across ALL parameters at a site, independent of whichever one
// parameter (if any) selectedColorParam is currently coloring pins by — a
// site with one bad reading should pulse/badge no matter what the map's
// color dropdown is set to. Same scope as the Water Quality Dashboard's
// sitesNeedingAttention / statusBySite. Carries WHICH parameter earned that
// status too, so the tooltip can say why instead of showing an unexplained
// badge — easy to assume it's about selectedColorParam when it isn't.
function siteAttention(siteId: string): SiteAttentionInfo | null {
  let worst: SiteAttentionInfo | null = null;
  for (const param of allWaterParams.value) {
    const value = generateReading(siteId, selectedMonthIndex.value, param, effectiveDepthFor(siteId));
    if (value === null) continue;
    const status = param.getStatus(value);
    if (worst === null || STATUS_LEVELS.indexOf(status) > STATUS_LEVELS.indexOf(worst.status)) {
      worst = { status, paramLabel: param.label, formattedValue: formatReading(value, param) };
    }
  }
  return worst;
}

function siteAttentionStatus(siteId: string): StatusLevel | null {
  return siteAttention(siteId)?.status ?? null;
}

function recolorWaterLayers() {
  for (const entry of waterSiteMarkerEntries) {
    const color = getMarkerColor(entry.siteId, entry.defaultColor);
    entry.marker.setIcon(makeWaterPinIcon(color, siteAttentionStatus(entry.siteId)));
  }
  for (const entry of riverSiteMarkerEntries) {
    const color = getMarkerColor(entry.siteId, RIVER_PIN_COLOR);
    entry.marker.setIcon(makeRiverPinIcon(color, siteAttentionStatus(entry.siteId)));
  }
}

watch([selectedColorParam, selectedMonthIndex, selectedDepthM], () => {
  recolorWaterLayers();
});

// Pins are created (via createWaterQualitySiteLayer / the river-markers loop)
// before this page's separate onMounted() finishes fetching readings, so
// their first paint always has readingsLookup still empty — no attention
// decoration would ever appear until the user happened to touch a filter.
// Re-decorate once real data lands.
watch(readingsLookup, () => {
  recolorWaterLayers();
});

function waterQualityTooltipHtml(props: WaterQualitySiteProps): string {
  const zone = siteDepthZone.get(props.SITE_ID);
  const param = selectedColorParam.value;
  let paramLine = '';
  if (param) {
    const value = generateReading(props.SITE_ID, selectedMonthIndex.value, param, selectedDepthM.value);
    if (value !== null) {
      const status = param.getStatus(value);
      paramLine = `<br><span style="color:${STATUS_COLORS[status]}; font-weight:bold;">${param.label} @ ${depthLabel(selectedDepthM.value)}: ${formatReading(value, param)} (${STATUS_LABELS[status]})</span>`;
    } else {
      paramLine = `<br><span style="color:${NO_DATA_COLOR}; font-weight:bold;">${param.label} @ ${depthLabel(selectedDepthM.value)}: No Data</span>`;
    }
  }
  // Only shown when it's a different parameter than paramLine above — avoids
  // repeating the same reading twice when selectedColorParam happens to be
  // the same one driving the pulse/badge.
  const attention = siteAttention(props.SITE_ID);
  const attentionLine =
    attention && attention.paramLabel !== param?.label
      ? `<br><span style="color:${STATUS_COLORS[attention.status]}; font-weight:bold;">⚠ ${attention.paramLabel}: ${attention.formattedValue} (${STATUS_LABELS[attention.status]})</span>`
      : '';
  return `
    <div style="font-family: Roboto, sans-serif; min-width: 170px;">
      <strong style="color:#0288D1;">${props.SITE_ID}</strong><br>
      <span style="color:#666;">Station: ${props.STATION_ID}</span><br>
      <span style="color:#666;">Coordinates: ${props.LATITUDE.toFixed(5)}, ${props.LONGITUDE.toFixed(5)}</span>
      ${zone ? `<br><span style="color:#666;">Depth Zone: ${zone}</span>` : ''}
      ${paramLine}
      ${attentionLine}
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
      const marker = L.marker(latlng, { icon: makeWaterPinIcon(color, siteAttentionStatus(siteId)) });
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
// pointInPolygon and extractPolygonRings are imported from useBathymetry

// Shared geo helpers — also used by the bathymetry-contours feature below.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// computeRingsBounds is imported from useBathymetry

// ═══ BATHYMETRY CONTOURS ═══
// CONTOUR_LEVELS, CONTOUR_LINE_COLOR, CONTOUR_LABEL_MIN_ZOOM, colorForDepth,
// DepthGrid, and buildDepthGrid are all imported from useBathymetry.

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
  const grid = buildDepthGrid(lakePolygonRings);
  if (!grid) return;

  contourLinesLayerGroup = L.layerGroup();
  contourFilledLayerGroup = L.layerGroup();

  // ── Filled color gradient, rasterized straight from the depth grid, then
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
      const [r, g, b] = colorForDepth(d);
      const idx = i * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
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
      // Soften the grid's resolution artifacts into a smooth gradient blend,
      // matching the reference figure's continuous (not banded) shading.
      finalCtx.filter = 'blur(2.5px)';
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

  // ── Contour lines, shared by both layers — black in both, slightly
  // lighter opacity on top of the fill so it doesn't overpower the deepest
  // (darkest) bands. ──
  contourLabelsLayerGroup = L.layerGroup();
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
      color: CONTOUR_LINE_COLOR,
      weight: Math.max(1, weight - 0.4),
      opacity: 0.4,
      interactive: false,
    });
    contourFilledLayerGroup!.addLayer(overlayLine);

    // A handful of small depth labels spaced along the line — only shown
    // once zoomed in far enough that they wouldn't just clutter the map.
    const desiredLabelCount = 5;
    const stride = Math.max(1, Math.floor(segments.length / desiredLabelCount));
    for (let s = 0; s < segments.length; s += stride) {
      const segment = segments[s]!;
      const [lat1, lng1] = segment[0]!;
      const [lat2, lng2] = segment[1]!;
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#fff; border:1px solid #000; border-radius:3px; padding:0 4px; font-size:10px; font-weight:700; line-height:14px; color:#000; white-space:nowrap; box-shadow:0 1px 2px rgba(0,0,0,0.35);">${level}m</div>`,
        iconSize: [28, 16],
        iconAnchor: [14, 8],
      });
      const labelMarker = L.marker([midLat, midLng], {
        icon,
        interactive: false,
        keyboard: false,
      });
      contourLabelsLayerGroup!.addLayer(labelMarker);
    }
  });
}

// ═══ MUNICIPAL WATER ZONES (illustrative — see disclaimer in the Fish tab) ═══
// Lake Lanao has no official RA 8550-style municipal water delineation. OSM's
// own administrative-boundary data confirms this: of the lakeshore LGUs
// below, only Marawi City has a mapped boundary polygon at all — every other
// one is only a town-center point (no drawn territory in OSM at all). So
// this layer models, rather than looks up, each municipality's share of the
// lake: every point on the lake surface is assigned to whichever town center
// is nearest — the "equidistant / median line" method RA 8550 itself uses
// for adjacent/opposite municipal waters under 30km apart. The Act's 15km
// reach is checked (MUNICIPAL_WATER_LIMIT_KM) but never actually caps
// anything here — the lake's widest point is well under 30km, so every spot
// on it already sits within 15km of some shore, meaning the median line
// (not the 15km limit) is what actually divides the surface among
// neighboring LGUs. Town coordinates are real (geocoded from OpenStreetMap),
// but this is a simplified nearest-neighbor model, not a cadastral survey.
interface LakeMunicipality {
  name: string;
  lat: number;
  lng: number;
  color: string;
}

const LAKE_MUNICIPALITIES: LakeMunicipality[] = (
  [
    { name: 'Marawi City', lat: 8.0047262, lng: 124.2854351 },
    { name: 'Bacolod-Kalawi', lat: 7.8576753, lng: 124.1423567 },
    { name: 'Balindong', lat: 7.9162827, lng: 124.2055463 },
    { name: 'Bayang', lat: 7.793733, lng: 124.1972049 },
    { name: 'Binidayan', lat: 7.7949244, lng: 124.1670371 },
    { name: 'Buadiposo-Buntong', lat: 7.9654, lng: 124.37615 },
    { name: 'Ditsaan-Ramain', lat: 7.9788768, lng: 124.3516506 },
    { name: 'Ganassi', lat: 7.8260261, lng: 124.1018827 },
    { name: 'Lumbatan', lat: 7.7848782, lng: 124.2552241 },
    { name: 'Lumbayanague', lat: 7.7830923, lng: 124.2815746 },
    { name: 'Madalum', lat: 7.8540188, lng: 124.1140094 },
    { name: 'Madamba', lat: 7.8588264, lng: 124.050705 },
    { name: 'Marantao', lat: 7.9482892, lng: 124.2315699 },
    { name: 'Masiu', lat: 7.8184459, lng: 124.3308048 },
    { name: 'Mulondo', lat: 7.9170563, lng: 124.3615673 },
    { name: 'Poona Bayabao', lat: 7.8531283, lng: 124.3394332 },
    { name: 'Tamparan', lat: 7.8765155, lng: 124.3264879 },
    { name: 'Taraka', lat: 7.8998799, lng: 124.3339467 },
    { name: 'Tugaya', lat: 7.883728, lng: 124.17801 },
  ] as Omit<LakeMunicipality, 'color'>[]
).map((m, i, arr) => ({ ...m, color: `hsl(${Math.round((i * 360) / arr.length)}, 62%, 50%)` }));

const MUNICIPAL_WATER_LIMIT_KM = 15;

function hslToRgb(hsl: string): [number, number, number] {
  const match = /hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/.exec(hsl);
  if (!match) return [128, 128, 128];
  const h = Number(match[1]) / 360;
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function buildMunicipalZones() {
  if (!map || municipalZonesLayerGroup) return;
  const grid = buildDepthGrid(lakePolygonRings);
  if (!grid) return;

  municipalZonesLayerGroup = L.layerGroup();
  municipalLabelsLayerGroup = L.layerGroup();

  const { width, height, minLat, maxLat, minLng, maxLng, values } = grid;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const municipalRgb = LAKE_MUNICIPALITIES.map((m) => hslToRgb(m.color));

  // For every grid cell already known to be inside the lake (the bathymetry
  // grid's depth is 0 only outside the shoreline), find the nearest town.
  const assignment = new Int16Array(width * height).fill(-1);
  const cellSumLat = new Float64Array(LAKE_MUNICIPALITIES.length);
  const cellSumLng = new Float64Array(LAKE_MUNICIPALITIES.length);
  const cellCount = new Int32Array(LAKE_MUNICIPALITIES.length);

  for (let row = 0; row < height; row++) {
    const lat = maxLat - (row / (height - 1)) * latSpan;
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;
      if (values[idx]! <= 0) continue; // outside the lake
      const lng = minLng + (col / (width - 1)) * lngSpan;

      let nearest = -1;
      let nearestKm = Infinity;
      for (let m = 0; m < LAKE_MUNICIPALITIES.length; m++) {
        const town = LAKE_MUNICIPALITIES[m]!;
        const d = haversineKm(lat, lng, town.lat, town.lng);
        if (d < nearestKm) {
          nearestKm = d;
          nearest = m;
        }
      }
      if (nearest < 0 || nearestKm > MUNICIPAL_WATER_LIMIT_KM) continue;
      assignment[idx] = nearest;
      cellSumLat[nearest]! += lat;
      cellSumLng[nearest]! += lng;
      cellCount[nearest]! += 1;
    }
  }

  // ── Rasterize flat zone colors + a boundary stroke between neighboring
  // zones (a simple neighbor-comparison edge, not vector geometry — this is
  // a categorical field, not the continuous one marching squares needs). ──
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = width;
  rawCanvas.height = height;
  const rawCtx = rawCanvas.getContext('2d');
  if (rawCtx) {
    const imageData = rawCtx.createImageData(width, height);
    const data = imageData.data;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = row * width + col;
        const m = assignment[idx]!;
        if (m < 0) continue;
        const idx4 = idx * 4;

        const isBoundary =
          (col > 0 && assignment[idx - 1] !== m && assignment[idx - 1]! >= 0) ||
          (col < width - 1 && assignment[idx + 1] !== m && assignment[idx + 1]! >= 0) ||
          (row > 0 && assignment[idx - width] !== m && assignment[idx - width]! >= 0) ||
          (row < height - 1 && assignment[idx + width] !== m && assignment[idx + width]! >= 0);

        if (isBoundary) {
          data[idx4] = 33;
          data[idx4 + 1] = 33;
          data[idx4 + 2] = 33;
          data[idx4 + 3] = 230;
        } else {
          const [r, g, b] = municipalRgb[m]!;
          data[idx4] = r;
          data[idx4 + 1] = g;
          data[idx4 + 2] = b;
          data[idx4 + 3] = Math.round(0.4 * 255);
        }
      }
    }
    rawCtx.putImageData(imageData, 0, 0);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
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

      const zonesOverlay = L.imageOverlay(
        finalCanvas.toDataURL('image/png'),
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { interactive: false, className: 'municipal-zones-img' },
      );
      municipalZonesLayerGroup.addLayer(zonesOverlay);
    }
  }

  // Label each municipality at the centroid of its own assigned zone (inside
  // the lake), not at its town center (which is usually on land) — skip any
  // municipality that never won a single cell under this model.
  //
  // Leaflet's default marker CSS constrains an icon container's width unless
  // iconSize says otherwise — omitting it (relying on "auto size to content")
  // silently clips longer names like "Ditsaan-Ramain". So iconSize is sized
  // explicitly per label, from its own text length.
  LAKE_MUNICIPALITIES.forEach((town, m) => {
    if (cellCount[m]! === 0) return;
    const labelLat = cellSumLat[m]! / cellCount[m]!;
    const labelLng = cellSumLng[m]! / cellCount[m]!;
    const width = Math.ceil(town.name.length * 4.4) + 8;
    const height = 12;
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:100%; height:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.88); border:1px solid #555; border-radius:2px; font-size:7px; font-weight:700; color:#212121; white-space:nowrap; box-shadow:0 1px 2px rgba(0,0,0,0.3);">${town.name}</div>`,
      iconSize: [width, height],
      iconAnchor: [width / 2, height / 2],
    });
    const marker = L.marker([labelLat, labelLng], { icon, interactive: false, keyboard: false });
    municipalLabelsLayerGroup!.addLayer(marker);
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
  {
    id: 'municipalWaters',
    name: 'Municipal Water Zones (~15km)',
    description: 'Illustrative median-line division among lakeshore LGUs',
    active: false,
  },
  {
    id: 'municipalityMarkers',
    name: 'Municipality Markers',
    description: 'Clickable city markers — one per lakeside municipality',
    active: true,
  },
]);

// Layers shown in the "Layers" tab (kept separate from the Water tab's own layer controls).
const exceptionLayerIds = ['fish', 'lakeBoundary', 'wqAll', 'contourLines', 'contourFilled'];
const exceptionLayers = computed(() =>
  mapLayers.value.filter((l) => exceptionLayerIds.includes(l.id)),
);

// Floating depth legend — only shown while the filled contour layer is on,
// built from the same color stops used to paint it (single source of truth).
const showContourLegend = computed(
  () => mapLayers.value.find((l) => l.id === 'contourFilled')?.active ?? false,
);
const contourGradientCss = computed(() => {
  const stops = CONTOUR_COLOR_STOPS.map(
    (s) => `rgb(${s.rgb[0]}, ${s.rgb[1]}, ${s.rgb[2]}) ${s.depth}%`,
  );
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
});

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

// Surfaced as its own toggle in the Fish tab, not the generic Layers tab —
// fisheries jurisdiction is a fish-tab concern.
const municipalWaterLayer = computed(() => mapLayers.value.find((l) => l.id === 'municipalWaters')!);
const municipalityMarkerLayer = computed(() => mapLayers.value.find((l) => l.id === 'municipalityMarkers')!);

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
  L.control.scale({ position: 'bottomleft', metric: true, imperial: false, maxWidth: 150 }).addTo(map);

  // Contour depth labels only show once zoomed in far enough (see
  // syncLayerVisibility) — re-check on every zoom change.
  map.on('zoomend', syncLayerVisibility);

  // ── Create Fish Layer Group ──
  fishLayerGroup = L.layerGroup();
  renderFishMarkers();

  // ── Create Municipality City-Pin Markers (hardcoded coords — no GeoJSON dep) ──
  buildMunicipalityMarkers();

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
      buildMunicipalZones();
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
            const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            return { siteId: props.SITE_ID, stationId: props.STATION_ID, lat, lng };
          });
          wqAllLayerGroup = createWaterQualitySiteLayer(geojson, WATER_PIN_COLOR);
          syncLayerVisibility();
        });
    })
    .catch((err) => console.error('Failed to load water quality sampling sites GeoJSON:', err));

  // ── Tributary river sites (fixed coordinates, always Surface — shown
  // alongside the lake water-quality sites, not a separately toggled layer). ──
  {
    const markers = TRIBUTARY_RIVER_SITES.map((site) => {
      const color = getMarkerColor(site.siteId, RIVER_PIN_COLOR);
      const marker = L.marker([site.lat, site.lng], { icon: makeRiverPinIcon(color, siteAttentionStatus(site.siteId)) });
      // Bound as a function so the attention line stays accurate as
      // month/depth change, not just whatever it was at page load.
      marker.bindTooltip(
        () => {
          const attention = siteAttention(site.siteId);
          const attentionLine = attention
            ? `<br><span style="color:${STATUS_COLORS[attention.status]}; font-weight:bold;">⚠ ${attention.paramLabel}: ${attention.formattedValue} (${STATUS_LABELS[attention.status]})</span>`
            : '';
          return `<div style="font-family: Roboto, sans-serif; min-width: 170px;">
            <strong style="color:${RIVER_PIN_COLOR};">${site.siteId}</strong><br>
            <span style="color:#666;">Tributary River — Surface only</span><br>
            <span style="color:#666;">Coordinates: ${site.lat.toFixed(5)}, ${site.lng.toFixed(5)}</span>
            ${attentionLine}
          </div>`;
        },
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
    municipalWaters: municipalZonesLayerGroup,
    municipalityMarkers: municipalityMarkersLayerGroup,
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

  // Depth labels ride along with either contour layer, but only once zoomed
  // in — they'd just be unreadable clutter at the default whole-lake view.
  if (contourLabelsLayerGroup) {
    const contourActive =
      (mapLayers.value.find((l) => l.id === 'contourLines')?.active ?? false) ||
      (mapLayers.value.find((l) => l.id === 'contourFilled')?.active ?? false);
    const zoomedInEnough = map.getZoom() >= CONTOUR_LABEL_MIN_ZOOM;
    if (contourActive && zoomedInEnough) {
      if (!map.hasLayer(contourLabelsLayerGroup)) map.addLayer(contourLabelsLayerGroup);
    } else if (map.hasLayer(contourLabelsLayerGroup)) {
      map.removeLayer(contourLabelsLayerGroup);
    }
  }

  // Municipality name labels ride along with the zones layer — no zoom gate,
  // there are only ~19 of them (about as many as the water-quality markers
  // already shown together on the default view).
  if (municipalLabelsLayerGroup) {
    const zonesActive = mapLayers.value.find((l) => l.id === 'municipalWaters')?.active ?? false;
    if (zonesActive) {
      if (!map.hasLayer(municipalLabelsLayerGroup)) map.addLayer(municipalLabelsLayerGroup);
    } else if (map.hasLayer(municipalLabelsLayerGroup)) {
      map.removeLayer(municipalLabelsLayerGroup);
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
  void nextTick(() => {
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

// ═══ MUNICIPALITY CITY-PIN MARKERS ═══

// Yellow teardrop pin with a location_city icon center.
function makeMunicipalityIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:24px;height:24px;display:block;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 36 36" style="display:block;">
        <filter id="muni-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
        </filter>
        <circle cx="18" cy="18" r="16" fill="#F9A825" stroke="#fff" stroke-width="2" filter="url(#muni-shadow)"/>
      </svg>
      <span style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);
                   font-family:'Material Icons';font-size:14px;color:white;
                   line-height:1;pointer-events:none;user-select:none;">location_city</span>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

// Builds one clickable fish row element for use inside the municipality popup.
function createFishItemEl(fish: Fish, color: string, bgColor: string): HTMLElement {
  const item = document.createElement('div');
  item.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;
    border-radius:8px;cursor:pointer;background:${bgColor};
    transition:background 0.15s,transform 0.15s;border:1px solid transparent;`;
  item.innerHTML = `
    <div style="width:28px;height:28px;background:${color};border-radius:50%;
                display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <span style="font-family:'Material Icons';color:white;font-size:14px;line-height:1;">set_meal</span>
    </div>
    <div style="min-width:0;flex:1;">
      <div style="font-weight:600;font-size:0.8rem;color:#212121;
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fish.commonName}</div>
      <div style="font-size:0.68rem;color:#757575;font-style:italic;
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fish.scientificName}</div>
    </div>
    <span style="font-family:'Material Icons';color:${color};font-size:16px;line-height:1;flex-shrink:0;">chevron_right</span>`;
  item.addEventListener('mouseenter', () => {
    item.style.background = bgColor.replace('0.06', '0.13');
    item.style.transform = 'translateX(2px)';
  });
  item.addEventListener('mouseleave', () => {
    item.style.background = bgColor;
    item.style.transform = '';
  });
  item.addEventListener('click', () => {
    map?.closePopup();
    selectFish(fish);
  });
  return item;
}

// Builds the full popup DOM element shown when a municipality marker is clicked.
function buildMuniPopupContent(muni: LakeMunicipality): HTMLElement {
  const endemicFish = species.value.filter((f) => f.type === 'endemic' && f.municipal === muni.name);
  const invasiveFish = species.value.filter((f) => f.type === 'invasive' && f.municipal === muni.name);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'font-family:Roboto,sans-serif;min-width:230px;max-width:270px;max-height:300px;overflow-y:auto;';

  // ── Header ──
  const hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e0e0e0;';
  hdr.innerHTML = `
    <div style="width:36px;height:36px;background:#F9A825;border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                flex-shrink:0;border:2px solid #E65100;">
      <span style="font-family:'Material Icons';color:white;font-size:20px;line-height:1;">location_city</span>
    </div>
    <div>
      <div style="font-weight:700;font-size:0.9rem;color:#212121;line-height:1.2;">${muni.name}</div>
      <div style="font-size:0.68rem;color:#757575;margin-top:2px;">Municipality · Lake Lanao</div>
    </div>`;
  wrap.appendChild(hdr);

  // ── Count badges ──
  const badgeRow = document.createElement('div');
  badgeRow.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;';
  badgeRow.innerHTML = `
    <span style="background:rgba(21,101,192,0.12);color:#1565C0;border-radius:12px;
                 padding:2px 10px;font-size:0.7rem;font-weight:700;">${endemicFish.length} Endemic</span>
    <span style="background:rgba(211,47,47,0.12);color:#D32F2F;border-radius:12px;
                 padding:2px 10px;font-size:0.7rem;font-weight:700;">${invasiveFish.length} Invasive</span>`;
  wrap.appendChild(badgeRow);

  // ── Empty state ──
  if (endemicFish.length === 0 && invasiveFish.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;color:#9e9e9e;font-size:0.78rem;padding:14px 0 6px;';
    empty.innerHTML = `<span style="font-family:'Material Icons';font-size:28px;display:block;
                                    margin-bottom:6px;opacity:0.45;">search_off</span>
                       No observations recorded yet.`;
    wrap.appendChild(empty);
    return wrap;
  }

  // ── Endemic section ──
  if (endemicFish.length > 0) {
    const sh = document.createElement('div');
    sh.style.cssText = 'font-size:0.65rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;'
      + 'color:#1565C0;background:rgba(21,101,192,0.08);padding:4px 8px;border-radius:6px;'
      + 'border-left:3px solid #1565C0;margin-bottom:6px;';
    sh.textContent = 'Endemic Species';
    wrap.appendChild(sh);
    endemicFish.forEach((f) => wrap.appendChild(createFishItemEl(f, '#1565C0', 'rgba(21,101,192,0.06)')));
  }

  // ── Invasive section ──
  if (invasiveFish.length > 0) {
    const sh = document.createElement('div');
    sh.style.cssText = 'font-size:0.65rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;'
      + 'color:#D32F2F;background:rgba(211,47,47,0.08);padding:4px 8px;border-radius:6px;'
      + 'border-left:3px solid #D32F2F;margin-bottom:6px;margin-top:8px;';
    sh.textContent = 'Invasive Species';
    wrap.appendChild(sh);
    invasiveFish.forEach((f) => wrap.appendChild(createFishItemEl(f, '#D32F2F', 'rgba(211,47,47,0.06)')));
  }

  return wrap;
}

// Creates the municipality pin layer group with one yellow city marker per LGU.
// Uses hardcoded LAKE_MUNICIPALITIES coordinates — no GeoJSON loading required.
function buildMunicipalityMarkers() {
  if (!map || municipalityMarkersLayerGroup) return;
  municipalityMarkersLayerGroup = L.layerGroup();

  LAKE_MUNICIPALITIES.forEach((muni) => {
    const marker = L.marker([muni.lat, muni.lng], {
      icon: makeMunicipalityIcon(),
      zIndexOffset: 200,
      title: muni.name,
    });
    marker.bindTooltip(muni.name, {
      direction: 'top',
      offset: [0, -14],
      className: 'muni-tooltip',
    });
    marker.on('click', () => {
      L.popup({ maxWidth: 290, className: 'muni-popup' })
        .setLatLng([muni.lat, muni.lng])
        .setContent(buildMuniPopupContent(muni))
        .openOn(map!);
      map?.flyTo([muni.lat, muni.lng], 13, { duration: 0.8 });
    });
    municipalityMarkersLayerGroup!.addLayer(marker);
  });
  syncLayerVisibility();
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

.year-toggle {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  overflow: hidden;
}
.year-toggle :deep(.q-btn) {
  font-size: 11px;
  font-weight: 600;
  min-height: 26px;
  padding: 0 2px;
}

.month-tick-row span {
  font-size: 0.56rem;
  flex: 1;
  text-align: center;
}
.month-tick-row span:first-child {
  text-align: left;
}
.month-tick-row span:last-child {
  text-align: right;
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
/* BATHYMETRY DEPTH LEGEND (top-right) */
/* ═══════════════════════════════════ */
.contour-legend {
  position: absolute;
  top: 60px;
  right: 12px;
  z-index: 999;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  transition: right 0.25s ease-out;
}
.contour-legend--shifted {
  right: 366px;
}
.contour-legend-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: #263238;
  text-align: center;
  margin-bottom: 6px;
}
.contour-legend-body {
  display: flex;
  align-items: stretch;
  gap: 6px;
}
.contour-legend-gradient {
  width: 16px;
  height: 100px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.25);
}
.contour-legend-ticks {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 600;
  color: #37474f;
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

<!-- Global styles for Leaflet municipality popups (outside Vue scoped scope) -->
<style>
.muni-popup .leaflet-popup-content-wrapper {
  border-radius: 14px !important;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.14),
    0 1px 4px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid rgba(249, 168, 37, 0.25) !important;
  padding: 0 !important;
  overflow: hidden;
}
.muni-popup .leaflet-popup-content {
  margin: 14px 14px 12px !important;
  width: auto !important;
}
.muni-popup .leaflet-popup-tip {
  background: white !important;
}
.muni-tooltip {
  background: rgba(249, 168, 37, 0.95) !important;
  border: 1px solid #E65100 !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  border-radius: 6px !important;
  padding: 3px 8px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18) !important;
}
.muni-tooltip::before {
  border-top-color: #E65100 !important;
}

/* "Needs attention" pulse ring on water/river pins (see attentionSvgFragments
   in the script) — mirrors StationMap.vue's .wq-marker__pulse. */
.wq-pulse-ring {
  transform-box: fill-box;
  transform-origin: center;
  pointer-events: none;
  animation: wq-pulse-ring 1.8s ease-out infinite;
}
@keyframes wq-pulse-ring {
  0% {
    transform: scale(0.6);
    opacity: 0.65;
  }
  70% {
    transform: scale(1.9);
    opacity: 0;
  }
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wq-pulse-ring {
    animation: none;
    opacity: 0.3;
    transform: scale(1.4);
  }
}
</style>
