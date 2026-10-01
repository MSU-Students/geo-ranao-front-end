// Shared "where did this data come from" diagram for PDF summary reports —
// a boundary outline (a municipal water zone or the whole lake) with a
// colored dot per data point, projected into a square. Factored out of
// useWaterQualitySummaryReport.ts so useFishObservationSummaryReport.ts (and
// any future summary report) doesn't duplicate the same geometry math.
import type jsPDF from 'jspdf';

export function hexToRgb(hex: string): [number, number, number] {
  const num = parseInt(hex.replace('#', ''), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function boundsOf(ring: [number, number][]): Bounds | null {
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

export interface DiagramPoint {
  lat: number;
  lng: number;
  color: string; // hex
  label: string; // short label drawn next to the dot
}

export interface DiagramLegendEntry {
  color: string;
  label: string;
}

// Draws the boundary + colored dots + a legend row beneath it. `ring` is
// whatever boundary applies to this report's scope (a municipal water zone
// or the whole lake) — the caller decides which and loads it beforehand,
// since that choice is report-specific.
export function drawLocationDiagram(
  doc: jsPDF,
  opts: {
    x: number;
    y: number;
    size: number;
    ring: [number, number][];
    points: DiagramPoint[];
    legend: DiagramLegendEntry[];
  },
): void {
  const { x, y, size, ring, points, legend } = opts;
  const bounds = boundsOf(ring);
  if (!bounds) {
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text('Boundary unavailable for this scope.', x, y + 10);
    return;
  }

  // Pad the bounds slightly so points near the edge aren't clipped.
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

  for (const point of points) {
    const [px, py] = project(point.lat, point.lng, padded, x, y, size);
    const [r, g, b] = hexToRgb(point.color);
    doc.setFillColor(r, g, b);
    doc.circle(px, py, 1.6, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(60, 60, 60);
    doc.text(point.label, px + 2.2, py + 1, { maxWidth: 24 });
  }

  const legendY = y + size + 8;
  let legendX = x;
  doc.setFontSize(8);
  for (const entry of legend) {
    const [r, g, b] = hexToRgb(entry.color);
    doc.setFillColor(r, g, b);
    doc.circle(legendX + 2, legendY, 1.6, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text(entry.label, legendX + 5, legendY + 1);
    legendX += 5 + doc.getTextWidth(entry.label) + 10;
  }
}
