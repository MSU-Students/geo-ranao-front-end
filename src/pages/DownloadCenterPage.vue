<template>
  <q-page class="dc-page">
    <BackButton to="/map" />

    <!-- Banner header — title + institutional logos, styled after the
         Karagatan Patrol / Tableau analytics layout this page was modeled
         on (OCEANA + KARAGATAN PATROL logos top-right of a navy banner). -->
    <div class="dc-banner">
      <div class="dc-banner__title">
        <div class="text-h5 text-weight-bolder">Lake Lanao Water Quality Analytics</div>
        <div class="text-caption dc-banner__subtitle">Download Center — Reports, Maps &amp; Statistical Visualizations</div>
      </div>
      <div class="dc-banner__logos">
        <div class="dc-banner__logo-box">
          <img src="~assets/cics-logo.webp" alt="CICS" />
        </div>
        <div class="dc-banner__logo-box">
          <img src="~assets/CFAS-Logo.png" alt="CFAS" />
        </div>
      </div>
    </div>

    <div class="page-content full-width q-pa-md" style="max-width: 1200px">
      <div class="row q-col-gutter-md">
        <!-- Filters -->
        <div class="col-12 col-md-4">
          <q-card class="panel-card q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-md dc-sidebar-title">
              <q-icon name="tune" class="q-mr-xs" />Filters
            </div>

            <div class="text-caption text-grey-4 q-mb-xs">Parameters</div>
            <q-select
              v-model="filters.parameterKeys"
              :options="parameterOptions"
              multiple emit-value map-options use-chips
              outlined dense class="form-field q-mb-md"
              label="All Parameters"
            />

            <div class="text-caption text-grey-4 q-mb-xs">Lake Stations</div>
            <q-select
              v-model="filters.stationIds"
              :options="stationOptions"
              multiple emit-value map-options use-chips
              outlined dense class="form-field q-mb-md"
              label="All Lake Stations"
            />

            <q-toggle
              v-model="filters.includeTributaries"
              label="Include Tributary Rivers"
              color="teal"
              class="q-mb-md"
            />

            <div class="text-caption text-grey-4 q-mb-xs">Depths</div>
            <q-select
              v-model="filters.depths"
              :options="depthOptions"
              multiple emit-value map-options use-chips
              outlined dense class="form-field q-mb-md"
              label="All Depths"
            />

            <div class="text-caption text-grey-4 q-mb-xs">Date Range</div>
            <q-select
              v-model="filters.dateRange"
              :options="dateRangeOptions"
              outlined dense class="form-field q-mb-md"
            />

            <div class="text-caption text-grey-4 q-mb-xs">Analytics Visualizations (optional)</div>
            <q-select
              v-model="selectedAnalytics"
              :options="analyticsOptionsWithAvailability"
              option-disable="disable"
              multiple emit-value map-options use-chips
              outlined dense class="form-field q-mb-md"
              label="None — summary table only"
              hint="Shown in the preview below and, if 'Analytics Report (PDF)' is selected, added to the download. Greyed-out options don't have enough data for your current filters."
            >
              <template #option="scope">
                <q-item v-if="scope.opt.isHeader">
                  <q-item-section>
                    <q-item-label caption class="text-teal-7 text-weight-bold">{{ scope.opt.label.toUpperCase() }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-else v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption class="text-grey-6">
                      {{ scope.opt.disable ? 'Not enough data for this with your current filters.' : ANALYTICS_REQUIREMENTS[scope.opt.value] }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Focus selectors — only the charts that need a single specific
                 station/parameter/month (rather than operating over the whole
                 filtered set, like Station Comparison / Correlation / PCA do)
                 show these, and only the ones they actually need. -->
            <template v-if="needsFocusStation || needsFocusParam || needsFocusParamPair || needsFocusMonth">
              <q-separator class="q-mb-md" />
              <div class="text-caption text-grey-4 q-mb-sm">
                <q-icon name="center_focus_strong" size="14px" class="q-mr-xs" />Focus selection for the chart(s) above
              </div>

              <q-select
                v-if="needsFocusStation"
                v-model="focusStationId"
                :options="focusStationOptions"
                emit-value map-options
                outlined dense class="form-field q-mb-md"
                label="Focus Station"
              />

              <q-select
                v-if="needsFocusParam"
                v-model="focusParamKey"
                :options="scopeParameterOptions"
                emit-value map-options
                outlined dense class="form-field q-mb-md"
                label="Focus Parameter"
                hint="Only parameters your Parameters filter (above) currently includes."
              />

              <div v-if="needsFocusParamPair" class="row q-col-gutter-sm q-mb-md">
                <div class="col-6">
                  <q-select
                    v-model="focusParamAKey"
                    :options="scopeParameterOptions"
                    emit-value map-options
                    outlined dense class="form-field"
                    label="Parameter A"
                  />
                </div>
                <div class="col-6">
                  <q-select
                    v-model="focusParamBKey"
                    :options="scopeParameterOptions"
                    emit-value map-options
                    outlined dense class="form-field"
                    label="Parameter B"
                  />
                </div>
              </div>
              <div v-if="needsFocusParamPair" class="text-caption text-grey-5 q-mt-n-sm q-mb-md">
                Both only offer parameters your Parameters filter (above) currently includes — narrow it to
                fewer than 2 and two-parameter charts can't be added.
              </div>

              <q-select
                v-if="needsFocusMonth"
                v-model="focusMonthKey"
                :options="focusMonthOptions"
                emit-value map-options
                outlined dense class="form-field q-mb-md"
                label="Focus Month"
                :hint="focusMonthOptions.length === 0 ? 'No months in the current filter — widen the date range.' : undefined"
              />
            </template>

            <q-separator class="q-mb-md" />

            <div class="text-caption text-grey-4 q-mb-sm">What do you want to download?</div>
            <q-btn-toggle
              v-model="outputType"
              spread
              no-caps
              toggle-color="primary"
              color="grey-2"
              text-color="grey-8"
              class="q-mb-md dc-output-toggle"
              :options="[
                { label: 'Analytics Report (PDF)', value: 'report', icon: 'summarize' },
                { label: 'Map Snapshot (PNG)', value: 'map', icon: 'map' },
              ]"
            />

            <q-btn
              color="primary"
              label="Download"
              icon="download"
              unelevated rounded class="full-width"
              :loading="downloading"
              :disable="scope.readings.length === 0"
              @click="handleDownload"
            />
            <div v-if="scope.readings.length === 0" class="text-caption text-negative q-mt-sm">
              No approved readings match these filters — try widening them.
            </div>

            <q-separator class="q-my-md" />
            <div class="dc-source-note">
              <q-icon name="verified" size="14px" class="q-mr-xs" />
              <strong>Source:</strong> College of Fisheries and Aquatic Sciences (CFAS), MSU Main Campus —
              field data gathering and surveying using in-situ sensors and laboratory chemical analysis, for
              a Lake Lanao water quality monitoring project funded by DOST-PCAARRD.
            </div>
          </q-card>
        </div>

        <!-- Preview -->
        <div class="col-12 col-md-8">
        <div class="panel-grid">
          <q-card class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="visibility" class="q-mr-xs" color="teal-3" />Preview
            </div>
            <div class="text-caption text-grey-4 q-mb-sm">
              {{ scope.readings.length }} reading(s) from {{ scope.stationsWithData.length }} station(s) — each
              included station is colored by its status (the worst of whichever parameter(s) you've selected).
              Hover a station for its value.
            </div>
            <div ref="mapCaptureWrapEl" class="map-capture-wrap">
              <div ref="previewMapEl" class="preview-map" />
              <div class="row items-center justify-center q-gutter-md q-mt-sm">
                <div v-for="level in STATUS_LEVELS" :key="level" class="row items-center no-wrap">
                  <span class="status-dot" :style="{ background: STATUS_COLORS[level] }" />
                  <span class="text-caption text-grey-4 q-ml-xs">{{ STATUS_LABELS[level] }}</span>
                </div>
                <div class="row items-center no-wrap">
                  <span class="status-dot" style="background: #9e9e9e" />
                  <span class="text-caption text-grey-4 q-ml-xs">Excluded by filters</span>
                </div>
              </div>
              <div class="text-caption text-grey-5 q-mt-xs text-center">
                Thin blue ring = tributary station
              </div>
            </div>
          </q-card>

          <q-card class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="table_chart" class="q-mr-xs" color="teal-3" />Parameter Summary
            </div>
            <div class="text-caption text-grey-4 q-mb-sm">
              Judged against DENR {{ WATER_QUALITY_CLASS_LABEL }} limitations.
            </div>
            <q-markup-table flat dense class="preview-table">
              <thead>
                <tr>
                  <th class="text-left">Parameter</th>
                  <th class="text-left">Average</th>
                  <th class="text-left">DENR Limit</th>
                  <th class="text-left">Status</th>
                  <th class="text-left">Readings</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in paramStats" :key="s.param.key">
                  <td>{{ s.param.label }}</td>
                  <td>{{ s.avg !== null ? formatReading(s.avg, s.param) : '—' }}</td>
                  <td>{{ formatClassLimit(s.param) }}</td>
                  <td>
                    <q-badge v-if="s.status" :style="{ backgroundColor: STATUS_COLORS[s.status] }" :label="STATUS_LABELS[s.status]" />
                    <span v-else class="text-grey-6">No data</span>
                  </td>
                  <td>{{ s.count }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('parallel')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="timeline" class="q-mr-xs" color="teal-3" />Station Comparison
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              Every parameter at once, one line per station — averaged across all matching readings.
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS.parallel }}</div>
            <div ref="parallelChartEl" class="chart-capture-wrap">
              <ParallelCoordinatesChart :axes="parallelData.axes" :series-list="parallelData.seriesList" />
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('correlation')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="grid_on" class="q-mr-xs" color="teal-3" />Statistical Correlation
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              Pearson correlation (r) between every pair of parameters, from every matching reading.
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS.correlation }}</div>
            <div ref="correlationChartEl" class="chart-capture-wrap">
              <CorrelationHeatmap :labels="correlationData.labels" :matrix="correlationData.matrix" />
            </div>
            <div class="text-caption text-grey-5 q-mt-sm">
              r ranges from −1 (perfectly inverse) to +1 (perfectly matched); 0 means no linear relationship.
              Cells built from very few paired readings are far less reliable than they might look — hover a
              cell to see exactly how many paired readings (n) it's based on before reading much into it.
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('depth-profile')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="moving" class="q-mr-xs" color="teal-3" />Vertical Depth Profile
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              {{ focusStationId ?? '—' }}, {{ focusMonthLabel }} — value by depth (0m/Surface at top).
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS['depth-profile'] }}</div>
            <div ref="depthProfileChartEl" class="chart-capture-wrap">
              <template v-if="focusStationId && focusMonthKey">
                <div class="row q-col-gutter-sm justify-center">
                  <div class="col-12 col-sm-6 text-center" v-if="focusParamA">
                    <div class="text-grey-3 text-caption q-mb-xs">{{ focusParamA.label }}</div>
                    <DepthProfileChart :points="depthProfilePointsA" :unit="focusParamA.unit" color="#ff8a65" :decimals="focusParamA.decimals" :guideline-value="guidelineFor(focusParamA)" />
                  </div>
                  <div class="col-12 col-sm-6 text-center" v-if="focusParamB">
                    <div class="text-grey-3 text-caption q-mb-xs">{{ focusParamB.label }}</div>
                    <DepthProfileChart :points="depthProfilePointsB" :unit="focusParamB.unit" color="#4fc3f7" :decimals="focusParamB.decimals" :guideline-value="guidelineFor(focusParamB)" />
                  </div>
                </div>
                <div class="row items-center justify-center q-gutter-md q-mt-sm">
                  <div class="row items-center no-wrap" v-if="focusParamA">
                    <span class="status-dot" style="background: #ff8a65" />
                    <span class="text-caption text-grey-4 q-ml-xs">{{ focusParamA.label }}</span>
                  </div>
                  <div class="row items-center no-wrap" v-if="focusParamB">
                    <span class="status-dot" style="background: #4fc3f7" />
                    <span class="text-caption text-grey-4 q-ml-xs">{{ focusParamB.label }}</span>
                  </div>
                  <div class="row items-center no-wrap" v-if="guidelineFor(focusParamA) !== undefined || guidelineFor(focusParamB) !== undefined">
                    <span class="legend-dash" />
                    <span class="text-caption text-grey-4 q-ml-xs">DENR guideline</span>
                  </div>
                </div>
                <div class="text-caption text-grey-5 q-mt-xs text-center">X-axis: value · Y-axis: depth (0m/Surface at top)</div>
              </template>
              <div v-else class="text-center text-grey-5 q-py-lg">Pick a Focus Station and Focus Month above.</div>
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('isopleth')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="gradient" class="q-mr-xs" color="teal-3" />Depth-Time Isopleth
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              {{ focusStationId ?? '—' }} — {{ focusParam?.label }} by depth, one column per month in the filtered range.
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS.isopleth }}</div>
            <div ref="isoplethChartEl" class="chart-capture-wrap">
              <DepthTimeIsopleth v-if="focusStationId && isoplethColumns.some((c) => c.points.length)" :columns="isoplethColumns" :unit="focusParam?.unit ?? ''" :decimals="focusParam?.decimals ?? 1" />
              <div v-else class="text-center text-grey-5 q-py-lg">Pick a Focus Station and Focus Parameter above.</div>
            </div>
            <div v-if="focusStationId && isoplethColumns.some((c) => c.points.length)" class="text-caption text-grey-5 q-mt-sm">
              Each column is one month's real depth profile at this station, shaded smoothly from its surface
              reading down to its deepest. Columns are not blended into each other; a hatched column means
              fewer than 2 depths were sampled that month, not that nothing changed.
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('multi-depth')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="stacked_line_chart" class="q-mr-xs" color="teal-3" />Multi-Depth Time-Series
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              {{ focusStationId ?? '—' }} — one line per sampled depth, over the filtered date range.
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS['multi-depth'] }}</div>
            <div ref="multiDepthChartEl" class="chart-capture-wrap">
              <MultiDepthTrendChart v-if="focusStationId && multiDepthSeries.series.length" :months="multiDepthSeries.months" :series="multiDepthSeries.series" :decimals="focusParam?.decimals ?? 1" />
              <div v-else class="text-center text-grey-5 q-py-lg">Pick a Focus Station and Focus Parameter above.</div>
            </div>
            <div v-if="focusStationId && multiDepthSeries.series.length" class="text-caption text-grey-5 q-mt-sm">
              A depth's line breaks wherever a month wasn't sampled at that depth, rather than interpolating
              across the gap. See the chart's own legend for which color is which depth.
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('all-param-depth')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="dashboard" class="q-mr-xs" color="teal-3" />All-Parameter Depth Profiles
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              {{ focusStationId ?? '—' }}, {{ focusMonthLabel }} — every filtered parameter gets its own
              depth-profile line, with its DENR limit marked.
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS['all-param-depth'] }}</div>
            <div ref="allParamDepthChartEl" class="chart-capture-wrap">
              <div v-if="allParamDepthResult.length" class="row q-col-gutter-md">
                <div v-for="entry in allParamDepthResult" :key="entry.param.key" class="col-6 col-sm-4 col-md-3 text-center">
                  <div class="text-grey-3 text-caption ellipsis q-mb-xs">
                    {{ entry.param.label }}{{ entry.param.unit ? ` (${entry.param.unit})` : '' }}
                  </div>
                  <DepthProfileChart
                    :points="entry.points"
                    :unit="entry.param.unit"
                    :decimals="entry.param.decimals"
                    :color="dcParamColor(entry.param)"
                    :guideline-value="guidelineFor(entry.param)"
                  />
                </div>
              </div>
              <div v-else class="text-center text-grey-5 q-py-lg">Pick a Focus Station and Focus Month above.</div>
            </div>
            <div class="text-caption text-grey-5 q-mt-sm">
              Each line's color reflects that parameter's status judged against its filtered-scope average
              (same Status column as the Parameter Summary table above). X: value · Y: depth (0m at top).
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('compliance')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-xs panel-title">
              <q-icon name="grid_view" class="q-mr-xs" color="teal-3" />Station × Month Compliance Grid
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              {{ focusParam?.label }} — every station and month in the filtered range, colored by the same
              good/warning/serious/critical status used throughout this page — not a separate composite index.
              Stations are ordered Tributary → Nearshore → Offshore.
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS.compliance }}</div>
            <div ref="complianceChartEl" class="chart-capture-wrap">
              <StationMonthComplianceGrid v-if="complianceGrid.rows.length" :months="complianceGrid.months" :rows="complianceGrid.rows" :unit="focusParam?.unit ?? ''" :decimals="focusParam?.decimals ?? 1" />
              <div v-else class="text-center text-grey-5 q-py-lg">No stations match the current filters.</div>
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('composition')" class="panel-card panel-card--full q-pa-md">
            <div class="row items-center justify-between q-mb-xs wrap">
              <div class="text-subtitle1 text-weight-bold panel-title full-width">
                <q-icon name="bar_chart" class="q-mr-xs" color="teal-3" />Composition Over Time
              </div>
            </div>
            <div class="row items-center justify-between q-mb-xs wrap">
              <div class="text-caption text-grey-4">
                <template v-if="compositionStackBy === 'status'">{{ focusParam?.label }} readings per month, stacked by compliance status.</template>
                <template v-else-if="compositionStackBy === 'station'">Readings per month (any parameter), stacked by station.</template>
                <template v-else>Readings per month, stacked by which parameter was recorded.</template>
              </div>
              <q-btn-toggle
                v-model="compositionStackBy"
                :options="compositionStackByOptions"
                dense no-caps unelevated
                toggle-color="teal-6" color="grey-3" text-color="grey-8"
              />
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS.composition }}</div>
            <div ref="compositionChartEl" class="chart-capture-wrap">
              <StackedCompositionChart
                v-if="dcCompositionResult.segments.length"
                :months="dcCompositionResult.months"
                :segments="dcCompositionResult.segments"
                :stack-by-label="compositionStackByOptions.find((o) => o.value === compositionStackBy)?.label ?? 'Category'"
              />
              <div v-else class="text-center text-grey-5 q-py-lg">No readings match the current filters.</div>
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('long-term-trend')" class="panel-card panel-card--full q-pa-md">
            <div class="row items-center justify-between q-mb-xs wrap">
              <div class="text-subtitle1 text-weight-bold panel-title full-width">
                <q-icon name="trending_up" class="q-mr-xs" color="teal-3" />Long-Term Trend
              </div>
            </div>
            <div class="row items-center justify-between q-mb-sm wrap">
              <div class="text-caption text-grey-4">
                {{ focusParam?.label }} — lake-wide average across the filtered date range, with a
                linear-regression trend line.
              </div>
              <div class="row q-gutter-sm items-center">
                <q-btn-toggle
                  v-model="longTermTrendCompare"
                  :options="[
                    { label: 'No Comparison', value: 'none' },
                    { label: 'By Zone', value: 'zone' },
                    { label: 'By Station', value: 'station' },
                  ]"
                  dense no-caps unelevated
                  toggle-color="teal-6" color="grey-3" text-color="grey-8"
                />
                <q-select
                  v-if="longTermTrendCompare === 'zone'"
                  v-model="longTermTrendZone"
                  :options="['NEARSHORE', 'OFFSHORE']"
                  dense outlined class="form-field" style="min-width: 130px"
                />
              </div>
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS['long-term-trend'] }}</div>
            <div ref="longTermTrendChartEl" class="chart-capture-wrap">
              <TrendLineChart
                v-if="dcLongTermTrendResult.months.length"
                :months="dcLongTermTrendResult.months"
                :series="dcLongTermTrendResult.series"
                :trend="dcLongTermTrendResult.trend"
                :unit="focusParam?.unit ?? ''"
                :decimals="focusParam?.decimals ?? 1"
              />
              <div v-else class="text-center text-grey-5 q-py-lg">No readings match the current filters.</div>
            </div>
          </q-card>

          <q-card v-if="selectedAnalytics.includes('all-param-trend')" class="panel-card panel-card--full q-pa-md">
            <div class="text-subtitle1 text-weight-bold q-mb-sm panel-title">
              <q-icon name="ssid_chart" class="q-mr-xs" color="teal-3" />All-Parameter Trend Grid
            </div>
            <div class="text-caption text-grey-4 q-mb-xs">
              {{ focusStationId ? `At ${focusStationId}` : 'Lake-wide' }} — every filtered parameter gets its
              own trend line across the filtered date range, with its DENR limit marked.
            </div>
            <div class="text-caption text-grey-6 q-mb-sm"><q-icon name="info" size="12px" class="q-mr-xs" />{{ ANALYTICS_REQUIREMENTS['all-param-trend'] }}</div>
            <div ref="allParamTrendChartEl" class="chart-capture-wrap">
              <div v-if="allParamTrendsResult.length" class="row q-col-gutter-md">
                <div v-for="entry in allParamTrendsResult" :key="entry.param.key" class="col-12 col-sm-6 col-md-4">
                  <div class="text-grey-3 text-caption q-mb-xs">
                    {{ entry.param.label }}{{ entry.param.unit ? ` (${entry.param.unit})` : '' }}
                  </div>
                  <ParameterTrendChart
                    :months="entry.months"
                    :values="entry.values"
                    :unit="entry.param.unit"
                    :decimals="entry.param.decimals"
                    :color="dcParamColor(entry.param)"
                    :guideline-value="guidelineFor(entry.param)"
                  />
                </div>
              </div>
              <div v-else class="text-center text-grey-5 q-py-lg">No readings match the current filters.</div>
            </div>
          </q-card>

        </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import BackButton from 'src/components/BackButton.vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import html2canvas from 'html2canvas';
