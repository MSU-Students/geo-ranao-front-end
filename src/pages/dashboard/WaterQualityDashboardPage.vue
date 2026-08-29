<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Same Lake Lanao background as the Fish Dashboard -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />
    <div class="absolute-full bg-overlay" />

    <BackButton to="/map" />

    <div class="page-content full-width q-pa-md" style="max-width: 1300px">
      <!-- Header -->
      <div class="text-center q-mb-md">
        <h4 class="text-weight-bolder q-my-xs text-white drop-shadow">Water Quality Dashboard</h4>
        <p class="text-grey-3 drop-shadow-soft q-mb-none">
          Environmental monitoring overview of Lake Lanao — for agency awareness and reporting
        </p>
      </div>

      <!-- Reading Period -->
      <q-card class="glass-morph q-pa-md q-mb-md">
        <div class="row items-center justify-between q-mb-sm">
          <span class="text-grey-3 text-caption">Reading Period</span>
          <span class="text-white text-weight-bold">
            {{ MONTH_NAMES[selectedMonthInYear] }} {{ selectedYear }}
          </span>
        </div>

        <q-btn-toggle
          v-model="selectedYear"
          spread
          dense
          no-caps
          unelevated
          toggle-color="teal"
          text-color="grey-3"
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
          dark
        />
        <div class="row justify-between text-caption text-grey-5 month-tick-row">
          <span v-for="(label, i) in MONTH_NAMES" :key="i">{{ label }}</span>
        </div>
        <div class="text-caption text-grey-5 q-mt-sm q-mb-md">
          <q-icon name="info" size="14px" class="q-mr-xs" />
          Showing approved field readings — coverage varies by month and station; averages are computed only from stations that reported.
        </div>

        <q-separator dark class="q-mb-md" style="opacity: 0.15" />

        <div class="row items-center justify-between q-mb-xs">
          <span class="text-grey-3 text-caption">
            <q-icon name="vertical_align_bottom" size="14px" class="q-mr-xs" />
            Depth
          </span>
        </div>
        <q-select
          v-model="selectedDepthM"
          :options="DEPTH_OPTIONS"
          emit-value
          map-options
          dense
          outlined
          dark
          class="form-field"
          style="max-width: 260px"
        />
        <div class="text-caption text-grey-5 q-mt-sm">
          <q-icon name="info" size="14px" class="q-mr-xs" />
          Applies to the KPI cards, parameter overview, and charts below — the Vertical Depth
          Profile chart further down always shows every depth at once.
        </div>
      </q-card>

      <!-- Interactive Station Map -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-8">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-white text-subtitle1 text-weight-medium">
                  <q-icon name="map" color="teal-3" class="q-mr-xs" />
                  Station Map — {{ selectedParam ? selectedParam.label : 'Select a Parameter' }}
                </span>
                <q-btn
                  v-if="selectedStationId"
                  flat
                  dense
                  size="sm"
                  color="grey-4"
                  icon="close"
                  label="Clear Selection"
                  @click="selectedStationId = null"
                />
              </div>
              <p class="text-grey-4 text-caption q-mb-sm">
                {{ siteCount }} monitoring stations across Lake Lanao. Click a station to filter
                the research charts below to that site.
              </p>

              <div class="station-map-wrap">
                <StationMap
                  :sites="sites"
                  :status-color-by-site="statusColorBySite"
                  :status-by-site="statusBySite"
                  :attention-detail-by-site="attentionDetailBySite"
                  :selected-site-id="selectedStationId"
                  @select-station="selectStation"
                />
              </div>

              <div class="row items-center q-gutter-md q-mt-sm">
                <div class="row items-center no-wrap">
                  <span class="status-dot" :style="{ background: STATUS_COLORS.good }" />
                  <span class="text-caption text-grey-4 q-ml-xs">Good</span>
                </div>
                <div class="row items-center no-wrap">
                  <span class="status-dot" :style="{ background: STATUS_COLORS.warning }" />
                  <span class="text-caption text-grey-4 q-ml-xs">Warning</span>
                </div>
                <div class="row items-center no-wrap">
                  <span class="status-dot" :style="{ background: STATUS_COLORS.critical }" />
                  <span class="text-caption text-grey-4 q-ml-xs">Serious / Critical</span>
                </div>
              </div>
              <p class="text-caption text-grey-5 q-mt-xs q-mb-0">
                Pulsing ring = Serious &nbsp;·&nbsp; <strong>!</strong> badge = Warning &nbsp;·&nbsp;
                both = Critical — on <em>any</em> parameter, not just {{ selectedParam?.label ?? 'the one shown' }}
              </p>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="text-white text-subtitle1 text-weight-medium q-mb-xs">
                <q-icon name="report_problem" color="orange-3" class="q-mr-xs" />
                Sites of Concern
              </div>
              <p class="text-grey-4 text-caption q-mb-sm">
                Click a site to quick-filter the map and charts.
              </p>
              <q-list dark dense>
                <q-item
                  v-for="s in sitesOfConcern"
                  :key="s.siteId"
                  clickable
                  class="q-px-sm concern-item"
                  :class="{ 'concern-item--active': s.siteId === selectedStationId }"
                  @click="selectStation(s.siteId)"
                >
                  <q-item-section>
                    <q-item-label class="text-grey-2">{{ s.siteId }}</q-item-label>
                    <q-item-label caption class="text-grey-5">Station: {{ s.stationId }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <span class="status-chip" :style="{ background: STATUS_COLORS[s.status] }">
                      {{ STATUS_LABELS[s.status] }}
                    </span>
                  </q-item-section>
                </q-item>
                <q-item v-if="sitesOfConcern.length === 0">
                  <q-item-section class="text-center text-grey-4 q-py-md">
                    No sites of concern for this parameter this month.
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="row q-col-gutter-md q-mb-md justify-center">
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="pin_drop" color="teal-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ sites.length }}</div>
            <div class="text-grey-3 text-caption">Monitoring Sites</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="science" color="blue-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ allWaterQualityParams.length }}</div>
            <div class="text-grey-3 text-caption">Parameters Tracked</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="warning" color="orange-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ sitesNeedingAttention }}</div>
            <div class="text-grey-3 text-caption">Sites Needing Attention</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="eco" :style="{ color: overallStatus ? STATUS_COLORS[overallStatus] : NO_DATA_COLOR }" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ overallStatus ? STATUS_LABELS[overallStatus] : 'No Data' }}</div>
            <div class="text-grey-3 text-caption">Overall Lake Status</div>
          </q-card>
        </div>
      </div>

      <!-- Parameter Overview Grid -->
      <q-card class="glass-morph q-mb-md">
        <q-card-section>
          <div class="text-white text-subtitle1 text-weight-medium q-mb-sm">
            Parameter Overview
          </div>
          <div class="text-grey-4 text-caption q-mb-md">
            Lake-wide average per parameter for {{ months[selectedMonthIndex] }}. Select a
            parameter to see its trend and site breakdown below.
          </div>

          <div v-for="group in waterQualityParameterGroups" :key="group.title" class="q-mb-md">
            <div class="text-grey-3 text-caption text-weight-bold q-mb-xs">
              <q-icon :name="group.icon" size="14px" class="q-mr-xs" />{{ group.title }}
            </div>
            <div class="row q-col-gutter-sm">
              <div v-for="param in group.params" :key="param.key" class="col-6 col-sm-4 col-md-3">
                <q-card
                  flat
                  class="param-tile"
                  :class="{ 'param-tile--active': selectedParamKey === param.key }"
                  @click="selectedParamKey = param.key"
                >
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center justify-between no-wrap">
                      <span class="text-grey-3 text-caption ellipsis">{{ param.label }}</span>
                      <span class="status-dot" :style="{ background: paramColor(param) }">
                        <q-tooltip>{{ lakeAverageCoverage(param, selectedMonthIndex) }} of {{ sites.length }} stations reporting</q-tooltip>
                      </span>
                    </div>
                    <div class="text-white text-subtitle1 text-weight-bold">
                      {{ formatLakeAverage(param, selectedMonthIndex) }}
                    </div>
                    <div class="row items-center justify-between no-wrap">
                      <span
                        class="text-caption"
                        :class="(paramDelta(param) ?? 0) <= 0 ? 'text-positive' : 'text-negative'"
                        v-if="selectedMonthIndex > 0 && paramDelta(param) !== null"
                      >
                        <q-icon :name="paramDeltaImproved(param) ? 'trending_down' : 'trending_up'" size="12px" />
                        {{ Math.abs(paramDelta(param) ?? 0).toFixed(param.decimals) }}
                      </span>
                      <span v-else class="text-caption text-grey-5">—</span>
                      <TrendSparkline :values="sparklineValues(param)" :color="paramColor(param)" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Detail Section -->
      <div class="row q-col-gutter-md q-mb-md" v-if="selectedParam">
        <!-- Trend Chart -->
        <div class="col-12 col-md-7">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-white text-subtitle1 text-weight-medium">
                  {{ selectedParam.label }} — 13-Month Trend
                </span>
                <span class="status-chip" :style="{ background: paramColor(selectedParam) }">
                  {{ paramStatusLabel(selectedParam) }}
                </span>
              </div>
              <ParameterTrendChart
                :months="selectedParamTrend.months"
                :values="selectedParamTrend.values"
                :unit="selectedParam.unit"
                :decimals="selectedParam.decimals"
                color="#4dd0e1"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Status Distribution -->
        <div class="col-12 col-md-5">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="text-white text-subtitle1 text-weight-medium q-mb-sm">
                Site Status Distribution
              </div>
              <StatusDistributionBar :counts="statusCounts(selectedParam, selectedMonthIndex)" />
              <div class="text-grey-4 text-caption q-mt-md">
                <q-icon name="info" size="14px" class="q-mr-xs" />
                See the "Sites of Concern" panel above the map for the flagged stations.
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Specialized Limnology Research Charts -->
      <div class="text-white text-h6 text-weight-bold q-mb-sm q-mt-lg">
        <q-icon name="biotech" color="teal-3" class="q-mr-sm" />
        Specialized Limnology Research Charts
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <!-- Chart 1: Multi-Parameter Trend Comparison -->
        <div class="col-12">
          <q-card class="glass-morph">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm wrap">
                <span class="text-white text-subtitle1 text-weight-medium">
                  Multi-Parameter Trend Comparison
                </span>
                <div class="row q-gutter-sm">
                  <q-select
                    v-model="compareParamKeyA"
                    :options="paramSelectOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    dark
                    label="Parameter A"
                    class="form-field"
                    style="min-width: 180px"
                  />
                  <q-select
                    v-model="compareParamKeyB"
                    :options="paramSelectOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    dark
                    label="Parameter B"
                    class="form-field"
                    style="min-width: 180px"
                  />
                </div>
              </div>
              <p class="text-grey-4 text-caption q-mb-md">
                {{ selectedStation ? `Station ${selectedStation.siteId}` : 'Lake-wide average' }}
                over the past 13 months. Each parameter keeps its own axis — plotting different
                units on one shared axis would be misleading — with an approximate DENR
                guideline line where one applies.
              </p>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6" v-if="compareParamA">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-white text-body2 text-weight-medium">{{ compareParamA.label }}</span>
                  </div>
                  <ParameterTrendChart
                    :months="compareASeries.months"
                    :values="compareASeries.values"
                    :unit="compareParamA.unit"
                    :decimals="compareParamA.decimals"
                    color="#4dd0e1"
                    :guideline-value="compareParamA.guideline"
                    guideline-label="DENR Guideline"
                  />
                </div>
                <div class="col-12 col-md-6" v-if="compareParamB">
                  <div class="row items-center justify-between q-mb-xs">
                    <span class="text-white text-body2 text-weight-medium">{{ compareParamB.label }}</span>
                  </div>
                  <ParameterTrendChart
                    :months="compareBSeries.months"
                    :values="compareBSeries.values"
                    :unit="compareParamB.unit"
                    :decimals="compareParamB.decimals"
                    color="#ba68c8"
                    :guideline-value="compareParamB.guideline"
                    guideline-label="DENR Guideline"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Chart 2: Vertical Depth Profile -->
        <div class="col-12 col-md-6">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm wrap">
                <span class="text-white text-subtitle1 text-weight-medium">Vertical Depth Profile</span>
                <div class="row q-gutter-sm">
                  <q-select
                    v-model="depthProfileParamKeyA"
                    :options="paramSelectOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    dark
                    label="Parameter A"
                    class="form-field"
                    style="min-width: 160px"
                  />
                  <q-select
                    v-model="depthProfileParamKeyB"
                    :options="paramSelectOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    dark
                    label="Parameter B"
                    class="form-field"
                    style="min-width: 160px"
                  />
                </div>
              </div>
              <p class="text-grey-4 text-caption q-mb-md">
                Approved readings at {{ depthProfileStationId ?? '—' }} for
                {{ months[selectedMonthIndex] }} across whichever of the 9 sampling depths (Surface–100m) were recorded.
                Select a station on the map above to inspect a specific site.
              </p>
              <div class="row q-col-gutter-sm">
                <div class="col-6 text-center" v-if="depthProfileParamA">
                  <div class="text-grey-3 text-caption q-mb-xs">
                    {{ depthProfileParamA.label }}{{ depthProfileParamA.unit ? ` (${depthProfileParamA.unit})` : '' }}
                  </div>
                  <DepthProfileChart
                    :points="depthProfilePointsA"
                    :unit="depthProfileParamA.unit"
                    color="#ff8a65"
                    :decimals="depthProfileParamA.decimals"
                    :guideline-value="depthProfileParamA.guideline"
                  />
                </div>
                <div class="col-6 text-center" v-if="depthProfileParamB">
                  <div class="text-grey-3 text-caption q-mb-xs">
                    {{ depthProfileParamB.label }}{{ depthProfileParamB.unit ? ` (${depthProfileParamB.unit})` : '' }}
                  </div>
                  <DepthProfileChart
                    :points="depthProfilePointsB"
                    :unit="depthProfileParamB.unit"
                    color="#4fc3f7"
                    :decimals="depthProfileParamB.decimals"
                    :guideline-value="depthProfileParamB.guideline"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Chart 3: Station Comparison -->
        <div class="col-12 col-md-6">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <span class="text-white text-subtitle1 text-weight-medium">
                Station Comparison — {{ selectedParam ? selectedParam.label : '' }}
              </span>
              <p class="text-grey-4 text-caption q-mb-md">
                Nearshore, offshore, and tributary stations for {{ months[selectedMonthIndex] }}.
                Click a bar to select that station (tributaries are Surface-only and shown for
                reference, not selectable).
              </p>
              <q-scroll-area style="height: 360px">
                <StationComparisonChart
                  :entries="stationComparisonEntries"
                  :unit="selectedParam?.unit ?? ''"
                  :decimals="selectedParam?.decimals ?? 1"
                  :guideline-value="selectedParam?.guideline"
                  :selected-site-id="selectedStationId"
                  @select-station="selectStation"
                />
              </q-scroll-area>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="row q-gutter-sm">
        <q-btn
          color="teal"
          label="Record Water Quality Data"
          icon="add"
          unelevated
          rounded
          @click="uploadDialogRef?.openFor('water')"
        />
      </div>
    </div>

    <UploadDataDialog ref="uploadDialogRef" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BackButton from 'src/components/BackButton.vue';
