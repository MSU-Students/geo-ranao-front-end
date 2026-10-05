// Fish Observation summary PDF — the Ranao FishNet counterpart to
// useWaterQualitySummaryReport.ts (AquaLanaoGIS), so the two capstone
// projects get the same quality of reporting instead of fish data only ever
// being available as a flat CSV.
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import {
  fetchFishObservations,
  parseCoordinates,
  CONSERVATION_STATUS_LABELS,
  type FishObservation,
  type FishCategory,
} from 'src/composables/useFishObservations';
import { loadMunicipalZones, findMunicipalityForPoint, simplifiedZoneRing } from 'src/composables/useMunicipalZones';
import { loadLakePolygonRings } from 'src/composables/useBathymetryClean';
import { drawLocationDiagram, type DiagramPoint } from 'src/composables/useReportDiagram';
import { withinDateRange, type DateRangeOption } from 'src/composables/useReportExport';

export interface FishObservationSummaryOptions {
  /** A municipality name from Municipal-Water-Zones.geojson, or null for the whole lake. */
  municipality: string | null;
  dateRange: DateRangeOption;
  generatedBy: string;
}

export interface FishObservationSummaryResult {
  filename: string;
  label: string;
  recordCount: number;
}

// Same category colors used throughout the map/dashboards — kept consistent
// rather than inventing a separate palette for the PDF.
const CATEGORY_COLORS: Record<FishCategory, string> = {
  ENDEMIC: '#1565C0',
  INVASIVE: '#D32F2F',
  GENERAL: '#F57C00',
};
const CATEGORY_LABELS: Record<FishCategory, string> = {
  ENDEMIC: 'Endemic',
  INVASIVE: 'Invasive',
  GENERAL: 'General (unidentified catch)',
};

interface SpeciesRow {
  category: FishCategory;
  scientific: string;
  common: string;
  conservationStatus: string;
  count: number;
  avgLengthCm: number | null;
  avgWeightG: number | null;
}