import { fetchWaterQualityReadings, dateToMonthIndex, type WaterQualityReading } from 'src/composables/useWaterQualityReadings';
import { fetchStations, type Station } from 'src/composables/useStations';
import {
  allWaterQualityParams,
  formatReading,
  formatClassLimit,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_LEVELS,
  WATER_QUALITY_CLASS_LABEL,
  DEPTH_OPTIONS,
  READING_START_YEAR,
  MONTH_NAMES,
  type WaterQualityParam,
  type StatusLevel,
} from 'src/composables/useWaterQualityModel';
import { buildYearRangeOptions } from 'src/composables/useReportExport';
import {
  defaultWqDownloadFilters,
  applyWqDownloadFilters,
  computeParamStats,
  isTributaryStation,
  generateFilteredWaterQualityReport,
  SOURCE_ATTRIBUTION_TEXT,
  DATA_DISCLAIMER_TEXT,
  type ChartImage,
} from 'src/composables/useWaterQualityFilteredReport';
import { loadImageElement } from 'src/utils/images';
import cicsLogoUrl from 'src/assets/cics-logo.webp';
import cfasLogoUrl from 'src/assets/CFAS-Logo.png';
import {
  buildCorrelationMatrix,
  buildParallelCoordinatesData,
  distinctMonths,
  buildDepthProfilePoints,
  buildMultiDepthSeries,
  buildDepthTimeColumns,
  buildComplianceGrid,
  buildCompositionOverTime,
  buildLongTermTrend,
  type MonthBucket,
  type CompositionStackBy,
  type TrendLineGroup,
} from 'src/composables/useWaterQualityAnalytics';
import { getClassLimitReferenceValue } from 'src/composables/useWaterQualityModel';
import ParallelCoordinatesChart from 'src/components/charts/ParallelCoordinatesChart.vue';
import CorrelationHeatmap from 'src/components/charts/CorrelationHeatmap.vue';
import ParameterTrendChart from 'src/components/charts/ParameterTrendChart.vue';
import DepthProfileChart from 'src/components/charts/DepthProfileChart.vue';
import DepthTimeIsopleth from 'src/components/charts/DepthTimeIsopleth.vue';
import MultiDepthTrendChart from 'src/components/charts/MultiDepthTrendChart.vue';
import StationMonthComplianceGrid from 'src/components/charts/StationMonthComplianceGrid.vue';
import StackedCompositionChart from 'src/components/charts/StackedCompositionChart.vue';
import TrendLineChart from 'src/components/charts/TrendLineChart.vue';

