import { ref } from 'vue';
import { api } from 'src/boot/axios';

export type StationZone = 'NEARSHORE' | 'OFFSHORE' | 'TRIBUTARY' | 'RIVER';

export interface Station {
  siteId: string;
  stationId?: string | null;
  latitude: number;
  longitude: number;
  zone: StationZone;
}

// Fixed reference data (30 rows, never changes at runtime) — fetched once
// and shared across every composable/page via this module-level cache.
const stations = ref<Station[]>([]);
let fetchPromise: Promise<Station[]> | null = null;

export async function fetchStations(): Promise<Station[]> {
  if (stations.value.length > 0) return stations.value;
  fetchPromise ??= api.get<Station[]>('/stations').then(({ data }) => {
    stations.value = data;
    return data;
  });
  return fetchPromise;
}

export function useStations() {
  return { stations, fetchStations };
}
