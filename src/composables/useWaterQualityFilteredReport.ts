// Powers the public Download Center (DownloadCenterPage.vue) — unlike
// useWaterQualitySummaryReport.ts (the admin's own municipality-scoped tool,
// left as-is to avoid regressing it), this accepts a free-form filter set
// (parameters, specific stations, tributaries, depths, date range) and the
// SAME filtering logic drives both the live on-page preview and the PDF, so
// what someone sees before downloading is exactly what they get.
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { fetchWaterQualityReadings, type WaterQualityReading } from 'src/composables/useWaterQualityReadings';
import { fetchStations, type Station } from 'src/composables/useStations';
import { loadLakePolygonRings } from 'src/composables/useBathymetryClean';
import { hexToRgb, drawLocationDiagram, type DiagramPoint } from 'src/composables/useReportDiagram';
import {
  allWaterQualityParams,
  formatReading,
  formatClassLimit,
  STATUS_LABELS,
  STATUS_COLORS,
  WATER_QUALITY_CLASS_LABEL,
  type WaterQualityParam,
  type StatusLevel,
} from 'src/composables/useWaterQualityModel';
import { withinDateRange, type DateRangeOption } from 'src/composables/useReportExport';
import { loadImageAsPngDataUrl } from 'src/utils/images';
import cicsLogoUrl from 'src/assets/cics-logo.webp';
import cfasLogoUrl from 'src/assets/CFAS-Logo.png';

// Reused by DownloadCenterPage.vue's PNG map-snapshot export too, so the
// wording stays identical across both download formats.
export const SOURCE_ATTRIBUTION_TEXT =
  'Source: College of Fisheries and Aquatic Sciences (CFAS), MSU Main Campus — field data gathering and ' +
  'surveying using in-situ sensors and laboratory chemical analysis, for a Lake Lanao water quality ' +
  'monitoring project funded by DOST-PCAARRD.';

export const DATA_DISCLAIMER_TEXT =
  'Disclaimer: Field data is gathered using in-situ sensors and laboratory chemical analysis and may ' +
  'contain measurement error, sensor drift, or gaps in coverage. Figures are indicative of conditions at ' +
  'the time of sampling — verify independently before citing in formal publications or policy decisions.';

// Empty array on any of these means "no restriction" (everyone/everything) —
// same convention as an empty multi-select reading as "All" in the UI,
// rather than needing a separate boolean mode for "overall summary" vs
// "custom": the overall-summary case IS just every filter left at its
// default empty/true state.
export interface WqDownloadFilters {
  parameterKeys: string[];
  stationIds: string[];
  includeTributaries: boolean;
  depths: number[];
  dateRange: DateRangeOption;
}

export function defaultWqDownloadFilters(): WqDownloadFilters {
  return { parameterKeys: [], stationIds: [], includeTributaries: true, depths: [], dateRange: 'All Time' };
}

export function isTributaryStation(station: Station): boolean {
  return station.zone === 'TRIBUTARY' || station.zone === 'RIVER';
}

export interface FilteredScope {
  readings: WaterQualityReading[];
  stations: Station[]; // every station in scope, whether or not it has a matching reading
  stationsWithData: Station[];
  params: WaterQualityParam[];
}