const $q = useQuasar();
const authStore = useAuthStore();

const filters = reactive(defaultWqDownloadFilters());
const outputType = ref<'report' | 'map'>('report');
const downloading = ref(false);

const parameterOptions = allWaterQualityParams.map((p) => ({ label: p.label, value: p.key }));
const depthOptions = DEPTH_OPTIONS;
const dateRangeOptions = buildYearRangeOptions(2025);

// All 11 Water Quality Dashboard analytics types that actually capture into
// a PDF — the Interactive 3D Surface Plot is deliberately left out: it
// renders via WebGL, which html2canvas cannot capture (the chart works fine
// on screen but the PDF page comes out blank), so there's no honest way to
// include it in a downloaded report.
//
// The 2 that operate over the whole filtered reading set (Station
// Comparison, Correlation) plus PCA need no extra picker; the rest need a
// Focus Station/Parameter(s)/Month (see the "Focus selection" block above),
// since the dashboard's own versions key off its single Reading Period +
// selected-station state, which this page's date-RANGE + multi-station
// filters don't have.
const analyticsOptions = [
  { label: 'Cross-Station (whole filtered set)', value: '__group-cross__', isHeader: true },
  { label: 'Station Comparison (Parallel Coordinates)', value: 'parallel' },
  { label: 'Statistical Correlation (Heatmap)', value: 'correlation' },
  { label: 'Station × Month Compliance Grid', value: 'compliance' },
  { label: 'Composition Over Time', value: 'composition' },
  { label: 'Long-Term Trend', value: 'long-term-trend' },
  { label: 'All-Parameter Trend Grid', value: 'all-param-trend' },

  { label: 'Single-Station Depth Profiles', value: '__group-single__', isHeader: true },
  { label: 'Vertical Depth Profile', value: 'depth-profile' },
  { label: 'Depth-Time Isopleth', value: 'isopleth' },
  { label: 'Multi-Depth Time-Series', value: 'multi-depth' },
  { label: 'All-Parameter Depth Profiles', value: 'all-param-depth' },
];
const selectedAnalytics = ref<string[]>([]);
const ANALYTICS_TITLES: Record<string, string> = {
  parallel: 'Station Comparison — Parallel Coordinates',
  correlation: 'Statistical Correlation — Pearson Heatmap',
  compliance: 'Station × Month Compliance Grid',
  composition: 'Composition Over Time',
  'long-term-trend': 'Long-Term Trend',
  'all-param-trend': 'All-Parameter Trend Grid',
  'depth-profile': 'Vertical Depth Profile',
  isopleth: 'Depth-Time Isopleth',
  'multi-depth': 'Multi-Depth Time-Series',
  'all-param-depth': 'All-Parameter Depth Profiles',
};
// Shown under each option in the picker AND under its card once selected —
// "make a note on the graphs that needed for specific pickers."
const ANALYTICS_REQUIREMENTS: Record<string, string> = {
  parallel: 'No focus picker needed — uses every filtered reading.',
  correlation: 'No focus picker needed — uses every filtered reading.',
  compliance: 'Requires: Focus Parameter.',
  composition: 'Requires: Focus Parameter (for Compliance Status mode — pick the stack via the toggle on the chart itself).',
  'long-term-trend': 'Requires: Focus Parameter. Optional: Focus Station (for a comparison line).',
  'all-param-trend': 'Optional: Focus Station (falls back to lake-wide).',
  'depth-profile': 'Requires: Focus Station, Parameter A & B, Focus Month.',
  isopleth: 'Requires: Focus Station, Focus Parameter.',
  'multi-depth': 'Requires: Focus Station, Focus Parameter.',
  'all-param-depth': 'Requires: Focus Station, Focus Month.',
};

