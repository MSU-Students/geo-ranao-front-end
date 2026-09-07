import { extractPolygonRings, pointInPolygon } from 'src/composables/useBathymetry';
import type { DepthPoint } from 'src/composables/useMapDataUpload';

export interface CleanResult {
  points: DepthPoint[];
  duplicateCount: number;
  outsideLakeCount: number;
  outlierCount: number;
  outliers: DepthPoint[];
}

// Loaded once and reused by every clean() call in a session — the lake
// boundary doesn't change, and fetching it per-upload would be wasteful.
let lakeRingsCache: [number, number][][] | null = null;

export async function loadLakePolygonRings(): Promise<[number, number][][]> {
  if (lakeRingsCache) return lakeRingsCache;
  const res = await fetch('/geo/lake-lanao.geojson');
  const geojson = (await res.json()) as GeoJSON.FeatureCollection;
  lakeRingsCache = extractPolygonRings(geojson);
  return lakeRingsCache;
}

function roundKey(p: DepthPoint): string {
  // ~0.11m precision at this latitude — close enough to call two soundings
  // "the same point" without merging genuinely distinct nearby readings.
  return `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

function dedupe(points: DepthPoint[]): { kept: DepthPoint[]; duplicateCount: number } {
  const seen = new Set<string>();
  const kept: DepthPoint[] = [];
  let duplicateCount = 0;
  for (const p of points) {
    const key = roundKey(p);
    if (seen.has(key)) {
      duplicateCount++;
      continue;
    }
    seen.add(key);
    kept.push(p);
  }
  return { kept, duplicateCount };
}

function filterToLake(
  points: DepthPoint[],
  lakePolygonRings: [number, number][][],
): { kept: DepthPoint[]; outsideLakeCount: number } {
  if (lakePolygonRings.length === 0) return { kept: points, outsideLakeCount: 0 };
  const kept: DepthPoint[] = [];
  let outsideLakeCount = 0;
  for (const p of points) {
    if (pointInPolygon(p.lat, p.lng, lakePolygonRings)) {
      kept.push(p);
    } else {
      outsideLakeCount++;
    }
  }
  return { kept, outsideLakeCount };
}

// Median Absolute Deviation outlier check — for each point, compare its
// depth against the median depth of its K nearest neighbors. Flags things
// like a stray GPS fix or a sonar spike (a lone 90m reading surrounded by
// 12m neighbors), the same kind of scientifically-implausible-value check
// already used for water quality parameters, just spatial instead of
// range-based since "plausible depth" here depends on where you are in the
// lake, not a single fixed range.
const NEIGHBOR_K = 6;
const MAD_MULTIPLIER = 3; // ~3 scaled-MAD ≈ 3 std devs for normally-distributed noise
const MIN_ABSOLUTE_DEVIATION_M = 5; // floor so a dead-flat neighborhood (MAD = 0) doesn't flag tiny, real variation

function findOutliers(points: DepthPoint[]): { kept: DepthPoint[]; outliers: DepthPoint[] } {
  if (points.length <= NEIGHBOR_K) return { kept: points, outliers: [] };

  const midLatRad = (points.reduce((sum, p) => sum + p.lat, 0) / points.length) * (Math.PI / 180);
  const lngCorrection = Math.max(Math.cos(midLatRad), 0.1);

  const outlierFlags = points.map((p, i) => {
    const distances = points
      .filter((_, j) => j !== i)
      .map((other) => {
        const dLat = p.lat - other.lat;
        const dLng = (p.lng - other.lng) * lngCorrection;
        return { dist: Math.hypot(dLat, dLng), depth: other.depth };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, NEIGHBOR_K);

    const neighborDepths = distances.map((d) => d.depth).sort((a, b) => a - b);
    const mid = Math.floor(neighborDepths.length / 2);
    const median =
      neighborDepths.length % 2 === 0 ? (neighborDepths[mid - 1]! + neighborDepths[mid]!) / 2 : neighborDepths[mid]!;

    const absDeviations = neighborDepths.map((d) => Math.abs(d - median)).sort((a, b) => a - b);
    const madMid = Math.floor(absDeviations.length / 2);
    const mad =
      absDeviations.length % 2 === 0
        ? (absDeviations[madMid - 1]! + absDeviations[madMid]!) / 2
        : absDeviations[madMid]!;

    const threshold = Math.max(MAD_MULTIPLIER * 1.4826 * mad, MIN_ABSOLUTE_DEVIATION_M);
    return Math.abs(p.depth - median) > threshold;
  });

  const kept: DepthPoint[] = [];
  const outliers: DepthPoint[] = [];
  points.forEach((p, i) => (outlierFlags[i] ? outliers.push(p) : kept.push(p)));
  return { kept, outliers };
}

// Full cleaning pass, in order: dedupe -> lake-boundary filter -> spatial
// outlier check. Every dropped point is counted so the researcher (and
// later the reviewing admin) can see exactly what was removed and why,
// rather than data silently vanishing.
export function cleanDepthPoints(points: DepthPoint[], lakePolygonRings: [number, number][][]): CleanResult {
  const { kept: deduped, duplicateCount } = dedupe(points);
  const { kept: inLake, outsideLakeCount } = filterToLake(deduped, lakePolygonRings);
  const { kept, outliers } = findOutliers(inLake);
  return {
    points: kept,
    duplicateCount,
    outsideLakeCount,
    outlierCount: outliers.length,
    outliers,
  };
}