import TrendSparkline from 'src/components/charts/TrendSparkline.vue';
import ParameterTrendChart from 'src/components/charts/ParameterTrendChart.vue';
import StatusDistributionBar from 'src/components/charts/StatusDistributionBar.vue';
import StationMap from 'src/components/charts/StationMap.vue';
import DepthProfileChart from 'src/components/charts/DepthProfileChart.vue';
import StationComparisonChart from 'src/components/charts/StationComparisonChart.vue';
import UploadDataDialog from 'src/components/UploadDataDialog.vue';
import {
  waterQualityParameterGroups,
  allWaterQualityParams,
  months,
  MONTH_NAMES,
  READING_YEARS,
  READING_START_YEAR,
  formatReading,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_LEVELS,
  DEPTH_OPTIONS,
  DEPTHS,
  TRIBUTARY_RIVER_SITES,
  TRIBUTARY_RIVER_SITE_IDS,
  type WaterQualityParam,
  type StatusLevel,
  type DepthReadingPoint,
} from 'src/composables/useWaterQualityModel';
import {
  fetchWaterQualityReadings,
  buildReadingLookup,
  getReading,
  getReadingCoverage,
  type ReadingLookup,
} from 'src/composables/useWaterQualityReadings';

// Sites/months with zero approved readings show as this neutral grey rather
// than a fabricated status color — "no data" is a distinct state from "good".
const NO_DATA_COLOR = '#78909c';