// Which analytics need which focus picker(s) — drives both the picker
// visibility above and which chart cards below actually render.
const STATION_ANALYTICS = new Set(['depth-profile', 'isopleth', 'multi-depth', 'all-param-depth']);
// Shows the Focus Station picker but doesn't require it — these fall back
// to a lake-wide average when none is picked (same "optional" pattern the
// old Nitrogen:Phosphorus Ratio card used).
const OPTIONAL_STATION_ANALYTICS = new Set(['long-term-trend', 'all-param-trend']);
const SINGLE_PARAM_ANALYTICS = new Set(['isopleth', 'multi-depth', 'compliance', 'composition', 'long-term-trend']);
const PARAM_PAIR_ANALYTICS = new Set(['depth-profile']);
const MONTH_ANALYTICS = new Set(['depth-profile', 'all-param-depth']);

const needsFocusStation = computed(() => selectedAnalytics.value.some((a) => STATION_ANALYTICS.has(a) || OPTIONAL_STATION_ANALYTICS.has(a)));
const needsFocusParam = computed(() => selectedAnalytics.value.some((a) => SINGLE_PARAM_ANALYTICS.has(a)));
const needsFocusParamPair = computed(() => selectedAnalytics.value.some((a) => PARAM_PAIR_ANALYTICS.has(a)));
const needsFocusMonth = computed(() => selectedAnalytics.value.some((a) => MONTH_ANALYTICS.has(a)));

const allReadings = ref<WaterQualityReading[]>([]);
const allStations = ref<Station[]>([]);

const stationOptions = computed(() =>
  allStations.value
    .filter((s) => !isTributaryStation(s))
    .sort((a, b) => a.siteId.localeCompare(b.siteId))
    .map((s) => ({ label: s.stationId ? `${s.siteId} (${s.stationId})` : s.siteId, value: s.siteId })),
);

const scope = computed(() => applyWqDownloadFilters(allReadings.value, allStations.value, filters));
const paramStats = computed(() => computeParamStats(scope.value.readings, scope.value.params));

// ═══ PREVIEW MAP — per-station status ═══
// Replaces the old included/excluded-only coloring (which told you WHICH
// stations matched your filters but nothing about what their data actually
// looks like) with the same Good/Warning/Serious/Critical read the rest of
// the app uses. One parameter selected -> that station's scope-average for
// it. Multiple/all parameters -> the worst status across all of them, same
// "any one bad parameter flags the station" reasoning already used for the
// PDF's own station-locations page (see stationConcern in
// useWaterQualityFilteredReport.ts), just with the full 4-tier status
// instead of a flattened good/critical split.
interface StationStatusInfo {
  status: StatusLevel;
  param: WaterQualityParam;
  value: number;
}

const stationStatusBySite = computed<Record<string, StationStatusInfo | null>>(() => {
  const result: Record<string, StationStatusInfo | null> = {};
  const params = scope.value.params;
  for (const site of scope.value.stationsWithData) {
    const siteReadings = scope.value.readings.filter((r) => r.siteId === site.siteId);
    let worst: StationStatusInfo | null = null;
    for (const param of params) {
      const values = siteReadings
        .map((r) => r[param.key as keyof WaterQualityReading])
        .filter((v): v is number => typeof v === 'number');
      if (values.length === 0) continue;
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const status = param.getStatus(avg);
      if (!worst || STATUS_LEVELS.indexOf(status) > STATUS_LEVELS.indexOf(worst.status)) {
        worst = { status, param, value: avg };
      }
    }
    result[site.siteId] = worst;
  }
  return result;
});
const parallelData = computed(() => buildParallelCoordinatesData(scope.value.readings, scope.value.params));
const correlationData = computed(() => buildCorrelationMatrix(scope.value.readings, scope.value.params));

const parallelChartEl = ref<HTMLElement | null>(null);
const correlationChartEl = ref<HTMLElement | null>(null);
const depthProfileChartEl = ref<HTMLElement | null>(null);
const isoplethChartEl = ref<HTMLElement | null>(null);
const multiDepthChartEl = ref<HTMLElement | null>(null);
const complianceChartEl = ref<HTMLElement | null>(null);
const compositionChartEl = ref<HTMLElement | null>(null);
const longTermTrendChartEl = ref<HTMLElement | null>(null);
const allParamTrendChartEl = ref<HTMLElement | null>(null);
const allParamDepthChartEl = ref<HTMLElement | null>(null);

// ═══ FOCUS SELECTORS ═══
// Lake stations only (same reasoning as the main Stations filter — a
// tributary is Surface-only, so a depth profile/isopleth/etc. wouldn't have
// anything to show). Defaults to the first station/parameter/month actually
// present in the current filtered scope, re-picked whenever that scope
// changes out from under the current selection (e.g. a station filter
// removes the one currently focused).
const focusStationId = ref<string | null>(null);
const focusParamKey = ref<string | null>(null);
const focusParamAKey = ref<string | null>(null);
const focusParamBKey = ref<string | null>(null);
const focusMonthKey = ref<string | null>(null);

const focusStationOptions = computed(() => [
  { label: '— Lake-wide (no single station) —', value: null },
  ...stationOptions.value,
]);
const focusMonths = computed<MonthBucket[]>(() => distinctMonths(scope.value.readings));
const focusMonthOptions = computed(() => focusMonths.value.map((m) => ({ label: m.label, value: m.key })));
const focusMonthLabel = computed(() => focusMonths.value.find((m) => m.key === focusMonthKey.value)?.label ?? '—');

// Focus Parameter pickers only ever offer parameters the main "Parameters"
// filter already includes — otherwise a chart could show data for a
// parameter you explicitly filtered out, which is exactly the kind of
// cross-picker conflict this page is meant to prevent. When the main filter
// is narrowed down to one parameter, the two-parameter charts (Vertical
// Depth Profile, Time-Lagged Correlation) have nothing valid for "B" to
// differ from "A" — see canSatisfy() below, which disables them in that case
// rather than silently comparing a parameter against itself.
const scopeParameterOptions = computed(() => scope.value.params.map((p) => ({ label: p.label, value: p.key })));

