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
        <q-chip
          v-if="isSampleDataInUse"
          color="amber-9"
          text-color="white"
          size="sm"
          icon="science"
          class="q-mt-sm text-weight-bold"
        >
          Sample data in use
        </q-chip>
      </div>

      <!-- Top Summary Cards (All Years) -->
      <div class="row q-col-gutter-md q-mb-lg justify-center">
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="set_meal" color="teal-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ species.length }}</div>
            <div class="text-grey-3 text-caption">Total Species (All Years)</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="crisis_alert" color="blue-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ endemicCount }}</div>
            <div class="text-grey-3 text-caption">Endemic Cyprinids (All Years)</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="warning" color="orange-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ invasiveCount }}</div>
            <div class="text-grey-3 text-caption">Invasive Species (All Years)</div>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="glass-morph text-center q-pa-sm">
            <q-icon name="dangerous" color="red-3" size="md" />
            <div class="text-h5 text-white text-weight-bold">{{ criticallyEndangeredCount }}</div>
            <div class="text-grey-3 text-caption">Critically Endangered (All Years)</div>
          </q-card>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- CURRENT-YEAR OBSERVATION SUMMARY                -->
      <!-- ═══════════════════════════════════════════════ -->
      <div class="text-white text-h6 text-weight-bold q-mb-sm row items-center justify-between">
        <div>
          <q-icon name="event_available" color="teal-3" class="q-mr-sm" />
          {{ activeSummaryYear }} Recorded Observations Summary
        </div>
        <q-chip outline color="teal-3" text-color="white" size="sm">
          {{ currentYearData.records }} recorded observations · {{ currentYearData.individuals }} individuals
        </q-chip>
      </div>

      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Category Split -->
        <div class="col-12 col-md-4">
          <q-card class="glass-morph full-height q-pa-md">
            <div class="text-white text-subtitle2 text-weight-medium q-mb-sm">Category Composition</div>
            <div class="q-gutter-y-sm">
              <div>
                <div class="row justify-between text-caption text-grey-3 q-mb-xs">
                  <span>Endemic Cyprinids</span>
                  <span>{{ currentYearData.endemicRecords }} ({{ currentYearData.endemicPct }}%)</span>
                </div>
                <q-linear-progress :value="currentYearData.records ? currentYearData.endemicRecords / currentYearData.records : 0" color="blue-7" track-color="grey-8" rounded size="8px" />
              </div>
              <div>
                <div class="row justify-between text-caption text-grey-3 q-mb-xs">
                  <span>Invasive Species</span>
                  <span>{{ currentYearData.invasiveRecords }} ({{ currentYearData.invasivePct }}%)</span>
                </div>
                <q-linear-progress :value="currentYearData.records ? currentYearData.invasiveRecords / currentYearData.records : 0" color="red-7" track-color="grey-8" rounded size="8px" />
              </div>
              <div>
                <div class="row justify-between text-caption text-grey-3 q-mb-xs">
                  <span>General Catch</span>
                  <span>{{ currentYearData.generalRecords }} ({{ currentYearData.generalPct }}%)</span>
                </div>
                <q-linear-progress :value="currentYearData.records ? currentYearData.generalRecords / currentYearData.records : 0" color="orange-7" track-color="grey-8" rounded size="8px" />
              </div>
            </div>
          </q-card>
        </div>

        <!-- Year-over-Year (YoY) Change -->
        <div class="col-12 col-md-4">
          <q-card class="glass-morph full-height q-pa-md">
            <div class="text-white text-subtitle2 text-weight-medium q-mb-sm">
              Year-over-Year Comparison
              <span v-if="yoyComparison" class="text-caption text-grey-4">vs {{ yoyComparison.prevYear }}</span>
            </div>
            <div v-if="yoyComparison" class="row q-col-gutter-sm text-center q-pt-sm">
              <div class="col-6">
                <div class="text-caption text-grey-3">Observation Records</div>
                <div class="text-h6 text-weight-bold" :class="yoyComparison.recDiff >= 0 ? 'text-teal-3' : 'text-red-3'">
                  {{ yoyComparison.recDiff >= 0 ? '+' : '' }}{{ yoyComparison.recDiff }}
                </div>
                <div class="text-caption text-grey-4">
                  {{ yoyComparison.recPct != null ? (yoyComparison.recPct >= 0 ? `+${yoyComparison.recPct}%` : `${yoyComparison.recPct}%`) : '—' }}
                </div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-3">Recorded Individuals</div>
                <div class="text-h6 text-weight-bold" :class="yoyComparison.indDiff >= 0 ? 'text-teal-3' : 'text-red-3'">
                  {{ yoyComparison.indDiff >= 0 ? '+' : '' }}{{ yoyComparison.indDiff }}
                </div>
                <div class="text-caption text-grey-4">
                  {{ yoyComparison.indPct != null ? (yoyComparison.indPct >= 0 ? `+${yoyComparison.indPct}%` : `${yoyComparison.indPct}%`) : '—' }}
                </div>
              </div>
            </div>
            <div v-else class="text-center text-grey-4 q-py-md text-caption">
              No prior year data available for YoY comparison.
            </div>
          </q-card>
        </div>

        <!-- Top LGUs & First-Time Species -->
        <div class="col-12 col-md-4">
          <q-card class="glass-morph full-height q-pa-md">
            <div class="text-white text-subtitle2 text-weight-medium q-mb-xs">Top Active Municipalities</div>
            <div v-if="currentYearData.topLGUs.length" class="row q-gutter-xs q-mb-sm">
              <q-chip v-for="lgu in currentYearData.topLGUs" :key="lgu.name" size="xs" color="teal-9" text-color="white">
                {{ lgu.name }}: <strong>&nbsp;{{ lgu.count }}</strong>
              </q-chip>
            </div>
            <div v-else class="text-caption text-grey-4 q-mb-sm">No municipal records yet.</div>

            <div class="text-white text-subtitle2 text-weight-medium q-mb-xs">First-Time Species Recorded</div>
            <div v-if="newSpeciesFirstTime.length" class="row q-gutter-xs">
              <q-chip v-for="sp in newSpeciesFirstTime" :key="sp" size="xs" color="blue-9" text-color="white" icon="star">
                {{ sp }}
              </q-chip>
            </div>
            <div v-else class="text-caption text-grey-4">
              None recorded for the first time in {{ activeSummaryYear }}.
            </div>
          </q-card>
        </div>
      </div>

      <!-- Data Quality & Accounting Strip -->
      <div v-if="fullTimeSeries" class="row items-center justify-between glass-morph q-pa-sm q-mb-lg rounded-borders text-caption text-grey-3">
        <div class="row items-center q-gutter-x-md">
          <span><strong>Data Quality:</strong> {{ fullTimeSeries.dataQuality.totalRecords }} total recorded observations</span>
          <span v-if="fullTimeSeries.dataQuality.undatedRecords > 0" class="text-amber-3">
            ⚠ {{ fullTimeSeries.dataQuality.undatedRecords }} Undated
          </span>
          <span v-if="fullTimeSeries.dataQuality.unmatchedRecords > 0" class="text-amber-3">
            ⚠ {{ fullTimeSeries.dataQuality.unmatchedRecords }} Unmatched LGU
          </span>
          <span v-if="fullTimeSeries.dataQuality.notOnMapRecords > 0" class="text-amber-3">
            ⚠ {{ fullTimeSeries.dataQuality.notOnMapRecords }} Coordinates missing
          </span>
        </div>
        <div class="text-grey-4">
          Wording: Recorded observations only (not absolute population or abundance).
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
              <q-item v-if="loading">
                <q-item-section class="text-center text-grey-4 q-py-lg">
                  <q-spinner color="teal-4" size="24px" />
                </q-item-section>
              </q-item>
              <q-item v-else-if="filteredSpecies.length === 0">
                <q-item-section class="text-center text-grey-4 q-py-lg">
                  {{ species.length === 0 ? 'No approved fish observations yet.' : 'No species found.' }}
                </q-item-section>
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
                  :value="species.length ? s.count / species.length : 0"
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
                  <div class="text-grey-4 text-caption">{{ endemicCount }} cyprinid species</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card class="glass-morph action-card" @click="activeFilter = 'invasive'">
                <q-card-section class="text-center q-pa-md">
                  <q-icon name="warning" color="orange-3" size="lg" />
                  <div class="text-white text-weight-medium q-mt-sm">Invasive</div>
                  <div class="text-grey-4 text-caption">{{ invasiveCount }} recorded species</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════ -->
      <!-- YEARLY OBSERVATION TREND SECTION                -->
      <!-- ═══════════════════════════════════════════════ -->
      <div class="text-white text-h6 text-weight-bold q-mb-sm q-mt-lg row items-center justify-between">
        <div>
          <q-icon name="bar_chart" color="teal-3" class="q-mr-sm" />
          Yearly Observation Trend
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-btn-toggle
            v-model="fishYearMode"
            dense
            no-caps
            rounded
            toggle-color="teal-8"
            color="grey-9"
            text-color="grey-4"
            size="xs"
            :options="[
              { label: 'Yearly', value: 'year' },
              { label: 'Cumulative', value: 'cumulative' }
            ]"
          />
        </div>
      </div>
      <p class="text-grey-4 text-caption q-mb-sm">
        Recorded fish observation history across Lake Lanao. Filter by municipality, category, or target species.
      </p>

      <q-card class="glass-morph q-mb-lg">
        <q-card-section>
          <!-- Filters row -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-4">
              <q-select
                v-model="trendMunicipality"
                :options="trendMuniOptions"
                label="Municipality"
                outlined
                dense
                dark
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="trendCategory"
                :options="trendCategoryOptions"
                label="Category"
                outlined
                dense
                dark
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="trendSpecies"
                :options="trendSpeciesOptions"
                label="Species"
                outlined
                dense
                dark
              />
            </div>
          </div>

          <!-- Stacked SVG Trend Chart -->
          <div v-if="trendTimeSeries && trendTimeSeries.years.length > 0">
            <FishYearChart
              :years="trendTimeSeries.years"
              :yearly="trendTimeSeries.yearly"
              :selected-year="fishYear"
              :dark="true"
              :height="260"
              @select-year="fishYear = $event"
            />
          </div>
          <div v-else class="text-center text-grey-4 q-py-xl">
            No observations recorded matching the selected trend filters.
          </div>
        </q-card-section>
      </q-card>

      <!-- Distribution Explorer -->
      <div class="text-white text-h6 text-weight-bold q-mb-sm q-mt-lg">
        <q-icon name="explore" color="teal-3" class="q-mr-sm" />
        Geographic & Temporal Distribution
      </div>
      <q-card class="glass-morph q-mb-lg">
        <q-card-section>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-4">
              <q-select v-model="distYear" :options="distYearOptions" label="Year" outlined dense dark />
            </div>
            <div class="col-12 col-sm-4">
              <q-select v-model="distMunicipality" :options="distMuniOptions" label="Municipality" outlined dense dark />
            </div>
            <div class="col-12 col-sm-4">
              <q-select v-model="distCategory" :options="distCategoryOptions" label="Category" outlined dense dark emit-value map-options />
            </div>
          </div>
          <q-list dark separator>
            <q-item v-for="item in distributionResults" :key="item.speciesName">
              <q-item-section>
                <q-item-label class="text-white text-weight-bold">{{ item.speciesName }}</q-item-label>
                <q-item-label caption class="text-grey-4">{{ item.type }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-right">
                <q-item-label class="text-grey-3">Avg Count: {{ item.avgCount.toFixed(1) }}</q-item-label>
                <q-item-label caption class="text-grey-5">Avg Depth: {{ item.avgDepth.toFixed(1) }}m</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="distributionResults.length === 0">
              <q-item-section class="text-center text-grey-4 q-py-sm">No species found for these filters.</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Timeline Comparison -->
      <div class="text-white text-h6 text-weight-bold q-mb-sm q-mt-lg">
        <q-icon name="timeline" color="teal-3" class="q-mr-sm" />
        Timeline Comparison
      </div>
      <p class="text-grey-4 text-caption q-mb-md">Compare up to 2 timelines (count, length, weight, bathymetry/depth) side-by-side.</p>
      
      <div class="row q-col-gutter-md q-mb-xl">
        <!-- Series A -->
        <div class="col-12 col-md-6">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row q-col-gutter-sm q-mb-md">
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineAYear" :options="timelineYearOptions" label="Year" outlined dense dark />
                </div>
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineAMuni" :options="distMuniOptions" label="Municipality" outlined dense dark />
                </div>
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineASpecies" :options="speciesSelectOptions" label="Species" outlined dense dark />
                </div>
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineAMetric" :options="metricSelectOptions" label="Metric" outlined dense dark emit-value map-options />
                </div>
              </div>
              <ParameterTrendChart
                v-if="timelineASeries.values.length"
                :months="timelineASeries.months"
                :values="timelineASeries.values"
                :unit="timelineASeries.unit"
                color="#4dd0e1"
              />
              <div v-else class="text-center text-grey-5 q-py-xl">Not enough data to graph for this year</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Series B -->
        <div class="col-12 col-md-6">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row q-col-gutter-sm q-mb-md">
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineBYear" :options="timelineYearOptions" label="Year" outlined dense dark />
                </div>
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineBMuni" :options="distMuniOptions" label="Municipality" outlined dense dark />
                </div>
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineBSpecies" :options="speciesSelectOptions" label="Species" outlined dense dark />
                </div>
                <div class="col-6 col-sm-3">
                  <q-select v-model="timelineBMetric" :options="metricSelectOptions" label="Metric" outlined dense dark emit-value map-options />
                </div>
              </div>
              <ParameterTrendChart
                v-if="timelineBSeries.values.length"
                :months="timelineBSeries.months"
                :values="timelineBSeries.values"
                :unit="timelineBSeries.unit"
                color="#ba68c8"
              />
              <div v-else class="text-center text-grey-5 q-py-xl">Not enough data to graph for this year</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BackButton from 'components/BackButton.vue';
import ParameterTrendChart from 'components/charts/ParameterTrendChart.vue';
import {
  fetchFishObservations,
  hasSampleData,
  CONSERVATION_STATUS_LABELS,
  type FishObservation,
  type ConservationStatus,
} from 'src/composables/useFishObservations';
import {
  activeFilter,
  search,
  distYear,
  distMunicipality,
  distCategory,
  timelineAYear,
  timelineBYear,
  timelineAMuni,
  timelineBMuni,
  timelineASpecies,
  timelineAMetric,
  timelineBSpecies,
  timelineBMetric,
  trendMunicipality,
  trendCategory,
  trendSpecies,
} from 'src/composables/useFishDashboardState';
import { fishYear, fishYearMode } from 'src/composables/useFishYearState';
import { resolveFishMunicipality, yearOf } from 'src/composables/useFishMunicipality';
import { loadMunicipalZones, type MunicipalZone } from 'src/composables/useMunicipalZones';
import {
  aggregateFishTimeSeries,
  getDistinctYears,
  individualCountOf,
  type TimeSeriesResult,
} from 'src/composables/useFishTimeSeries';
import FishYearChart from 'src/components/charts/FishYearChart.vue';

// search comes from useFishDashboardState now (session-persisted, see that file).
const loading = ref(false);

interface Fish {
  id: string;
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

// One row per distinct species (not per sighting) — approved observations of
// the same species are grouped, and the most recently observed one is shown
// as the representative record.
function toSpeciesList(observations: FishObservation[]): Fish[] {
  const bySpecies = new Map<string, FishObservation[]>();
  for (const obs of observations) {
    if (obs.category === 'GENERAL') continue; // unidentified catch — not a species profile
    const key = `${obs.category}|${obs.speciesScientific ?? ''}|${obs.speciesCommon ?? ''}`;
    const bucket = bySpecies.get(key);
    if (bucket) bucket.push(obs);
    else bySpecies.set(key, [obs]);
  }
  return [...bySpecies.entries()].map(([key, obs]) => {
    const rep = obs.reduce((a, b) => ((a.dateObserved ?? '') > (b.dateObserved ?? '') ? a : b));
    return {
      id: key,
      commonName: rep.speciesCommon || rep.speciesScientific || 'Unnamed species',
      scientificName: rep.speciesScientific || '—',
      type: rep.category === 'ENDEMIC' ? 'endemic' : 'invasive',
      status: CONSERVATION_STATUS_LABELS[rep.conservationStatus],
      length: rep.trueLengthCm != null ? `${rep.trueLengthCm} cm` : '—',
      weight: rep.weightG != null ? `${rep.weightG} g` : '—',
      location: [rep.municipal, rep.barangay].filter(Boolean).join(', ') || 'Lake Lanao',
      date: rep.dateObserved ?? 'Undated',
    };
  });
}

const species = ref<Fish[]>([]);
const rawObservations = ref<FishObservation[]>([]);
const municipalZones = ref<MunicipalZone[]>([]);
const isSampleDataInUse = computed(() => hasSampleData(rawObservations.value));

onMounted(async () => {
  loading.value = true;
  try {
    const [observations, zones] = await Promise.all([
      fetchFishObservations({ status: 'APPROVED' }),
      loadMunicipalZones().catch(() => [] as MunicipalZone[]),
    ]);
    rawObservations.value = observations;
    municipalZones.value = zones;
    species.value = toSpeciesList(observations);
  } catch (err) {
    console.error('Failed to load fish observations:', err);
  } finally {
    loading.value = false;
  }
});

// ── Time-Series & Current Year Computations ──
const distinctYears = computed<number[]>(() => getDistinctYears(rawObservations.value));

// Current Year selection: default to actual current calendar year, or fallback to the latest year with data
const currentCalendarYear = new Date().getFullYear();
const activeSummaryYear = computed<number>(() => {
  const yrs = distinctYears.value;
  if (yrs.includes(currentCalendarYear)) return currentCalendarYear;
  return yrs.length > 0 ? yrs[yrs.length - 1]! : currentCalendarYear;
});

const previousSummaryYear = computed<number | null>(() => {
  const yrs = distinctYears.value;
  const current = activeSummaryYear.value;
  const prevCandidates = yrs.filter((y) => y < current);
  return prevCandidates.length > 0 ? prevCandidates[prevCandidates.length - 1]! : null;
});

// Full Time Series aggregation (pure, cached)
const fullTimeSeries = computed<TimeSeriesResult | null>(() => {
  if (rawObservations.value.length === 0) return null;
  return aggregateFishTimeSeries(rawObservations.value, municipalZones.value, {
    mode: fishYearMode.value,
  });
});

// Trend filtered time series (with filter applied)
const trendCategoryOptions = [
  { label: 'All Categories', value: 'All' },
  { label: 'Endemic', value: 'ENDEMIC' },
  { label: 'Invasive', value: 'INVASIVE' },
  { label: 'General', value: 'GENERAL' },
];

const trendMuniOptions = computed<string[]>(() => {
  const munis = new Set<string>();
  if (fullTimeSeries.value) {
    for (const yrData of Object.values(fullTimeSeries.value.yearly)) {
      Object.keys(yrData.byMunicipality).forEach((m) => munis.add(m));
    }
  }
  return ['All Municipalities', ...Array.from(munis).sort()];
});

const trendSpeciesOptions = computed<string[]>(() => {
  const list = new Set<string>();
  rawObservations.value.forEach((o) => {
    const name = o.speciesCommon || o.speciesScientific;
    if (name) list.add(name);
  });
  return ['All Species', ...Array.from(list).sort()];
});

const trendTimeSeries = computed<TimeSeriesResult | null>(() => {
  if (rawObservations.value.length === 0) return null;
  return aggregateFishTimeSeries(rawObservations.value, municipalZones.value, {
    mode: fishYearMode.value,
    targetCategory: trendCategory.value !== 'All' ? (trendCategory.value as 'ENDEMIC' | 'INVASIVE' | 'GENERAL') : undefined,
    targetMunicipality: trendMunicipality.value !== 'All Municipalities' ? trendMunicipality.value : undefined,
    targetSpecies: trendSpecies.value !== 'All Species' ? trendSpecies.value : undefined,
  });
});

// Current-Year Summary Metrics
const currentYearData = computed(() => {
  const yr = activeSummaryYear.value;
  const fts = fullTimeSeries.value;
  if (!fts || !fts.yearly[yr]) {
    return {
      records: 0,
      individuals: 0,
      endemicRecords: 0,
      invasiveRecords: 0,
      generalRecords: 0,
      endemicPct: 0,
      invasivePct: 0,
      generalPct: 0,
      topLGUs: [] as { name: string; count: number }[],
      topSpecies: [] as { name: string; count: number }[],
    };
  }
  const d = fts.yearly[yr]!;
  const rec = d.records;
  const endRec = d.byCategory.ENDEMIC.records;
  const invRec = d.byCategory.INVASIVE.records;
  const genRec = d.byCategory.GENERAL.records;

  const topLGUs = Object.entries(d.byMunicipality)
    .map(([name, m]) => ({ name, count: m.records }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topSpecies = Object.entries(d.bySpecies)
    .map(([, s]) => ({ name: s.commonName || s.scientificName || 'Unnamed', count: s.records }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    records: rec,
    individuals: d.individuals,
    endemicRecords: endRec,
    invasiveRecords: invRec,
    generalRecords: genRec,
    endemicPct: rec > 0 ? Math.round((endRec / rec) * 100) : 0,
    invasivePct: rec > 0 ? Math.round((invRec / rec) * 100) : 0,
    generalPct: rec > 0 ? Math.round((genRec / rec) * 100) : 0,
    topLGUs,
    topSpecies,
  };
});

// Year-over-Year comparison metrics
const yoyComparison = computed(() => {
  const curr = currentYearData.value;
  const prevYr = previousSummaryYear.value;
  const fts = fullTimeSeries.value;
  if (!prevYr || !fts || !fts.yearly[prevYr]) {
    return null;
  }
  const prev = fts.yearly[prevYr]!;
  const recDiff = curr.records - prev.records;
  const recPct = prev.records > 0 ? Math.round((recDiff / prev.records) * 100) : null;
  const indDiff = curr.individuals - prev.individuals;
  const indPct = prev.individuals > 0 ? Math.round((indDiff / prev.individuals) * 100) : null;
  return {
    prevYear: prevYr,
    recDiff,
    recPct,
    indDiff,
    indPct,
  };
});

// New species recorded for the first time in the current summary year
const newSpeciesFirstTime = computed<string[]>(() => {
  const yr = activeSummaryYear.value;
  const fts = fullTimeSeries.value;
  if (!fts || !fts.yearly[yr]) return [];
  const currentSpeciesNames = Object.keys(fts.yearly[yr]!.bySpecies);
  
  // Species that appeared in any year before this
  const earlierSpecies = new Set<string>();
  for (const [yStr, data] of Object.entries(fts.yearly)) {
    if (Number(yStr) < yr) {
      Object.keys(data.bySpecies).forEach((sp) => earlierSpecies.add(sp));
    }
  }

  return currentSpeciesNames
    .filter((sp) => !earlierSpecies.has(sp))
    .map((spKey) => {
      const sp = fts.yearly[yr]!.bySpecies[spKey];
      return sp?.commonName || sp?.scientificName || spKey;
    });
});

const filteredSpecies = computed(() =>
  species.value.filter((f) => {
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

const endemicCount = computed(() => species.value.filter((f) => f.type === 'endemic').length);
const invasiveCount = computed(() => species.value.filter((f) => f.type === 'invasive').length);

const CONSERVATION_STATUS_COLORS: Record<ConservationStatus, string> = {
  CRITICALLY_ENDANGERED: 'red',
  ENDANGERED: 'orange',
  VULNERABLE: 'yellow',
  LEAST_CONCERN: 'green',
  NOT_EVALUATED: 'grey',
};

const conservationStats = computed(() => {
  const order: ConservationStatus[] = ['CRITICALLY_ENDANGERED', 'ENDANGERED', 'VULNERABLE', 'LEAST_CONCERN'];
  return order.map((status) => ({
    label: CONSERVATION_STATUS_LABELS[status],
    count: species.value.filter((f) => f.status === CONSERVATION_STATUS_LABELS[status]).length,
    color: CONSERVATION_STATUS_COLORS[status],
  }));
});

const criticallyEndangeredCount = computed(
  () => species.value.filter((f) => f.status === CONSERVATION_STATUS_LABELS.CRITICALLY_ENDANGERED).length,
);

function selectFish(fish: Fish) {
  selectedFish.value = fish;
}

// --- Distribution Explorer Logic ---
// distYear/distMunicipality/distCategory come from useFishDashboardState now
// (session-persisted, see that file).
const distCategoryOptions = [
  { label: 'All Categories', value: 'All' },
  { label: 'Endemic', value: 'ENDEMIC' },
  { label: 'Invasive', value: 'INVASIVE' },
];

const distYearOptions = computed(() => {
  const years = new Set<string>();
  rawObservations.value.forEach(o => {
    const year = o.dateObserved?.split('-')[0];
    if (year) years.add(year);
  });
  return ['All Years', ...Array.from(years).sort().reverse()];
});

const distMuniOptions = computed(() => {
  const munis = new Set<string>();
  rawObservations.value.forEach(o => {
    if (o.municipal) munis.add(o.municipal);
  });
  return ['All Municipalities', ...Array.from(munis).sort()];
});

const distributionResults = computed(() => {
  const filtered = rawObservations.value.filter(o => {
    const y = o.dateObserved ? o.dateObserved.split('-')[0] : '';
    if (distYear.value !== 'All Years' && y !== distYear.value) return false;
    if (distMunicipality.value !== 'All Municipalities' && o.municipal !== distMunicipality.value) return false;
    if (distCategory.value !== 'All' && o.category !== distCategory.value) return false;
    return true;
  });

  const bySpecies = new Map<string, { count: number, depth: number, occ: number, type: string }>();
  filtered.forEach(o => {
    const name = o.speciesCommon || o.speciesScientific || 'Unnamed';
    const b = bySpecies.get(name) || { count: 0, depth: 0, occ: 0, type: o.category === 'ENDEMIC' ? 'Endemic Cyprinid' : (o.category === 'INVASIVE' ? 'Invasive Species' : 'General') };
    b.count += (o.count || 0);
    b.depth += (o.depthM || 0);
    b.occ += 1;
    bySpecies.set(name, b);
  });

  return Array.from(bySpecies.entries()).map(([name, data]) => ({
    speciesName: name,
    type: data.type,
    avgCount: data.occ ? data.count / data.occ : 0,
    avgDepth: data.occ ? data.depth / data.occ : 0,
  })).sort((a, b) => b.avgCount - a.avgCount);
});


// --- Timeline Comparison Logic ---
const speciesSelectOptions = computed(() => {
  const opts = new Set<string>();
  rawObservations.value.forEach(o => {
    if (o.speciesCommon) opts.add(o.speciesCommon);
    else if (o.speciesScientific) opts.add(o.speciesScientific);
  });
  return ['All Species', ...Array.from(opts).sort()];
});

const metricSelectOptions = [
  { label: 'Count (Individuals)', value: 'count' },
  { label: 'True Length (cm)', value: 'trueLengthCm' },
  { label: 'Weight (g)', value: 'weightG' },
  { label: 'Bathymetry / Depth (m)', value: 'depthM' },
];

const timelineYearOptions = computed(() => {
  const years = new Set<string>();
  rawObservations.value.forEach(o => {
    const year = o.dateObserved?.split('-')[0];
    if (year) years.add(year);
  });
  const sorted = Array.from(years).sort().reverse();
  if (!sorted.length) sorted.push(String(new Date().getFullYear()));
  return sorted;
});

// timelineAYear/timelineBYear/timelineAMuni/timelineBMuni/timelineASpecies/
// timelineAMetric/timelineBSpecies/timelineBMetric come from
// useFishDashboardState now (session-persisted, see that file).

function computeTimelineSeries(targetSpecies: string, targetMetric: string, targetYear: string, targetMuni: string) {
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(parseInt(targetYear), i, 1);
    months.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }));
  }

  const buckets = new Map<string, { sum: number, occ: number }>();
  months.forEach(m => buckets.set(m, { sum: 0, occ: 0 }));

  rawObservations.value.forEach(o => {
    const name = o.speciesCommon || o.speciesScientific || 'Unnamed';
    if (targetSpecies !== 'All Species' && name !== targetSpecies) return;
    if (targetMuni !== 'All Municipalities' && o.municipal !== targetMuni) return;
    
    if (o.dateObserved && o.dateObserved.startsWith(targetYear)) {
      const d = new Date(o.dateObserved);
      const mStr = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      const b = buckets.get(mStr);
      if (b) {
        let val = 0;
        if (targetMetric === 'count') val = o.count || 0;
        else if (targetMetric === 'trueLengthCm') val = o.trueLengthCm || 0;
        else if (targetMetric === 'weightG') val = o.weightG || 0;
        else if (targetMetric === 'depthM') val = o.depthM || 0;

        if (val > 0) {
          b.sum += val;
          b.occ += 1;
        }
      }
    }
  });

  const values = months.map(m => {
    const b = buckets.get(m)!;
    return b.occ > 0 ? b.sum / b.occ : 0;
  });

  let unit = '';
  if (targetMetric === 'trueLengthCm') unit = 'cm';
  else if (targetMetric === 'weightG') unit = 'g';
  else if (targetMetric === 'depthM') unit = 'm';

  if (values.every(v => v === 0)) {
    return { months, values: [], unit };
  }

  return { months, values, unit };
}

const timelineASeries = computed(() => computeTimelineSeries(timelineASpecies.value, timelineAMetric.value, timelineAYear.value, timelineAMuni.value));
const timelineBSeries = computed(() => computeTimelineSeries(timelineBSpecies.value, timelineBMetric.value, timelineBYear.value, timelineBMuni.value));
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
