// One-off authoring tool: regenerates "public/geo/Municipal-Water-Zones.geojson"
// — a proper vector polygon per lakeshore municipality's illustrative water
// zone, replacing the old canvas-rasterized L.imageOverlay (which pixelated
// on zoom). Run with:
//   npm run generate:municipal-zones
//
// Method mirrors the model documented in IndexPage.vue's MUNICIPAL WATER
// ZONES section: every point on the lake is assigned to whichever town
// center is nearest (RA 8550's "equidistant/median line" method for
// adjacent municipal waters), capped at MUNICIPAL_WATER_LIMIT_KM. That's
// exactly a Voronoi diagram of the town points, clipped to (a) each town's
// 15km buffer circle and (b) the lake's own shoreline — so instead of
// rasterizing a nearest-neighbor grid to a PNG, this computes the Voronoi
// cells directly (d3-delaunay) and clips them with real polygon boolean ops
// (turf), producing crisp vector geometry at any zoom level.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Delaunay } from 'd3-delaunay';
import * as turf from '@turf/turf';

const __dirname = dirname(fileURLToPath(import.meta.url));
const municipalitiesPath = resolve(__dirname, '..', 'src', 'data', 'lake-municipalities.json');
const lakeBoundaryPath = resolve(__dirname, '..', 'public', 'geo', 'lake-lanao.geojson');
const outPath = resolve(__dirname, '..', 'public', 'geo', 'Municipal-Water-Zones.geojson');

const MUNICIPAL_WATER_LIMIT_KM = 15;

const municipalities = JSON.parse(readFileSync(municipalitiesPath, 'utf8'));
const lakeGeojson = JSON.parse(readFileSync(lakeBoundaryPath, 'utf8'));
const lakePolygon = lakeGeojson.features[0];

// Same per-town color formula IndexPage.vue's LAKE_MUNICIPALITIES uses for
// the city-pin markers, so a zone and its town's pin always match.
function colorFor(index, total) {
  return `hsl(${Math.round((index * 360) / total)}, 62%, 50%)`;
}

const points = municipalities.map((m) => [m.lng, m.lat]);
const delaunay = Delaunay.from(points);

// Voronoi needs an explicit bounding box to clip infinite edge cells against
// — generous margin (~0.5°, well over the 15km cap) so no real cell edge
// gets truncated by the diagram bounds before the real clips (buffer, lake)
// run.
const lakeBbox = turf.bbox(lakePolygon);
const margin = 0.5;
const voronoi = delaunay.voronoi([
  lakeBbox[0] - margin,
  lakeBbox[1] - margin,
  lakeBbox[2] + margin,
  lakeBbox[3] + margin,
]);

const features = [];
municipalities.forEach((town, i) => {
  const cell = voronoi.cellPolygon(i);
  if (!cell) return; // town had no Voronoi cell (shouldn't happen with >2 points)

  const cellFeature = turf.polygon([cell]);
  const buffer = turf.buffer(turf.point([town.lng, town.lat]), MUNICIPAL_WATER_LIMIT_KM, {
    units: 'kilometers',
  });

  let zone = turf.intersect(turf.featureCollection([cellFeature, buffer]));
  if (!zone) return;
  zone = turf.intersect(turf.featureCollection([zone, lakePolygon]));
  if (!zone) return; // town's Voronoi cell never reaches the lake at all

  const label = turf.pointOnFeature(zone).geometry.coordinates; // [lng, lat], guaranteed inside

  zone.properties = {
    name: town.name,
    color: colorFor(i, municipalities.length),
    labelLat: label[1],
    labelLng: label[0],
  };
  features.push(zone);
});

const output = turf.featureCollection(features);
writeFileSync(outPath, JSON.stringify(output));

console.log(`Wrote ${features.length} municipal water zones to ${outPath}`);