const focusParam = computed(() => scope.value.params.find((p) => p.key === focusParamKey.value) ?? null);
const focusParamA = computed(() => scope.value.params.find((p) => p.key === focusParamAKey.value) ?? null);
const focusParamB = computed(() => scope.value.params.find((p) => p.key === focusParamBKey.value) ?? null);

// ═══ CONFLICT PREVENTION ═══
// Whether an analytic's required focus picker(s) can actually be satisfied
// by what the main filters currently leave in scope — used to disable it in
// the picker (can't be added while unsatisfiable) and to prune it from an
// existing selection if the main filters change underneath it. This is what
// stops a chart from reaching the PDF as an empty "pick a station" page.
function canSatisfy(type: string): boolean {
  const hasStation = scope.value.stationsWithData.length > 0;
  const hasParam = scope.value.params.length > 0;
  const hasTwoParams = scope.value.params.length > 1;
  const hasMonth = focusMonths.value.length > 0;
  switch (type) {
    case 'parallel':
    case 'correlation':
      return scope.value.readings.length > 0;
    case 'depth-profile':
      return hasStation && hasTwoParams && hasMonth;
    case 'isopleth':
    case 'multi-depth':
      return hasStation && hasParam;
    case 'all-param-depth':
      return hasStation && hasMonth;
    case 'compliance':
    case 'composition':
    case 'long-term-trend':
    case 'all-param-trend':
      return hasParam;
    default:
      return true;
  }
}
const analyticsOptionsWithAvailability = computed(() =>
  analyticsOptions.map((opt) => ({
    ...opt,
    disable: !!opt.isHeader || !canSatisfy(opt.value),
  })),
);

// Drops any already-selected analytic that the current filters can no
// longer satisfy (e.g. narrowing Parameters down to one removes the second
// one a two-parameter chart needs) — "if they are in conflict do not let
// them add it" extends to not letting them *stay* added either, since
// nothing stops the main filters from changing after the fact.
watch(
  [scope, focusMonths],
  () => {
    const stillValid = selectedAnalytics.value.filter((a) => canSatisfy(a));
    if (stillValid.length !== selectedAnalytics.value.length) {
      const dropped = selectedAnalytics.value.filter((a) => !stillValid.includes(a));
      selectedAnalytics.value = stillValid;
      $q.notify({
        type: 'warning',
        message: `Removed from Analytics Visualizations (filters no longer satisfy it): ${dropped.map((d) => ANALYTICS_TITLES[d] ?? d).join(', ')}`,
        position: 'top',
        timeout: 5000,
      });
    }
  },
  { deep: true },
);

function guidelineFor(param: typeof focusParam.value): number | undefined {
  return param ? getClassLimitReferenceValue(param) : undefined;
}

// Keep each focus selector pointed at something that actually exists in the
// current scope, without clobbering a still-valid user choice.
watch(
  () => scope.value.stationsWithData.map((s) => s.siteId).join(','),
  () => {
    const ids = scope.value.stationsWithData.map((s) => s.siteId);
    if (focusStationId.value && !ids.includes(focusStationId.value)) focusStationId.value = null;
    if (!focusStationId.value && ids.length > 0) focusStationId.value = ids[0]!;
  },
  { immediate: true },
);
watch(
  () => scope.value.params.map((p) => p.key).join(','),
  () => {
    const keys = scope.value.params.map((p) => p.key);
    if (!focusParamKey.value || !keys.includes(focusParamKey.value)) focusParamKey.value = keys[0] ?? null;
    if (!focusParamAKey.value || !keys.includes(focusParamAKey.value)) focusParamAKey.value = keys[0] ?? null;
    if (!focusParamBKey.value || !keys.includes(focusParamBKey.value)) focusParamBKey.value = keys[1] ?? keys[0] ?? null;
  },
  { immediate: true },
);
watch(
  focusMonths,
  (months) => {
    const keys = months.map((m) => m.key);
    if (!focusMonthKey.value || !keys.includes(focusMonthKey.value)) {
      focusMonthKey.value = keys.length > 0 ? keys[keys.length - 1]! : null;
    }
  },
  { immediate: true },
);

// ═══ FOCUS-STATION / FOCUS-PARAMETER CHART DATA ═══
const depthProfilePointsA = computed(() =>
  focusStationId.value && focusParamA.value && focusMonthKey.value
    ? buildDepthProfilePoints(scope.value.readings, focusStationId.value, focusParamA.value, focusMonthKey.value)
    : [],
);
const depthProfilePointsB = computed(() =>
  focusStationId.value && focusParamB.value && focusMonthKey.value
    ? buildDepthProfilePoints(scope.value.readings, focusStationId.value, focusParamB.value, focusMonthKey.value)
    : [],
);
const isoplethColumns = computed(() =>
  focusStationId.value && focusParam.value
    ? buildDepthTimeColumns(scope.value.readings, focusStationId.value, focusParam.value, focusMonths.value)
    : [],
);
const multiDepthSeries = computed(() =>
  focusStationId.value && focusParam.value
    ? buildMultiDepthSeries(scope.value.readings, focusStationId.value, focusParam.value, focusMonths.value)
    : { months: [], series: [] },
);
const complianceGrid = computed(() =>
  focusParam.value
    ? buildComplianceGrid(scope.value.readings, scope.value.stations, focusParam.value, focusMonths.value)
    : { months: [], rows: [] },
);
// Status-based line color, reusing the same Status column the Parameter
// Summary table already computes from the filtered scope's average — there
// is no single "current" reading period on this page (it's a date RANGE),
// so "current status" here means "status of the scope-wide average."
function dcParamColor(param: WaterQualityParam): string {
  const stat = paramStats.value.find((s) => s.param.key === param.key);
  return stat?.status ? STATUS_COLORS[stat.status] : '#78909c';
}

function monthIndexToLabel(idx: number): string {
  const year = READING_START_YEAR + Math.floor(idx / 12);
  const monthInYear = ((idx % 12) + 12) % 12;
  return `${MONTH_NAMES[monthInYear]} ${year}`;
}

// ═══ COMPOSITION OVER TIME ═══
const compositionStackBy = ref<CompositionStackBy>('status');
const compositionStackByOptions: { label: string; value: CompositionStackBy }[] = [
  { label: 'Compliance Status', value: 'status' },
  { label: 'Station', value: 'station' },
  { label: 'Parameter', value: 'parameter' },
];
const dcCompositionResult = computed(() => {
  const param = focusParam.value ?? scope.value.params[0];
  if (!param || focusMonths.value.length === 0) return { months: [], segments: [] };
  const monthIndices = focusMonths.value.map((m) => dateToMonthIndex(m.key));
  const monthLabels = focusMonths.value.map((m) => m.label);
  return buildCompositionOverTime(scope.value.readings, scope.value.stations, param, compositionStackBy.value, monthIndices, monthLabels);
});

// ═══ LONG-TERM TREND ═══
// "Long-term" here just means "the filtered date range" — this page has no
// separate trailing-window concept the way the dashboard does, since the
// Date Range filter already IS the chosen window.
const longTermTrendCompare = ref<'none' | 'zone' | 'station'>('none');
const longTermTrendZone = ref<'NEARSHORE' | 'OFFSHORE'>('NEARSHORE');
const dcLongTermTrendResult = computed(() => {
  const param = focusParam.value;
  if (!param) return { months: [], series: [], trend: null };
  const groups: TrendLineGroup[] = [
    { key: 'lake', label: 'Lake-wide average', color: '#4fc3f7', filter: () => true },
  ];
  if (longTermTrendCompare.value === 'zone') {
    const zoneSiteIds = new Set(scope.value.stations.filter((s) => s.zone === longTermTrendZone.value).map((s) => s.siteId));
    groups.push({ key: 'zone', label: `${longTermTrendZone.value} average`, color: '#ff8a65', filter: (r) => zoneSiteIds.has(r.siteId) });
  } else if (longTermTrendCompare.value === 'station' && focusStationId.value) {
    const stationId = focusStationId.value;
    groups.push({ key: 'station', label: stationId, color: '#ff8a65', filter: (r) => r.siteId === stationId });
  }
  return buildLongTermTrend(scope.value.readings, param, groups, monthIndexToLabel);
});