interface Site {
  siteId: string;
  stationId: string;
  lat: number;
  lng: number;
  zone: 'Nearshore' | 'Offshore' | 'Tributary';
}

const sites = ref<Site[]>([]);
const siteCount = computed(() => sites.value.length);
const uploadDialogRef = ref<InstanceType<typeof UploadDataDialog> | null>(null);

const readingsLookup = ref<ReadingLookup>(new Map());
const readingsLoading = ref(false);
onMounted(async () => {
  readingsLoading.value = true;
  try {
    const readings = await fetchWaterQualityReadings({ status: 'APPROVED' });
    readingsLookup.value = buildReadingLookup(readings);
  } catch (err) {
    console.error('Failed to load water quality readings:', err);
  } finally {
    readingsLoading.value = false;
  }
});

// Reading Period: pick a year (2025 onward), then a month within that year.
const now = new Date();
const defaultReadingYear = READING_YEARS.includes(now.getFullYear())
  ? now.getFullYear()
  : READING_YEARS[READING_YEARS.length - 1]!;
const selectedYear = ref(defaultReadingYear);
const selectedMonthInYear = ref(defaultReadingYear === now.getFullYear() ? now.getMonth() : 0);
const selectedMonthIndex = computed(
  () => (selectedYear.value - READING_START_YEAR) * 12 + selectedMonthInYear.value,
);

