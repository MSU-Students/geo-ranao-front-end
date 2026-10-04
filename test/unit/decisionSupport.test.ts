import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDecisionSupport } from '../../src/composables/useDecisionSupport';
import type { FishObservation } from '../../src/composables/useFishObservations';
import type { MunicipalZone } from '../../src/composables/useMunicipalZones';

const mockZones: MunicipalZone[] = [
  {
    name: 'Bayang',
    ring: [
      [7.79, 124.19],
      [7.81, 124.19],
      [7.81, 124.21],
      [7.79, 124.21],
    ],
  },
  {
    name: 'Marawi City',
    ring: [
      [7.99, 124.27],
      [8.02, 124.27],
      [8.02, 124.30],
      [7.99, 124.30],
    ],
  },
  {
    name: 'Bacolod-Kalawi',
    ring: [
      [7.84, 124.14],
      [7.86, 124.14],
      [7.86, 124.16],
      [7.84, 124.16],
    ],
  },
  {
    name: 'Madamba',
    ring: [
      [7.87, 124.09],
      [7.89, 124.09],
      [7.89, 124.11],
      [7.87, 124.11],
    ],
  },
  {
    name: 'Ganassi',
    ring: [
      [7.81, 124.07],
      [7.83, 124.07],
      [7.83, 124.09],
      [7.81, 124.09],
    ],
  },
];