export function applyWqDownloadFilters(
  allReadings: WaterQualityReading[],
  allStations: Station[],
  filters: WqDownloadFilters,
): FilteredScope {
  // Tributaries are an all-or-nothing category toggle (there are only 6, and
  // the UI offers them as a single switch, not a multi-select) — stationIds
  // only ever narrows which LAKE stations qualify, never tributaries, since
  // the station multi-select in the UI only lists lake stations.
  const stations = allStations.filter((s) => {
    if (isTributaryStation(s)) return filters.includeTributaries;
    if (filters.stationIds.length > 0) return filters.stationIds.includes(s.siteId);
    return true;
  });
  const stationIdSet = new Set(stations.map((s) => s.siteId));

  const params =
    filters.parameterKeys.length > 0
      ? allWaterQualityParams.filter((p) => filters.parameterKeys.includes(p.key))
      : allWaterQualityParams;

  const readings = allReadings.filter((r) => {
    if (!stationIdSet.has(r.siteId)) return false;
    if (!withinDateRange(r.dateObserved, filters.dateRange)) return false;
    if (filters.depths.length > 0 && !filters.depths.includes(r.depthM)) return false;
    return true;
  });

  const siteIdsWithData = new Set(readings.map((r) => r.siteId));
  const stationsWithData = stations.filter((s) => siteIdsWithData.has(s.siteId));

  return { readings, stations, stationsWithData, params };
}

export interface ParamStat {
  param: WaterQualityParam;
  count: number;
  avg: number | null;
  status: StatusLevel | null;
}

export function computeParamStats(readings: WaterQualityReading[], params: WaterQualityParam[]): ParamStat[] {
  return params.map((param) => {
    const values = readings
      .map((r) => r[param.key as keyof WaterQualityReading])
      .filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return { param, count: 0, avg: null, status: null };
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return { param, count: values.length, avg, status: param.getStatus(avg) };
  });
}

function filtersSummaryLines(filters: WqDownloadFilters, scope: FilteredScope): string[] {
  const lines: string[] = [];
  lines.push(
    `Parameters: ${filters.parameterKeys.length > 0 ? scope.params.map((p) => p.label).join(', ') : 'All parameters'}`,
  );
  const tributaryNote = filters.includeTributaries ? '' : ' (tributaries excluded)';
  lines.push(
    `Stations: ${filters.stationIds.length > 0 ? `${scope.stations.length} selected` : 'All stations'}${tributaryNote}`,
  );
  lines.push(`Depths: ${filters.depths.length > 0 ? filters.depths.map((d) => (d === 0 ? 'Surface' : `${d}m`)).join(', ') : 'All depths'}`);
  lines.push(`Period: ${filters.dateRange}`);
  return lines;
}

export interface ChartImage {
  title: string;
  /** PNG data URL, e.g. from html2canvas's canvas.toDataURL('image/png'). */
  dataUrl: string;
  /** One-line context (which station/parameter/month it's showing) — drawn as real PDF text below the image, not screenshotted. */
  description?: string;
  /** How-to-read notes/legend-as-text, one paragraph each — same reasoning as `description`. */
  notes?: string[];
  /** The chart's underlying numbers, drawn as a real table below it — a static image loses the live hover tooltips, so this is how the PDF stays readable without them. */
  table?: { head: string[]; body: (string | number)[][] };
}

export interface FilteredReportOptions {
  filters: WqDownloadFilters;
  generatedBy: string;
  /** Rendered analytics charts (see DownloadCenterPage.vue) — appended one per page after the station map. */
  chartImages?: ChartImage[];
}

export interface FilteredReportResult {
  filename: string;
  label: string;
  recordCount: number;
}