const selectedParamKey = ref(allWaterQualityParams[0]!.key);
const selectedStationId = ref<string | null>(null);
const selectedDepthM = ref(0);

const compareParamKeyA = ref(
  allWaterQualityParams.find((p) => p.key === 'chlorophyll')?.key ?? allWaterQualityParams[0]!.key,
);
const compareParamKeyB = ref(
  allWaterQualityParams.find((p) => p.key === 'nitrate')?.key ?? allWaterQualityParams[1]!.key,
);

const depthProfileParamKeyA = ref(
  allWaterQualityParams.find((p) => p.key === 'temperature')?.key ?? allWaterQualityParams[0]!.key,
);
const depthProfileParamKeyB = ref(
  allWaterQualityParams.find((p) => p.key === 'dissolvedOxygen')?.key ?? allWaterQualityParams[1]!.key,
);

const paramSelectOptions = allWaterQualityParams.map((p) => ({ label: p.label, value: p.key }));

onMounted(() => {
  function fetchZone(
    url: string,
    zone: 'Nearshore' | 'Offshore',
    target: Map<string, 'Nearshore' | 'Offshore'>,
  ) {
    return fetch(url)
      .then((res) => res.json())
      .then((geojson: GeoJSON.FeatureCollection) => {
        geojson.features.forEach((feature) => {
          const props = feature.properties as unknown as { SITE_ID: string };
          target.set(props.SITE_ID, zone);
        });
      })
      .catch((err) => console.error(`Failed to load ${url}:`, err));
  }

  const zoneBySite = new Map<string, 'Nearshore' | 'Offshore'>();

  // Reuse the same depth-zone GeoJSON split as the interactive map: sites in
  // shallower water (or along tributaries) count as nearshore, sites in the
  // deeper open-water zone count as offshore.
  void Promise.all([
    fetchZone('/geo/WQ-Sampling-Sites-Above-40m-Depth.geojson', 'Nearshore', zoneBySite),
    fetchZone('/geo/WQ-Sampling-Sites-Below-40m-Depth.geojson', 'Offshore', zoneBySite),
    fetchZone('/geo/WQ-Sampling-Sites-Tributary.geojson', 'Nearshore', zoneBySite),
  ]).then(() =>
    fetch('/geo/WQ-All-Sampling-Sites.geojson')
      .then((res) => res.json())
      .then((geojson: GeoJSON.FeatureCollection) => {
        const lakeSites: Site[] = geojson.features.map((feature) => {
          const props = feature.properties as unknown as {
            SITE_ID: string;
            STATION_ID: string;
            LATITUDE: number;
            LONGITUDE: number;
          };
          return {
            siteId: props.SITE_ID,
            stationId: props.STATION_ID,
            lat: props.LATITUDE,
            lng: props.LONGITUDE,
            zone: zoneBySite.get(props.SITE_ID) ?? 'Nearshore',
          };
        });
        // The 6 fixed tributary rivers — always Surface-only, get their own
        // "Tributary" zone bucket in the Station Comparison chart.
        const riverSites: Site[] = TRIBUTARY_RIVER_SITES.map((r) => ({
          siteId: r.siteId,
          stationId: 'Tributary River',
          lat: r.lat,
          lng: r.lng,
          zone: 'Tributary',
        }));
        sites.value = [...lakeSites, ...riverSites];
      })
      .catch((err) => console.error('Failed to load water quality sampling sites GeoJSON:', err)),
  );
});

