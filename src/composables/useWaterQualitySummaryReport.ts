import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { fetchWaterQualityReadings, type WaterQualityReading } from 'src/composables/useWaterQualityReadings';
import { fetchStations } from 'src/composables/useStations';
import { loadMunicipalZones, findMunicipalityForPoint, simplifiedZoneRing } from 'src/composables/useMunicipalZones';
import { loadLakePolygonRings } from 'src/composables/useBathymetryClean';
import { hexToRgb, drawLocationDiagram, type DiagramPoint } from 'src/composables/useReportDiagram';
import {
  allWaterQualityParams,
  formatReading,
  formatClassLimit,
  STATUS_LABELS,
  STATUS_COLORS,
  WATER_QUALITY_CLASS_LABEL,
  type StatusLevel,
} from 'src/composables/useWaterQualityModel';
import { withinDateRange, type DateRangeOption } from 'src/composables/useReportExport';

export interface WaterQualitySummaryOptions {
  /** A municipality name from Municipal-Water-Zones.geojson, or null for the whole lake. */
  municipality: string | null;
  dateRange: DateRangeOption;
  generatedBy: string;
}

export interface WaterQualitySummaryResult {
  filename: string;
  label: string;
  recordCount: number;
}

export async function generateWaterQualitySummaryReport(
  options: WaterQualitySummaryOptions,
): Promise<WaterQualitySummaryResult> {
  const [readings, stations, zones] = await Promise.all([
    fetchWaterQualityReadings({ status: 'APPROVED' }),
    fetchStations(),
    loadMunicipalZones(),
  ]);

  const zone = options.municipality ? (zones.find((z) => z.name === options.municipality) ?? null) : null;
  if (options.municipality && !zone) {
    throw new Error(`Unknown municipality "${options.municipality}".`);
  }

  const scopedStations = zone
    ? stations.filter((s) => findMunicipalityForPoint(s.latitude, s.longitude, [zone]) !== null)
    : stations;
  const scopedStationIds = new Set(scopedStations.map((s) => s.siteId));

  const scopedReadings = readings.filter(
    (r) => scopedStationIds.has(r.siteId) && withinDateRange(r.dateObserved, options.dateRange),
  );

  const scopeLabel = options.municipality ?? 'Lake Lanao (All Municipalities)';
  if (scopedReadings.length === 0) {
    throw new Error(`No approved readings found for ${scopeLabel} in "${options.dateRange}".`);
  }

  // ── Per-parameter averages, classified with the same good/warning/serious/critical
  // thresholds the dashboards already use — no separately-invented scale. ──
  const paramStats = allWaterQualityParams.map((param) => {
    const values = scopedReadings
      .map((r) => r[param.key as keyof WaterQualityReading])
      .filter((v): v is number => typeof v === 'number');
    if (values.length === 0) {
      return { param, count: 0, avg: null as number | null, status: null as StatusLevel | null };
    }
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return { param, count: values.length, avg, status: param.getStatus(avg) };
  });

  const evaluated = paramStats.filter((p) => p.count > 0);
  const concerns = paramStats.filter((p) => p.status === 'serious' || p.status === 'critical');

  const stationConcern = new Map<string, boolean>();
  for (const r of scopedReadings) {
    let concernHere = stationConcern.get(r.siteId) ?? false;
    if (!concernHere) {
      for (const param of allWaterQualityParams) {
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
  const stationsWithData = scopedStations.filter((s) => scopedReadings.some((r) => r.siteId === s.siteId));

  // ── Page 1: header, plain-language summary, per-parameter table ──
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(10, 60, 60);
  doc.text('Water Quality Summary Report', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text(scopeLabel, margin, 32);
  doc.text(`Period: ${options.dateRange}`, margin, 38);
  doc.text(`Judged against DENR ${WATER_QUALITY_CLASS_LABEL} limitations`, margin, 44);
  doc.text(`Generated ${new Date().toLocaleDateString()} by ${options.generatedBy}`, margin, 50);

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 54, pageWidth - margin, 54);

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const summarySentence =
    concerns.length === 0
      ? `Based on ${scopedReadings.length} approved reading(s) from ${stationsWithData.length} station(s), all ${evaluated.length} monitored parameters with data were within good-to-acceptable ranges for this period.`
      : `Based on ${scopedReadings.length} approved reading(s) from ${stationsWithData.length} station(s), ${concerns.length} of ${evaluated.length} monitored parameters showed serious or critical levels: ${concerns.map((c) => c.param.label).join(', ')}.`;
  const wrapped = doc.splitTextToSize(summarySentence, pageWidth - margin * 2) as string[];
  doc.text(wrapped, margin, 64);

  const tableStartY = 64 + wrapped.length * 5 + 6;

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [['Parameter', 'Average', 'DENR Limit', 'Status', 'Readings']],
    body: paramStats.map((p) => [
      p.param.label,
      p.avg !== null ? formatReading(p.avg, p.param) : '—',
      formatClassLimit(p.param),
      p.status ? STATUS_LABELS[p.status] : 'No data',
      String(p.count),
    ]),
    headStyles: { fillColor: [11, 95, 90] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const stat = paramStats[data.row.index]?.status;
        if (stat) {
          const [r, g, b] = hexToRgb(STATUS_COLORS[stat]);
          data.cell.styles.textColor = [r, g, b];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // ── Page 2: station location diagram ──
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(10, 60, 60);
  doc.text('Sampling Station Locations', margin, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(zone ? `${zone.name} water zone boundary` : 'Lake Lanao boundary (all municipalities)', margin, 26);

  const ring = zone ? simplifiedZoneRing(zone) : ((await loadLakePolygonRings())[0] ?? []);
  const points: DiagramPoint[] = stationsWithData.map((s) => ({
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

  const today = new Date().toISOString().slice(0, 10);
  const slug = scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const filename = `water-quality-summary-${slug}-${today}.pdf`;
  doc.save(filename);

  return {
    filename,
    label: `Water Quality Summary Report — ${scopeLabel} — ${options.dateRange}`,
    recordCount: scopedReadings.length,
  };
}
