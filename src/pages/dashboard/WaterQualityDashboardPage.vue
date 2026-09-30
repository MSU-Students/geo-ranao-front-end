<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden">
    <!-- Same Lake Lanao background as the Fish Dashboard -->
    <q-img
      src="https://phworldexpo.tpb.gov.ph/wp-content/uploads/2025/05/Lake-Lanao.png"
      class="absolute-full"
    />
    <div class="absolute-full bg-overlay" />

    <BackButton to="/map" />

    <div class="page-content full-width q-pa-md">
      <!-- Header -->
      <div class="text-center q-mb-md">
        <h4 class="text-weight-bolder q-my-xs text-white drop-shadow">Water Quality Dashboard</h4>
        <p class="text-grey-3 drop-shadow-soft q-mb-none">
          Environmental monitoring overview of Lake Lanao — for agency awareness and reporting
        </p>
      </div>

      <!-- Overview / Advanced Analytics split — the 9 analytics visualization
           types plus Station Comparison are specialist tools (PCA, time-lagged
           correlation, isopleth diagrams, stoichiometry) that most visitors
           checking "is the lake okay" never need to see. Overview is the
           default landing view; Advanced Analytics is opt-in. -->
      <q-tabs
        v-model="activeView"
        dense
        align="justify"
        indicator-color="teal"
        active-color="white"
        inactive-color="grey-5"
        class="view-tabs q-mb-md"
      >
        <q-tab name="overview" icon="dashboard" label="Overview" no-caps />
        <q-tab name="advanced" icon="insights" label="Advanced Analytics" no-caps />
      </q-tabs>

      <q-tab-panels v-model="activeView" class="view-tab-panels">
        <q-tab-panel name="overview" class="q-pa-none">

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

      <!-- Parameter Overview Grid — collapsed by default so browsing all 13
           parameters is optional, not something you have to scroll past
           every visit. The picker beside the 13-Month Trend chart (and the
           tiles here when expanded) both drive the same selectedParamKey. -->
      <q-card class="glass-morph q-mb-md">
        <q-expansion-item v-model="parameterOverviewExpanded" dense-toggle>
          <template #header>
            <q-item-section avatar>
              <q-icon name="science" color="blue-3" />
            </q-item-section>
            <q-item-section>
              <div class="text-white text-subtitle1 text-weight-medium">Parameter Overview</div>
              <div class="text-grey-4 text-caption">
                {{ selectedParam?.label ?? 'None selected' }} selected — tap to browse all {{ allWaterQualityParams.length }} parameters
              </div>
            </q-item-section>
          </template>

          <q-card-section>
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
        </q-expansion-item>
      </q-card>

      <!-- Detail Section -->
      <div class="row q-col-gutter-md q-mb-md" v-if="selectedParam">
        <!-- Trend Chart -->
        <div class="col-12 col-md-7">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm wrap">
                <span class="text-white text-subtitle1 text-weight-medium">
                  {{ selectedParam.label }} — 13-Month Trend
                </span>
                <div class="row items-center q-gutter-sm">
                  <span class="status-chip" :style="{ background: paramColor(selectedParam) }">
                    {{ paramStatusLabel(selectedParam) }}
                  </span>
                  <q-select
                    v-model="selectedParamKey"
                    :options="paramSelectOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    dark
                    class="form-field"
                    style="min-width: 180px"
                  >
                    <q-tooltip>Switch which parameter this trend shows</q-tooltip>
                  </q-select>
                </div>
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
                See the "Sites of Concern" panel below for the flagged stations.
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

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
                the research charts above, and the Advanced Analytics tab, to that site.
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
                both = Critical — for {{ selectedParam?.label ?? 'the selected parameter' }} only
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

        </q-tab-panel>

        <q-tab-panel name="advanced" class="q-pa-none">

      <!-- Type of Analytics Visualization -->
      <q-card class="glass-morph q-mb-md">
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm wrap">
            <span class="text-white text-subtitle1 text-weight-medium">
              <q-icon name="insights" color="teal-3" class="q-mr-xs" />
              Analytics Visualization
            </span>
            <q-select
              v-model="analyticsVizType"
              :options="analyticsVizOptions"
              emit-value
              map-options
              dense
              outlined
              dark
              class="form-field"
              label="Type of analytics visualization"
              style="min-width: 280px"
            />
          </div>

          <!-- Vertical Depth Profile — the only type built so far; every
               other option below is a placeholder until its own batch. -->
          <template v-if="analyticsVizType === 'vertical-depth-profile'">
            <div class="row items-center justify-between q-mb-sm wrap">
              <span class="text-white text-body2 text-weight-medium">Vertical Depth Profile</span>
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
              Select a station on the map below to inspect a specific site.
            </p>
            <template v-if="depthProfilePointsA.length || depthProfilePointsB.length">
              <div class="row q-col-gutter-sm justify-center">
                <div class="col-12 col-sm-6 col-md-4 text-center" v-if="depthProfileParamA">
                  <div class="text-grey-3 text-caption q-mb-xs">
                    {{ depthProfileParamA.label }}{{ depthProfileParamA.unit ? ` (${depthProfileParamA.unit})` : '' }}
                  </div>
                  <DepthProfileChart
                    :points="depthProfilePointsA"
                    :unit="depthProfileParamA.unit"
                    color="#ff8a65"
                    :decimals="depthProfileParamA.decimals"
                    :guideline-value="guidelineFor(depthProfileParamA)"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-4 text-center" v-if="depthProfileParamB">
                  <div class="text-grey-3 text-caption q-mb-xs">
                    {{ depthProfileParamB.label }}{{ depthProfileParamB.unit ? ` (${depthProfileParamB.unit})` : '' }}
                  </div>
                  <DepthProfileChart
                    :points="depthProfilePointsB"
                    :unit="depthProfileParamB.unit"
                    color="#4fc3f7"
                    :decimals="depthProfileParamB.decimals"
                    :guideline-value="guidelineFor(depthProfileParamB)"
                  />
                </div>
              </div>
              <!-- Legend -->
              <div class="row items-center justify-center q-gutter-md q-mt-sm">
                <div class="row items-center no-wrap" v-if="depthProfileParamA">
                  <span class="status-dot" style="background: #ff8a65" />
                  <span class="text-caption text-grey-4 q-ml-xs">{{ depthProfileParamA.label }}</span>
                </div>
                <div class="row items-center no-wrap" v-if="depthProfileParamB">
                  <span class="status-dot" style="background: #4fc3f7" />
                  <span class="text-caption text-grey-4 q-ml-xs">{{ depthProfileParamB.label }}</span>
                </div>
                <div class="row items-center no-wrap" v-if="guidelineFor(depthProfileParamA) !== undefined || guidelineFor(depthProfileParamB) !== undefined">
                  <span class="legend-dash" />
                  <span class="text-caption text-grey-4 q-ml-xs">DENR guideline</span>
                </div>
              </div>
              <div class="text-caption text-grey-5 q-mt-xs text-center">
                X-axis: value · Y-axis: depth (0m/Surface at top)
              </div>
            </template>
            <div v-else class="text-center text-grey-5 q-py-lg">No depth readings yet for this station/parameter.</div>
          </template>

          <!-- Faceted Vertical Depth Profiles -->
          <template v-else-if="analyticsVizType === 'faceted-depth-profiles'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Faceted Vertical Depth Profiles — {{ selectedParam?.label }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              {{ depthProfileStationId ?? '—' }}'s depth profile each month in the trailing window,
              side by side in chronological order. Months with no readings at this station/parameter
              are skipped rather than shown empty.
            </p>
            <q-scroll-area v-if="facetedProfiles.length" style="height: 320px">
              <div class="row no-wrap q-gutter-md q-pb-sm">
                <div v-for="f in facetedProfiles" :key="f.month" class="text-center" style="width: 160px; flex-shrink: 0">
                  <div class="text-grey-3 text-caption q-mb-xs">{{ f.month }}</div>
                  <DepthProfileChart
                    :points="f.points"
                    :unit="selectedParam?.unit ?? ''"
                    :decimals="selectedParam?.decimals ?? 1"
                    color="#4dd0e1"
                    :guideline-value="guidelineFor(selectedParam)"
                  />
                </div>
              </div>
            </q-scroll-area>
            <div v-else class="text-center text-grey-5 q-py-lg">No depth readings yet for this station/parameter.</div>
            <div v-if="facetedProfiles.length" class="row items-center justify-center q-gutter-md q-mt-sm">
              <div class="row items-center no-wrap">
                <span class="status-dot" style="background: #4dd0e1" />
                <span class="text-caption text-grey-4 q-ml-xs">{{ selectedParam?.label }}</span>
              </div>
              <div class="row items-center no-wrap" v-if="guidelineFor(selectedParam) !== undefined">
                <span class="legend-dash" />
                <span class="text-caption text-grey-4 q-ml-xs">DENR guideline</span>
              </div>
              <span class="text-caption text-grey-5">X: value · Y: depth (0m at top)</span>
            </div>
          </template>

          <!-- Multi-Depth Time-Series -->
          <template v-else-if="analyticsVizType === 'multi-depth-time-series'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Multi-Depth Time-Series — {{ selectedParam?.label }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              {{ depthProfileStationId ?? '—' }} — one line per sampled depth layer, over the trailing
              13-month window. A depth's line breaks wherever a month wasn't sampled at that depth,
              rather than interpolating across the gap.
            </p>
            <MultiDepthTrendChart
              v-if="multiDepthSeries.series.length"
              :months="multiDepthSeries.months"
              :series="multiDepthSeries.series"
              :decimals="selectedParam?.decimals ?? 1"
            />
            <div v-else class="text-center text-grey-5 q-py-lg">No depth readings yet for this station/parameter.</div>
          </template>

          <!-- Stoichiometric Ratio -->
          <template v-else-if="analyticsVizType === 'stoichiometric-ratio'">
            <div class="text-white text-body2 text-weight-medium q-mb-md">Nitrogen : Phosphorus Ratio</div>
            <div class="row q-col-gutter-md items-center q-mb-sm">
              <div class="col-12 col-sm-4 text-center">
                <div class="text-grey-4 text-caption">Current N:P (molar)</div>
                <div class="text-h4 text-white text-weight-bold q-my-xs">
                  {{ currentNPRatio.molarRatio !== null ? currentNPRatio.molarRatio.toFixed(1) : '—' }}
                </div>
                <span
                  v-if="npRatioInterpretation"
                  class="status-chip"
                  :style="{ background: npRatioInterpretation.color }"
                >
                  {{ npRatioInterpretation.label }}
                </span>
              </div>
              <div class="col-12 col-sm-8">
                <ParameterTrendChart
                  :months="npRatioTrend.months"
                  :values="npRatioTrend.values"
                  unit=""
                  :decimals="1"
                  color="#ba68c8"
                  :guideline-value="REDFIELD_NP_RATIO"
                  guideline-label="Redfield Ratio (16:1)"
                />
              </div>
            </div>
            <!-- Legend -->
            <div class="row items-center justify-center q-gutter-md q-mb-sm">
              <div class="row items-center no-wrap">
                <span class="status-dot" style="background: #4fc3f7" />
                <span class="text-caption text-grey-4 q-ml-xs">N-limited (&lt; 12)</span>
              </div>
              <div class="row items-center no-wrap">
                <span class="status-dot" style="background: #81c784" />
                <span class="text-caption text-grey-4 q-ml-xs">Near-balanced (12–20)</span>
              </div>
              <div class="row items-center no-wrap">
                <span class="status-dot" style="background: #ff8a65" />
                <span class="text-caption text-grey-4 q-ml-xs">P-limited (&gt; 20)</span>
              </div>
              <div class="row items-center no-wrap">
                <span class="legend-dash" />
                <span class="text-caption text-grey-4 q-ml-xs">Redfield ratio (16:1)</span>
              </div>
            </div>
            <div class="text-caption text-grey-5">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              Computed from measured nitrate, nitrite, and ammonia (→ total N) and phosphate (→ total P),
              converted to molar units. The 16:1 Redfield ratio is a reference point, not a hard threshold —
              well below it, nitrogen is the more likely growth-limiting nutrient for algae; well above it,
              phosphorus is. A value near 16 isn't necessarily "balanced," just inconclusive from this ratio alone.
            </div>
          </template>

          <!-- Interactive Statistical Correlation -->
          <template v-else-if="analyticsVizType === 'correlation-heatmap'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Interactive Statistical Correlation
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              Pearson correlation (r) between every pair of the 13 parameters, computed from every
              approved reading ever recorded (not just the current Reading Period — a correlation
              needs many paired observations to mean anything). Hover a cell for the exact r and how
              many paired readings it's based on.
            </p>
            <CorrelationHeatmap :labels="correlationLabels" :matrix="correlationMatrix" />
            <div class="text-caption text-grey-5 q-mt-md">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              r ranges from −1 (perfectly inverse) to +1 (perfectly matched); 0 means no linear
              relationship. Cells built from very few paired readings (see the tooltip's n) are far
              less reliable than they might look — this view doesn't filter those out, so check n
              before reading much into an extreme-looking cell.
            </div>
          </template>

          <!-- Time-Lagged Cross-Correlation -->
          <template v-else-if="analyticsVizType === 'time-lagged-correlation'">
            <div class="row items-center justify-between q-mb-sm wrap">
              <span class="text-white text-body2 text-weight-medium">Time-Lagged Cross-Correlation</span>
              <div class="row q-gutter-sm">
                <q-select
                  v-model="timeLagParamKeyA"
                  :options="paramSelectOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  dark
                  label="Parameter A (lag 0)"
                  class="form-field"
                  style="min-width: 170px"
                />
                <q-select
                  v-model="timeLagParamKeyB"
                  :options="paramSelectOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  dark
                  label="Parameter B (shifted)"
                  class="form-field"
                  style="min-width: 170px"
                />
              </div>
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              Correlates {{ timeLagParamA?.label }} against {{ timeLagParamB?.label }} 0–6 months later,
              using the lake-wide monthly average across the platform's full recorded history.
            </p>
            <div class="time-lag-bars">
              <div v-for="res in timeLagResults" :key="res.lag" class="time-lag-bar-col">
                <div class="time-lag-bar-value">{{ res.r !== null ? res.r.toFixed(2) : '—' }}</div>
                <div class="time-lag-bar-track">
                  <div
                    v-if="res.r !== null"
                    class="time-lag-bar-fill"
                    :class="res.r < 0 ? 'time-lag-bar-fill--neg' : 'time-lag-bar-fill--pos'"
                    :style="{ height: `${Math.abs(res.r) * 100}%` }"
                  />
                </div>
                <div class="time-lag-bar-label">t+{{ res.lag }}</div>
              </div>
            </div>
            <!-- Legend -->
            <div class="row items-center justify-center q-gutter-md q-mt-sm">
              <div class="row items-center no-wrap">
                <span class="legend-line" style="background: #ef5350" />
                <span class="text-caption text-grey-4 q-ml-xs">Positive correlation</span>
              </div>
              <div class="row items-center no-wrap">
                <span class="legend-line" style="background: #4f7fff" />
                <span class="text-caption text-grey-4 q-ml-xs">Negative correlation</span>
              </div>
              <span class="text-caption text-grey-5">Bar height = |r| (0 to 1)</span>
            </div>
            <div v-if="bestTimeLag" class="text-caption text-grey-3 q-mt-sm">
              Strongest relationship at a {{ bestTimeLag.lag }}-month lag
              (r = {{ bestTimeLag.r!.toFixed(2) }}, n = {{ bestTimeLag.n }} month-pairs).
            </div>
            <div class="text-caption text-grey-5 q-mt-sm">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              "t+2" means {{ timeLagParamB?.label }} two months after the {{ timeLagParamA?.label }} reading
              it's compared against — e.g. a nutrient pulse possibly showing up as an algal (chlorophyll)
              response two months later. A stronger correlation at a lag doesn't prove cause and effect, and
              n shrinks as the lag grows (fewer month-pairs exist at the far ends of the record).
            </div>
          </template>

          <!-- Depth-Time Isopleth -->
          <template v-else-if="analyticsVizType === 'depth-time-isopleth'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Depth-Time Isopleth — {{ selectedParam?.label }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              {{ depthProfileStationId ?? '—' }}, trailing 13 months. Depth increases downward
              (0m at top); color shows the {{ selectedParam?.label }} level.
            </p>
            <DepthTimeIsopleth
              v-if="isoplethColumns.some((c) => c.points.length)"
              :columns="isoplethColumns"
              :unit="selectedParam?.unit ?? ''"
              :decimals="selectedParam?.decimals ?? 1"
            />
            <div v-else class="text-center text-grey-5 q-py-lg">No depth readings yet for this station/parameter.</div>
            <div class="text-caption text-grey-5 q-mt-md">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              How to read this: each column is one month's real depth profile at this station, shaded
              smoothly from its surface reading down to its deepest — that vertical blend is a real
              physical continuity (depth genuinely varies smoothly). Columns are <strong>not</strong>
              blended into each other; a hatched column means fewer than 2 depths were sampled that
              month, not that nothing changed. This shows a smooth color gradient rather than traced
              contour lines connecting equal values across months.
            </div>
          </template>

          <!-- Principal Component Analysis -->
          <template v-else-if="analyticsVizType === 'pca'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">Principal Component Analysis</div>
            <p class="text-grey-4 text-caption q-mb-md">
              Loadings plot — how much each of the 13 parameters contributes to the two directions
              (principal components) that explain the most variance across every approved reading
              ever recorded. Parameters near each other (or pointing the same direction) tend to vary
              together; parameters pointing opposite directions tend to vary inversely.
            </p>
            <template v-if="pcaResult">
              <PCABiplot :points="pcaResult.points" />
              <div class="row items-center justify-center q-gutter-md q-mt-sm">
                <div class="row items-center no-wrap">
                  <span class="status-dot" style="background: #4fc3f7" />
                  <span class="text-caption text-grey-4 q-ml-xs">One dot/arrow = one parameter</span>
                </div>
                <span class="text-caption text-grey-5">Arrow direction &amp; length = how strongly it drives that axis</span>
              </div>
              <div class="text-caption text-grey-3 q-mt-sm">
                PC1 explains {{ pcaResult.varianceExplainedPct1.toFixed(0) }}% of the variance,
                PC2 explains {{ pcaResult.varianceExplainedPct2.toFixed(0) }}% — together
                {{ (pcaResult.varianceExplainedPct1 + pcaResult.varianceExplainedPct2).toFixed(0) }}%.
              </div>
            </template>
            <div v-else class="text-center text-grey-5 q-py-lg">Not enough paired data yet to run this.</div>
            <div class="text-caption text-grey-5 q-mt-md">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              This is a loadings plot only — it shows how the parameters relate to each other, not
              where individual readings fall. A parameter pair with too few paired readings to
              correlate reliably (see the Interactive Statistical Correlation view) is treated here as
              uncorrelated (r=0) rather than left unknown, which can pull it toward the center more
              than its true relationship would.
            </div>
          </template>

          <!-- Interactive 3D Surface Plot -->
          <template v-else-if="analyticsVizType === '3d-surface-plot'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Interactive 3D Surface Plot — {{ selectedParam?.label }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              {{ depthProfileStationId ?? '—' }}, trailing 13 months. Height and color both encode the
              {{ selectedParam?.label }} value; a hole in the surface means that month/depth combination
              wasn't sampled, not that the value was zero.
            </p>
            <Depth3DSurfacePlot
              v-if="isoplethColumns.some((c) => c.points.length)"
              :columns="isoplethColumns"
              :unit="selectedParam?.unit ?? ''"
              :decimals="selectedParam?.decimals ?? 1"
            />
            <div v-else class="text-center text-grey-5 q-py-lg">No depth readings yet for this station/parameter.</div>
          </template>

          <!-- Everything else: not built yet — names the type and what it
               will do, rather than an unexplained empty state. -->
          <template v-else>
            <div class="text-center text-grey-4 q-py-xl">
              <q-icon name="construction" size="40px" color="grey-6" />
              <div class="text-white text-subtitle1 q-mt-sm">{{ selectedAnalyticsViz?.label }}</div>
              <div class="text-caption q-mt-xs" style="max-width: 520px; margin: 0 auto;">
                {{ selectedAnalyticsViz?.description }}
              </div>
              <div class="text-caption text-grey-6 q-mt-md">Coming soon.</div>
            </div>
          </template>
        </q-card-section>
      </q-card>

      <!-- Station Comparison -->
      <q-card class="glass-morph q-mb-md">
        <q-card-section>
          <span class="text-white text-subtitle1 text-weight-medium">
            Station Comparison
          </span>
          <p class="text-grey-4 text-caption q-mb-md">
            All 13 parameters at once for {{ months[selectedMonthIndex] }} — each line is one station.
            Click a line (or a station elsewhere on this page) to highlight it; a station missing a
            reading for a parameter simply skips that axis rather than showing a fabricated value.
          </p>
          <q-scroll-area v-if="parallelSeriesList.length" style="height: 420px">
            <ParallelCoordinatesChart
              :axes="parallelAxes"
              :series-list="parallelSeriesList"
              :selected-site-id="selectedStationId"
              @select-station="selectStation"
            />
          </q-scroll-area>
          <div v-else class="text-center text-grey-5 q-py-lg">No readings yet for {{ months[selectedMonthIndex] }}.</div>
          <div v-if="parallelSeriesList.length" class="text-caption text-grey-5 q-mt-sm">
            <q-icon name="info" size="14px" class="q-mr-xs" />
            {{ parallelSeriesList.length }} stations shown — each vertical axis is one parameter, scaled
            to its own plausible range (top-to-bottom order:
            {{ allWaterQualityParams.map((p) => p.label).join(', ') }}). Click a station below or a line
            in the chart to highlight just that one.
          </div>
          <!-- Station legend — every line's color + name, clickable to highlight
               (mirrors clicking the line itself). With up to ~30 stations, colors
               cycle around the hue wheel and aren't meant to be memorized on sight;
               this list is how you actually look one up. -->
          <div v-if="parallelSeriesList.length" class="parallel-legend q-mt-sm">
            <button
              v-for="s in parallelSeriesList"
              :key="s.siteId"
              type="button"
              class="parallel-legend__item"
              :class="{ 'parallel-legend__item--active': selectedStationId === s.siteId }"
              @click="selectStation(s.siteId)"
            >
              <span class="parallel-legend__dot" :style="{ background: s.color }" />
              {{ s.siteId }}
            </button>
          </div>
        </q-card-section>
      </q-card>

        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Reading Period / Depth / Classification — floating in the bottom
         corner and fixed regardless of scroll position, so changing any of
         these never requires scrolling back to the top. Collapsed to a
         single button by default so it doesn't sit permanently over page
         content; expands to the full controls on click. Plain fixed
         positioning (not q-page-sticky) with an explicit high z-index —
         BackButton alone is already at z-index 2100, and q-page-sticky
         doesn't reliably out-rank fixed-position elements like that. -->
    <!-- Reading Controls — docked as a full-width bar along the bottom of the
         viewport instead of a small floating card. Every control lays out in
         a wrapping row so nothing needs an internal scrollbar to reach, and
         the bar is open by default so there's no button to hunt for and
         click first. The handle (always visible) can still minimize it down
         to a thin strip if it's covering something below. -->
    <div class="controls-bar" :class="{ 'controls-bar--collapsed': !controlsPanelOpen }">
      <button
        type="button"
        class="controls-bar__handle"
        @click="controlsPanelOpen = !controlsPanelOpen"
      >
        <q-icon name="tune" size="16px" class="q-mr-xs" />
        <span>Reading Controls</span>
        <span class="controls-bar__handle-summary">
          {{ MONTH_NAMES[selectedMonthInYear] }} {{ selectedYear }} · {{ selectedParam?.label }} · {{ depthLabel(selectedDepthM) }}
        </span>
        <q-icon :name="controlsPanelOpen ? 'expand_more' : 'expand_less'" size="18px" class="q-ml-xs" />
      </button>

      <div v-show="controlsPanelOpen" class="controls-bar__body">
        <div class="controls-bar__field controls-bar__field--period">
          <div class="controls-bar__label">
            <q-icon name="event" size="14px" class="q-mr-xs" />Reading Period
            <q-tooltip>Showing approved field readings — coverage varies by month and station.</q-tooltip>
          </div>
          <div class="row items-center q-gutter-sm no-wrap">
            <YearPicker
              :model-value="selectedYear"
              :min-year="READING_START_YEAR"
              dark
              @update:model-value="selectedYear = $event"
              @need-coverage="ensureReadingYearsCoverage"
            />
            <div class="controls-bar__month-slider">
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
            </div>
          </div>
        </div>

        <div class="controls-bar__field">
          <div class="controls-bar__label">
            <q-icon name="science" size="14px" class="q-mr-xs" />Parameter
            <q-tooltip>
              Drives Parameter Overview, the 13-Month Trend, Sites of Concern, the Station Map's
              color, and most of the analytics visualizations below.
            </q-tooltip>
          </div>
          <q-select
            v-model="selectedParamKey"
            :options="paramSelectOptions"
            emit-value
            map-options
            dense
            outlined
            dark
            class="form-field"
          />
        </div>

        <div class="controls-bar__field">
          <div class="controls-bar__label">
            <q-icon name="vertical_align_bottom" size="14px" class="q-mr-xs" />Depth
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
          />
        </div>

        <div class="controls-bar__field">
          <div class="controls-bar__label">
            <q-icon name="place" size="14px" class="q-mr-xs" />Station
            <q-tooltip>
              Drives Vertical Depth Profile, Faceted Profiles, Multi-Depth Time-Series, Depth-Time
              Isopleth, the 3D Surface Plot, and (when set) the Stoichiometric Ratio — same as
              clicking a station on the map below.
            </q-tooltip>
          </div>
          <q-select
            v-model="stationPickerModel"
            :options="stationPickerOptions"
            emit-value
            map-options
            dense
            outlined
            dark
            class="form-field"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BackButton from 'src/components/BackButton.vue';
import YearPicker from 'src/components/YearPicker.vue';
import TrendSparkline from 'src/components/charts/TrendSparkline.vue';
import ParameterTrendChart from 'src/components/charts/ParameterTrendChart.vue';
import StatusDistributionBar from 'src/components/charts/StatusDistributionBar.vue';
import StationMap from 'src/components/charts/StationMap.vue';
import DepthProfileChart from 'src/components/charts/DepthProfileChart.vue';
import MultiDepthTrendChart, { type DepthSeries } from 'src/components/charts/MultiDepthTrendChart.vue';
import ParallelCoordinatesChart, {
  type ParallelAxis,
  type ParallelSeries,
} from 'src/components/charts/ParallelCoordinatesChart.vue';
import CorrelationHeatmap from 'src/components/charts/CorrelationHeatmap.vue';
import DepthTimeIsopleth, { type IsoplethColumn } from 'src/components/charts/DepthTimeIsopleth.vue';
import PCABiplot, { type PCAPoint } from 'src/components/charts/PCABiplot.vue';
import Depth3DSurfacePlot from 'src/components/charts/Depth3DSurfacePlot.vue';
import {
  waterQualityParameterGroups,
  allWaterQualityParams,
  months,
  MONTH_NAMES,
  READING_START_YEAR,
  ensureReadingYearsCoverage,
  formatReading,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_LEVELS,
  DEPTH_OPTIONS,
  DEPTHS,
  depthLabel,
  TRIBUTARY_RIVER_SITES,
  TRIBUTARY_RIVER_SITE_IDS,
  getClassLimitReferenceValue,
  type WaterQualityParam,
  type StatusLevel,
  type DepthReadingPoint,
} from 'src/composables/useWaterQualityModel';
import {
  selectedParamKey,
  selectedYear,
  selectedMonthInYear,
  selectedStationId,
  selectedDepthM,
  depthProfileParamKeyA,
  depthProfileParamKeyB,
  timeLagParamKeyA,
  timeLagParamKeyB,
  readingMonthIndex,
} from 'src/composables/useWaterQualityDashboardState';
import {
  fetchWaterQualityReadings,
  buildReadingLookup,
  getReading,
  getReadingCoverage,
  dateToMonthIndex,
  type ReadingLookup,
  type WaterQualityReading,
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

const readingsLookup = ref<ReadingLookup>(new Map());
// Kept alongside the lookup (not just discarded after building it) for the
// Correlation Heatmap — a correlation needs each reading's parameters paired
// from the SAME underlying record, not independently pre-averaged values.
const rawReadings = ref<WaterQualityReading[]>([]);
const readingsLoading = ref(false);
onMounted(async () => {
  readingsLoading.value = true;
  try {
    const readings = await fetchWaterQualityReadings({ status: 'APPROVED' });
    rawReadings.value = readings;
    readingsLookup.value = buildReadingLookup(readings);
  } catch (err) {
    console.error('Failed to load water quality readings:', err);
  } finally {
    readingsLoading.value = false;
  }
});

// selectedYear/selectedMonthInYear/selectedStationId/selectedDepthM/
// depthProfileParamKeyA-B are all imported from useWaterQualityDashboardState
// now — session-persisted filters, not reset every time you navigate back to
// this page.
const selectedMonthIndex = computed(() => readingMonthIndex(selectedYear.value, selectedMonthInYear.value));

const paramSelectOptions = allWaterQualityParams.map((p) => ({ label: p.label, value: p.key }));

// Overview / Advanced Analytics — always lands on Overview, matching how
// most visits actually use this page. Local (not session-persisted), same
// reasoning as parameterOverviewExpanded below: this is a navigational
// choice for this visit, not a filter selection worth remembering.
const activeView = ref<'overview' | 'advanced'>('overview');

// Collapsed by default — see the Parameter Overview card's comment above.
// Local (not session-persisted): re-collapsing on a fresh visit is expected
// here, unlike an actual filter selection.
const parameterOverviewExpanded = ref(false);

// Reading Period/Parameter/Depth/Classification/Station bar, docked to the
// bottom of the viewport (see .controls-bar) — open by default so every
// control is laid out and visible without an extra click, which a floating
// FAB used to require. The handle still lets it be minimized if it's in the
// way of the chart below it.
const controlsPanelOpen = ref(true);

// ═══ TYPE OF ANALYTICS VISUALIZATION ═══
// Only 'vertical-depth-profile' renders a real chart right now (the rest of
// this dashboard's build is happening in later batches) — every other entry
// shows its own description as a placeholder instead of an unexplained gap,
// so the picker's full intended shape is visible even before each type is
// built out.
interface AnalyticsVizOption {
  label: string;
  value: string;
  description: string;
}
const analyticsVizOptions: AnalyticsVizOption[] = [
  {
    label: 'Vertical Depth Profile',
    value: 'vertical-depth-profile',
    description: 'Two parameters plotted against depth (Surface–50m) for the selected station and month.',
  },
  {
    label: 'Depth-Time Isopleth',
    value: 'depth-time-isopleth',
    description: 'A depth-vs-time contour heatmap (Hovmöller diagram) — X: time, Y: depth (0m at top), color: parameter level, with contour lines connecting equal values.',
  },
  {
    label: 'Multi-Depth Time-Series',
    value: 'multi-depth-time-series',
    description: 'One line per sampled depth layer (Surface, 5m, 10m, …, Bottom) plotted over time on a shared axis.',
  },
  {
    label: 'Faceted Vertical Depth Profiles',
    value: 'faceted-depth-profiles',
    description: 'Small vertical depth-profile charts placed side by side in chronological order (Jan, Feb, Mar, …), each showing the same parameter that month.',
  },
  {
    label: 'Interactive 3D Surface Plot',
    value: '3d-surface-plot',
    description: 'A 3D surface over time (X) and depth (Y), with parameter value as both height and color.',
  },
  {
    label: 'Interactive Statistical Correlation',
    value: 'correlation-heatmap',
    description: 'A 13×13 grid of Pearson (r) or Spearman (ρ) correlation coefficients between every measured parameter.',
  },
  {
    label: 'Time-Lagged Cross-Correlation',
    value: 'time-lagged-correlation',
    description: 'Correlation between parameters across shifted time steps (month t vs. t+1, t+2, …) to surface delayed relationships.',
  },
  {
    label: 'Principal Component Analysis',
    value: 'pca',
    description: 'Reduces the 13 parameters to two principal axes (PC1, PC2) that explain most of the dataset’s variance, plotted as a biplot.',
  },
  {
    label: 'Stoichiometric Ratio',
    value: 'stoichiometric-ratio',
    description: 'Derived ecological indices from raw nutrient values, such as the Nitrogen-to-Phosphorus (N:P) ratio.',
  },
];
const analyticsVizType = ref<string>('vertical-depth-profile');
const selectedAnalyticsViz = computed(() =>
  analyticsVizOptions.find((o) => o.value === analyticsVizType.value) ?? null,
);

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

// Chart reference-line value for the currently selected classification —
// null-safe so it can be bound directly to a possibly-unselected param.
function guidelineFor(param: WaterQualityParam | null | undefined): number | undefined {
  return param ? getClassLimitReferenceValue(param) : undefined;
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

// Per-site status for the currently selected parameter (4-tier:
// good/warning/serious/critical) — the single source the map's fill color,
// pulse ring, and "!" badge are all derived from below, so a station is
// never flagged over a parameter you didn't choose to look at. Previously
// the ring/badge scanned every parameter for the worst one regardless of
// selection, which meant a station could pulse red while colored green
// (fine on the parameter shown, bad on some other one) — confusing, since
// nothing on screen explained the mismatch unless you hovered the tooltip.
const statusBySite = computed<Record<string, StatusLevel>>(() => {
  const param = selectedParam.value;
  const result: Record<string, StatusLevel> = {};
  if (!param) return result;
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
    if (value !== null) result[site.siteId] = param.getStatus(value);
  });
  return result;
});

// Marker fill color — same 3-tier collapse (good/warning/critical) as
// before, just now derived from statusBySite instead of a separate lookup,
// so it can never disagree with the ring/badge decoration on top of it.
const statusColorBySite = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};
  sites.value.forEach((site) => {
    const status = statusBySite.value[site.siteId];
    result[site.siteId] = status ? mapStatusColor(status) : NO_DATA_COLOR;
  });
  return result;
});

