import { parseCoordinates } from './useFishCoordinates';
import { findMunicipalityForPoint, type MunicipalZone } from './useMunicipalZones';

export interface FishLocationInput {
  coordinates?: string | null | undefined;
  municipal?: string | null | undefined;
  zoneMunicipality?: string | null | undefined;
}

/**
 * Shared resolver for attributing a fish observation to a municipality.
 *
 * Discrepancy fix:
 * 1. Primary: Polygon containment check via water-zone polygons (zoneMunicipality or coordinates).
 * 2. Fallback: Stored `municipal` text matched case-insensitively against known zone names.
 * 3. None: Returns null (signifies "Unmatched").
 */
export function resolveFishMunicipality(
  obs: FishLocationInput,
  zones: MunicipalZone[],
): string | null {
  // 1. If zoneMunicipality was already resolved by the map
  if (obs.zoneMunicipality) {
    const canonical = zones.find(
      (z) => z.name.toLowerCase() === obs.zoneMunicipality!.toLowerCase(),
    );
    if (canonical) return canonical.name;
  }

  // 2. Point-in-polygon containment
  if (obs.coordinates) {
    const coords = parseCoordinates(obs.coordinates);
    if (coords) {
      const zoneName = findMunicipalityForPoint(coords.lat, coords.lng, zones);
      if (zoneName) return zoneName;
    }
  }

  // 3. Stored municipal string fallback (normalized)
  if (obs.municipal && obs.municipal.trim()) {
    const raw = obs.municipal.trim().toLowerCase();
    const match = zones.find((z) => z.name.toLowerCase() === raw);
    if (match) return match.name;
  }

  // 4. Unmatched
  return null;
}

/**
 * Extracts a numeric year from a dateObserved string.
 * Returns null for missing, empty, or invalid dates (counted as "Undated").
 */
export function yearOf(dateObserved: string | null | undefined): number | null {
  if (!dateObserved || typeof dateObserved !== 'string') return null;
  const trimmed = dateObserved.trim();
  if (!trimmed) return null;

  // Format: YYYY-MM-DD or starts with 4-digit year
  const match = trimmed.match(/^(\d{4})/);
  if (!match || !match[1]) return null;

  const year = parseInt(match[1], 10);
  if (Number.isNaN(year) || year < 1900 || year > 2100) {
    return null;
  }

  // Verify date validity if full date string
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return year;
}
