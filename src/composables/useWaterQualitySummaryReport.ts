import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { fetchWaterQualityReadings, type WaterQualityReading } from 'src/composables/useWaterQualityReadings';
import { fetchStations, type Station } from 'src/composables/useStations';
import {
  loadMunicipalZones,
  findMunicipalityForPoint,
  simplifiedZoneRing,
  type MunicipalZone,
} from 'src/composables/useMunicipalZones';
import { loadLakePolygonRings } from 'src/composables/useBathymetryClean';
import {
  allWaterQualityParams,
  formatReading,
  formatClassLimit,
  STATUS_LABELS,
  STATUS_COLORS,
  DEFAULT_WATER_QUALITY_CLASS,
  WATER_QUALITY_CLASS_LABELS,
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

function hexToRgb(hex: string): [number, number, number] {
  const num = parseInt(hex.replace('#', ''), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function boundsOf(ring: [number, number][]): Bounds | null {
  if (ring.length === 0) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lat, lng] of ring) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

function project(lat: number, lng: number, bounds: Bounds, x: number, y: number, size: number): [number, number] {
  const latSpan = bounds.maxLat - bounds.minLat || 1;
  const lngSpan = bounds.maxLng - bounds.minLng || 1;
  const px = x + ((lng - bounds.minLng) / lngSpan) * size;
  const py = y + size - ((lat - bounds.minLat) / latSpan) * size; // flip so north is up
  return [px, py];
}

function drawRing(doc: jsPDF, ring: [number, number][], bounds: Bounds, x: number, y: number, size: number) {
  if (ring.length < 2) return;
  doc.setDrawColor(2, 136, 209);
  doc.setLineWidth(0.4);
  for (let i = 0; i < ring.length; i++) {
    const [latA, lngA] = ring[i]!;
    const [latB, lngB] = ring[(i + 1) % ring.length]!;
    const [ax, ay] = project(latA, lngA, bounds, x, y, size);
    const [bx, by] = project(latB, lngB, bounds, x, y, size);
    doc.line(ax, ay, bx, by);
  }
}

// One page: the municipality's (or the lake's) boundary as a simple outline,
// with a colored dot per contributing station — red if any of its readings
// in scope hit "serious"/"critical" on any parameter, teal otherwise. A real
// locator diagram, not decoration: the shape and dot positions are the
// actual boundary and actual station coordinates, just projected into a
// square instead of pulled from a live map.
async function drawStationDiagram(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    size: number;
    zone: MunicipalZone | null;
    stations: Station[];
    stationConcern: Map<string, boolean>;
  },
): Promise<void> {
  const { x, y, size, zone, stations, stationConcern } = opts;

  let ring: [number, number][];
  if (zone) {
    ring = simplifiedZoneRing(zone);
  } else {
    const lakeRings = await loadLakePolygonRings();
    ring = lakeRings[0] ?? [];
  }

  const bounds = boundsOf(ring);
  if (!bounds) {
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text('Boundary unavailable for this scope.', x, y + 10);
    return;
  }

  // Pad the bounds slightly so stations near the edge aren't clipped.
  const latPad = (bounds.maxLat - bounds.minLat || 0.01) * 0.08;
  const lngPad = (bounds.maxLng - bounds.minLng || 0.01) * 0.08;
  const padded: Bounds = {
    minLat: bounds.minLat - latPad,
    maxLat: bounds.maxLat + latPad,
    minLng: bounds.minLng - lngPad,
    maxLng: bounds.maxLng + lngPad,
  };

  doc.setDrawColor(210, 210, 210);
  doc.rect(x, y, size, size);

  drawRing(doc, ring, padded, x, y, size);

  for (const station of stations) {
    const [px, py] = project(station.latitude, station.longitude, padded, x, y, size);
    const concern = stationConcern.get(station.siteId) ?? false;
    const [r, g, b] = hexToRgb(concern ? STATUS_COLORS.critical : STATUS_COLORS.good);
    doc.setFillColor(r, g, b);
    doc.circle(px, py, 1.6, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(60, 60, 60);
    doc.text(station.siteId, px + 2.2, py + 1, { maxWidth: 24 });
  }

  const legendY = y + size + 8;
  doc.setFillColor(...hexToRgb(STATUS_COLORS.good));
  doc.circle(x + 2, legendY, 1.6, 'F');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('No serious/critical readings', x + 5, legendY + 1);
  doc.setFillColor(...hexToRgb(STATUS_COLORS.critical));
  doc.circle(x + 75, legendY, 1.6, 'F');
  doc.text('At least one serious/critical reading', x + 78, legendY + 1);
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
  doc.text(
    `Judged against DENR ${WATER_QUALITY_CLASS_LABELS[DEFAULT_WATER_QUALITY_CLASS]} limitations`,
    margin,
    44,
  );
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
      formatClassLimit(p.param, DEFAULT_WATER_QUALITY_CLASS),
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

  await drawStationDiagram(doc, {
    x: margin,
    y: 34,
    size: pageWidth - margin * 2,
    zone,
    stations: stationsWithData,
    stationConcern,
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
