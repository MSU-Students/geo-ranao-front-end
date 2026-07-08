<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Same Lake Lanao background as the Fish Dashboard -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />
    <div class="absolute-full bg-overlay" />

    <div class="z-top full-width q-pa-md" style="max-width: 1300px">
      <!-- Header -->
      <div class="text-center q-mb-md">
        <h4 class="text-weight-bolder q-my-xs text-white drop-shadow">Water Quality Dashboard</h4>
        <p class="text-grey-3 drop-shadow-soft q-mb-none">
          Environmental monitoring overview of Lake Lanao — for agency awareness and reporting
        </p>
      </div>

      <!-- Reading Period -->
      <q-card class="glass-morph q-pa-md q-mb-md">
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-grey-3 text-caption">Reading Period</span>
          <span class="text-white text-weight-bold">{{ months[selectedMonthIndex] }}</span>
        </div>
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
          dark
        />
        <div class="row justify-between text-caption text-grey-5">
          <span>{{ months[0] }}</span>
          <span>{{ months[months.length - 1] }}</span>
        </div>
        <div class="text-caption text-grey-5 q-mt-sm">
          <q-icon name="info" size="14px" class="q-mr-xs" />
          Simulated monthly readings — real data collection is not connected yet.
        </div>
      </q-card>

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
            <q-icon name="eco" :style="{ color: STATUS_COLORS[overallStatus] }" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ STATUS_LABELS[overallStatus] }}</div>
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
                      <span class="status-dot" :style="{ background: STATUS_COLORS[paramStatus(param)] }" />
                    </div>
                    <div class="text-white text-subtitle1 text-weight-bold">
                      {{ formatReading(lakeAverage(param, selectedMonthIndex), param) }}
                    </div>
                    <div class="row items-center justify-between no-wrap">
                      <span
                        class="text-caption"
                        :class="paramDelta(param) <= 0 ? 'text-positive' : 'text-negative'"
                        v-if="selectedMonthIndex > 0"
                      >
                        <q-icon :name="paramDeltaImproved(param) ? 'trending_down' : 'trending_up'" size="12px" />
                        {{ Math.abs(paramDelta(param)).toFixed(param.decimals) }}
                      </span>
                      <span v-else class="text-caption text-grey-5">—</span>
                      <TrendSparkline :values="sparklineValues(param)" :color="STATUS_COLORS[paramStatus(param)]" />
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
                <span class="status-chip" :style="{ background: STATUS_COLORS[paramStatus(selectedParam)] }">
                  {{ STATUS_LABELS[paramStatus(selectedParam)] }}
                </span>
              </div>
              <ParameterTrendChart
                :months="months"
                :values="sparklineValues(selectedParam)"
                :unit="selectedParam.unit"
                :decimals="selectedParam.decimals"
                color="#4dd0e1"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Status Distribution + Sites of Concern -->
        <div class="col-12 col-md-5">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="text-white text-subtitle1 text-weight-medium q-mb-sm">
                Site Status Distribution
              </div>
              <StatusDistributionBar :counts="statusCounts(selectedParam, selectedMonthIndex)" />

              <q-separator class="q-my-md" style="background: rgba(255, 255, 255, 0.12)" />

              <div class="text-white text-subtitle2 text-weight-medium q-mb-sm">
                Sites of Concern
              </div>
              <q-list dark dense>
                <q-item v-for="s in sitesOfConcern" :key="s.siteId" class="q-px-none">
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

      <!-- Footer Actions -->
      <div class="row q-gutter-sm">
        <q-btn
          color="white"
          text-color="dark"
          label="Back to Home"
          icon="arrow_back"
          unelevated
          rounded
          @click="$router.push('/')"
        />
        <q-btn
          color="teal"
          label="Record Water Quality Data"
          icon="add"
          unelevated
          rounded
          @click="$router.push('/researcher/upload/water-quality')"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TrendSparkline from 'src/components/charts/TrendSparkline.vue';
import ParameterTrendChart from 'src/components/charts/ParameterTrendChart.vue';
import StatusDistributionBar from 'src/components/charts/StatusDistributionBar.vue';
import {
  waterQualityParameterGroups,
  allWaterQualityParams,
  months,
  generateReading,
  formatReading,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_LEVELS,
  type WaterQualityParam,
  type StatusLevel,
} from 'src/composables/useWaterQualityModel';