// The selected parameter's actual reading at each flagged site, so the map
// tooltip can show the number behind the badge instead of just the color.
const attentionDetailBySite = computed<Record<string, { paramLabel: string; formattedValue: string }>>(() => {
  const param = selectedParam.value;
  const result: Record<string, { paramLabel: string; formattedValue: string }> = {};
  if (!param) return result;
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
    if (value !== null) result[site.siteId] = { paramLabel: param.label, formattedValue: formatReading(value, param) };
  });
  return result;
});

const selectedParamTrend = computed(() =>
  selectedParam.value ? trendSeries(selectedParam.value) : { months: [], values: [] },
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

// How many distinct depths each station has EVER reported at (not scoped to
// the current Reading Period) — surfaced in the station picker below so you
// can tell a station with real vertical coverage from a surface-only one
// before picking it, rather than discovering it's empty by trial and error.
const siteDepthCoverage = computed<Record<string, number>>(() => {
  const depthsBySite = new Map<string, Set<number>>();
  rawReadings.value.forEach((r) => {
    const bucket = depthsBySite.get(r.siteId);
    if (bucket) bucket.add(r.depthM);
    else depthsBySite.set(r.siteId, new Set([r.depthM]));
  });
  const result: Record<string, number> = {};
  depthsBySite.forEach((depths, siteId) => {
    result[siteId] = depths.size;
  });
  return result;
});

// Rivers are excluded — see selectStation()'s comment: they're always
// Surface-only, so picking one would drive a meaningless flat depth profile.
const stationPickerOptions = computed(() =>
  sites.value
    .filter((s) => !TRIBUTARY_RIVER_SITE_IDS.has(s.siteId))
    .map((s) => {
      const depthCount = siteDepthCoverage.value[s.siteId] ?? 0;
      const coverageLabel = depthCount >= 2 ? `${depthCount} depths` : depthCount === 1 ? 'Surface only' : 'No data yet';
      return { label: `${s.siteId} — ${coverageLabel}`, value: s.siteId };
    }),
);

// Getter/setter so the dropdown always shows a real station (falling back to
// the same default the depth-based views themselves use) while still
// sharing selectedStationId with the map's click-to-select/deselect — picking
// "Auto" here and deselecting a station on the map do the same thing.
const stationPickerModel = computed<string | null>({
  get: () => depthProfileStationId.value,
  set: (val) => {
    selectedStationId.value = val;
  },
});

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

// ═══ FACETED VERTICAL DEPTH PROFILES (SMALL MULTIPLES) ═══
// Same station as the Vertical Depth Profile chart above (depthProfileStationId)
// — one small profile per month in the trailing window, months with zero
// readings at this station/parameter are skipped rather than shown empty.
const facetedProfiles = computed(() => {
  const stationId = depthProfileStationId.value;
  const param = selectedParam.value;
  const result: { month: string; points: DepthReadingPoint[] }[] = [];
  if (!stationId || !param) return result;
  for (const i of trendIndices.value) {
    const points = depthProfilePoints(stationId, param, i);
    if (points.length > 0) result.push({ month: months[i]!, points });
  }
  return result;
});

// ═══ MULTI-DEPTH TIME-SERIES ═══
// One line per sampled depth, same station as the two charts above. A
// distinct hue per depth via HSL so any number of active depths (up to the
// 9 defined ones) stays visually distinguishable without a hand-picked
// palette running out.
function colorForIndex(i: number, total: number): string {
  return `hsl(${Math.round((i * 360) / Math.max(total, 1))}, 70%, 62%)`;
}

const multiDepthSeries = computed<{ months: string[]; series: DepthSeries[] }>(() => {
  const stationId = depthProfileStationId.value;
  const param = selectedParam.value;
  const monthsOut = trendIndices.value.map((i) => months[i]!);
  if (!stationId || !param) return { months: monthsOut, series: [] };

  const activeDepths = DEPTHS.filter((depth) =>
    trendIndices.value.some((i) => getReading(readingsLookup.value, stationId, i, param, depth) !== null),
  );
  const series: DepthSeries[] = activeDepths.map((depth, di) => ({
    depth,
    label: depthLabel(depth),
    color: colorForIndex(di, activeDepths.length),
    values: trendIndices.value.map((i) => getReading(readingsLookup.value, stationId, i, param, depth)),
  }));
  return { months: monthsOut, series };
});

// ═══ STOICHIOMETRIC RATIO (NITROGEN : PHOSPHORUS) ═══
// Converts each measured nutrient compound (as reported: NO3-, NO2-, NH3,
// PO4^3-) to its elemental N/P mass via molar-mass ratios, then to the molar
// N:P ratio limnologists compare against the Redfield ratio (16:1) — well
// below it, nitrogen is the more likely growth-limiting nutrient for algae;
// well above it, phosphorus is. Values near 16 aren't necessarily "balanced,"
// just inconclusive from this ratio alone (real limitation needs a bioassay).
const N_MOLAR_MASS = 14.007; // g/mol, elemental N
const P_MOLAR_MASS = 30.974; // g/mol, elemental P
const NO3_MOLAR_MASS = 62.004; // g/mol, NO3-
const NO2_MOLAR_MASS = 46.005; // g/mol, NO2-
const NH3_MOLAR_MASS = 17.031; // g/mol, NH3
const PO4_MOLAR_MASS = 94.971; // g/mol, PO4^3-
const REDFIELD_NP_RATIO = 16;

const nitrateParam = allWaterQualityParams.find((p) => p.key === 'nitrate')!;
const nitriteParam = allWaterQualityParams.find((p) => p.key === 'nitrite')!;
const ammoniaParam = allWaterQualityParams.find((p) => p.key === 'ammonia')!;
const phosphateParam = allWaterQualityParams.find((p) => p.key === 'phosphate')!;

interface NPRatioResult {
  totalNMgL: number | null;
  totalPMgL: number | null;
  molarRatio: number | null;
}

function paramValueAt(param: WaterQualityParam, siteId: string | null, monthIndex: number): number | null {
  if (siteId) {
    const site = sites.value.find((s) => s.siteId === siteId);
    return site ? getReading(readingsLookup.value, siteId, monthIndex, param, depthForSite(site)) : null;
  }
  return lakeAverage(param, monthIndex);
}

function npRatioAt(siteId: string | null, monthIndex: number): NPRatioResult {
  const nitrate = paramValueAt(nitrateParam, siteId, monthIndex);
  const nitrite = paramValueAt(nitriteParam, siteId, monthIndex);
  const ammonia = paramValueAt(ammoniaParam, siteId, monthIndex);
  const phosphate = paramValueAt(phosphateParam, siteId, monthIndex);

  const nParts = [
    nitrate !== null ? nitrate * (N_MOLAR_MASS / NO3_MOLAR_MASS) : null,
    nitrite !== null ? nitrite * (N_MOLAR_MASS / NO2_MOLAR_MASS) : null,
    ammonia !== null ? ammonia * (N_MOLAR_MASS / NH3_MOLAR_MASS) : null,
  ].filter((v): v is number => v !== null);
  const totalNMgL = nParts.length > 0 ? nParts.reduce((sum, v) => sum + v, 0) : null;
  const totalPMgL = phosphate !== null ? phosphate * (P_MOLAR_MASS / PO4_MOLAR_MASS) : null;

  const molarRatio =
    totalNMgL !== null && totalPMgL !== null && totalPMgL > 0
      ? totalNMgL / N_MOLAR_MASS / (totalPMgL / P_MOLAR_MASS)
      : null;

  return { totalNMgL, totalPMgL, molarRatio };
}

const currentNPRatio = computed(() => npRatioAt(selectedStationId.value, selectedMonthIndex.value));

const npRatioInterpretation = computed(() => {
  const ratio = currentNPRatio.value.molarRatio;
  if (ratio === null) return null;
  if (ratio < 12) return { label: 'Nitrogen-limited tendency', color: '#4fc3f7' };
  if (ratio > 20) return { label: 'Phosphorus-limited tendency', color: '#ff8a65' };
  return { label: 'Near-balanced (~Redfield)', color: '#81c784' };
});

const npRatioTrend = computed(() => {
  const monthsOut: string[] = [];
  const valuesOut: number[] = [];
  for (const i of trendIndices.value) {
    const result = npRatioAt(selectedStationId.value, i);
    if (result.molarRatio !== null) {
      monthsOut.push(months[i]!);
      valuesOut.push(result.molarRatio);
    }
  }
  return { months: monthsOut, values: valuesOut };
});

// ═══ STATION COMPARISON — PARALLEL COORDINATES ═══
// All 13 parameters at once, one line per station — unlike the rest of this
// page, deliberately independent of selectedParamKey. Each axis uses the
// parameter's defined sensor-plausibility range (not the current month's
// data range), so the axes stay stable as you change the Reading Period
// instead of rescaling every time.
const parallelAxes = computed<ParallelAxis[]>(() =>
  allWaterQualityParams.map((p) => ({ key: p.key, label: p.label, min: p.min, max: p.max })),
);

const parallelSeriesList = computed<ParallelSeries[]>(() => {
  const eligible = sites.value.filter((site) =>
    allWaterQualityParams.some(
      (p) => getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, p, depthForSite(site)) !== null,
    ),
  );
  return eligible.map((site, i) => ({
    siteId: site.siteId,
    color: colorForIndex(i, eligible.length),
    values: allWaterQualityParams.map((p) =>
      getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, p, depthForSite(site)),
    ),
  }));
});