// Rivers are always read at Surface, regardless of the page's Depth selector.
function depthForSite(site: Site): number {
  return site.zone === 'Tributary' ? 0 : selectedDepthM.value;
}

const selectedParam = computed(() =>
  allWaterQualityParams.find((p) => p.key === selectedParamKey.value) ?? null,
);

// Real reading, averaged only over sites that actually reported this
// param/month/depth — null (not a fabricated number) when nobody did.
// This is deliberate: a month where 5 of 30 stations were sampled still
// gets a real average of those 5, it just isn't "the whole lake."
function lakeAverage(param: WaterQualityParam, monthIndex: number): number | null {
  const values: number[] = [];
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, monthIndex, param, depthForSite(site));
    if (value !== null) values.push(value);
  });
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// How many of the monitoring sites contributed to lakeAverage() — the
// "how complete is this?" companion so a 5-of-30 month doesn't read as if
// it were a full lake-wide reading.
function lakeAverageCoverage(param: WaterQualityParam, monthIndex: number): number {
  return sites.value.filter(
    (site) => getReadingCoverage(readingsLookup.value, site.siteId, monthIndex, param, depthForSite(site)) > 0,
  ).length;
}

// The trend charts show a trailing 13-month window ending at the selected
// Reading Period, not the whole (now multi-year) timeline.
const trendIndices = computed(() => {
  const end = selectedMonthIndex.value;
  const start = Math.max(0, end - 12);
  const indices: number[] = [];
  for (let i = start; i <= end; i++) indices.push(i);
  return indices;
});

