import type { FishObservation, ConservationStatus } from '../composables/useFishObservations';

interface SpeciesDef {
  scientific: string;
  common: string;
  category: 'ENDEMIC' | 'INVASIVE' | 'GENERAL';
  status: ConservationStatus;
  lengthRange: [number, number];
  weightRange: [number, number];
  depthRange: [number, number];
}

const SPECIES_POOL: SpeciesDef[] = [
  // Endemics
  { scientific: 'Barbodes baoulan', common: 'Baolan', category: 'ENDEMIC', status: 'CRITICALLY_ENDANGERED', lengthRange: [8, 14], weightRange: [40, 110], depthRange: [5, 30] },
  { scientific: 'Barbodes binotatus', common: 'Pait', category: 'ENDEMIC', status: 'LEAST_CONCERN', lengthRange: [6, 12], weightRange: [20, 70], depthRange: [1, 10] },
  { scientific: 'Barbodes clemensi', common: 'Bagangan', category: 'ENDEMIC', status: 'CRITICALLY_ENDANGERED', lengthRange: [10, 18], weightRange: [60, 150], depthRange: [4, 25] },
  { scientific: 'Barbodes disa', common: 'Disa', category: 'ENDEMIC', status: 'CRITICALLY_ENDANGERED', lengthRange: [7, 13], weightRange: [30, 90], depthRange: [3, 20] },
  { scientific: 'Barbodes lindog', common: 'Lindog', category: 'ENDEMIC', status: 'CRITICALLY_ENDANGERED', lengthRange: [9, 16], weightRange: [50, 140], depthRange: [5, 35] },
  { scientific: 'Barbodes sirang', common: 'Sirang', category: 'ENDEMIC', status: 'ENDANGERED', lengthRange: [6, 11], weightRange: [25, 65], depthRange: [2, 15] },
  { scientific: 'Barbodes tumba', common: 'Tumba', category: 'ENDEMIC', status: 'CRITICALLY_ENDANGERED', lengthRange: [8, 15], weightRange: [45, 120], depthRange: [4, 25] },
  // Invasives
  { scientific: 'Oreochromis niloticus', common: 'Nile Tilapia', category: 'INVASIVE', status: 'LEAST_CONCERN', lengthRange: [12, 35], weightRange: [100, 650], depthRange: [0.5, 12] },
  { scientific: 'Glossogobius giuris', common: 'White Goby (Kadyawan)', category: 'INVASIVE', status: 'LEAST_CONCERN', lengthRange: [8, 22], weightRange: [30, 180], depthRange: [1, 20] },
  { scientific: 'Hypseleotris agilis', common: 'Katulong', category: 'INVASIVE', status: 'LEAST_CONCERN', lengthRange: [5, 10], weightRange: [10, 45], depthRange: [0.5, 8] },
  { scientific: 'Clarias batrachus', common: 'Walking Catfish', category: 'INVASIVE', status: 'LEAST_CONCERN', lengthRange: [15, 32], weightRange: [120, 450], depthRange: [0.5, 10] },
  // General Catch
  { scientific: 'Channa striata', common: 'Striped Snakehead (Haruan)', category: 'GENERAL', status: 'LEAST_CONCERN', lengthRange: [18, 45], weightRange: [150, 800], depthRange: [0.5, 8] },
  { scientific: 'Anabas testudineus', common: 'Climbing Perch (Puyo)', category: 'GENERAL', status: 'LEAST_CONCERN', lengthRange: [8, 16], weightRange: [30, 95], depthRange: [0.2, 5] },
];