// ═══ INTERACTIVE STATISTICAL CORRELATION (13×13 PEARSON MATRIX) ═══
// Pairs come from each raw reading row directly (same site/date/depth), not
// from independently pre-averaged values — a correlation needs matched
// (x, y) observations from the same underlying record. Uses every approved
// reading ever recorded (not just the current Reading Period), since a
// correlation needs many paired observations to mean anything; a single
// month/station rarely has more than a handful.
function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null; // too few pairs for a correlation to mean anything
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - meanX;
    const dy = ys[i]! - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? null : num / denom;
}

function pairedValues(
  paramA: WaterQualityParam,
  paramB: WaterQualityParam,
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  rawReadings.value.forEach((r) => {
    const a = r[paramA.key as keyof WaterQualityReading];
    const b = r[paramB.key as keyof WaterQualityReading];
    if (typeof a === 'number' && typeof b === 'number') {
      xs.push(a);
      ys.push(b);
    }
  });
  return { xs, ys };
}

const correlationLabels = computed(() => allWaterQualityParams.map((p) => p.label));
const correlationMatrix = computed(() =>
  allWaterQualityParams.map((paramA) =>
    allWaterQualityParams.map((paramB) => {
      if (paramA.key === paramB.key) return { r: 1, n: rawReadings.value.length };
      const { xs, ys } = pairedValues(paramA, paramB);
      return { r: pearsonCorrelation(xs, ys), n: xs.length };
    }),
  ),
);