// Paired {months, values} that drops months with zero lake-wide data —
// dropping jointly keeps the x-axis labels aligned with the plotted points
// (a chart with 13 labels but only 8 values would mis-align everything else).
function trendSeries(param: WaterQualityParam): { months: string[]; values: number[] } {
  const monthsOut: string[] = [];
  const valuesOut: number[] = [];
  for (const i of trendIndices.value) {
    const value = lakeAverage(param, i);
    if (value !== null) {
      monthsOut.push(months[i]!);
      valuesOut.push(value);
    }
  }
  return { months: monthsOut, values: valuesOut };
}

function sparklineValues(param: WaterQualityParam): number[] {
  return trendSeries(param).values;
}

function paramStatus(param: WaterQualityParam, monthIndex = selectedMonthIndex.value): StatusLevel | null {
  const value = lakeAverage(param, monthIndex);
  return value !== null ? param.getStatus(value) : null;
}

function paramColor(param: WaterQualityParam): string {
  const status = paramStatus(param);
  return status ? STATUS_COLORS[status] : NO_DATA_COLOR;
}

function paramStatusLabel(param: WaterQualityParam): string {
  const status = paramStatus(param);
  return status ? STATUS_LABELS[status] : 'No Data';
}

function formatLakeAverage(param: WaterQualityParam, monthIndex: number): string {
  const value = lakeAverage(param, monthIndex);
  return value !== null ? formatReading(value, param) : 'No data';
}

function paramDelta(param: WaterQualityParam): number | null {
  const current = lakeAverage(param, selectedMonthIndex.value);
  const previous = lakeAverage(param, selectedMonthIndex.value - 1);
  if (current === null || previous === null) return null;
  return current - previous;
}

// "Improved" means the status rank moved toward good (lower index), not just
// a raw numeric decrease — direction of "better" varies per parameter.
function paramDeltaImproved(param: WaterQualityParam): boolean {
  if (selectedMonthIndex.value === 0) return true;
  const currentStatus = paramStatus(param, selectedMonthIndex.value);
  const previousStatus = paramStatus(param, selectedMonthIndex.value - 1);
  if (!currentStatus || !previousStatus) return true;
  return STATUS_LEVELS.indexOf(currentStatus) <= STATUS_LEVELS.indexOf(previousStatus);
}

function statusCounts(param: WaterQualityParam, monthIndex: number): Record<StatusLevel, number> {
  const counts: Record<StatusLevel, number> = { good: 0, warning: 0, serious: 0, critical: 0 };
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, monthIndex, param, depthForSite(site));
    if (value !== null) counts[param.getStatus(value)]++;
  });
  return counts;
}

const sitesNeedingAttention = computed(() => {
  const flagged = new Set<string>();
  sites.value.forEach((site) => {
    const isFlagged = allWaterQualityParams.some((param) => {
      const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
      if (value === null) return false;
      const status = param.getStatus(value);
      return status === 'serious' || status === 'critical';
    });
    if (isFlagged) flagged.add(site.siteId);
  });
  return flagged.size;
});

