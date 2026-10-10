<template>
  <q-page class="q-pa-md flex flex-center relative-position overflow-hidden dashboard-page">
    <BackButton to="/map" />

    <div class="page-content full-width q-pa-md">
      <!-- Header -->
      <div class="text-center q-mb-sm">
        <h4 class="text-weight-bolder q-my-xs" style="color: #16306b">Water Quality Dashboard</h4>
        <p class="q-mb-none" style="color: #5c6b7a">
          Environmental monitoring overview of Lake Lanao — for agency awareness and reporting
        </p>
      </div>
      <div class="text-center q-mb-md q-gutter-md">
        <q-btn
          color="teal"
          icon="summarize"
          label="Station Summary"
          unelevated
          rounded
          padding="sm xl"
          @click="showStationSummary = true"
        />
        <q-btn
          color="primary"
          icon="download"
          label="Download Center"
          outline
          rounded
          padding="sm xl"
          to="/download"
        />
      </div>
      <StationSummaryDialog
        v-model="showStationSummary"
        :rows="stationSummaryRows"
        v-model:param-key="selectedParamKey"
      />

      <!-- Overview / Advanced Analytics split — the analytics visualization
           types (grouped Single-Station / Cross-Station / Statistical
           Relationships in the picker below) are specialist tools that most
           visitors checking "is the lake okay" never need to see. Overview is
           the default landing view; Advanced Analytics is opt-in. -->
      <q-tabs
        v-model="activeView"
        dense
        align="justify"
        indicator-color="teal"
        active-color="teal-8"
        inactive-color="grey-6"
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
                    class="form-field"
                    style="min-width: 180px"
                  >
                    <q-tooltip>Switch which parameter this trend shows</q-tooltip>
                  </q-select>
                </div>
              </div>
              <div class="chart-inset">
                <ParameterTrendChart
                  :months="selectedParamTrend.months"
                  :values="selectedParamTrend.values"
                  :unit="selectedParam.unit"
                  :decimals="selectedParam.decimals"
                  color="#4dd0e1"
                />
              </div>
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

      <!-- Monthly (Parameter) Trend -->
      <div class="row q-col-gutter-md q-mb-md" v-if="selectedParam">
        <div class="col-12">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm wrap">
                <span class="text-white text-subtitle1 text-weight-medium">
                  <q-icon name="bar_chart" color="teal-3" class="q-mr-xs" />
                  Monthly {{ selectedParam.label }} Trend
                </span>
                <q-btn-toggle
                  v-model="monthlyTrendMode"
                  dense
                  no-caps
                  rounded
                  toggle-color="teal-8"
                  color="grey-9"
                  text-color="grey-4"
                  size="sm"
                  :options="[
                    { label: 'Area', value: 'area' },
                    { label: 'Line', value: 'line' },
                    { label: 'Stack', value: 'stack' },
                  ]"
                />
              </div>
              <p class="text-grey-4 text-caption q-mb-sm">{{ monthlyTrendCaption }}</p>
              <div class="chart-inset">
                <MonthlyParamTrendChart
                  :months="monthlyParamTrend.months"
                  :average="monthlyParamTrend.average"
                  :status-counts="monthlyParamTrend.statusCounts"
                  :mode="monthlyTrendMode"
                  :unit="selectedParam.unit"
                  :decimals="selectedParam.decimals"
                  color="#4dd0e1"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Interactive Station Map — one card, pick the visualization type -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-8">
          <q-card class="glass-morph full-height">
            <q-card-section>
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-white text-subtitle1 text-weight-medium">
                  <q-icon :name="mapVizIcon" color="teal-3" class="q-mr-xs" />
                  {{ mapVizLabel }} — {{ selectedParam ? selectedParam.label : 'Select a Parameter' }}
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

              <q-btn-toggle
                v-model="mapVizType"
                dense
                no-caps
                rounded
                toggle-color="teal-8"
                color="grey-9"
                text-color="grey-4"
                size="sm"
                class="q-mb-sm"
                :options="[
                  { label: 'Station Map', value: 'station' },
                  { label: 'Choropleth', value: 'choropleth' },
                  { label: 'Interpolation', value: 'interpolation' },
                  { label: 'Treemap', value: 'treemap' },
                ]"
              />

              <p class="text-grey-4 text-caption q-mb-sm">{{ mapVizCaption }}</p>

              <div class="station-map-wrap">
                <StationMap
                  v-if="mapVizType === 'station'"
                  :sites="sites"
                  :status-color-by-site="statusColorBySite"
                  :status-by-site="statusBySite"
                  :attention-detail-by-site="attentionDetailBySite"
                  :selected-site-id="selectedStationId"
                  @select-station="selectStation"
                />
                <WaterQualityChoroplethMap v-else-if="mapVizType === 'choropleth'" :zones="choroplethZones" />
                <InterpolatedParamMap
                  v-else-if="mapVizType === 'interpolation'"
                  :sites="sites"
                  :values="valueBySite"
                  :param="selectedParam"
                />
                <StationTreemap
                  v-else
                  :sites="sites"
                  :values="valueBySite"
                  :status-color-by-site="statusColorBySite"
                  :param="selectedParam"
                  :selected-site-id="selectedStationId"
                  @select-station="selectStation"
                />
              </div>

              <div class="row items-center q-gutter-md q-mt-sm">
                <template v-if="mapVizType === 'station'">
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
                </template>
                <template v-else>
                  <div class="row items-center no-wrap">
                    <span class="status-dot" :style="{ background: STATUS_COLORS.good }" />
                    <span class="text-caption text-grey-4 q-ml-xs">Good</span>
                  </div>
                  <div class="row items-center no-wrap">
                    <span class="status-dot" :style="{ background: STATUS_COLORS.warning }" />
                    <span class="text-caption text-grey-4 q-ml-xs">Warning</span>
                  </div>
                  <div class="row items-center no-wrap">
                    <span class="status-dot" :style="{ background: STATUS_COLORS.serious }" />
                    <span class="text-caption text-grey-4 q-ml-xs">Serious</span>
                  </div>
                  <div class="row items-center no-wrap">
                    <span class="status-dot" :style="{ background: STATUS_COLORS.critical }" />
                    <span class="text-caption text-grey-4 q-ml-xs">Critical</span>
                  </div>
                  <div class="row items-center no-wrap">
                    <span class="status-dot" :style="{ background: '#78909c' }" />
                    <span class="text-caption text-grey-4 q-ml-xs">No Data</span>
                  </div>
                </template>
              </div>
              <p v-if="mapVizType === 'station'" class="text-caption text-grey-5 q-mt-xs q-mb-0">
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
              <q-list dense>
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
              :option-disable="(opt) => !!opt.isHeader"
              emit-value
              map-options
              dense
              outlined
              class="form-field"
              label="Type of analytics visualization"
              style="min-width: 280px"
              popup-content-class="viz-picker-popup"
            >
              <template #option="scope">
                <q-item v-if="scope.opt.isHeader" class="viz-picker-group-header">
                  <q-item-section>
                    <q-item-label caption class="text-teal-3 text-weight-bold">
                      {{ scope.opt.label.toUpperCase() }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-else v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Focus Selection — this visualization type's own pickers, fully
               independent of the Reading Controls bar (that bar now only
               drives the Overview tab). Only the fields the currently
               selected type actually needs are shown, same reasoning as the
               Download Center's own Focus Selection sidebar. -->
          <template v-if="aaNeedsStation || aaNeedsParam || aaNeedsDepth || aaNeedsMonth">
            <q-separator class="q-mb-sm" />
            <div class="text-caption text-grey-4 q-mb-sm">
              <q-icon name="center_focus_strong" size="14px" class="q-mr-xs" />Focus selection for this visualization
            </div>
            <div v-if="aaNeedsStation || aaNeedsParam || aaNeedsDepth" class="row q-col-gutter-sm q-mb-md aa-focus-row">
              <div v-if="aaNeedsStation" class="col-6 col-sm-4">
                <q-select
                  v-model="aaStationModel"
                  :options="stationPickerOptions"
                  emit-value
                  map-options
                  clearable
                  dense
                  outlined
                  class="form-field"
                  :label="aaStationOptional ? 'Focus Station (optional)' : 'Focus Station'"
                />
              </div>
              <div v-if="aaNeedsParam" class="col-6 col-sm-4">
                <q-select
                  v-model="aaParamKey"
                  :options="paramSelectOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  class="form-field"
                  label="Focus Parameter"
                />
              </div>
              <div v-if="aaNeedsDepth" class="col-6 col-sm-4">
                <q-select
                  v-model="aaDepth"
                  :options="DEPTH_OPTIONS"
                  emit-value
                  map-options
                  dense
                  outlined
                  class="form-field"
                  label="Depth"
                />
              </div>
            </div>

            <!-- Reading Period — same YearPicker + month-slider control as the
                 Overview tab's Reading Controls bar, just driving this tab's
                 own aaYear/aaMonthInYear instead. -->
            <div v-if="aaNeedsMonth" class="q-mb-md">
              <div class="text-caption text-grey-4 q-mb-xs">
                <q-icon name="event" size="14px" class="q-mr-xs" />Reading Period
              </div>
              <div class="row items-center q-gutter-sm no-wrap">
                <YearPicker
                  :model-value="aaYear"
                  :min-year="READING_START_YEAR"
                  @update:model-value="aaYear = $event"
                  @need-coverage="ensureReadingYearsCoverage"
                />
                <div class="controls-bar__month-slider">
                  <q-slider
                    v-model="aaMonthInYear"
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
              </div>
            </div>
          </template>

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
                  label="Parameter B"
                  class="form-field"
                  style="min-width: 160px"
                />
              </div>
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              Approved readings at {{ depthProfileStationId ?? '—' }} for
              {{ months[aaMonthIndex] }} across whichever of the 9 sampling depths (Surface–100m) were recorded.
              Select a station on the map below to inspect a specific site.
            </p>
            <template v-if="depthProfilePointsA.length || depthProfilePointsB.length">
              <div class="row q-col-gutter-sm justify-center">
                <div class="col-12 col-sm-6 col-md-4 text-center" v-if="depthProfileParamA">
                  <div class="text-grey-3 text-caption q-mb-xs">
                    {{ depthProfileParamA.label }}{{ depthProfileParamA.unit ? ` (${depthProfileParamA.unit})` : '' }}
                  </div>
                  <div class="chart-inset">
                    <DepthProfileChart
                      :points="depthProfilePointsA"
                      :unit="depthProfileParamA.unit"
                      color="#ff8a65"
                      :decimals="depthProfileParamA.decimals"
                      :guideline-value="guidelineFor(depthProfileParamA)"
                    />
                  </div>
                </div>
                <div class="col-12 col-sm-6 col-md-4 text-center" v-if="depthProfileParamB">
                  <div class="text-grey-3 text-caption q-mb-xs">
                    {{ depthProfileParamB.label }}{{ depthProfileParamB.unit ? ` (${depthProfileParamB.unit})` : '' }}
                  </div>
                  <div class="chart-inset">
                    <DepthProfileChart
                      :points="depthProfilePointsB"
                      :unit="depthProfileParamB.unit"
                      color="#4fc3f7"
                      :decimals="depthProfileParamB.decimals"
                      :guideline-value="guidelineFor(depthProfileParamB)"
                    />
                  </div>
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
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No readings for {{ depthProfileParamA?.label }}{{ depthProfileParamB ? ` or ${depthProfileParamB.label}` : '' }}
                at {{ depthProfileStationId ?? 'this station' }} in {{ months[aaMonthIndex] }} — try a different
                station, parameter, or month above.
              </span>
            </div>
          </template>

          <!-- All-Parameter Depth Profiles -->
          <template v-else-if="analyticsVizType === 'all-param-depth-profiles'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              All-Parameter Depth Profiles — {{ depthProfileStationId ?? '—' }}, {{ months[aaMonthIndex] }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              Every parameter's own depth-profile line, same station and month as the Vertical Depth
              Profile chart. The dashed line (where shown) is that parameter's DENR
              {{ WATER_QUALITY_CLASS_LABEL }} limit. Parameters with no readings at this station/month
              are skipped.
            </p>
            <div v-if="allParamDepthProfiles.length" class="row q-col-gutter-md">
              <div v-for="entry in allParamDepthProfiles" :key="entry.param.key" class="col-6 col-sm-4 col-md-3 text-center">
                <div class="text-grey-3 text-caption ellipsis q-mb-xs">
                  {{ entry.param.label }}{{ entry.param.unit ? ` (${entry.param.unit})` : '' }}
                </div>
                <div class="chart-inset">
                  <DepthProfileChart
                    :points="entry.points"
                    :unit="entry.param.unit"
                    :decimals="entry.param.decimals"
                    :color="paramColor(entry.param, aaMonthIndex)"
                    :guideline-value="guidelineFor(entry.param)"
                  />
                </div>
              </div>
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No readings for any parameter at {{ depthProfileStationId ?? 'this station' }} in
                {{ months[aaMonthIndex] }} — try a different station or month above.
              </span>
            </div>
            <div v-if="allParamDepthProfiles.length" class="text-caption text-grey-5 q-mt-md">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              Each line's color reflects that parameter's current status (good/warning/serious/critical),
              same scheme as everywhere else on this dashboard. X: value · Y: depth (0m at top).
            </div>
          </template>

          <!-- Multi-Depth Time-Series -->
          <template v-else-if="analyticsVizType === 'multi-depth-time-series'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Multi-Depth Time-Series — {{ aaParam?.label }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              {{ depthProfileStationId ?? '—' }} — one line per sampled depth layer, over the trailing
              13-month window. A depth's line breaks wherever a month wasn't sampled at that depth,
              rather than interpolating across the gap.
            </p>
            <div v-if="multiDepthSeries.series.length" class="chart-inset">
              <MultiDepthTrendChart
                :months="multiDepthSeries.months"
                :series="multiDepthSeries.series"
                :decimals="aaParam?.decimals ?? 1"
              />
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No {{ aaParam?.label }} readings at {{ depthProfileStationId ?? 'this station' }} in the
                13 months through {{ months[aaMonthIndex] }} — try a different station, parameter, or
                month above.
              </span>
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
            <div v-if="rawReadings.length" class="chart-inset">
              <CorrelationHeatmap :labels="correlationLabels" :matrix="correlationMatrix" />
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>No approved readings yet — this needs at least a few paired observations to compute.</span>
            </div>
            <div v-if="rawReadings.length" class="text-caption text-grey-5 q-mt-md">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              r ranges from −1 (perfectly inverse) to +1 (perfectly matched); 0 means no linear
              relationship. Cells built from very few paired readings (see the tooltip's n) are far
              less reliable than they might look — this view doesn't filter those out, so check n
              before reading much into an extreme-looking cell.
            </div>
          </template>

          <!-- Depth-Time Heatmap -->
          <template v-else-if="analyticsVizType === 'depth-time-isopleth'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Depth-Time Heatmap — {{ aaParam?.label }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              {{ depthProfileStationId ?? '—' }}, trailing 13 months. Depth increases downward
              (0m at top); color shows the {{ aaParam?.label }} level.
            </p>
            <div v-if="isoplethColumns.some((c) => c.points.length)" class="chart-inset">
              <DepthTimeIsopleth
                :columns="isoplethColumns"
                :unit="aaParam?.unit ?? ''"
                :decimals="aaParam?.decimals ?? 1"
              />
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No {{ aaParam?.label }} readings at {{ depthProfileStationId ?? 'this station' }} in the
                13 months through {{ months[aaMonthIndex] }} — try a different station, parameter, or
                month above.
              </span>
            </div>
            <div v-if="isoplethColumns.some((c) => c.points.length)" class="text-caption text-grey-5 q-mt-md">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              How to read this: each column is one month's real depth profile at this station, shaded
              smoothly from its surface reading down to its deepest — that vertical blend is a real
              physical continuity (depth genuinely varies smoothly). Columns are <strong>not</strong>
              blended into each other; a hatched column means fewer than 2 depths were sampled that
              month, not that nothing changed. This shows a smooth color gradient rather than traced
              contour lines connecting equal values across months.
            </div>
          </template>

          <!-- Station Comparison (Parallel Coordinates) -->
          <template v-else-if="analyticsVizType === 'station-comparison'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">Station Comparison</div>
            <p class="text-grey-4 text-caption q-mb-md">
              All 13 parameters at once for {{ months[aaMonthIndex] }} — each line is one station.
              Click a line to highlight it; a station missing a reading for a parameter simply skips
              that axis rather than showing a fabricated value.
            </p>

            <!-- Range filters — e.g. "Temperature > 28 AND Dissolved Oxygen < 4" —
                 combined with AND across every active rule. Matching stations light
                 up together in the chart and legend below instead of only the
                 single last-hovered/clicked one. -->
            <div class="row items-center q-gutter-sm q-mb-sm wrap">
              <span class="text-caption text-grey-4">Highlight stations where:</span>
              <div
                v-for="rule in parallelFilterRules"
                :key="rule.id"
                class="row items-center no-wrap q-gutter-xs filter-rule-chip"
              >
                <q-select
                  v-model="rule.paramKey"
                  :options="paramSelectOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  style="min-width: 150px"
                />
                <q-select v-model="rule.operator" :options="['>', '<', '>=', '<=']" dense outlined style="width: 62px" />
                <q-input v-model.number="rule.value" type="number" dense outlined style="width: 80px" />
                <q-btn flat round dense size="sm" icon="close" color="grey-4" @click="removeParallelFilterRule(rule.id)" />
              </div>
              <q-btn flat dense size="sm" icon="add" label="Add filter" color="teal-3" @click="addParallelFilterRule" />
            </div>
            <div v-if="parallelFilterRules.length" class="text-caption text-grey-3 q-mb-sm">
              <q-icon name="filter_alt" size="14px" class="q-mr-xs" />
              {{ parallelMatchedSiteIds.length }} of {{ parallelSeriesList.length }} stations match all
              {{ parallelFilterRules.length }} filter{{ parallelFilterRules.length > 1 ? 's' : '' }} (AND).
            </div>

            <q-scroll-area v-if="parallelSeriesList.length" style="height: 420px" class="chart-inset">
              <ParallelCoordinatesChart
                :axes="parallelAxes"
                :series-list="parallelSeriesList"
                :selected-site-id="aaStationId"
                :matched-site-ids="parallelMatchedSiteIds"
                @select-station="aaSelectStation"
              />
            </q-scroll-area>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No stations have any reading at {{ depthLabel(aaDepth) }} depth in {{ months[aaMonthIndex] }}
                — try a different depth or month above.
              </span>
            </div>
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
                :class="{
                  'parallel-legend__item--active': parallelFilterRules.length
                    ? parallelMatchedSiteIds.includes(s.siteId)
                    : aaStationId === s.siteId,
                  'parallel-legend__item--dim': parallelFilterRules.length > 0 && !parallelMatchedSiteIds.includes(s.siteId),
                }"
                @click="aaSelectStation(s.siteId)"
              >
                <span class="parallel-legend__dot" :style="{ background: s.color }" />
                {{ s.siteId }}
              </button>
            </div>
          </template>

          <!-- Station × Month Compliance Grid -->
          <template v-else-if="analyticsVizType === 'compliance-grid'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">
              Station × Month Compliance Grid — {{ aaParam?.label }}
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              Trailing 13 months, every station, colored by the same good/warning/serious/critical status
              used everywhere else on this dashboard for {{ aaParam?.label }} — not a separate
              composite index. Stations are ordered Tributary → Nearshore → Offshore.
            </p>
            <div v-if="complianceGrid.rows.some((r) => r.cells.some((c) => c.status !== 'no-data'))" class="chart-inset">
              <StationMonthComplianceGrid
                :months="complianceGrid.months"
                :rows="complianceGrid.rows"
                :selected-site-id="aaStationId"
                :unit="aaParam?.unit ?? ''"
                :decimals="aaParam?.decimals ?? 1"
                @select-station="aaSelectStation"
              />
              <div class="text-caption text-grey-5 q-mt-sm">
                <q-icon name="info" size="14px" class="q-mr-xs" />
                Click a station's name to highlight it elsewhere on this dashboard. Hover a cell for its
                exact reading.
              </div>
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No {{ aaParam?.label }} readings at {{ depthLabel(aaDepth) }} depth in the 13 months
                through {{ months[aaMonthIndex] }} — try a different depth, parameter, or month above.
              </span>
            </div>
          </template>

          <!-- Composition Over Time -->
          <template v-else-if="analyticsVizType === 'composition-over-time'">
            <div class="row items-center justify-between q-mb-sm wrap">
              <span class="text-white text-body2 text-weight-medium">
                Composition Over Time{{ compositionStackBy === 'status' ? ` — ${aaParam?.label}` : '' }}
              </span>
              <q-btn-toggle
                v-model="compositionStackBy"
                :options="compositionStackByOptions"
                dense
                no-caps
                unelevated
                toggle-color="teal-6"
                color="grey-9"
                text-color="grey-4"
                class="composition-toggle"
              />
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              <template v-if="compositionStackBy === 'status'">
                Trailing 13 months of approved {{ aaParam?.label }} readings, stacked by how many fell
                into each good/warning/serious/critical band that month.
              </template>
              <template v-else-if="compositionStackBy === 'station'">
                Trailing 13 months of approved readings (any parameter), stacked by which station they were
                sampled at — a view of sampling coverage over time, not water quality itself.
              </template>
              <template v-else>
                Trailing 13 months of approved readings, stacked by which of the 13 parameters were recorded
                — a data-completeness view, not water quality itself.
              </template>
            </p>
            <div v-if="compositionResult.segments.length" class="chart-inset">
              <StackedCompositionChart
                :months="compositionResult.months"
                :segments="compositionResult.segments"
                :stack-by-label="compositionStackByLabel"
              />
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No readings in the 13 months through {{ months[aaMonthIndex] }}
                {{ compositionStackBy === 'status' ? `for ${aaParam?.label}` : '' }} — try a different
                {{ compositionStackBy === 'status' ? 'parameter or ' : '' }}month above.
              </span>
            </div>
          </template>

          <!-- Long-Term Trend -->
          <template v-else-if="analyticsVizType === 'long-term-trend'">
            <div class="row items-center justify-between q-mb-sm wrap">
              <span class="text-white text-body2 text-weight-medium">
                Long-Term Trend — {{ aaParam?.label }}
              </span>
              <div class="row q-gutter-sm items-center">
                <q-btn-toggle
                  v-model="longTermTrendCompare"
                  :options="[
                    { label: 'No Comparison', value: 'none' },
                    { label: 'By Zone', value: 'zone' },
                    { label: 'By Station', value: 'station' },
                  ]"
                  dense
                  no-caps
                  unelevated
                  toggle-color="teal-6"
                  color="grey-9"
                  text-color="grey-4"
                />
                <q-select
                  v-if="longTermTrendCompare === 'zone'"
                  v-model="longTermTrendZone"
                  :options="['Nearshore', 'Offshore', 'Tributary']"
                  dense
                  outlined
                  class="form-field"
                  style="min-width: 140px"
                />
              </div>
            </div>
            <p class="text-grey-4 text-caption q-mb-md">
              <template v-if="longTermTrendCompare === 'none'">
                Every approved {{ aaParam?.label }} reading's lake-wide monthly average, from the
                earliest record to the latest — not just the trailing window used elsewhere on this
                dashboard — with a linear-regression trend line fit to it.
              </template>
              <template v-else-if="longTermTrendCompare === 'zone'">
                Lake-wide average vs. the {{ longTermTrendZone }} zone's own average, over the full
                recorded history. The trend line is fit to the lake-wide line only.
              </template>
              <template v-else>
                Lake-wide average vs. {{ aaStationId ?? 'the selected station (pick one above)' }}.
                The trend line is fit to the lake-wide line only.
              </template>
            </p>
            <div v-if="longTermTrendResult.months.length" class="chart-inset">
              <TrendLineChart
                :months="longTermTrendResult.months"
                :series="longTermTrendResult.series"
                :trend="longTermTrendResult.trend"
                :unit="aaParam?.unit ?? ''"
                :decimals="aaParam?.decimals ?? 1"
              />
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>No approved {{ aaParam?.label }} readings yet — try a different parameter above.</span>
            </div>
          </template>

          <!-- All-Parameter Trend Grid -->
          <template v-else-if="analyticsVizType === 'all-param-trend-grid'">
            <div class="text-white text-body2 text-weight-medium q-mb-xs">All-Parameter Trend Grid</div>
            <p class="text-grey-4 text-caption q-mb-md">
              Every parameter's own lake-wide average trend, trailing 13 months — same window and
              averaging as the 13-Month Trend chart on the Overview tab. The dashed line (where shown)
              is that parameter's DENR {{ WATER_QUALITY_CLASS_LABEL }} limit. Parameters with no data in
              this window are skipped.
            </p>
            <div v-if="allParamTrends.length" class="row q-col-gutter-md">
              <div v-for="entry in allParamTrends" :key="entry.param.key" class="col-12 col-sm-6 col-md-4">
                <div class="text-grey-3 text-caption q-mb-xs">
                  {{ entry.param.label }}{{ entry.param.unit ? ` (${entry.param.unit})` : '' }}
                </div>
                <div class="chart-inset">
                  <ParameterTrendChart
                    :months="entry.months"
                    :values="entry.values"
                    :unit="entry.param.unit"
                    :decimals="entry.param.decimals"
                    :color="paramColor(entry.param, aaMonthIndex)"
                    :guideline-value="guidelineFor(entry.param)"
                  />
                </div>
              </div>
            </div>
            <div v-else class="aa-no-data">
              <q-icon name="info" size="18px" />
              <span>
                No readings in the 13 months through {{ months[aaMonthIndex] }} — try a different month above.
              </span>
            </div>
            <div v-if="allParamTrends.length" class="text-caption text-grey-5 q-mt-md">
              <q-icon name="info" size="14px" class="q-mr-xs" />
              Each line's color reflects that parameter's current status (good/warning/serious/critical),
              same scheme as everywhere else on this dashboard.
            </div>
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
         to a thin strip if it's covering something below.
         Overview-only — Advanced Analytics has its own per-visualization
         Focus Selection instead (see the Analytics Visualization card),
         fully independent of this bar. -->
    <div v-if="activeView === 'overview'" class="controls-bar" :class="{ 'controls-bar--collapsed': !controlsPanelOpen }">
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
              Heatmap, and (when set) the Nutrient Ratio — same as clicking a station on the map below.
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
import StationSummaryDialog, { type StationSummaryRow } from 'src/components/StationSummaryDialog.vue';
import WaterQualityChoroplethMap, {
  type ChoroplethZone,
} from 'src/components/charts/WaterQualityChoroplethMap.vue';
import DepthProfileChart from 'src/components/charts/DepthProfileChart.vue';
import MultiDepthTrendChart, { type DepthSeries } from 'src/components/charts/MultiDepthTrendChart.vue';
import ParallelCoordinatesChart, {
  type ParallelAxis,
  type ParallelSeries,
} from 'src/components/charts/ParallelCoordinatesChart.vue';
import CorrelationHeatmap from 'src/components/charts/CorrelationHeatmap.vue';
import DepthTimeIsopleth, { type IsoplethColumn } from 'src/components/charts/DepthTimeIsopleth.vue';
import StationMonthComplianceGrid, {
  type ComplianceRow,
} from 'src/components/charts/StationMonthComplianceGrid.vue';
import StackedCompositionChart from 'src/components/charts/StackedCompositionChart.vue';
import TrendLineChart from 'src/components/charts/TrendLineChart.vue';
import InterpolatedParamMap from 'src/components/charts/InterpolatedParamMap.vue';
import StationTreemap from 'src/components/charts/StationTreemap.vue';
import MonthlyParamTrendChart from 'src/components/charts/MonthlyParamTrendChart.vue';
import {
  buildCompositionOverTime,
  buildLongTermTrend,
  buildMonthlyParamTrend,
  type CompositionStackBy,
  type MonthlyParamTrendResult,
} from 'src/composables/useWaterQualityAnalytics';
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
  WATER_QUALITY_CLASS_LABEL,
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
  readingMonthIndex,
  applyLatestReadingPeriodDefault,
  latestYearMonth,
  analyticsVizType,
  parallelFilterRules,
  allocateParallelFilterRuleId,
  compositionStackBy,
  longTermTrendCompare,
  longTermTrendZone,
  type ParallelFilterRule,
} from 'src/composables/useWaterQualityDashboardState';
import {
  fetchWaterQualityReadings,
  buildReadingLookup,
  getReading,
  getReadingCoverage,
  computeStationZoneAverages,
  type ReadingLookup,
  type WaterQualityReading,
} from 'src/composables/useWaterQualityReadings';
import { loadMunicipalZones, type MunicipalZone } from 'src/composables/useMunicipalZones';
import { computeStationSummaryRows } from 'src/composables/useStationSummary';

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
    // Overview's Reading Period is session-persisted and only auto-advances
    // once; Advanced Analytics' own Reading Period is page-local (not
    // persisted), so it just re-applies "latest" on every mount instead.
    applyLatestReadingPeriodDefault(readings);
    const latest = latestYearMonth(readings);
    if (latest) {
      aaYear.value = latest.year;
      aaMonthInYear.value = latest.monthInYear;
    }
  } catch (err) {
    console.error('Failed to load water quality readings:', err);
  } finally {
    readingsLoading.value = false;
  }
});

