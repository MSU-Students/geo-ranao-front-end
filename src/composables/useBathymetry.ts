import type { FeatureCollection } from 'geojson';

export const CONTOUR_LEVELS = [20, 40, 60, 80, 100];
export const CONTOUR_LINE_COLOR = '#000000';
export const CONTOUR_LABEL_MIN_ZOOM = 14;

export const CONTOUR_COLOR_STOPS: { depth: number; rgb: [number, number, number] }[] = [
  { depth: 0, rgb: [227, 242, 253] }, // #E3F2FD
  { depth: 25, rgb: [144, 202, 249] }, // #90CAF9
  { depth: 50, rgb: [66, 165, 245] }, // #42A5F5
  { depth: 75, rgb: [21, 101, 192] }, // #1565C0
  { depth: 100, rgb: [13, 71, 161] }, // #0D47A1
];

export const CONTOUR_MAX_DEPTH_M = 110;
export const CONTOUR_BASIN_FRACTION = { lat: 0.27, lng: 0.29 };

export function colorForDepth(d: number): [number, number, number] {
  const stops = CONTOUR_COLOR_STOPS;
  if (d <= stops[0]!.depth) return stops[0]!.rgb;
  const last = stops[stops.length - 1]!;
  if (d >= last.depth) return last.rgb;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (d >= a.depth && d <= b.depth) {
      const t = (d - a.depth) / (b.depth - a.depth);
      return [
        Math.round(a.rgb[0] + t * (b.rgb[0] - a.rgb[0])),
        Math.round(a.rgb[1] + t * (b.rgb[1] - a.rgb[1])),
        Math.round(a.rgb[2] + t * (b.rgb[2] - a.rgb[2])),
      ];
    }
  }
  return last.rgb;
}

export function pointInRing(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const latI = ring[i]![0];
    const lngI = ring[i]![1];
    const latJ = ring[j]![0];
    const lngJ = ring[j]![1];
    const intersects =
      lngI > lng !== lngJ > lng && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(lat: number, lng: number, rings: [number, number][][]): boolean {
  let inside = false;
  for (const ring of rings) {
    if (pointInRing(lat, lng, ring)) inside = !inside;
  }
  return inside;
}

export function extractPolygonRings(geojson: FeatureCollection): [number, number][][] {
  const rings: [number, number][][] = [];
  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach((ring) => {
        rings.push(ring.map(([lng, lat]) => [lat, lng] as [number, number]));
      });
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          rings.push(ring.map(([lng, lat]) => [lat, lng] as [number, number]));
        });
      });
    }
  });
  return rings;
}

export function computeRingsBounds(
  rings: [number, number][][],
): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const ring of rings) {
    for (const [lat, lng] of ring) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }
  if (!isFinite(minLat) || !isFinite(minLng)) return null;
  return { minLat, maxLat, minLng, maxLng };
}

export function perpendicularDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function simplifyRing(points: [number, number][], toleranceDeg: number): [number, number][] {
  if (points.length < 3) return points.slice();
  let maxDist = 0;
  let index = 0;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i]!, first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > toleranceDeg) {
    const left = simplifyRing(points.slice(0, index + 1), toleranceDeg);
    const right = simplifyRing(points.slice(index), toleranceDeg);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

export function distanceToSegmentM(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export interface DepthGrid {
  width: number;
  height: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  values: Float32Array; // meters of depth, 0 outside the lake
}

let cachedDepthGrid: DepthGrid | null = null;

export function buildDepthGrid(lakePolygonRings: [number, number][][], forceRebuild = false): DepthGrid | null {
  if (cachedDepthGrid && !forceRebuild) return cachedDepthGrid;
  if (lakePolygonRings.length === 0) return null;

  const bounds = computeRingsBounds(lakePolygonRings);
  if (!bounds) return null;
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  if (latSpan <= 0 || lngSpan <= 0) return null;

  const simplifiedRings = lakePolygonRings.map((ring) => simplifyRing(ring, 0.0008));

  const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const lngCorrection = Math.max(Math.cos(midLatRad), 0.1);
  const EARTH_R = 6371000;
  const toXY = (lat: number, lng: number): [number, number] => [
    lng * (Math.PI / 180) * EARTH_R * lngCorrection,
    lat * (Math.PI / 180) * EARTH_R,
  ];
  const simplifiedRingsXY = simplifiedRings.map((ring) => ring.map(([lat, lng]) => toXY(lat, lng)));

  const correctedLngSpan = lngSpan * lngCorrection;
  const RES = 220;
  let width: number;
  let height: number;
  if (correctedLngSpan >= latSpan) {
    width = RES;
    height = Math.max(40, Math.round((RES * latSpan) / correctedLngSpan));
  } else {
    height = RES;
    width = Math.max(40, Math.round((RES * correctedLngSpan) / latSpan));
  }

  function distanceToShoreM(px: number, py: number): number {
    let min = Infinity;
    for (const ring of simplifiedRingsXY) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [ax, ay] = ring[j]!;
        const [bx, by] = ring[i]!;
        const d = distanceToSegmentM(px, py, ax, ay, bx, by);
        if (d < min) min = d;
      }
    }
    return min;
  }

  const distances = new Float32Array(width * height);
  const inside = new Uint8Array(width * height);
  let maxDistM = 0;
  for (let row = 0; row < height; row++) {
    const lat = maxLat - (row / (height - 1)) * latSpan;
    for (let col = 0; col < width; col++) {
      const lng = minLng + (col / (width - 1)) * lngSpan;
      const idx = row * width + col;
      if (!pointInPolygon(lat, lng, simplifiedRings)) {
        distances[idx] = -1;
        continue;
      }
      inside[idx] = 1;
      const [px, py] = toXY(lat, lng);
      const d = distanceToShoreM(px, py);
      distances[idx] = d;
      if (d > maxDistM) maxDistM = d;
    }
  }

  const basinLat = minLat + CONTOUR_BASIN_FRACTION.lat * latSpan;
  const basinLng = minLng + CONTOUR_BASIN_FRACTION.lng * lngSpan;
  const [basinX, basinY] = toXY(basinLat, basinLng);
  const radialScaleM = Math.min(latSpan, correctedLngSpan) * 111320 * 0.24;
  const shoreScaleM = maxDistM / 3.5;

  const values = new Float32Array(width * height);
  for (let i = 0; i < distances.length; i++) {
    if (!inside[i]) continue;
    const row = Math.floor(i / width);
    const col = i % width;
    const lat = maxLat - (row / (height - 1)) * latSpan;
    const lng = minLng + (col / (width - 1)) * lngSpan;
    const [px, py] = toXY(lat, lng);
    const radialDistM = Math.hypot(px - basinX, py - basinY);
    const radialDepth = CONTOUR_MAX_DEPTH_M * Math.exp(-radialDistM / radialScaleM);
    const shoreDepth = CONTOUR_MAX_DEPTH_M * (1 - Math.exp(-distances[i]! / shoreScaleM));
    values[i] = Math.min(radialDepth, shoreDepth);
  }

  cachedDepthGrid = { width, height, minLat, maxLat, minLng, maxLng, values };
  return cachedDepthGrid;
}