export async function generateFilteredWaterQualityReport(
  options: FilteredReportOptions,
): Promise<FilteredReportResult> {
  const [allReadings, allStations] = await Promise.all([
    fetchWaterQualityReadings({ status: 'APPROVED' }),
    fetchStations(),
  ]);

  const scope = applyWqDownloadFilters(allReadings, allStations, options.filters);
  if (scope.readings.length === 0) {
    throw new Error('No approved readings match the selected filters.');
  }

  const stats = computeParamStats(scope.readings, scope.params);
  const evaluated = stats.filter((s) => s.count > 0);
  const concerns = stats.filter((s) => s.status === 'serious' || s.status === 'critical');

  const stationConcern = new Map<string, boolean>();
  for (const r of scope.readings) {
    let concernHere = stationConcern.get(r.siteId) ?? false;
    if (!concernHere) {
      for (const param of scope.params) {
        const v = r[param.key as keyof WaterQualityReading];
        if (typeof v === 'number') {
          const status = param.getStatus(v);
          if (status === 'serious' || status === 'critical') {
            concernHere = true;
            break;
          }
        }
      }
    }
    stationConcern.set(r.siteId, concernHere);
  }

  // Logos are re-encoded to PNG data URLs via canvas (jsPDF's addImage
  // doesn't reliably handle .webp), loaded in parallel before any drawing
  // starts.
  const [cicsLogo, cfasLogo] = await Promise.all([
    loadImageAsPngDataUrl(cicsLogoUrl),
    loadImageAsPngDataUrl(cfasLogoUrl),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;

  // Institutional logos, top-right of the cover page — same pairing as the
  // Download Center page banner (CICS + CFAS), each capped to a 11mm-tall
  // box so a landscape or portrait logo both sit the same height.
  const logoH = 11;
  let logoX = pageWidth - margin;
  for (const logo of [cfasLogo, cicsLogo]) {
    const w = (logo.width / logo.height) * logoH;
    logoX -= w;
    doc.addImage(logo.dataUrl, 'PNG', logoX, 10, w, logoH);
    logoX -= 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(10, 60, 60);
  doc.text('Lake Lanao Water Quality Report', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  const filterLines = filtersSummaryLines(options.filters, scope);
  let y = 32;
  for (const line of filterLines) {
    doc.text(line, margin, y);
    y += 6;
  }
  doc.text(`Judged against DENR ${WATER_QUALITY_CLASS_LABEL} limitations`, margin, y);
  y += 6;
  doc.text(`Generated ${new Date().toLocaleDateString()} by ${options.generatedBy}`, margin, y);
  y += 4;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Source + disclaimer block — small print, same wording reused for the
  // PNG map-snapshot export so both download formats carry the same
  // provenance/accuracy notice.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const sourceWrapped = doc.splitTextToSize(SOURCE_ATTRIBUTION_TEXT, pageWidth - margin * 2) as string[];
  doc.text(sourceWrapped, margin, y);
  y += sourceWrapped.length * 3.6 + 2;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(130, 90, 20);
  const disclaimerWrapped = doc.splitTextToSize(DATA_DISCLAIMER_TEXT, pageWidth - margin * 2) as string[];
  doc.text(disclaimerWrapped, margin, y);
  y += disclaimerWrapped.length * 3.6 + 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const summarySentence =
    concerns.length === 0
      ? `Based on ${scope.readings.length} approved reading(s) from ${scope.stationsWithData.length} station(s), all ${evaluated.length} monitored parameters with data were within good-to-acceptable ranges for this selection.`
      : `Based on ${scope.readings.length} approved reading(s) from ${scope.stationsWithData.length} station(s), ${concerns.length} of ${evaluated.length} monitored parameters showed serious or critical levels: ${concerns.map((c) => c.param.label).join(', ')}.`;
  const wrapped = doc.splitTextToSize(summarySentence, pageWidth - margin * 2) as string[];
  doc.text(wrapped, margin, y);
  y += wrapped.length * 5 + 6;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Parameter', 'Average', 'DENR Limit', 'Status', 'Readings']],
    body: stats.map((p) => [
      p.param.label,
      p.avg !== null ? formatReading(p.avg, p.param) : '—',
      formatClassLimit(p.param),
      p.status ? STATUS_LABELS[p.status] : 'No data',
      String(p.count),
    ]),
    headStyles: { fillColor: [11, 95, 90] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const stat = stats[data.row.index]?.status;
        if (stat) {
          const [r, g, b] = hexToRgb(STATUS_COLORS[stat]);
          data.cell.styles.textColor = [r, g, b];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // ── Page 2: sampling station locations within scope ──
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(10, 60, 60);
  doc.text('Sampling Station Locations', margin, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Lake Lanao boundary — stations included in this selection', margin, 26);

  const ring = (await loadLakePolygonRings())[0] ?? [];
  const points: DiagramPoint[] = scope.stationsWithData.map((s) => ({
    lat: s.latitude,
    lng: s.longitude,
    color: (stationConcern.get(s.siteId) ?? false) ? STATUS_COLORS.critical : STATUS_COLORS.good,
    label: s.siteId,
  }));
  drawLocationDiagram(doc, {
    x: margin,
    y: 34,
    size: pageWidth - margin * 2,
    ring,
    points,
    legend: [
      { color: STATUS_COLORS.good, label: 'No serious/critical readings' },
      { color: STATUS_COLORS.critical, label: 'At least one serious/critical reading' },
    ],
  });

  // ── One page per selected analytics chart (see DownloadCenterPage.vue) ──
  // The image itself is rendered live on the page and captured to a PNG via
  // html2canvas before calling this function, but description/notes are
  // drawn here as real PDF text rather than being part of that screenshot —
  // sharper, smaller file size, and actually selectable/accessible text,
  // which a raster capture of a paragraph of explanation wouldn't be.
  const pageHeight = doc.internal.pageSize.getHeight();
  for (const chart of options.chartImages ?? []) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(10, 60, 60);
    doc.text(chart.title, margin, 20);

    const chartProps = doc.getImageProperties(chart.dataUrl);
    const maxW = pageWidth - margin * 2;
    // Caps the image at ~62% of the page's usable height, reserving the
    // rest for description/notes text below it — most charts then get their
    // explanation on the same page as the chart, instead of every single
    // one spilling onto an extra page.
    const maxH = (pageHeight - 34 - margin) * 0.62;
    const scale = Math.min(maxW / chartProps.width, maxH / chartProps.height, 1);
    const w = chartProps.width * scale;
    const h = chartProps.height * scale;
    doc.addImage(chart.dataUrl, 'PNG', margin, 28, w, h);

    let y = 28 + h + 10;
    const lineHeight = 4.5;

    if (chart.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);
      const wrapped = doc.splitTextToSize(chart.description, maxW) as string[];
      if (y + wrapped.length * lineHeight > pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
      doc.text(wrapped, margin, y);
      y += wrapped.length * lineHeight + 4;
    }

    if (chart.notes?.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      for (const note of chart.notes) {
        const wrapped = doc.splitTextToSize(`• ${note}`, maxW) as string[];
        if (y + wrapped.length * lineHeight > pageHeight - margin) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrapped, margin, y);
        y += wrapped.length * lineHeight + 3;
      }
    }

    // The underlying numbers, as a real table — a static chart image loses
    // the live hover tooltips, so this is what keeps the PDF readable
    // without them. autoTable paginates on its own past this point.
    if (chart.table && chart.table.body.length > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin, bottom: margin },
        head: [chart.table.head],
        body: chart.table.body,
        styles: { fontSize: 6.5, cellPadding: 1.2, overflow: 'linebreak' },
        headStyles: { fillColor: [11, 95, 90], fontSize: 6.5 },
        theme: 'grid',
      });
    }
  }

  // Short recurring footer (two lines + page number) stamped on every page,
  // including the cover — a reader who only sees a single page printed or
  // forwarded out of context still gets the source and accuracy notice.
  // Split across two short lines rather than one long one, so it can never
  // run into the page-number text regardless of font-metrics rounding.
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(225, 225, 225);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text('Source: CFAS, MSU Main Campus — Lake Lanao WQ monitoring, funded by DOST-PCAARRD.', margin, pageHeight - 11);
    doc.text('Data may contain measurement error, sensor drift, or gaps — verify before formal use.', margin, pageHeight - 7);
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const filename = `water-quality-report-${today}.pdf`;
  doc.save(filename);

  return {
    filename,
    label: `Water Quality Report — ${options.filters.dateRange}`,
    recordCount: scope.readings.length,
  };
}