// null when nothing has been sampled yet for the selected period at all.
const overallStatus = computed<StatusLevel | null>(() => {
  let goodCount = 0;
  let total = 0;
  sites.value.forEach((site) => {
    allWaterQualityParams.forEach((param) => {
      const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
      if (value === null) return;
      total++;
      if (param.getStatus(value) === 'good') goodCount++;
    });
  });
  if (total === 0) return null;
  const ratio = goodCount / total;
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.6) return 'warning';
  if (ratio >= 0.4) return 'serious';
  return 'critical';
});

const sitesOfConcern = computed(() => {
  const param = selectedParam.value;
  if (!param) return [];
  const results: (Site & { status: StatusLevel })[] = [];
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
    if (value === null) return;
    const status = param.getStatus(value);
    if (status === 'serious' || status === 'critical') results.push({ ...site, status });
  });
  return results
    .sort((a, b) => STATUS_LEVELS.indexOf(b.status) - STATUS_LEVELS.indexOf(a.status))
    .slice(0, 6);
});

// ═══ INTERACTIVE STATION MAP ═══
const selectedStation = computed(
  () => sites.value.find((s) => s.siteId === selectedStationId.value) ?? null,
);

function selectStation(siteId: string) {
  // Rivers are Surface-only reference points, not selectable as the active
  // station — selecting one would drive a meaningless flat Depth Profile.
  if (TRIBUTARY_RIVER_SITE_IDS.has(siteId)) return;
  selectedStationId.value = selectedStationId.value === siteId ? null : siteId;
}

// The map deliberately collapses serious+critical into one red — a quick-glance
// 3-tier read (green/yellow/red), distinct from the 4-level palette used elsewhere
// on this page where the serious/critical distinction matters more.
function mapStatusColor(status: StatusLevel): string {
  if (status === 'good') return STATUS_COLORS.good;
  if (status === 'warning') return STATUS_COLORS.warning;
  return STATUS_COLORS.critical;
}

const statusColorBySite = computed<Record<string, string>>(() => {
  const param = selectedParam.value;
  const result: Record<string, string> = {};
  if (!param) return result;
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
    result[site.siteId] = value !== null ? mapStatusColor(param.getStatus(value)) : NO_DATA_COLOR;
  });
  return result;
});

// Worst status across ALL parameters per site — separate from
// statusColorBySite's single-parameter quick-glance color, and deliberately
// NOT scoped to selectedParam. Drives the map's pulse/badge attention cues,
// same scope as sitesNeedingAttention: a site with one bad parameter should
// stay flagged on the map no matter which parameter is currently selected.
// attentionDetailBySite carries WHICH parameter earned that status, so the
// map tooltip can say why a site is flagged instead of just showing an
// unexplained badge (easy to assume it's about whichever parameter the map
// happens to be colored by, when it's actually a different one).
interface SiteAttention {
  status: StatusLevel;
  paramLabel: string;
  formattedValue: string;
}

const attentionBySite = computed<Record<string, SiteAttention>>(() => {
  const result: Record<string, SiteAttention> = {};
  sites.value.forEach((site) => {
    let worst: SiteAttention | null = null;
    allWaterQualityParams.forEach((param) => {
      const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
      if (value === null) return;
      const status = param.getStatus(value);
      if (worst === null || STATUS_LEVELS.indexOf(status) > STATUS_LEVELS.indexOf(worst.status)) {
        worst = { status, paramLabel: param.label, formattedValue: formatReading(value, param) };
      }
    });
    if (worst !== null) result[site.siteId] = worst;
  });
  return result;
});

const statusBySite = computed<Record<string, StatusLevel>>(() => {
  const result: Record<string, StatusLevel> = {};
  Object.entries(attentionBySite.value).forEach(([siteId, a]) => {
    result[siteId] = a.status;
  });
  return result;
});

const attentionDetailBySite = computed<Record<string, { paramLabel: string; formattedValue: string }>>(() => {
  const result: Record<string, { paramLabel: string; formattedValue: string }> = {};
  Object.entries(attentionBySite.value).forEach(([siteId, a]) => {
    result[siteId] = { paramLabel: a.paramLabel, formattedValue: a.formattedValue };
  });
  return result;
});

// ═══ MULTI-PARAMETER TREND COMPARISON ═══
const compareParamA = computed(
  () => allWaterQualityParams.find((p) => p.key === compareParamKeyA.value) ?? null,
);
const compareParamB = computed(
  () => allWaterQualityParams.find((p) => p.key === compareParamKeyB.value) ?? null,
);

