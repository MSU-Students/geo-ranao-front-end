// Shared "Station Summary" aggregation — one row per STATION-<n> lake zone
// plus one row per tributary river, for whichever parameter the caller
// picks. Used by both the Water Quality Dashboard and the main interactive
// map ("Ecological Dashboard"), each supplying their own already-loaded
// sites/readings/municipal zones, so the aggregation rule itself (and the
// trend math) lives in exactly one place.
import { depthLabel, type WaterQualityParam } from './useWaterQualityModel';
import { dateToMonthIndex, type WaterQualityReading } from './useWaterQualityReadings';
import { findMunicipalityForPoint, type MunicipalZone } from './useMunicipalZones';
import lakeMunicipalitiesRaw from 'src/data/lake-municipalities.json';

export interface StationSummarySite {
  siteId: string;
  stationId: string;
  lat: number;
  lng: number;
}

export interface StationSummaryRow {
  stationId: string;
  municipality: string;
  sampleCount: number;
  percentOfTotal: number;
  depths: string;
  trend: 'Increasing' | 'Decreasing' | 'Stable' | 'Not enough data';
}

const TRIBUTARY_STATION_ID = 'Tributary River';

// Smaller than 5% of the parameter's plausible range reads as noise, not a
// real trend — otherwise a near-flat record would flip Increasing/
// Decreasing on the tiniest wobble between two adjacent readings.
const TREND_THRESHOLD_FRACTION = 0.05;

function stationTrend(
  series: { monthIndex: number; value: number }[],
  param: WaterQualityParam,
): StationSummaryRow['trend'] {
  if (series.length < 2) return 'Not enough data';
  const sorted = [...series].sort((a, b) => a.monthIndex - b.monthIndex);
  const mid = Math.ceil(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  if (secondHalf.length === 0) return 'Not enough data';
  const avg = (arr: typeof sorted) => arr.reduce((sum, p) => sum + p.value, 0) / arr.length;
  const delta = avg(secondHalf) - avg(firstHalf);
  const threshold = (param.max - param.min) * TREND_THRESHOLD_FRACTION;
  if (Math.abs(delta) < threshold) return 'Stable';
  return delta > 0 ? 'Increasing' : 'Decreasing';
}

// Municipal-Water-Zones.geojson only covers the lake surface (each zone is
// a lakeshore town's ~15km water allotment) — a tributary river's
// coordinates sit on the river itself, never inside any of those polygons,
// so findMunicipalityForPoint() always misses for them (confirmed: all 6
// rivers fall outside every zone). This is the fallback for that case —
// and a safety net for any lake site that ever lands on a zone boundary —
// nearest town center by straight-line distance.
const lakeMunicipalities = lakeMunicipalitiesRaw as { name: string; lat: number; lng: number }[];
function nearestMunicipalityByDistance(lat: number, lng: number): string {
  let best = lakeMunicipalities[0]!;
  let bestDist = Infinity;
  for (const m of lakeMunicipalities) {
    const dist = (m.lat - lat) ** 2 + (m.lng - lng) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = m;
    }
  }
  return best.name;
}

function resolveMunicipality(lat: number, lng: number, municipalZones: MunicipalZone[]): string {
  if (municipalZones.length === 0) return 'Loading…';
  return findMunicipalityForPoint(lat, lng, municipalZones) ?? nearestMunicipalityByDistance(lat, lng);
}

/**
 * Lifetime-to-date summary per station for one parameter: every APPROVED
 * reading on record (not just the currently selected Reading Period).
 * Lake sites are grouped by stationId (e.g. the S1A/S1B pair under
 * "STATION-1") and averaged. Each tributary river is its own row — there's
 * only ever one physical site per river, so there's nothing to average.
 */
export function computeStationSummaryRows(
  sites: StationSummarySite[],
  rawReadings: WaterQualityReading[],
  municipalZones: MunicipalZone[],
  param: WaterQualityParam,
): StationSummaryRow[] {
  const byStation = new Map<string, StationSummarySite[]>();
  sites.forEach((site) => {
    const groupId = site.stationId.startsWith('STATION-') ? site.stationId : site.siteId;
    const bucket = byStation.get(groupId);
    if (bucket) bucket.push(site);
    else byStation.set(groupId, [site]);
  });

  const siteToGroup = new Map<string, string>();
  byStation.forEach((groupSites, groupId) => groupSites.forEach((s) => siteToGroup.set(s.siteId, groupId)));

  interface Accum {
    count: number;
    depths: Set<number>;
    series: { monthIndex: number; value: number }[];
  }
  const accum = new Map<string, Accum>();
  byStation.forEach((_groupSites, groupId) => accum.set(groupId, { count: 0, depths: new Set(), series: [] }));

  rawReadings.forEach((reading) => {
    const groupId = siteToGroup.get(reading.siteId);
    if (!groupId) return;
    const value = reading[param.key as keyof WaterQualityReading];
    if (typeof value !== 'number') return;
    const a = accum.get(groupId)!;
    a.count++;
    a.depths.add(reading.depthM);
    a.series.push({ monthIndex: dateToMonthIndex(reading.dateObserved), value });
  });

  const totalCount = Array.from(accum.values()).reduce((sum, a) => sum + a.count, 0);

  const rows: StationSummaryRow[] = [];
  byStation.forEach((groupSites, groupId) => {
    const a = accum.get(groupId)!;
    const isRiver = groupSites[0]!.stationId === TRIBUTARY_STATION_ID;

    const centroidLat = groupSites.reduce((sum, s) => sum + s.lat, 0) / groupSites.length;
    const centroidLng = groupSites.reduce((sum, s) => sum + s.lng, 0) / groupSites.length;
    const municipality = resolveMunicipality(centroidLat, centroidLng, municipalZones);

    const sortedDepths = Array.from(a.depths).sort((x, y) => x - y);
    const depths = sortedDepths.length > 0 ? sortedDepths.map((d) => depthLabel(d)).join(', ') : '—';

    rows.push({
      // Rivers are keyed by siteId (their name, e.g. "Masiu River") since
      // groupId for them IS the siteId — labeling it as a "station" would
      // misrepresent a river as one of the 12 lake zones.
      stationId: isRiver ? `${groupId} (Tributary)` : groupId,
      municipality,
      sampleCount: a.count,
      percentOfTotal: totalCount > 0 ? (a.count / totalCount) * 100 : 0,
      depths,
      trend: stationTrend(a.series, param),
    });
  });

  return rows;
}
