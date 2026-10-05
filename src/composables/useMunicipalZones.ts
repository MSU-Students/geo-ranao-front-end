import { pointInRing, simplifyRing } from './useBathymetry';

// One municipality's water-zone boundary — reused from the same GeoJSON the
// 2D map colors municipal zones with (public/geo/Municipal-Water-Zones.geojson),
// so "which municipality is this station in" answers the same way everywhere.
export interface MunicipalZone {
  name: string;
  /** Full-precision ring, [lat, lng] pairs — used for accurate point-in-polygon tests. */
  ring: [number, number][];
}

let zonesCache: MunicipalZone[] | null = null;

export async function loadMunicipalZones(): Promise<MunicipalZone[]> {
  if (zonesCache) return zonesCache;
  const res = await fetch('/geo/Municipal-Water-Zones.geojson');
  const geojson = (await res.json()) as GeoJSON.FeatureCollection;
  zonesCache = geojson.features
    .filter((f): f is GeoJSON.Feature<GeoJSON.Polygon> => f.geometry.type === 'Polygon')
    .map((f) => {
      const name = (f.properties?.['name'] as string | undefined) ?? 'Unknown';
      const outerRing = f.geometry.coordinates[0] ?? [];
      const ring: [number, number][] = outerRing.map(([lng, lat]) => [lat!, lng!]);
      return { name, ring };
    });
  return zonesCache;
}

export function findMunicipalityForPoint(lat: number, lng: number, zones: MunicipalZone[]): string | null {
  for (const zone of zones) {
    if (pointInRing(lat, lng, zone.ring)) return zone.name;
  }
  return null;
}

/** Lower-detail copy of a zone's ring for embedding in a small diagram — full precision is wasted at PDF scale. */
export function simplifiedZoneRing(zone: MunicipalZone, toleranceDeg = 0.0006): [number, number][] {
  return simplifyRing(zone.ring, toleranceDeg);
}