// ═══ ALL-PARAMETER TREND GRID ═══
// Optional Focus Station (falls back to lake-wide), same pattern the old
// Nitrogen:Phosphorus Ratio card used — every filtered parameter's own
// average-per-month trend over the filtered date range.
const allParamTrendsResult = computed(() => {
  const monthsB = focusMonths.value;
  if (monthsB.length === 0) return [];
  const readings = focusStationId.value ? scope.value.readings.filter((r) => r.siteId === focusStationId.value) : scope.value.readings;
  return scope.value.params
    .map((param) => {
      const monthsOut: string[] = [];
      const valuesOut: number[] = [];
      for (const m of monthsB) {
        const vals = readings
          .filter((r) => r.dateObserved.slice(0, 7) === m.key)
          .map((r) => r[param.key as keyof WaterQualityReading])
          .filter((v): v is number => typeof v === 'number');
        if (vals.length > 0) {
          monthsOut.push(m.label);
          valuesOut.push(vals.reduce((s, v) => s + v, 0) / vals.length);
        }
      }
      return { param, months: monthsOut, values: valuesOut };
    })
    .filter((t) => t.values.length > 0);
});

// ═══ ALL-PARAMETER DEPTH PROFILES ═══
const allParamDepthResult = computed(() => {
  if (!focusStationId.value || !focusMonthKey.value) return [];
  const stationId = focusStationId.value;
  const monthKey = focusMonthKey.value;
  return scope.value.params
    .map((param) => ({ param, points: buildDepthProfilePoints(scope.value.readings, stationId, param, monthKey) }))
    .filter((e) => e.points.length > 0);
});

onMounted(async () => {
  try {
    const [readings, stations] = await Promise.all([
      fetchWaterQualityReadings({ status: 'APPROVED' }),
      fetchStations(),
    ]);
    allReadings.value = readings;
    allStations.value = stations;
    await nextTick();
    initPreviewMap();
  } catch (err) {
    console.error('Failed to load data for the Download Center:', err);
    $q.notify({ type: 'negative', message: 'Failed to load water quality data.', position: 'top' });
  }
});

// ═══ PREVIEW MAP — plain circle markers, OSM tiles only (so the whole
// preview stays exportable via html2canvas, same CORS constraint as the
// main interactive map's "Export Map as Image"). Included stations are
// colored by their actual status (worst parameter in scope — see
// stationStatusBySite above), not just a flat "included" teal, so the
// preview actually shows what's in the data instead of only which stations
// matched the filters. A thin blue ring distinguishes tributaries from lake
// stations without competing with the status fill color. Everything outside
// the current filter fades to grey so the highlight still reads clearly at
// a glance. ═══
const previewMapEl = ref<HTMLElement | null>(null);
const mapCaptureWrapEl = ref<HTMLElement | null>(null);
let previewMap: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;

const LAKE_LANAO_CENTER: [number, number] = [7.893111, 124.272778];

function initPreviewMap() {
  if (!previewMapEl.value || previewMap) return;
  previewMap = L.map(previewMapEl.value, { center: LAKE_LANAO_CENTER, zoom: 10, zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
    crossOrigin: true,
  }).addTo(previewMap);
  markersLayer = L.layerGroup().addTo(previewMap);
  redrawPreviewMarkers();
}

function previewTooltipHtml(s: Station, included: boolean, info: StationStatusInfo | null): string {
  const title = `<strong>${s.siteId}</strong>${isTributaryStation(s) ? ' (Tributary)' : ''}`;
  if (!included) return `${title}<br><span style="color:#9e9e9e">Excluded by current filters</span>`;
  if (!info) return `${title}<br>No matching readings for the selected parameter(s)`;
  const valueText = formatReading(info.value, info.param);
  return `${title}<br>${info.param.label}: ${valueText}<br><span style="color:${STATUS_COLORS[info.status]}; font-weight:bold;">${STATUS_LABELS[info.status]}</span>`;
}

function redrawPreviewMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  const includedIds = new Set(scope.value.stations.map((s) => s.siteId));
  for (const s of allStations.value) {
    const included = includedIds.has(s.siteId);
    const info = included ? (stationStatusBySite.value[s.siteId] ?? null) : null;
    const fallbackColor = isTributaryStation(s) ? '#1565C0' : '#0d9488';
    const marker = L.circleMarker([s.latitude, s.longitude], {
      radius: included ? 7 : 5,
      color: isTributaryStation(s) ? '#1565C0' : '#fff',
      weight: isTributaryStation(s) ? 2.5 : 1.5,
      fillColor: included ? (info ? STATUS_COLORS[info.status] : fallbackColor) : '#9e9e9e',
      fillOpacity: included ? 0.95 : 0.35,
      opacity: included ? 1 : 0.5,
    });
    marker.bindTooltip(() => previewTooltipHtml(s, included, info), { direction: 'top' });
    markersLayer.addLayer(marker);
  }
}

watch(scope, () => redrawPreviewMarkers());

// Mirrors each card's own caption/legend text in the preview above — kept
// as functions (not static strings) so they read the live focus selection
// (which station/parameter/month) the same way the on-screen cards do. This
// becomes real PDF text (see generateFilteredWaterQualityReport), not part
// of the chart screenshot, which is why it has to be built separately
// rather than just captured along with the chart image.
function analyticsPdfText(type: string): { description: string; notes: string[] } {
  switch (type) {
    case 'parallel':
      return { description: 'Every parameter at once, one line per station — averaged across all matching readings.', notes: [] };
    case 'correlation':
      return {
        description: 'Pearson correlation (r) between every pair of parameters, from every matching reading.',
        notes: [
          'r ranges from -1 (perfectly inverse) to +1 (perfectly matched); 0 means no linear relationship.',
          'Cells built from very few paired readings are far less reliable than they might look — check the underlying reading count (n) before reading much into an extreme-looking cell.',
        ],
      };
    case 'depth-profile':
      return {
        description: `${focusStationId.value ?? '—'}, ${focusMonthLabel.value} — value by depth (0m/Surface at top).`,
        notes: ['X-axis: value. Y-axis: depth. A dashed guideline line, where shown, marks the DENR limit for that parameter.'],
      };
    case 'isopleth':
      return {
        description: `${focusStationId.value ?? '—'} — ${focusParam.value?.label ?? ''} by depth, one column per month in the filtered range.`,
        notes: ['Each column is one month’s real depth profile, shaded from its surface reading down to its deepest. A hatched column means fewer than 2 depths were sampled that month, not that nothing changed.'],
      };
    case 'multi-depth':
      return {
        description: `${focusStationId.value ?? '—'} — one line per sampled depth, over the filtered date range.`,
        notes: ['A depth’s line breaks wherever a month wasn’t sampled at that depth, rather than interpolating across the gap.'],
      };
    case 'compliance':
      return {
        description: `${focusParam.value?.label ?? ''} — every station and month in the filtered range, colored by status.`,
        notes: ['Uses the same good/warning/serious/critical status used throughout this report — not a separate composite index. Stations are ordered Tributary → Nearshore → Offshore.'],
      };
    case 'composition':
      return {
        description:
          compositionStackBy.value === 'status'
            ? `${focusParam.value?.label ?? ''} readings per month, stacked by compliance status.`
            : compositionStackBy.value === 'station'
              ? 'Readings per month (any parameter), stacked by station.'
              : 'Readings per month, stacked by which parameter was recorded.',
        notes: ['Reading counts stack meaningfully; raw measured values (temperature, pH, …) do not, which is why this chart shows counts rather than averages.'],
      };
    case 'long-term-trend':
      return {
        description: `${focusParam.value?.label ?? ''} — lake-wide average across the filtered date range, with a linear-regression trend line.`,
        notes: [
          dcLongTermTrendResult.value.trend
            ? `Trend: ${dcLongTermTrendResult.value.trend.perYear >= 0 ? '+' : ''}${dcLongTermTrendResult.value.trend.perYear.toFixed(2)} ${focusParam.value?.unit ?? ''}/year over this range.`
            : 'Not enough data points in this range to fit a trend line.',
        ],
      };
    case 'all-param-trend':
      return {
        description: `${focusStationId.value ? `At ${focusStationId.value}` : 'Lake-wide'} — every filtered parameter's own trend across the filtered date range.`,
        notes: ['Each line is judged against its filtered-scope average status. A dashed line, where shown, marks that parameter\'s DENR limit.'],
      };
    case 'all-param-depth':
      return {
        description: `${focusStationId.value ?? '—'}, ${focusMonthLabel.value} — every filtered parameter's own depth profile.`,
        notes: ['X: value. Y: depth (0m at top). A dashed line, where shown, marks that parameter\'s DENR limit.'],
      };
    default:
      return { description: '', notes: [] };
  }
}

interface DataTable {
  head: string[];
  body: (string | number)[][];
}

function fmtNum(v: number | null | undefined, decimals = 2): string {
  return v === null || v === undefined ? '—' : v.toFixed(decimals);
}