interface Site {
  siteId: string;
  stationId: string;
}

const sites = ref<Site[]>([]);
const selectedMonthIndex = ref(months.length - 1);
const selectedParamKey = ref(allWaterQualityParams[0]!.key);

onMounted(() => {
  fetch('/geo/WQ-All-Sampling-Sites.geojson')
    .then((res) => res.json())
    .then((geojson: GeoJSON.FeatureCollection) => {
      sites.value = geojson.features.map((feature) => {
        const props = feature.properties as unknown as { SITE_ID: string; STATION_ID: string };
        return { siteId: props.SITE_ID, stationId: props.STATION_ID };
      });
    })
    .catch((err) => console.error('Failed to load water quality sampling sites GeoJSON:', err));
});

const selectedParam = computed(() =>
  allWaterQualityParams.find((p) => p.key === selectedParamKey.value) ?? null,
);

function lakeAverage(param: WaterQualityParam, monthIndex: number): number {
  if (sites.value.length === 0) return (param.min + param.max) / 2;
  const total = sites.value.reduce(
    (sum, site) => sum + generateReading(site.siteId, monthIndex, param),
    0,
  );
  return total / sites.value.length;
}

function sparklineValues(param: WaterQualityParam): number[] {
  return months.map((_, i) => lakeAverage(param, i));
}

function paramStatus(param: WaterQualityParam): StatusLevel {
  return param.getStatus(lakeAverage(param, selectedMonthIndex.value));
}

function paramDelta(param: WaterQualityParam): number {
  return lakeAverage(param, selectedMonthIndex.value) - lakeAverage(param, selectedMonthIndex.value - 1);
}

// "Improved" means the status rank moved toward good (lower index), not just
// a raw numeric decrease — direction of "better" varies per parameter.
function paramDeltaImproved(param: WaterQualityParam): boolean {
  if (selectedMonthIndex.value === 0) return true;
  const currentStatus = param.getStatus(lakeAverage(param, selectedMonthIndex.value));
  const previousStatus = param.getStatus(lakeAverage(param, selectedMonthIndex.value - 1));
  return STATUS_LEVELS.indexOf(currentStatus) <= STATUS_LEVELS.indexOf(previousStatus);
}

function statusCounts(param: WaterQualityParam, monthIndex: number): Record<StatusLevel, number> {
  const counts: Record<StatusLevel, number> = { good: 0, warning: 0, serious: 0, critical: 0 };
  sites.value.forEach((site) => {
    const value = generateReading(site.siteId, monthIndex, param);
    counts[param.getStatus(value)]++;
  });
  return counts;
}

const sitesNeedingAttention = computed(() => {
  const flagged = new Set<string>();
  sites.value.forEach((site) => {
    const isFlagged = allWaterQualityParams.some((param) => {
      const status = param.getStatus(generateReading(site.siteId, selectedMonthIndex.value, param));
      return status === 'serious' || status === 'critical';
    });
    if (isFlagged) flagged.add(site.siteId);
  });
  return flagged.size;
});

const overallStatus = computed<StatusLevel>(() => {
  if (sites.value.length === 0) return 'good';
  let goodCount = 0;
  let total = 0;
  sites.value.forEach((site) => {
    allWaterQualityParams.forEach((param) => {
      total++;
      const status = param.getStatus(generateReading(site.siteId, selectedMonthIndex.value, param));
      if (status === 'good') goodCount++;
    });
  });
  const ratio = goodCount / total;
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.6) return 'warning';
  if (ratio >= 0.4) return 'serious';
  return 'critical';
});

const sitesOfConcern = computed(() => {
  const param = selectedParam.value;
  if (!param) return [];
  return sites.value
    .map((site) => {
      const value = generateReading(site.siteId, selectedMonthIndex.value, param);
      return { ...site, status: param.getStatus(value) };
    })
    .filter((s) => s.status === 'serious' || s.status === 'critical')
    .sort((a, b) => STATUS_LEVELS.indexOf(b.status) - STATUS_LEVELS.indexOf(a.status))
    .slice(0, 6);
});
</script>

<style scoped>
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
</style>