// For the Station Summary dialog's "Nearest Municipality" column — same
// lookup fish observations already use to auto-attribute a municipality.
const municipalZones = ref<MunicipalZone[]>([]);
onMounted(async () => {
  municipalZones.value = await loadMunicipalZones().catch((err: unknown) => {
    console.error('Failed to load municipal water zones for the Station Summary:', err);
    return [] as MunicipalZone[];
  });
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
// Every option below renders a real chart — grouped into 3 sections by the
// question each one answers, since a flat list got hard to scan. Trimmed to
// the most interpretable set (3D Surface Plot, PCA, and Time-Lagged
// Cross-Correlation were cut — all three need a statistics background to
// read correctly, which most visitors to this dashboard don't have); two
// more were renamed away from jargon ("Isopleth" → "Heatmap",
// "Stoichiometric" → "Nutrient Ratio"). isHeader entries are non-selectable
// section labels (option-disable below), rendered differently via the
// #option scoped slot.
interface AnalyticsVizOption {
  label: string;
  value: string;
  description: string;
  isHeader?: boolean;
}
const analyticsVizOptions: AnalyticsVizOption[] = [
  { label: 'Single-Station', value: '__group-single__', description: '', isHeader: true },
  {
    label: 'Vertical Depth Profile',
    value: 'vertical-depth-profile',
    description: 'Two parameters plotted against depth (Surface–50m) for the selected station and month.',
  },
  {
    label: 'Depth-Time Heatmap',
    value: 'depth-time-isopleth',
    description: 'A depth-vs-time heatmap — X: time, Y: depth (0m at top), color: parameter level.',
  },
  {
    label: 'Multi-Depth Time-Series',
    value: 'multi-depth-time-series',
    description: 'One line per sampled depth layer (Surface, 5m, 10m, …, Bottom) plotted over time on a shared axis.',
  },
  {
    label: 'All-Parameter Depth Profiles',
    value: 'all-param-depth-profiles',
    description: 'Every parameter gets its own depth-profile line chart (depth vs. value) for the selected station and month, with its DENR limit marked.',
  },

  { label: 'Cross-Station', value: '__group-cross__', description: '', isHeader: true },
  {
    label: 'Station Comparison',
    value: 'station-comparison',
    description: 'Parallel coordinates — all 13 parameters at once, one colored line per station, with optional range filters to highlight stations matching a rule.',
  },
  {
    label: 'Station × Month Compliance Grid',
    value: 'compliance-grid',
    description: 'A stations-by-months grid colored by status for the selected parameter — a fast overview of which stations run persistently degraded vs. only seasonally.',
  },
  {
    label: 'Composition Over Time',
    value: 'composition-over-time',
    description: 'A stacked bar chart of reading counts per month — pick whether the stack breaks down by Compliance Status, Station, or Parameter.',
  },
  {
    label: 'Long-Term Trend',
    value: 'long-term-trend',
    description: 'Lake-wide average over its full recorded history (not just the trailing window), with a linear-regression trend line — optionally compared against one zone or station.',
  },
  {
    label: 'All-Parameter Trend Grid',
    value: 'all-param-trend-grid',
    description: 'Every parameter gets its own 13-month lake-wide trend line chart, with its DENR limit marked.',
  },

  { label: 'Statistical Relationships', value: '__group-stats__', description: '', isHeader: true },
  {
    label: 'Interactive Statistical Correlation',
    value: 'correlation-heatmap',
    description: 'A 13×13 grid of Pearson (r) or Spearman (ρ) correlation coefficients between every measured parameter.',
  },
];
// analyticsVizType comes from useWaterQualityDashboardState now (session-persisted, see that file).
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
  // shallower water count as nearshore, sites in the deeper open-water zone
  // count as offshore.
  void Promise.all([
    fetchZone('/geo/WQ-Sampling-Sites-Above-40m-Depth.geojson', 'Nearshore', zoneBySite),
    fetchZone('/geo/WQ-Sampling-Sites-Below-40m-Depth.geojson', 'Offshore', zoneBySite),
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

function paramColor(param: WaterQualityParam, monthIndex = selectedMonthIndex.value): string {
  const status = paramStatus(param, monthIndex);
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

// Which visualization the "Station Map" card is currently showing — one
// card, four interchangeable map types, instead of a separate always-on
// Choropleth Map section permanently taking up space below it.
const mapVizType = ref<'station' | 'choropleth' | 'interpolation' | 'treemap'>('station');

const mapVizLabel = computed(() => {
  switch (mapVizType.value) {
    case 'choropleth':
      return 'Choropleth Map';
    case 'interpolation':
      return 'Interpolation Map';
    case 'treemap':
      return 'Treemap';
    default:
      return 'Station Map';
  }
});

const mapVizIcon = computed(() => {
  switch (mapVizType.value) {
    case 'choropleth':
      return 'layers';
    case 'interpolation':
      return 'blur_on';
    case 'treemap':
      return 'dashboard';
    default:
      return 'map';
  }
});

const mapVizCaption = computed(() => {
  switch (mapVizType.value) {
    case 'choropleth':
      return 'Each of the 12 station zones is shaded by the average of its two sub-station readings for the selected parameter (or the one reading that exists, if only one sub-station has data).';
    case 'interpolation':
      return 'A smoothly-blended surface estimated between stations using inverse-distance weighting — useful for spotting likely trends between sampling sites, not a substitute for an actual reading at an unsampled spot.';
    case 'treemap':
      return 'Each station is a box sized by how far its reading sits into the bad end of the parameter’s range and colored by status, so the stations needing the most attention are both the biggest and the reddest.';
    default:
      return `${siteCount.value} monitoring stations across Lake Lanao. Click a station to filter the research charts above, and the Advanced Analytics tab, to that site.`;
  }
});

// ═══ CHOROPLETH MAP ═══
// One value per STATION-<n> zone (public/geo/Lake-Station.geojson), not per
// site — each zone covers a pair of sub-sites (e.g. S1A/S1B under
// STATION-1). Averages whichever of the two actually have a reading for the
// selected parameter/month/depth; when only one does, the "average" of a
// single value is just that value, which is the fallback the request asked
// for without needing a separate branch. Tributary river sites have no
// stationId in that set and no zone polygon, so they're naturally excluded.
const choroplethZones = computed<ChoroplethZone[]>(() => {
  const param = selectedParam.value;
  if (!param) return [];
  // Every site this computed sees is a lake site (never a Tributary river —
  // rivers have no "STATION-" stationId and are filtered out inside
  // computeStationZoneAverages), so depthForSite's river branch never
  // applies here; the selected Depth control is always the right one.
  const zoneAverages = computeStationZoneAverages(
    sites.value,
    readingsLookup.value,
    selectedMonthIndex.value,
    param,
    () => selectedDepthM.value,
  );
  const zones: ChoroplethZone[] = [];
  zoneAverages.forEach(({ stationId, value: average, coverage }) => {
    zones.push({
      stationId,
      formattedValue: average !== null ? formatReading(average, param) : 'No data',
      status: average !== null ? param.getStatus(average) : null,
      coverage,
    });
  });
  return zones;
});

// ═══ STATION SUMMARY DIALOG ═══
// Aggregation itself lives in useStationSummary.ts, shared with the main
// interactive map's own Station Summary button — this page just supplies
// its already-loaded sites/readings/municipal zones.
const showStationSummary = ref(false);
const stationSummaryRows = computed<StationSummaryRow[]>(() => {
  const param = selectedParam.value;
  if (!param) return [];
  return computeStationSummaryRows(sites.value, rawReadings.value, municipalZones.value, param);
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

// The selected parameter's raw reading at each site for the current Reading
// Period — shared source for the Interpolation Map (its scattered input
// points) and the Treemap (its box sizes), so both read the exact same
// numbers the markers/tooltips already show instead of recomputing it twice.
const valueBySite = computed<Record<string, number>>(() => {
  const param = selectedParam.value;
  const result: Record<string, number> = {};
  if (!param) return result;
  sites.value.forEach((site) => {
    const value = getReading(readingsLookup.value, site.siteId, selectedMonthIndex.value, param, depthForSite(site));
    if (value !== null) result[site.siteId] = value;
  });
  return result;
});

const selectedParamTrend = computed(() =>
  selectedParam.value ? trendSeries(selectedParam.value) : { months: [], values: [] },
);

// ═══ MONTHLY (PARAMETER) TREND ═══ — by-month rollup of the same selected
// parameter, covering every month with data (not just the 13-Month Trend's
// fixed trailing window above). Area is the default per the request this
// was built for; Line and Stack (reading counts by status) are switchable
// from the same toggle.
const monthlyTrendMode = ref<'area' | 'line' | 'stack'>('area');

const monthlyParamTrend = computed<MonthlyParamTrendResult>(() => {
  if (!selectedParam.value) return { months: [], average: [], statusCounts: { good: [], warning: [], serious: [], critical: [] } };
  return buildMonthlyParamTrend(rawReadings.value, selectedParam.value, (idx) => months[idx] ?? '');
});

const monthlyTrendCaption = computed(() => {
  if (monthlyTrendMode.value === 'stack') {
    return 'Reading counts per month, stacked by status — how the balance of Good/Warning/Serious/Critical readings has shifted month over month.';
  }
  return `Average ${selectedParam.value?.label ?? 'parameter'} value per month across every station and reading.`;
});

// ═══ ADVANCED ANALYTICS — OWN FOCUS SELECTION ═══
// Fully independent of the Reading Controls bar above (which is Overview-
// only) — each Advanced Analytics visualization reads from these instead,
// so switching the Type of Analytics Visualization doesn't also silently
// depend on whatever the Overview tab happened to be set to. Shown
// conditionally (see aaNeeds* below) — only the fields a given type
// actually uses ever appear, same reasoning as the Download Center's own
// Focus Selection.
const aaYear = ref(selectedYear.value);
const aaMonthInYear = ref(selectedMonthInYear.value);
const aaStationId = ref<string | null>(null);
const aaParamKey = ref<string | null>(allWaterQualityParams[0]!.key);
const aaDepth = ref(0);

const aaMonthIndex = computed(() => readingMonthIndex(aaYear.value, aaMonthInYear.value));
const aaParam = computed(() => allWaterQualityParams.find((p) => p.key === aaParamKey.value) ?? null);
const aaStationIdOrFirst = computed(
  () => aaStationId.value ?? deepestStationId.value ?? sites.value[0]?.siteId ?? null,
);
// What the Focus Station picker actually displays — for optional-station
// types (Long-Term Trend) an empty picker genuinely means "lake-wide, no
// comparison," so it stays null rather than silently resolving to a station.
const aaStationModel = computed<string | null>({
  get: () => (aaStationOptional.value ? aaStationId.value : aaStationIdOrFirst.value),
  set: (val) => {
    aaStationId.value = val;
  },
});
function aaDepthForSite(site: Site): number {
  return site.zone === 'Tributary' ? 0 : aaDepth.value;
}
// Click-to-highlight within charts that show every station at once (Station
// Comparison, Compliance Grid) — mirrors selectStation() below, but toggles
// this tab's own station instead of the Overview's.
function aaSelectStation(siteId: string) {
  if (TRIBUTARY_RIVER_SITE_IDS.has(siteId)) return;
  aaStationId.value = aaStationId.value === siteId ? null : siteId;
}
// Trailing 13-month window ending at aaMonthIndex — mirrors trendIndices
// above, just anchored to this tab's own month instead of the Overview's.
const aaTrendIndices = computed(() => {
  const end = aaMonthIndex.value;
  const start = Math.max(0, end - 12);
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
});
function aaTrendSeries(param: WaterQualityParam): { months: string[]; values: number[] } {
  const monthsOut: string[] = [];
  const valuesOut: number[] = [];
  for (const i of aaTrendIndices.value) {
    const value = lakeAverage(param, i);
    if (value !== null) {
      monthsOut.push(months[i]!);
      valuesOut.push(value);
    }
  }
  return { months: monthsOut, values: valuesOut };
}

const AA_NEEDS_STATION = new Set(['vertical-depth-profile', 'depth-time-isopleth', 'multi-depth-time-series', 'all-param-depth-profiles']);
const AA_OPTIONAL_STATION = new Set(['long-term-trend']);
const AA_NEEDS_PARAM = new Set(['depth-time-isopleth', 'multi-depth-time-series', 'compliance-grid', 'composition-over-time', 'long-term-trend']);
const AA_NEEDS_DEPTH = new Set(['station-comparison', 'compliance-grid']);
const AA_NEEDS_MONTH = new Set([
  'vertical-depth-profile',
  'depth-time-isopleth',
  'multi-depth-time-series',
  'all-param-depth-profiles',
  'station-comparison',
  'compliance-grid',
  'composition-over-time',
  'all-param-trend-grid',
]);

const aaNeedsStation = computed(() => AA_NEEDS_STATION.has(analyticsVizType.value) || AA_OPTIONAL_STATION.has(analyticsVizType.value));
const aaNeedsParam = computed(() => AA_NEEDS_PARAM.has(analyticsVizType.value));
const aaNeedsDepth = computed(() => AA_NEEDS_DEPTH.has(analyticsVizType.value));
const aaNeedsMonth = computed(() => AA_NEEDS_MONTH.has(analyticsVizType.value));
const aaStationOptional = computed(() => AA_OPTIONAL_STATION.has(analyticsVizType.value));

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
const depthProfileStationId = computed(() => aaStationIdOrFirst.value);

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

// The station with the single deepest reading ever recorded (rivers
// excluded — they're always Surface-only, see stationPickerOptions below).
// Used as Advanced Analytics' default focus station instead of just
// whichever site happens to be first, so a fresh visit to a
// depth-profile-shaped viz type (the default is now All-Parameter Depth
// Profiles) opens on the station with the most vertical range to show off.
const deepestStationId = computed<string | null>(() => {
  let best: string | null = null;
  let bestDepth = -Infinity;
  rawReadings.value.forEach((r) => {
    if (TRIBUTARY_RIVER_SITE_IDS.has(r.siteId)) return;
    if (r.depthM > bestDepth) {
      bestDepth = r.depthM;
      best = r.siteId;
    }
  });
  return best;
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
// the first one) while still sharing selectedStationId with the map's
// click-to-select/deselect — picking "Auto" here and deselecting a station
// on the map do the same thing. Overview-only now — Advanced Analytics has
// its own independent aaStationId (see above).
const stationPickerModel = computed<string | null>({
  get: () => selectedStationId.value ?? sites.value[0]?.siteId ?? null,
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
    ? depthProfilePoints(depthProfileStationId.value, depthProfileParamA.value, aaMonthIndex.value)
    : [],
);
const depthProfilePointsB = computed(() =>
  depthProfileStationId.value && depthProfileParamB.value
    ? depthProfilePoints(depthProfileStationId.value, depthProfileParamB.value, aaMonthIndex.value)
    : [],
);

// ═══ ALL-PARAMETER DEPTH PROFILES (SMALL MULTIPLES) ═══
// Same station/month as the Vertical Depth Profile chart, but every
// parameter at once instead of the two picked via Parameter A/B — params
// with no readings at this station/month are skipped rather than shown empty.
const allParamDepthProfiles = computed(() => {
  const stationId = depthProfileStationId.value;
  const result: { param: WaterQualityParam; points: DepthReadingPoint[] }[] = [];
  if (!stationId) return result;
  for (const param of allWaterQualityParams) {
    const points = depthProfilePoints(stationId, param, aaMonthIndex.value);
    if (points.length > 0) result.push({ param, points });
  }
  return result;
});

// ═══ ALL-PARAMETER TREND GRID (SMALL MULTIPLES) ═══
// Same lake-wide trailing-13-month series the 13-Month Trend chart above
// uses (trendSeries), but every parameter at once instead of just the
// selected one.
const allParamTrends = computed(() =>
  allWaterQualityParams
    .map((param) => ({ param, ...aaTrendSeries(param) }))
    .filter((t) => t.values.length > 0),
);

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
  const param = aaParam.value;
  const monthsOut = aaTrendIndices.value.map((i) => months[i]!);
  if (!stationId || !param) return { months: monthsOut, series: [] };

  const activeDepths = DEPTHS.filter((depth) =>
    aaTrendIndices.value.some((i) => getReading(readingsLookup.value, stationId, i, param, depth) !== null),
  );
  const series: DepthSeries[] = activeDepths.map((depth, di) => ({
    depth,
    label: depthLabel(depth),
    color: colorForIndex(di, activeDepths.length),
    values: aaTrendIndices.value.map((i) => getReading(readingsLookup.value, stationId, i, param, depth)),
  }));
  return { months: monthsOut, series };
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
      (p) => getReading(readingsLookup.value, site.siteId, aaMonthIndex.value, p, aaDepthForSite(site)) !== null,
    ),
  );
  return eligible.map((site, i) => ({
    siteId: site.siteId,
    color: colorForIndex(i, eligible.length),
    values: allWaterQualityParams.map((p) =>
      getReading(readingsLookup.value, site.siteId, aaMonthIndex.value, p, aaDepthForSite(site)),
    ),
  }));
});

// Range filters on the Station Comparison chart — e.g. "Temperature > 28 AND
// Dissolved Oxygen < 4" — combined with AND across every active rule. A
// station missing a reading for a filtered parameter that month can't
// satisfy the rule (no fabricated pass/fail), so it's excluded like any
// other non-match rather than silently ignored. parallelFilterRules comes
// from useWaterQualityDashboardState now (session-persisted, see that file).

function addParallelFilterRule() {
  const firstParam = allWaterQualityParams[0]!;
  parallelFilterRules.value.push({
    id: allocateParallelFilterRuleId(),
    paramKey: firstParam.key,
    operator: '>',
    value: firstParam.typical,
  });
}
function removeParallelFilterRule(id: number) {
  parallelFilterRules.value = parallelFilterRules.value.filter((r) => r.id !== id);
}

function parallelRuleMatches(rule: ParallelFilterRule, site: Site): boolean {
  const param = allWaterQualityParams.find((p) => p.key === rule.paramKey);
  if (!param) return false;
  const value = getReading(readingsLookup.value, site.siteId, aaMonthIndex.value, param, aaDepthForSite(site));
  if (value === null) return false;
  switch (rule.operator) {
    case '>':
      return value > rule.value;
    case '<':
      return value < rule.value;
    case '>=':
      return value >= rule.value;
    case '<=':
      return value <= rule.value;
  }
}

const parallelMatchedSiteIds = computed<string[]>(() => {
  if (parallelFilterRules.value.length === 0) return [];
  const eligibleIds = new Set(parallelSeriesList.value.map((s) => s.siteId));
  return sites.value
    .filter((site) => eligibleIds.has(site.siteId))
    .filter((site) => parallelFilterRules.value.every((rule) => parallelRuleMatches(rule, site)))
    .map((site) => site.siteId);
});

// Zone order (Tributary → Nearshore → Offshore) — shared by the Compliance
// Grid and Long-Term Trend's zone comparison below.
const ZONE_ORDER: Record<Site['zone'], number> = { Tributary: 0, Nearshore: 1, Offshore: 2 };
const zoneOrderedSites = computed(() =>
  [...sites.value].sort((a, b) => ZONE_ORDER[a.zone] - ZONE_ORDER[b.zone] || a.siteId.localeCompare(b.siteId)),
);

// ═══ STATION × MONTH COMPLIANCE GRID ═══
// Reuses the same single-parameter good/warning/serious/critical status
// every other chart on this dashboard uses — not a separate composite Water
// Quality Index, which would need its own methodology (NSF WQI, CCME WQI,
// etc.) to be defensible rather than invented ad hoc.
const complianceGrid = computed<{ months: string[]; rows: ComplianceRow[] }>(() => {
  const param = aaParam.value;
  if (!param) return { months: [], rows: [] };
  const monthsOut = aaTrendIndices.value.map((i) => months[i]!);
  const rows: ComplianceRow[] = zoneOrderedSites.value.map((site) => ({
    siteId: site.siteId,
    cells: aaTrendIndices.value.map((i) => {
      const value = getReading(readingsLookup.value, site.siteId, i, param, aaDepthForSite(site));
      return value === null
        ? { status: 'no-data' as const, value: null }
        : { status: param.getStatus(value), value };
    }),
  }));
  return { months: monthsOut, rows };
});

// ═══ COMPOSITION OVER TIME (stacked bar) ═══
// Same trailing-13-month window as the Compliance Grid, for consistency —
// readings are raw sample rows (rawReadings), not the per-site/param lookup,
// since "by station"/"by parameter" need to count rows directly rather than
// a single parameter's values.
const compositionResult = computed(() => {
  const param = aaParam.value;
  if (!param) return { months: [], segments: [] };
  const monthLabels = aaTrendIndices.value.map((i) => months[i]!);
  return buildCompositionOverTime(
    rawReadings.value,
    zoneOrderedSites.value,
    param,
    compositionStackBy.value,
    aaTrendIndices.value,
    monthLabels,
  );
});

const compositionStackByOptions: { label: string; value: CompositionStackBy }[] = [
  { label: 'Compliance Status', value: 'status' },
  { label: 'Station', value: 'station' },
  { label: 'Parameter', value: 'parameter' },
];

const compositionStackByLabel = computed(
  () => compositionStackByOptions.find((o) => o.value === compositionStackBy.value)?.label ?? 'Category',
);

// ═══ LONG-TERM TREND ═══
const longTermTrendResult = computed(() => {
  const param = aaParam.value;
  if (!param) return { months: [], series: [], trend: null };

  // Same blue/orange pairing as Vertical Depth Profile's Parameter A/B —
  // reusing the dashboard's own established "comparing two things" colors
  // rather than introducing a new one-off pair for this chart.
  const groups: { key: string; label: string; color: string; filter: (r: WaterQualityReading) => boolean }[] = [
    { key: 'lake', label: 'Lake-wide average', color: '#4fc3f7', filter: () => true },
  ];
  if (longTermTrendCompare.value === 'zone') {
    const zoneSiteIds = new Set(sites.value.filter((s) => s.zone === longTermTrendZone.value).map((s) => s.siteId));
    groups.push({
      key: 'zone',
      label: `${longTermTrendZone.value} average`,
      color: '#ff8a65',
      filter: (r) => zoneSiteIds.has(r.siteId),
    });
  } else if (longTermTrendCompare.value === 'station' && aaStationId.value) {
    const stationId = aaStationId.value;
    groups.push({
      key: 'station',
      label: stationId,
      color: '#ff8a65',
      filter: (r) => r.siteId === stationId,
    });
  }

  return buildLongTermTrend(rawReadings.value, param, groups, (idx) => months[idx] ?? `#${idx}`);
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

// ═══ DEPTH-TIME HEATMAP ═══
// Same station/parameter as the Vertical Depth Profile chart — one column
// per month in the trailing window, real depth readings only.
const isoplethColumns = computed<IsoplethColumn[]>(() => {
  const stationId = depthProfileStationId.value;
  const param = aaParam.value;
  if (!stationId || !param) return [];
  return aaTrendIndices.value.map((i) => ({
    month: months[i]!,
    points: depthProfilePoints(stationId, param, i),
  }));
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
  background: #ffffff;
  border: 1px solid #e1e6ed;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(16, 32, 64, 0.08);
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

/* Replaces the old hotlinked-photo + dark-overlay background — a plain
   light page, same tone as the Download Center, so cards and chart text
   actually stand out instead of competing with a busy dark image. */
.dashboard-page {
  background: #eef1f5;
  align-items: stretch;
}

.glass-morph {
  background: #ffffff !important;
  border: 1px solid #e1e6ed;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(16, 32, 64, 0.08);
}

/* Quasar's text-white/text-grey-* utility classes are used throughout this
   page's markup for what used to be light-on-dark-glass text — remapped
   here to dark-on-white instead of rewriting every element's classes. */
.glass-morph .text-white {
  color: #16306b !important;
}
.glass-morph .text-grey-3 {
  color: #2c3a4a !important;
}
.glass-morph .text-grey-4 {
  color: #5c6b7a !important;
}
.glass-morph .text-grey-5 {
  color: #6b7686 !important;
}
.glass-morph .text-grey-6 {
  color: #8591a0 !important;
}
.glass-morph .text-grey-2 {
  color: #9aa5b1 !important;
}
/* Pastel -3 icon/accent colors (teal-3, blue-3, orange-3) read fine on dark
   glass but wash out on white — darkened to solid, legible equivalents. */
.glass-morph .text-teal-3 {
  color: #00897b !important;
}
.glass-morph .text-blue-3 {
  color: #1976d2 !important;
}
.glass-morph .text-orange-3 {
  color: #ef6c00 !important;
}

/* Chart-rendering areas keep their own dark background — every chart
   component's internal colors (gridlines, axis labels, data lines) are
   tuned for a dark backdrop and shared with the Download Center, so this
   avoids re-theming 13 chart components individually. */
.chart-inset {
  background: #16212e;
  border-radius: 10px;
  padding: 12px;
}

/* No-data notice — shown in place of a chart when the current Focus
   Selection has nothing to plot, instead of a blank chart-inset or quiet
   grey text that's easy to miss. */
.aa-no-data {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 8px;
  color: #8d6e00;
  font-size: 0.82rem;
  line-height: 1.4;
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
  background: #f4f6f8 !important;
  border: 1px solid #e1e6ed;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.param-tile:hover {
  background: #e9edf1 !important;
}

.param-tile--active {
  border-color: #26a69a;
  background: rgba(38, 166, 154, 0.14) !important;
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
  background: #f4f6f8;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 3px 10px 3px 8px;
  color: #2c3a4a;
  font-size: 0.7rem;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.parallel-legend__item:hover {
  background: #e9edf1;
}

.parallel-legend__item--active {
  background: rgba(38, 166, 154, 0.16);
  border-color: rgba(38, 166, 154, 0.6);
  color: #00695c;
}

.parallel-legend__item--dim {
  opacity: 0.35;
}

.parallel-legend__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.filter-rule-chip {
  background: #f4f6f8;
  border-radius: 8px;
  padding: 4px 6px;
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
  background: #f4f6f8;
}

.concern-item--active {
  background: rgba(38, 166, 154, 0.14);
  outline: 1px solid rgba(38, 166, 154, 0.5);
}

.glass-morph .form-field :deep(.q-field__control) {
  background: #f4f6f8;
}

.glass-morph .form-field :deep(.q-field__label) {
  color: #6b7686;
}

.glass-morph .form-field :deep(.q-field__native),
.glass-morph .form-field :deep(.q-field__input) {
  color: #16306b;
}
</style>

<!-- Not scoped, deliberately: QSelect's option popup is teleported outside
     this component's DOM tree, so it never receives the scoped data-v-*
     attribute — a scoped rule here would silently never match it. -->
<style>
.viz-picker-popup {
  background: #ffffff;
}
.viz-picker-popup .text-teal-3 {
  color: #00897b !important;
}
.viz-picker-group-header {
  min-height: 28px;
  padding-top: 10px;
  padding-bottom: 2px;
  border-top: 1px solid #e1e6ed;
}
.viz-picker-group-header:first-child {
  border-top: none;
  padding-top: 4px;
}
</style>