// The underlying numbers behind each chart, as a plain table — a static
// chart image in the PDF loses the live hover tooltips this page's charts
// have on screen, so this is what keeps the downloaded report readable
// without them. Reuses the same computed data the chart itself renders
// from, never a separate recomputation.
function analyticsDataTable(type: string): DataTable | null {
  switch (type) {
    case 'parallel': {
      if (parallelData.value.seriesList.length === 0) return null;
      return {
        head: ['Station', ...parallelData.value.axes.map((a) => a.label)],
        body: parallelData.value.seriesList.map((s) => [s.siteId, ...s.values.map((v) => fmtNum(v))]),
      };
    }
    case 'correlation': {
      if (correlationData.value.labels.length === 0) return null;
      return {
        head: ['', ...correlationData.value.labels],
        body: correlationData.value.matrix.map((row, i) => [
          correlationData.value.labels[i]!,
          ...row.map((c) => fmtNum(c.r)),
        ]),
      };
    }
    case 'depth-profile': {
      const depths = Array.from(
        new Set([...depthProfilePointsA.value.map((p) => p.depth), ...depthProfilePointsB.value.map((p) => p.depth)]),
      ).sort((a, b) => a - b);
      if (depths.length === 0) return null;
      const aMap = new Map(depthProfilePointsA.value.map((p) => [p.depth, p.value]));
      const bMap = new Map(depthProfilePointsB.value.map((p) => [p.depth, p.value]));
      return {
        head: ['Depth', focusParamA.value?.label ?? 'Parameter A', focusParamB.value?.label ?? 'Parameter B'],
        body: depths.map((d) => [
          d === 0 ? 'Surface' : `${d}m`,
          fmtNum(aMap.get(d), focusParamA.value?.decimals ?? 2),
          fmtNum(bMap.get(d), focusParamB.value?.decimals ?? 2),
        ]),
      };
    }
    case 'isopleth': {
      if (isoplethColumns.value.length === 0) return null;
      const depths = Array.from(new Set(isoplethColumns.value.flatMap((c) => c.points.map((p) => p.depth)))).sort((a, b) => a - b);
      if (depths.length === 0) return null;
      return {
        head: ['Depth', ...isoplethColumns.value.map((c) => c.month)],
        body: depths.map((d) => [
          d === 0 ? 'Surface' : `${d}m`,
          ...isoplethColumns.value.map((c) => fmtNum(c.points.find((p) => p.depth === d)?.value, focusParam.value?.decimals ?? 2)),
        ]),
      };
    }
    case 'multi-depth': {
      if (multiDepthSeries.value.series.length === 0) return null;
      return {
        head: ['Month', ...multiDepthSeries.value.series.map((s) => s.label)],
        body: multiDepthSeries.value.months.map((m, i) => [
          m,
          ...multiDepthSeries.value.series.map((s) => fmtNum(s.values[i], focusParam.value?.decimals ?? 2)),
        ]),
      };
    }
    case 'compliance': {
      if (complianceGrid.value.rows.length === 0) return null;
      return {
        head: ['Station', ...complianceGrid.value.months],
        body: complianceGrid.value.rows.map((r) => [
          r.siteId,
          ...r.cells.map((c) => (c.status === 'no-data' ? '—' : STATUS_LABELS[c.status])),
        ]),
      };
    }
    case 'composition': {
      if (dcCompositionResult.value.segments.length === 0) return null;
      return {
        head: ['Month', ...dcCompositionResult.value.segments.map((s) => s.label)],
        body: dcCompositionResult.value.months.map((m, i) => [
          m,
          ...dcCompositionResult.value.segments.map((s) => String(s.values[i] ?? 0)),
        ]),
      };
    }
    case 'long-term-trend': {
      if (dcLongTermTrendResult.value.series.length === 0) return null;
      return {
        head: ['Month', ...dcLongTermTrendResult.value.series.map((s) => s.label)],
        body: dcLongTermTrendResult.value.months.map((m, i) => [
          m,
          ...dcLongTermTrendResult.value.series.map((s) => fmtNum(s.values[i], focusParam.value?.decimals ?? 2)),
        ]),
      };
    }
    case 'all-param-trend': {
      if (allParamTrendsResult.value.length === 0) return null;
      const orderedMonths = focusMonths.value.map((m) => m.label).filter((label) => allParamTrendsResult.value.some((t) => t.months.includes(label)));
      return {
        head: ['Parameter', ...orderedMonths],
        body: allParamTrendsResult.value.map((t) => [
          t.param.label,
          ...orderedMonths.map((m) => {
            const idx = t.months.indexOf(m);
            return idx === -1 ? '—' : fmtNum(t.values[idx], t.param.decimals);
          }),
        ]),
      };
    }
    case 'all-param-depth': {
      if (allParamDepthResult.value.length === 0) return null;
      const depths = Array.from(new Set(allParamDepthResult.value.flatMap((e) => e.points.map((p) => p.depth)))).sort((a, b) => a - b);
      return {
        head: ['Parameter', ...depths.map((d) => (d === 0 ? 'Surface' : `${d}m`))],
        body: allParamDepthResult.value.map((e) => [
          e.param.label,
          ...depths.map((d) => fmtNum(e.points.find((p) => p.depth === d)?.value, e.param.decimals)),
        ]),
      };
    }
    default:
      return null;
  }
}