// ═══ TIME-LAGGED CROSS-CORRELATION ═══
// Reuses pearsonCorrelation above, but on lake-wide MONTHLY series rather
// than raw per-reading pairs — a time lag is inherently a per-month
// relationship. Spans the platform's full recorded history (not just the
// trailing 13-month window everything else on this page uses), since
// correlating a shifted series needs as many month-pairs as possible,
// especially at the higher lags where fewer pairs are available at all.
const MAX_TIME_LAG = 6;

const timeLagParamA = computed(
  () => allWaterQualityParams.find((p) => p.key === timeLagParamKeyA.value) ?? null,
);
const timeLagParamB = computed(
  () => allWaterQualityParams.find((p) => p.key === timeLagParamKeyB.value) ?? null,
);

const maxDataMonthIndex = computed(() => {
  if (rawReadings.value.length === 0) return -1;
  return Math.max(...rawReadings.value.map((r) => dateToMonthIndex(r.dateObserved)));
});

function fullLakeSeries(param: WaterQualityParam): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i <= maxDataMonthIndex.value; i++) result.push(lakeAverage(param, i));
  return result;
}

interface TimeLagResult {
  lag: number;
  r: number | null;
  n: number;
}

const timeLagResults = computed<TimeLagResult[]>(() => {
  const paramA = timeLagParamA.value;
  const paramB = timeLagParamB.value;
  if (!paramA || !paramB) return [];

  const seriesA = fullLakeSeries(paramA);
  const seriesB = fullLakeSeries(paramB);

  const results: TimeLagResult[] = [];
  for (let lag = 0; lag <= MAX_TIME_LAG; lag++) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let t = 0; t + lag < seriesA.length; t++) {
      const a = seriesA[t];
      const b = seriesB[t + lag];
      if (a !== null && a !== undefined && b !== null && b !== undefined) {
        xs.push(a);
        ys.push(b);
      }
    }
    results.push({ lag, r: pearsonCorrelation(xs, ys), n: xs.length });
  }
  return results;
});