const MUNICIPALITIES = [
  { name: 'Marawi City', centerLat: 7.995, centerLng: 124.285 },
  { name: 'Bacolod-Kalawi', centerLat: 7.850, centerLng: 124.150 },
  { name: 'Balindong', centerLat: 7.900, centerLng: 124.210 },
  { name: 'Bayang', centerLat: 7.795, centerLng: 124.195 },
  { name: 'Binidayan', centerLat: 7.790, centerLng: 124.165 },
  { name: 'Buadiposo-Buntong', centerLat: 7.960, centerLng: 124.365 },
  { name: 'Ditsaan-Ramain', centerLat: 7.970, centerLng: 124.345 },
  { name: 'Ganassi', centerLat: 7.820, centerLng: 124.105 },
  { name: 'Lumbatan', centerLat: 7.785, centerLng: 124.250 },
  { name: 'Lumbayanague', centerLat: 7.785, centerLng: 124.275 },
  { name: 'Madalum', centerLat: 7.850, centerLng: 124.115 },
  { name: 'Madamba', centerLat: 7.865, centerLng: 124.085 },
  { name: 'Marantao', centerLat: 7.940, centerLng: 124.235 },
  { name: 'Masiu', centerLat: 7.820, centerLng: 124.320 },
  { name: 'Mulondo', centerLat: 7.915, centerLng: 124.350 },
  { name: 'Poona Bayabao', centerLat: 7.855, centerLng: 124.330 },
  { name: 'Tamparan', centerLat: 7.875, centerLng: 124.320 },
  { name: 'Taraka', centerLat: 7.895, centerLng: 124.325 },
  { name: 'Tugaya', centerLat: 7.880, centerLng: 124.180 },
];

/** Simple deterministic pseudo-random number generator (LCG) */
let seed = 123456789;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function randRange(min: number, max: number): number {
  return min + rand() * (max - min);
}
function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

export function generateFrontendMockObservations(): FishObservation[] {
  seed = 987654321;
  const list: FishObservation[] = [];
  let currentId = 1;

  // Generate deliberate patterns across 2022 to 2026:
  // 1. Marawi City: Invasion alert (invasive share climbs from 30% in 2022 to 85% in 2026)
  // 2. Bacolod-Kalawi: Protection priority (Barbodes lindog seen in 2022, absent 2023-2026)
  // 3. Madamba: Insufficient data (only 2 records overall)
  // 4. Bayang: Stable (~10 records/year, balanced native cyprinids)
  // 5. Ganassi: Monitoring gap (records only in 2022-2023)
  // 6. Other municipalities: general periodic catch observations

  for (const muni of MUNICIPALITIES) {
    if (muni.name === 'Madamba') {
      // Insufficient data: only 2 records
      for (let i = 0; i < 2; i++) {
        list.push(createMockObs(currentId++, muni, SPECIES_POOL[0]!, 2025, 4));
      }
      continue;
    }

    if (muni.name === 'Ganassi') {
      // Monitoring gap: observations only in 2022 and 2023
      for (const year of [2022, 2023]) {
        for (let i = 0; i < 4; i++) {
          const sp = SPECIES_POOL[randInt(0, SPECIES_POOL.length - 1)]!;
          list.push(createMockObs(currentId++, muni, sp, year, randInt(1, 10)));
        }
      }
      continue;
    }

    if (muni.name === 'Bacolod-Kalawi') {
      // Protection priority: Barbodes lindog in 2022, then absent through 2026
      list.push(createMockObs(currentId++, muni, SPECIES_POOL.find((s) => s.common === 'Lindog')!, 2022, 2));
      for (const year of [2023, 2024, 2025, 2026]) {
        for (let i = 0; i < 3; i++) {
          const sp = SPECIES_POOL.find((s) => s.category !== 'ENDEMIC' || s.common !== 'Lindog')!;
          list.push(createMockObs(currentId++, muni, sp, year, randInt(1, 9)));
        }
      }
      continue;
    }

    if (muni.name === 'Marawi City') {
      // Invasion alert: rising invasive share
      for (const year of [2022, 2023, 2024, 2025, 2026]) {
        const totalYear = 8;
        const invasiveCount = year === 2022 ? 2 : year === 2023 ? 3 : year === 2024 ? 5 : year === 2025 ? 6 : 7;
        for (let i = 0; i < totalYear; i++) {
          const isInv = i < invasiveCount;
          const pool = isInv ? SPECIES_POOL.filter((s) => s.category === 'INVASIVE') : SPECIES_POOL.filter((s) => s.category === 'ENDEMIC');
          const sp = pool[randInt(0, pool.length - 1)]!;
          list.push(createMockObs(currentId++, muni, sp, year, randInt(1, 10)));
        }
      }
      continue;
    }

    if (muni.name === 'Bayang') {
      // Stable: consistent balanced presence across all years
      for (const year of [2022, 2023, 2024, 2025, 2026]) {
        for (let i = 0; i < 7; i++) {
          const isEndemic = i < 4;
          const pool = isEndemic ? SPECIES_POOL.filter((s) => s.category === 'ENDEMIC') : SPECIES_POOL.filter((s) => s.category === 'GENERAL');
          const sp = pool[randInt(0, pool.length - 1)]!;
          list.push(createMockObs(currentId++, muni, sp, year, randInt(1, 10)));
        }
      }
      continue;
    }

    // Other municipalities: 3-5 observations across 2023-2026
    for (const year of [2023, 2024, 2025, 2026]) {
      const count = randInt(1, 3);
      for (let i = 0; i < count; i++) {
        const sp = SPECIES_POOL[randInt(0, SPECIES_POOL.length - 1)]!;
        list.push(createMockObs(currentId++, muni, sp, year, randInt(1, 11)));
      }
    }
  }

  // Add deliberate accounting records (Undated, Not on map, Unmatched)
  // 1. Undated
  list.push({
    ...createMockObs(currentId++, MUNICIPALITIES[0]!, SPECIES_POOL[1]!, 2024, 1),
    dateObserved: null,
    notes: '[SAMPLE DATA] Undated observation record',
  });
  list.push({
    ...createMockObs(currentId++, MUNICIPALITIES[1]!, SPECIES_POOL[2]!, 2025, 1),
    dateObserved: '',
    notes: '[SAMPLE DATA] Undated observation record',
  });

  // 2. Not on map (no coordinates)
  list.push({
    ...createMockObs(currentId++, MUNICIPALITIES[2]!, SPECIES_POOL[3]!, 2025, 1),
    coordinates: null,
    notes: '[SAMPLE DATA] Record with coordinates omitted',
  });

  // 3. Unmatched municipality
  list.push({
    id: currentId++,
    researcherId: 1,
    category: 'GENERAL',
    speciesScientific: 'Channa striata',
    speciesCommon: 'Striped Snakehead (Haruan)',
    conservationStatus: 'LEAST_CONCERN',
    trueLengthCm: 25,
    bodyDepthCm: 5,
    weightG: 320,
    depthM: 3,
    count: 1,
    coordinates: '7.9100, 124.2500',
    municipal: 'Outer Marshlands',
    barangay: 'Remote Canal',
    dateObserved: '2026-02-10',
    notes: '[SAMPLE DATA] Unmatched municipality text',
    reviewStatus: 'APPROVED',
    photos: [],
    createdAt: '2026-02-10',
    updatedAt: '2026-02-10',
  });

  return list;
}

