// "7.9823, 124.2701" -> { lat, lng } — splits string into numeric coordinates.
export function parseCoordinates(
  coordinates: string | null | undefined,
): { lat: number; lng: number } | null {
  if (!coordinates) return null;
  const [lat, lng] = coordinates.split(',').map((p) => Number(p.trim()));
  if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}