const bestTimeLag = computed<TimeLagResult | null>(() => {
  const valid = timeLagResults.value.filter((res) => res.r !== null);
  if (valid.length === 0) return null;
  return valid.reduce((best, cur) => (Math.abs(cur.r!) > Math.abs(best.r!) ? cur : best));
});

// ═══ DEPTH-TIME ISOPLETH ═══
// Same station/parameter as the Vertical Depth Profile chart — one column
// per month in the trailing window, real depth readings only.
const isoplethColumns = computed<IsoplethColumn[]>(() => {
  const stationId = depthProfileStationId.value;
  const param = selectedParam.value;
  if (!stationId || !param) return [];
  return trendIndices.value.map((i) => ({
    month: months[i]!,
    points: depthProfilePoints(stationId, param, i),
  }));
});

// ═══ PRINCIPAL COMPONENT ANALYSIS ═══
// Runs on the same 13x13 Pearson correlation matrix already computed above
// (pairwise-complete, so it works even though few if any readings have all
// 13 parameters filled in — a strict complete-rows requirement would likely
// leave almost nothing to analyze). This is a loadings plot only (how much
// each parameter contributes to PC1/PC2) — not a full biplot with individual
// sample points, since plotting those would need per-row values for every
// parameter, which the pairwise-complete approach above doesn't give us.
//
// No linear-algebra library is available in this project, so this
// implements the classic Jacobi eigenvalue algorithm directly — the
// standard, numerically stable method for diagonalizing a real symmetric
// matrix (which a correlation matrix always is). See e.g. Numerical Recipes
// §11.1 for the reference algorithm this follows.
function jacobiEigenDecomposition(
  matrix: number[][],
  maxIterations = 100,
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = matrix.length;
  const A = matrix.map((row) => row.slice());
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );

  function offDiagonalNorm(): number {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) sum += A[i]![j]! * A[i]![j]!;
      }
    }
    return Math.sqrt(sum);
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    if (offDiagonalNorm() < 1e-9) break;

    let p = 0;
    let q = 1;
    let maxVal = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[i]![j]!) > maxVal) {
          maxVal = Math.abs(A[i]![j]!);
          p = i;
          q = j;
        }
      }
    }
    if (maxVal < 1e-9) break;

    const app = A[p]![p]!;
    const aqq = A[q]![q]!;
    const apq = A[p]![q]!;
    const theta = (aqq - app) / (2 * apq);
    const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;

    // Rotate columns p,q of A (A := A * J)
    for (let i = 0; i < n; i++) {
      const aip = A[i]![p]!;
      const aiq = A[i]![q]!;
      A[i]![p] = c * aip - s * aiq;
      A[i]![q] = s * aip + c * aiq;
    }
    // Rotate rows p,q of A (A := J^T * A) — reads the already column-rotated A
    for (let j = 0; j < n; j++) {
      const apj = A[p]![j]!;
      const aqj = A[q]![j]!;
      A[p]![j] = c * apj - s * aqj;
      A[q]![j] = s * apj + c * aqj;
    }
    // Accumulate the rotation into V so its columns end up as eigenvectors
    for (let i = 0; i < n; i++) {
      const vip = V[i]![p]!;
      const viq = V[i]![q]!;
      V[i]![p] = c * vip - s * viq;
      V[i]![q] = s * vip + c * viq;
    }
  }

  const eigenvalues = Array.from({ length: n }, (_, i) => A[i]![i]!);
  return { eigenvalues, eigenvectors: V };
}