// A selected station shows its own readings; otherwise falls back to the
// lake-wide monthly average, matching the rest of the page's default view.
// Paired {months, values} for the same reason trendSeries() is — dropping
// no-data months from both arrays together keeps the chart's x-axis honest.
function stationOrLakeSeries(param: WaterQualityParam): { months: string[]; values: number[] } {
  if (selectedStation.value) {
    const siteId = selectedStation.value.siteId;
    const monthsOut: string[] = [];
    const valuesOut: number[] = [];
    for (const i of trendIndices.value) {
      const value = getReading(readingsLookup.value, siteId, i, param, selectedDepthM.value);
      if (value !== null) {
        monthsOut.push(months[i]!);
        valuesOut.push(value);
      }
    }
    return { months: monthsOut, values: valuesOut };
  }
  return trendSeries(param);
}

const selectedParamTrend = computed(() =>
  selectedParam.value ? trendSeries(selectedParam.value) : { months: [], values: [] },
);
const compareASeries = computed(() =>
  compareParamA.value ? stationOrLakeSeries(compareParamA.value) : { months: [], values: [] },
);
const compareBSeries = computed(() =>
  compareParamB.value ? stationOrLakeSeries(compareParamB.value) : { months: [], values: [] },
);

// ═══ VERTICAL DEPTH PROFILE ═══
// Independent of the page-level depth selector above — this chart's whole
// purpose is to show every depth at once for a chosen station. Depths with
// no reading at all are simply omitted rather than interpolated/faked.
const depthProfileParamA = computed(
  () => allWaterQualityParams.find((p) => p.key === depthProfileParamKeyA.value) ?? null,
);
const depthProfileParamB = computed(
  () => allWaterQualityParams.find((p) => p.key === depthProfileParamKeyB.value) ?? null,
);
const depthProfileStationId = computed(() => selectedStationId.value ?? sites.value[0]?.siteId ?? null);

function depthProfilePoints(stationId: string, param: WaterQualityParam, monthIndex: number): DepthReadingPoint[] {
  const points: DepthReadingPoint[] = [];
  for (const depth of DEPTHS) {
    const value = getReading(readingsLookup.value, stationId, monthIndex, param, depth);
    if (value !== null) points.push({ depth, value });
  }
  return points;
}

const depthProfilePointsA = computed(() =>
  depthProfileStationId.value && depthProfileParamA.value
    ? depthProfilePoints(depthProfileStationId.value, depthProfileParamA.value, selectedMonthIndex.value)
    : [],
);
const depthProfilePointsB = computed(() =>
  depthProfileStationId.value && depthProfileParamB.value
    ? depthProfilePoints(depthProfileStationId.value, depthProfileParamB.value, selectedMonthIndex.value)
    : [],
);

// ═══ STATION COMPARISON (NEARSHORE VS. OFFSHORE) ═══
// Only sites with an actual reading appear — a sparsely-sampled month simply
// shows fewer bars rather than fabricating one for every site.
const stationComparisonEntries = computed(() => {
  const param = selectedParam.value;
  if (!param) return [];
  const entries: { siteId: string; value: number; status: StatusLevel; zone: Site['zone'] }[] = [];
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
    if (value !== null) entries.push({ siteId: site.siteId, value, status: param.getStatus(value), zone: site.zone });
  });
  return entries;
});
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
}

.year-toggle {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
}
.year-toggle :deep(.q-btn) {
  font-size: 0.78rem;
  font-weight: 600;
}

.month-tick-row span {
  font-size: 0.62rem;
  flex: 1;
  text-align: center;
}
.month-tick-row span:first-child {
  text-align: left;
}
.month-tick-row span:last-child {
  text-align: right;
}

.param-tile {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.param-tile:hover {
  background: rgba(255, 255, 255, 0.12) !important;
}

.param-tile--active {
  border-color: #26a69a;
  background: rgba(38, 166, 154, 0.18) !important;
}

.status-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
}

.station-map-wrap {
  height: 360px;
  border-radius: 12px;
  overflow: hidden;
}

.concern-item {
  border-radius: 8px;
  transition: background 0.15s ease;
}

.concern-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.concern-item--active {
  background: rgba(38, 166, 154, 0.18);
  outline: 1px solid rgba(38, 166, 154, 0.5);
}

.form-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.06);
}

.form-field :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.5);
}
</style>