// One row per distinct species (not per sighting) — same grouping the Fish
// Dashboard uses, so a report and the dashboard never disagree on what
// counts as "one species." GENERAL sightings are unidentified catch, not a
// species profile, so they're summarized separately instead of appearing
// here as a row.
function buildSpeciesRows(observations: FishObservation[]): SpeciesRow[] {
  const groups = new Map<string, FishObservation[]>();
  for (const o of observations) {
    if (o.category === 'GENERAL') continue;
    const key = `${o.category}|${o.speciesScientific ?? ''}|${o.speciesCommon ?? ''}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(o);
    else groups.set(key, [o]);
  }
  return [...groups.values()].map((obs) => {
    const rep = obs.reduce((a, b) => ((a.dateObserved ?? '') > (b.dateObserved ?? '') ? a : b));
    const lengths = obs.map((o) => o.trueLengthCm).filter((v): v is number => v != null);
    const weights = obs.map((o) => o.weightG).filter((v): v is number => v != null);
    return {
      category: rep.category,
      scientific: rep.speciesScientific || '—',
      common: rep.speciesCommon || rep.speciesScientific || 'Unnamed species',
      conservationStatus: CONSERVATION_STATUS_LABELS[rep.conservationStatus],
      count: obs.length,
      avgLengthCm: lengths.length ? lengths.reduce((s, v) => s + v, 0) / lengths.length : null,
      avgWeightG: weights.length ? weights.reduce((s, v) => s + v, 0) / weights.length : null,
    };
  });
}

export async function generateFishObservationSummaryReport(
  options: FishObservationSummaryOptions,
): Promise<FishObservationSummaryResult> {
  const [observations, zones] = await Promise.all([
    fetchFishObservations({ status: 'APPROVED' }),
    loadMunicipalZones(),
  ]);

  const zone = options.municipality ? (zones.find((z) => z.name === options.municipality) ?? null) : null;
  if (options.municipality && !zone) {
    throw new Error(`Unknown municipality "${options.municipality}".`);
  }

  // A sighting "belongs" to a municipality when its coordinates actually
  // fall inside that municipality's water zone — the same automatic,
  // coordinate-based attribution the map's municipality markers use. Falls
  // back to the researcher-typed municipal field only when coordinates are
  // missing/invalid, same reasoning as IndexPage.vue's belongsToMunicipality.
  function belongsToZone(o: FishObservation): boolean {
    if (!zone) return true;
    const coords = parseCoordinates(o.coordinates);
    if (coords) return findMunicipalityForPoint(coords.lat, coords.lng, [zone]) !== null;
    return o.municipal === zone.name;
  }

  const scoped = observations.filter((o) => belongsToZone(o) && withinDateRange(o.dateObserved ?? undefined, options.dateRange));

  const scopeLabel = options.municipality ?? 'Lake Lanao (All Municipalities)';
  if (scoped.length === 0) {
    throw new Error(`No approved observations found for ${scopeLabel} in "${options.dateRange}".`);
  }

  const speciesRows = buildSpeciesRows(scoped).sort((a, b) => b.count - a.count);
  const endemicCount = scoped.filter((o) => o.category === 'ENDEMIC').length;
  const invasiveCount = scoped.filter((o) => o.category === 'INVASIVE').length;
  const generalObs = scoped.filter((o) => o.category === 'GENERAL');
  const generalIndividuals = generalObs.reduce((sum, o) => sum + (o.count ?? 0), 0);
  const criticallyEndangered = scoped.filter((o) => o.conservationStatus === 'CRITICALLY_ENDANGERED').length;

  // ── Page 1: header, plain-language summary, species table ──
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(10, 60, 60);
  doc.text('Fish Observation Summary Report', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text(scopeLabel, margin, 32);
  doc.text(`Period: ${options.dateRange}`, margin, 38);
  doc.text(`Generated ${new Date().toLocaleDateString()} by ${options.generatedBy}`, margin, 44);

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 48, pageWidth - margin, 48);

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const summaryParts = [
    `Based on ${scoped.length} approved observation(s), ${speciesRows.length} distinct species were recorded`,
    `(${endemicCount} endemic, ${invasiveCount} invasive sighting${invasiveCount === 1 ? '' : 's'})`,
    generalObs.length > 0
      ? `, plus ${generalObs.length} general/unidentified catch record(s) totaling ${generalIndividuals} individuals.`
      : '.',
    criticallyEndangered > 0
      ? ` ${criticallyEndangered} sighting(s) involved a Critically Endangered species.`
      : '',
  ];
  const wrapped = doc.splitTextToSize(summaryParts.join(''), pageWidth - margin * 2) as string[];
  doc.text(wrapped, margin, 58);

  const tableStartY = 58 + wrapped.length * 5 + 6;

  if (speciesRows.length > 0) {
    autoTable(doc, {
      startY: tableStartY,
      margin: { left: margin, right: margin },
      head: [['Species', 'Category', 'Conservation Status', 'Avg. Length (cm)', 'Avg. Weight (g)', 'Sightings']],
      body: speciesRows.map((r) => [
        r.common !== r.scientific ? `${r.common}\n${r.scientific}` : r.scientific,
        CATEGORY_LABELS[r.category],
        r.conservationStatus,
        r.avgLengthCm !== null ? r.avgLengthCm.toFixed(1) : '—',
        r.avgWeightG !== null ? r.avgWeightG.toFixed(0) : '—',
        String(r.count),
      ]),
      headStyles: { fillColor: [11, 95, 90] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const row = speciesRows[data.row.index];
          if (row) {
            const hex = CATEGORY_COLORS[row.category];
            const num = parseInt(hex.replace('#', ''), 16);
            data.cell.styles.textColor = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No identified-species sightings in scope — general/unidentified catch only.', margin, tableStartY);
  }

  // ── Page 2: sighting location diagram ──
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(10, 60, 60);
  doc.text('Sighting Locations', margin, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(zone ? `${zone.name} water zone boundary` : 'Lake Lanao boundary (all municipalities)', margin, 26);

  const ring = zone ? simplifiedZoneRing(zone) : ((await loadLakePolygonRings())[0] ?? []);
  const points: DiagramPoint[] = scoped
    .map((o) => {
      const coords = parseCoordinates(o.coordinates);
      if (!coords) return null;
      return {
        lat: coords.lat,
        lng: coords.lng,
        color: CATEGORY_COLORS[o.category],
        label: o.speciesCommon || o.speciesScientific || '',
      };
    })
    .filter((p): p is DiagramPoint => p !== null);

  drawLocationDiagram(doc, {
    x: margin,
    y: 34,
    size: pageWidth - margin * 2,
    ring,
    points,
    legend: [
      { color: CATEGORY_COLORS.ENDEMIC, label: 'Endemic' },
      { color: CATEGORY_COLORS.INVASIVE, label: 'Invasive' },
      { color: CATEGORY_COLORS.GENERAL, label: 'General' },
    ],
  });

  const today = new Date().toISOString().slice(0, 10);
  const slug = scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const filename = `fish-observation-summary-${slug}-${today}.pdf`;
  doc.save(filename);

  return {
    filename,
    label: `Fish Observation Summary Report — ${scopeLabel} — ${options.dateRange}`,
    recordCount: scoped.length,
  };
}