// Captures whichever selected-analytics chart containers are actually in
// the DOM right now into PNGs for the PDF — a dark backgroundColor instead
// of html2canvas's default white/transparent, since these charts are built
// for the dashboard's dark theme (white text would vanish on a white capture).
//
// canSatisfy() is checked again here, not just when the option was added —
// its container div always exists once selected (that's what holds the
// "pick a focus station" placeholder text), so capturing every ref that
// exists would screenshot that placeholder into the PDF as if it were real
// content. Anything not currently satisfied is skipped and reported back
// instead, so the only things in the PDF are built for anything you can
// actually see on screen in the preview.
async function captureSelectedChartImages(): Promise<{ images: ChartImage[]; skipped: string[] }> {
  const images: ChartImage[] = [];
  const skipped: string[] = [];
  const elByType: Record<string, HTMLElement | null> = {
    parallel: parallelChartEl.value,
    correlation: correlationChartEl.value,
    'depth-profile': depthProfileChartEl.value,
    isopleth: isoplethChartEl.value,
    'multi-depth': multiDepthChartEl.value,
    compliance: complianceChartEl.value,
    composition: compositionChartEl.value,
    'long-term-trend': longTermTrendChartEl.value,
    'all-param-trend': allParamTrendChartEl.value,
    'all-param-depth': allParamDepthChartEl.value,
  };
  for (const type of selectedAnalytics.value) {
    const el = elByType[type];
    if (!el || !canSatisfy(type)) {
      skipped.push(ANALYTICS_TITLES[type] ?? type);
      continue;
    }
    const canvas = await html2canvas(el, { backgroundColor: '#1b2a38', logging: false });
    const text = analyticsPdfText(type);
    const table = analyticsDataTable(type);
    images.push({
      title: ANALYTICS_TITLES[type] ?? type,
      dataUrl: canvas.toDataURL('image/png'),
      description: text.description,
      notes: text.notes,
      ...(table ? { table } : {}),
    });
  }
  return { images, skipped };
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Wraps the raw map screenshot with a navy title/logo header and a footer
// carrying the same source/disclaimer text as the PDF report — a PNG
// travels on its own (shared, embedded, printed) with no surrounding page
// to explain where it came from, so that context has to live inside the
// image itself.
async function composeBrandedMapSnapshot(mapCanvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const [cfasImg, cicsImg] = await Promise.all([loadImageElement(cfasLogoUrl), loadImageElement(cicsLogoUrl)]);

  const width = mapCanvas.width;
  const pad = Math.round(width * 0.018);
  const headerH = Math.round(width * 0.085);

  // Measure the footer text on a scratch context first so the footer band
  // is sized to however many lines it actually wraps to at this
  // resolution, instead of guessing a fixed height that could clip text.
  const scratch = document.createElement('canvas').getContext('2d');
  if (!scratch) throw new Error('Canvas 2D context unavailable.');
  const sourceFontPx = Math.max(10, Math.round(width * 0.0115));
  const disclaimerFontPx = sourceFontPx;
  scratch.font = `${sourceFontPx}px Helvetica, Arial, sans-serif`;
  const sourceLines = wrapLines(scratch, SOURCE_ATTRIBUTION_TEXT, width - pad * 2);
  scratch.font = `italic ${disclaimerFontPx}px Helvetica, Arial, sans-serif`;
  const disclaimerLines = wrapLines(scratch, DATA_DISCLAIMER_TEXT, width - pad * 2);

  const lineGap = sourceFontPx * 1.45;
  const blockGap = sourceFontPx * 0.6;
  const footerH = Math.round(pad * 1.6 + sourceLines.length * lineGap + blockGap + disclaimerLines.length * lineGap);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = headerH + mapCanvas.height + footerH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // Header band — title + subtitle, matching the on-page banner's teal.
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, '#00695c');
  grad.addColorStop(1, '#00897b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, headerH);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(headerH * 0.32)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('Lake Lanao Water Quality Analytics', pad, headerH * 0.52);
  ctx.font = `${Math.round(headerH * 0.17)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('Download Center — Map Snapshot', pad, headerH * 0.8);

  // Logos, top-right of the header, each in its own white rounded box.
  const logoBoxH = headerH * 0.6;
  const boxY = (headerH - logoBoxH) / 2;
  let logoX = width - pad;
  for (const img of [cfasImg, cicsImg]) {
    const innerH = logoBoxH * 0.72;
    const w = (img.naturalWidth / img.naturalHeight) * innerH;
    const boxPad = logoBoxH * 0.16;
    const boxW = w + boxPad * 2;
    logoX -= boxW;
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, logoX, boxY, boxW, logoBoxH, 5);
    ctx.fill();
    ctx.drawImage(img, logoX + boxPad, boxY + (logoBoxH - innerH) / 2, w, innerH);
    logoX -= pad * 0.5;
  }

  // The actual map screenshot, unchanged, between the two bands.
  ctx.drawImage(mapCanvas, 0, headerH);

  // Footer band — source attribution + data-accuracy disclaimer.
  const footerY = headerH + mapCanvas.height;
  ctx.fillStyle = '#eef1f5';
  ctx.fillRect(0, footerY, width, footerH);
  ctx.strokeStyle = '#d7dde5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(width, footerY);
  ctx.stroke();

  let textY = footerY + pad * 0.9 + sourceFontPx * 0.8;
  ctx.fillStyle = '#4b5563';
  ctx.font = `${sourceFontPx}px Helvetica, Arial, sans-serif`;
  for (const line of sourceLines) {
    ctx.fillText(line, pad, textY);
    textY += lineGap;
  }
  textY += blockGap;
  ctx.fillStyle = '#92400e';
  ctx.font = `italic ${disclaimerFontPx}px Helvetica, Arial, sans-serif`;
  for (const line of disclaimerLines) {
    ctx.fillText(line, pad, textY);
    textY += lineGap;
  }

  return canvas;
}

// ═══ DOWNLOAD ═══
async function handleDownload() {
  downloading.value = true;
  try {
    if (outputType.value === 'report') {
      const { images: chartImages, skipped } = await captureSelectedChartImages();
      const result = await generateFilteredWaterQualityReport({
        filters,
        generatedBy: authStore.isLoggedIn ? authStore.displayName : 'Public Visitor',
        chartImages,
      });
      $q.notify({ type: 'positive', message: `${result.filename} downloaded (${result.recordCount} readings).`, position: 'top' });
      if (skipped.length > 0) {
        $q.notify({
          type: 'warning',
          message: `Left out of the PDF (not enough data for your current filters/focus selection): ${skipped.join(', ')}`,
          position: 'top',
          timeout: 6000,
        });
      }
    } else {
      if (!mapCaptureWrapEl.value) return;
      const mapCanvas = await html2canvas(mapCaptureWrapEl.value, { useCORS: true, backgroundColor: '#1b2a38', logging: false });
      const canvas = await composeBrandedMapSnapshot(mapCanvas);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `lake-lanao-water-quality-map-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      $q.notify({ type: 'positive', message: 'Map image downloaded.', position: 'top' });
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: err instanceof Error ? err.message : 'Download failed.', position: 'top' });
  } finally {
    downloading.value = false;
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   Modeled on Karagatan Patrol's analytics dashboards
   (karagatanpatrol.org/analytics_marinecapture) — a navy banner with
   institutional logos, a dense filter sidebar, and a grid of
   colored-title-bar chart panels on a clean light background. This is a
   deliberate departure from the rest of the app's dark glass-morph theme,
   scoped to this one page to match that reference. ═══════════════════════ */

.dc-page {
  background: #eef1f5;
  min-height: 100vh;
  padding-bottom: 48px;
}

.dc-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  /* The app's own primary/secondary teal ($primary/$secondary in
     quasar.variables.scss), not the reference's navy — ties this banner
     back to the rest of Geo Ranao's color identity instead of the
     Karagatan Patrol reference's own. */
  background: linear-gradient(90deg, #00695c 0%, #00897b 100%);
  color: white;
  padding: 14px 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  /* Clears MainLayout's own fixed header (~64px) — same convention every
     other page in this app uses (see BackButton.vue's back-fab--offset),
     since Quasar doesn't auto-reserve space for it here. */
  margin-top: 64px;
}

.dc-banner__subtitle {
  color: rgba(255, 255, 255, 0.78);
}

.dc-banner__title {
  /* Clears BackButton's fixed round button (top:72px, left:16px, ~40px). */
  padding-left: 44px;
}

.dc-banner__logos {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.dc-banner__logo-box {
  background: white;
  border-radius: 6px;
  padding: 4px 8px;
  height: 40px;
  display: flex;
  align-items: center;
}

.dc-banner__logo-box img {
  height: 30px;
  width: auto;
  object-fit: contain;
  display: block;
}

.page-content {
  position: relative;
  z-index: 1;
  padding-top: 24px;
}

/* ── Panels ── */
.panel-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e1e6ed;
  box-shadow: 0 1px 3px rgba(16, 32, 64, 0.08);
}

/* One consistent color for every panel title bar — the app's own primary
   teal ($primary in quasar.variables.scss), not a per-panel rotating
   palette, so this page reads as part of the same system as the rest of
   Geo Ranao rather than a standalone one-off design. */
.panel-title {
  margin: -16px -16px 12px -16px;
  padding: 10px 16px;
  color: white !important;
  background: #00897b;
  border-radius: 9px 9px 0 0;
}

.panel-grid {
  display: grid;
  /* min(420px, 100%) keeps the minimum column width from ever exceeding the
     viewport — plain "420px" forces horizontal overflow of the whole page
     (including the fixed header) on phone-width screens. */
  grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
  gap: 16px;
  align-items: start;
}

.panel-card--full {
  grid-column: 1 / -1;
}

/* Sidebar (Filters) text/controls — dark-on-light, since the sidebar card is
   now a light panel too. */
.dc-sidebar-title {
  color: #00695c;
}

.dc-output-toggle {
  border: 1px solid #d7dde5;
  border-radius: 8px;
  overflow: hidden;
}

.dc-source-note {
  font-size: 0.72rem;
  line-height: 1.5;
  color: #6b7280;
}

/* Body text inside a light panel-card reads dark-on-light... */
.panel-card .text-grey-4,
.panel-card .text-grey-5,
.panel-card .text-grey-6 {
  color: #5c6b7a !important;
}
.panel-card .text-grey-3 {
  color: #3c4a58 !important;
}

/* ...except inside the still-dark chart/map insets, which keep their
   original light-on-dark text (higher specificity than the rule above). */
.panel-card .chart-capture-wrap .text-grey-3,
.panel-card .chart-capture-wrap .text-grey-4,
.panel-card .chart-capture-wrap .text-grey-5,
.panel-card .chart-capture-wrap .text-grey-6,
.panel-card .map-capture-wrap .text-grey-4,
.panel-card .map-capture-wrap .text-grey-5,
.panel-card .map-capture-wrap .text-grey-6 {
  color: rgba(255, 255, 255, 0.7) !important;
}

.map-capture-wrap {
  background: #1b2a38;
  border-radius: 10px;
  padding: 8px;
}

.preview-map {
  width: 100%;
  height: 320px;
  border-radius: 10px;
  overflow: hidden;
}

.preview-table th {
  color: #00695c;
}
.preview-table td {
  color: #2c3a4a;
}

.chart-capture-wrap {
  background: #1b2a38;
  border-radius: 10px;
  padding: 8px;
  overflow-x: auto;
}

/* Small reusable legend swatches, shared across the analytics visualizations
   (same classes as WaterQualityDashboardPage.vue, copied since scoped
   styles don't cross component/page boundaries). */
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

.legend-dash {
  display: inline-block;
  width: 16px;
  height: 0;
  border-top: 2px dashed #fab219;
  flex-shrink: 0;
}
</style>