interface PCAResult {
  points: PCAPoint[];
  varianceExplainedPct1: number;
  varianceExplainedPct2: number;
}

const pcaResult = computed<PCAResult | null>(() => {
  // pearsonCorrelation returns null (not 0) on too-few-pairs; substituting 0
  // for a null cell keeps the matrix numeric so the decomposition can run,
  // at the cost of treating a data-starved pair as "uncorrelated" rather
  // than "unknown" — flagged in the note below the chart.
  const n = allWaterQualityParams.length;
  const matrix = correlationMatrix.value.map((row) => row.map((cell) => cell.r ?? 0));
  if (matrix.length !== n) return null;

  const { eigenvalues, eigenvectors } = jacobiEigenDecomposition(matrix);
  const order = eigenvalues.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  if (order.length < 2) return null;
  const idx1 = order[0]!.i;
  const idx2 = order[1]!.i;
  const totalVariance = eigenvalues.reduce((sum, v) => sum + v, 0);

  const points: PCAPoint[] = allWaterQualityParams.map((p, i) => ({
    key: p.key,
    label: p.label,
    pc1: eigenvectors[i]![idx1]!,
    pc2: eigenvectors[i]![idx2]!,
  }));

  return {
    points,
    varianceExplainedPct1: totalVariance > 0 ? (order[0]!.v / totalVariance) * 100 : 0,
    varianceExplainedPct2: totalVariance > 0 ? (order[1]!.v / totalVariance) * 100 : 0,
  };
});
</script>