describe('useDecisionSupport - evaluateDecisionSupport', () => {
  it('classifies municipality with fewer than 5 records as INSUFFICIENT_DATA', () => {
    const obs: FishObservation[] = [
      {
        id: 1,
        researcherId: 1,
        category: 'ENDEMIC',
        speciesScientific: 'Barbodes sirang',
        speciesCommon: 'Sirang',
        conservationStatus: 'ENDANGERED',
        coordinates: '7.88, 124.10',
        municipal: 'Madamba',
        dateObserved: '2025-05-10',
        count: 2,
        reviewStatus: 'APPROVED',
        photos: [],
        createdAt: '2025-05-10',
        updatedAt: '2025-05-10',
      },
    ];

    const result = evaluateDecisionSupport(obs, mockZones, 2026);
    const madamba = result.municipalityResults.find((m) => m.municipality === 'Madamba');

    assert.ok(madamba);
    assert.strictEqual(madamba.status, 'INSUFFICIENT_DATA');
    assert.strictEqual(madamba.totalRecords, 1);
  });

  it('classifies municipality with records missing for >= 2 years as MONITORING_GAP', () => {
    // 5 records in Ganassi, but all from 2023 or earlier (assessment year: 2026)
    const obs: FishObservation[] = [1, 2, 3, 4, 5].map((i) => ({
      id: i,
      researcherId: 1,
      category: 'GENERAL',
      conservationStatus: 'NOT_EVALUATED',
      coordinates: '7.82, 124.08',
      municipal: 'Ganassi',
      dateObserved: `2023-0${i}-01`,
      count: 1,
      reviewStatus: 'APPROVED',
      photos: [],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    }));

    // Add one record in another municipality in 2026 so lake-wide max year is 2026
    obs.push({
      id: 99,
      researcherId: 1,
      category: 'ENDEMIC',
      conservationStatus: 'LEAST_CONCERN',
      coordinates: '7.80, 124.20',
      municipal: 'Bayang',
      dateObserved: '2026-02-15',
      count: 1,
      reviewStatus: 'APPROVED',
      photos: [],
      createdAt: '2026-02-15',
      updatedAt: '2026-02-15',
    });

    const result = evaluateDecisionSupport(obs, mockZones, 2026);
    const ganassi = result.municipalityResults.find((m) => m.municipality === 'Ganassi');

    assert.ok(ganassi);
    assert.strictEqual(ganassi.status, 'MONITORING_GAP');
    assert.strictEqual(ganassi.gapYearsCount >= 2, true);
  });

  it('classifies municipality with high or surging invasive share as INVASION_ALERT', () => {
    // 6 records in Marawi City: 5 invasive and 1 endemic in 2025-2026
    const obs: FishObservation[] = [
      ...[1, 2, 3, 4, 5].map((i) => ({
        id: i,
        researcherId: 1,
        category: 'INVASIVE' as const,
        speciesScientific: 'Glossogobius giuris',
        speciesCommon: 'White Goby',
        conservationStatus: 'LEAST_CONCERN' as const,
        coordinates: '8.00, 124.28',
        municipal: 'Marawi City',
        dateObserved: `2026-0${i}-01`,
        count: 5,
        reviewStatus: 'APPROVED' as const,
        photos: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      })),
      {
        id: 6,
        researcherId: 1,
        category: 'ENDEMIC' as const,
        speciesScientific: 'Barbodes baoulan',
        speciesCommon: 'Baolan',
        conservationStatus: 'CRITICALLY_ENDANGERED' as const,
        coordinates: '8.00, 124.28',
        municipal: 'Marawi City',
        dateObserved: '2026-01-15',
        count: 1,
        reviewStatus: 'APPROVED' as const,
        photos: [],
        createdAt: '2026-01-15',
        updatedAt: '2026-01-15',
      },
    ];

    const result = evaluateDecisionSupport(obs, mockZones, 2026);
    const marawi = result.municipalityResults.find((m) => m.municipality === 'Marawi City');

    assert.ok(marawi);
    assert.strictEqual(marawi.status, 'INVASION_ALERT');
    assert.strictEqual(marawi.invasiveSharePct >= 60, true);
  });

  it('classifies municipality with endemic species missing for 4+ years as PROTECTION_PRIORITY', () => {
    // Bacolod-Kalawi:
    // Barbodes lindog seen in 2022, but from 2023-2026 only general catches / other species
    const obs: FishObservation[] = [
      {
        id: 1,
        researcherId: 1,
        category: 'ENDEMIC',
        speciesScientific: 'Barbodes lindog',
        speciesCommon: 'Lindog',
        conservationStatus: 'CRITICALLY_ENDANGERED',
        coordinates: '7.85, 124.15',
        municipal: 'Bacolod-Kalawi',
        dateObserved: '2022-03-01',
        count: 1,
        reviewStatus: 'APPROVED',
        photos: [],
        createdAt: '2022-03-01',
        updatedAt: '2022-03-01',
      },
      ...[2, 3, 4, 5, 6].map((i) => ({
        id: i,
        researcherId: 1,
        category: 'GENERAL' as const,
        speciesScientific: 'Channa striata',
        conservationStatus: 'LEAST_CONCERN' as const,
        coordinates: '7.85, 124.15',
        municipal: 'Bacolod-Kalawi',
        dateObserved: `2026-0${i - 1}-01`,
        count: 2,
        reviewStatus: 'APPROVED' as const,
        photos: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      })),
    ];

    const result = evaluateDecisionSupport(obs, mockZones, 2026);
    const bacolod = result.municipalityResults.find((m) => m.municipality === 'Bacolod-Kalawi');

    assert.ok(bacolod);
    assert.strictEqual(bacolod.status, 'PROTECTION_PRIORITY');
    assert.strictEqual(bacolod.missingEndemicSpecies.includes('Barbodes lindog'), true);
  });

  it('classifies steady, balanced observations as STABLE', () => {
    // Bayang: 6 observations in 2026, balanced endemic (50%) and general (50%)
    const obs: FishObservation[] = [
      ...[1, 2, 3].map((i) => ({
        id: i,
        researcherId: 1,
        category: 'ENDEMIC' as const,
        speciesScientific: 'Barbodes sirang',
        speciesCommon: 'Sirang',
        conservationStatus: 'ENDANGERED' as const,
        coordinates: '7.80, 124.20',
        municipal: 'Bayang',
        dateObserved: `2026-0${i}-01`,
        count: 3,
        reviewStatus: 'APPROVED' as const,
        photos: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      })),
      ...[4, 5, 6].map((i) => ({
        id: i,
        researcherId: 1,
        category: 'GENERAL' as const,
        speciesScientific: 'Anguilla marmorata',
        conservationStatus: 'LEAST_CONCERN' as const,
        coordinates: '7.80, 124.20',
        municipal: 'Bayang',
        dateObserved: `2026-0${i - 3}-15`,
        count: 2,
        reviewStatus: 'APPROVED' as const,
        photos: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      })),
    ];

    const result = evaluateDecisionSupport(obs, mockZones, 2026);
    const bayang = result.municipalityResults.find((m) => m.municipality === 'Bayang');

    assert.ok(bayang);
    assert.strictEqual(bayang.status, 'STABLE');
    assert.strictEqual(bayang.invasiveSharePct, 0);
  });
});
