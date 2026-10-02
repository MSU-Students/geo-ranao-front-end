// Spatial interpolation for the water-quality "Interpolated Map" layer —
// same IDW (Inverse Distance Weighting) technique and canvas-rasterization
// approach already used for the bathymetry depth surface
// (useMapDataUpload.ts's buildDepthGridFromPoints + IndexPage.vue's
// buildContourLayers), just generic over an arbitrary parameter's value
// instead of depth, and with a continuous (not 4-flat-band) color ramp so
// adjacent grid cells blend smoothly instead of snapping between colors.
import { computeRingsBounds, pointInPolygon } from './useBathymetry';
import { STATUS_COLORS, STATUS_LEVELS, type WaterQualityParam, type StatusLevel } from './useWaterQualityModel';

export interface ValuePoint {
  lat: number;
  lng: number;
  value: number;
}

export interface ValueGrid {
  width: number;
  height: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  /** NaN = outside the lake polygon, or no points were close enough to weigh in. */
  values: Float32Array;
}

const IDW_POWER = 2;
const IDW_SMOOTHING = 0.001;
const GRID_RESOLUTION = 220;

/**
 * Builds a ValueGrid from scattered {lat, lng, value} readings using IDW
 * interpolation. Unlike the depth grid (where 0 outside the lake is a safe
 * sentinel — depth is never 0 or negative in real data), several water
 * quality parameters have a legitimate reading of exactly 0 (e.g. nitrite),
 * so NaN is used as the "no value here" sentinel instead, everywhere a
 * consumer needs to distinguish "really is 0" from "not applicable."
 */
export function buildParamInterpolationGrid(
  points: ValuePoint[],
  lakePolygonRings: [number, number][][],
): ValueGrid | null {
  if (points.length < 2) return null; // need at least 2 real readings to interpolate between
  if (lakePolygonRings.length === 0) return null;

  const bounds = computeRingsBounds(lakePolygonRings);
  if (!bounds) return null;
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  if (latSpan <= 0 || lngSpan <= 0) return null;

  const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const lngCorrection = Math.max(Math.cos(midLatRad), 0.1);
  const correctedLngSpan = lngSpan * lngCorrection;

  let width: number;
  let height: number;
  if (correctedLngSpan >= latSpan) {
    width = GRID_RESOLUTION;
    height = Math.max(40, Math.round((GRID_RESOLUTION * latSpan) / correctedLngSpan));
  } else {
    height = GRID_RESOLUTION;
    width = Math.max(40, Math.round((GRID_RESOLUTION * correctedLngSpan) / latSpan));
  }

  const values = new Float32Array(width * height).fill(NaN);

  for (let row = 0; row < height; row++) {
    const lat = maxLat - (row / (height - 1)) * latSpan;
    for (let col = 0; col < width; col++) {
      const lng = minLng + (col / (width - 1)) * lngSpan;
      const idx = row * width + col;
      if (!pointInPolygon(lat, lng, lakePolygonRings)) continue;

      let weightedSum = 0;
      let weightSum = 0;
      for (const pt of points) {
        const dLat = lat - pt.lat;
        const dLng = (lng - pt.lng) * lngCorrection;
        const distSq = dLat * dLat + dLng * dLng + IDW_SMOOTHING * IDW_SMOOTHING;
        const weight = 1 / Math.pow(distSq, IDW_POWER / 2);
        weightedSum += weight * pt.value;
        weightSum += weight;
      }
      values[idx] = weightSum > 0 ? weightedSum / weightSum : NaN;
    }
  }

  return { width, height, minLat, maxLat, minLng, maxLng, values };
}

// ─── Smooth 0..1 "severity position" from a raw value ───
// param.getStatus() only returns one of 4 discrete bands. Densely sampling
// it across the parameter's plausible [min, max] range turns that into a
// continuous position (0 = deep in the "good" band, 1 = at/beyond
// "critical"), so the interpolated surface can blend smoothly between
// colors instead of jumping between 4 flat bands at each threshold — works
// the same way for ascending, descending, and centered (both-ends-bad,
// e.g. temperature/pH) threshold shapes without needing to know which kind
// a given parameter uses.
const SAMPLE_COUNT = 200;
const severityCache = new WeakMap<WaterQualityParam, StatusLevel[]>();

function severitySamples(param: WaterQualityParam): StatusLevel[] {
  let cached = severityCache.get(param);
  if (cached) return cached;
  cached = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const v = param.min + ((param.max - param.min) * i) / SAMPLE_COUNT;
    cached.push(param.getStatus(v));
  }
  severityCache.set(param, cached);
  return cached;
}

export function severityPosition(param: WaterQualityParam, value: number): number {
  const statuses = severitySamples(param);
  const span = param.max - param.min || 1;
  const clamped = Math.min(Math.max(value, param.min), param.max);
  let idx = Math.round(((clamped - param.min) / span) * SAMPLE_COUNT);
  idx = Math.min(Math.max(idx, 0), SAMPLE_COUNT);
  const status = statuses[idx]!;
  const statusIdx = STATUS_LEVELS.indexOf(status);

  // Expand to this status's full run of samples, so position moves smoothly
  // *within* a band too, not just between bands.
  let lo = idx;
  while (lo > 0 && statuses[lo - 1] === status) lo--;
  let hi = idx;
  while (hi < SAMPLE_COUNT && statuses[hi + 1] === status) hi++;
  const bandFraction = hi > lo ? (idx - lo) / (hi - lo) : 0.5;

  return (statusIdx + bandFraction) / STATUS_LEVELS.length;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Stops sit at each band's center (not its edges) so a value deep in the
// "good" band still reads as pure green, and only values genuinely at/past
// the critical threshold reach pure red — same visual read as the 4-color
// legend elsewhere, just continuous between them.
const COLOR_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0.125, rgb: hexToRgb(STATUS_COLORS.good) },
  { t: 0.375, rgb: hexToRgb(STATUS_COLORS.warning) },
  { t: 0.625, rgb: hexToRgb(STATUS_COLORS.serious) },
  { t: 0.875, rgb: hexToRgb(STATUS_COLORS.critical) },
];

export function severityColor(position: number): [number, number, number] {
  const t = Math.min(Math.max(position, 0), 1);
  const first = COLOR_STOPS[0]!;
  const last = COLOR_STOPS[COLOR_STOPS.length - 1]!;
  if (t <= first.t) return first.rgb;
  if (t >= last.t) return last.rgb;
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const a = COLOR_STOPS[i]!;
    const b = COLOR_STOPS[i + 1]!;
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f),
      ];
    }
  }
  return last.rgb;
}