<style scoped>
.page-content {
  position: relative;
  z-index: 1;
  padding-top: 120px;
  /* Clears the docked controls bar at the bottom so it doesn't permanently
     bury the last section of content — sized for the bar's expanded height
     on a typical desktop width (it can wrap taller on narrow viewports; the
     handle can still minimize it if that overlaps). */
  padding-bottom: 210px;
}

.view-tabs {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.view-tab-panels {
  background: transparent;
}

/* Docked full-width bar instead of a small floating card in the corner —
   explicit fixed positioning + high z-index rather than q-page-sticky, since
   BackButton alone already sits at z-index 2100 (position: fixed) and this
   needs to render above every card and the Leaflet station map too. */
.controls-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5000;
  background: rgba(20, 24, 28, 0.82);
  backdrop-filter: blur(14px);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.45);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.controls-bar--collapsed {
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
}

.controls-bar__handle {
  display: flex;
  align-items: center;
  width: 100%;
  border: none;
  background: transparent;
  color: white;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 10px 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.controls-bar__handle-summary {
  margin-left: 10px;
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.controls-bar__body {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
  padding: 0 16px 16px;
  overflow-y: auto;
}

.controls-bar__field {
  flex: 1 1 170px;
  min-width: 150px;
  max-width: 240px;
}

.controls-bar__field--period {
  flex: 1 1 340px;
  max-width: 460px;
}

.controls-bar__label {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.controls-bar__month-slider {
  flex: 1;
  min-width: 180px;
}

.time-lag-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 160px;
  gap: 8px;
  padding: 0 8px;
}
.time-lag-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}
.time-lag-bar-value {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}
.time-lag-bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}
.time-lag-bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.2s ease;
}
.time-lag-bar-fill--pos {
  background: #ef5350;
}
.time-lag-bar-fill--neg {
  background: #4f7fff;
}
.time-lag-bar-label {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 4px;
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

/* Small reusable legend swatches, shared across the analytics visualizations. */
.legend-dash {
  display: inline-block;
  width: 16px;
  height: 0;
  border-top: 2px dashed #fab219;
  flex-shrink: 0;
}

.legend-line {
  display: inline-block;
  width: 16px;
  height: 2px;
  flex-shrink: 0;
}

/* Station Comparison legend — a scrollable wrapped grid of clickable
   color+name chips, since up to ~30 stations can't fit as a single row and
   their hue-wheel colors aren't meant to be memorized without a lookup. */
.parallel-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
  padding: 2px;
}

.parallel-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 3px 10px 3px 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.7rem;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.parallel-legend__item:hover {
  background: rgba(255, 255, 255, 0.12);
}

.parallel-legend__item--active {
  background: rgba(38, 166, 154, 0.18);
  border-color: rgba(38, 166, 154, 0.6);
  color: white;
}

.parallel-legend__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
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