function createMockObs(
  id: number,
  muni: (typeof MUNICIPALITIES)[0],
  sp: SpeciesDef,
  year: number,
  month: number,
): FishObservation {
  // Generate random points near municipal lake shoreline
  const latOffset = randRange(-0.012, 0.012);
  const lngOffset = randRange(-0.012, 0.012);
  const lat = muni.centerLat + latOffset;
  const lng = muni.centerLng + lngOffset;

  const mStr = String(month).padStart(2, '0');
  const dStr = String(randInt(1, 28)).padStart(2, '0');
  const dateObserved = `${year}-${mStr}-${dStr}`;

  return {
    id,
    researcherId: 1,
    category: sp.category,
    speciesScientific: sp.scientific,
    speciesCommon: sp.common,
    conservationStatus: sp.status,
    trueLengthCm: Math.round(randRange(...sp.lengthRange) * 10) / 10,
    bodyDepthCm: Math.round(randRange(2, 6) * 10) / 10,
    weightG: Math.round(randRange(...sp.weightRange)),
    depthM: Math.round(randRange(...sp.depthRange) * 10) / 10,
    count: randInt(1, 5),
    coordinates: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    municipal: muni.name,
    barangay: 'Lakeshore Barangay',
    dateObserved,
    notes: '[SAMPLE DATA] Auto-generated time-series observation for preview',
    reviewStatus: 'APPROVED',
    photos: [],
    createdAt: dateObserved,
    updatedAt: dateObserved,
  };
}
