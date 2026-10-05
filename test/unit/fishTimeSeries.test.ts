import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveFishMunicipality, yearOf } from '../../src/composables/useFishMunicipality';
import {
  aggregateFishTimeSeries,
  getDistinctYears,
  individualCountOf,
} from '../../src/composables/useFishTimeSeries';
import type { MunicipalZone } from '../../src/composables/useMunicipalZones';
import type { FishObservation } from '../../src/composables/useFishObservations';

// Sample zones for testing point-in-polygon & fallback matching
const sampleZones: MunicipalZone[] = [
  {
    name: 'Marawi City',
    // Triangle covering roughly lat 7.99 to 8.01, lng 124.28 to 124.30
    ring: [
      [7.99, 124.28],
      [8.01, 124.28],
      [8.01, 124.30],
      [7.99, 124.28],
    ],
  },
  {
    name: 'Bayang',
    // Triangle covering roughly lat 7.78 to 7.82, lng 124.18 to 124.22
    ring: [
      [7.78, 124.18],
      [7.82, 124.18],
      [7.82, 124.22],
      [7.78, 124.18],
    ],
  },
];

describe('useFishMunicipality', () => {
  describe('resolveFishMunicipality', () => {
    it('resolves by zone polygon containment when coordinates are inside a zone', () => {
      // Point inside Marawi City polygon
      const obs = {
        coordinates: '8.00, 124.285',
        municipal: 'Bayang', // Intentionally mismatched to verify polygon containment priority
      };
      const result = resolveFishMunicipality(obs, sampleZones);
      assert.equal(result, 'Marawi City');
    });

    it('falls back to normalized stored municipal name when point is outside polygons', () => {
      // Point somewhere else
      const obs = {
        coordinates: '7.50, 123.00',
        municipal: '  bayang  ', // Lowercase with whitespace
      };
      const result = resolveFishMunicipality(obs, sampleZones);
      assert.equal(result, 'Bayang');
    });

    it('returns canonical zone name when zoneMunicipality is already provided', () => {
      const obs = {
        zoneMunicipality: 'marawi city',
      };
      const result = resolveFishMunicipality(obs, sampleZones);
      assert.equal(result, 'Marawi City');
    });

    it('returns null (Unmatched) when coordinates miss all zones and municipal text is unknown', () => {
      const obs = {
        coordinates: '7.50, 123.00',
        municipal: 'Atlantis Ocean',
      };
      const result = resolveFishMunicipality(obs, sampleZones);
      assert.equal(result, null);
    });

    it('returns null when coordinates are absent and municipal text is missing', () => {
      const obs = {
        coordinates: null,
        municipal: null,
      };
      const result = resolveFishMunicipality(obs, sampleZones);
      assert.equal(result, null);
    });
  });

  describe('yearOf', () => {
    it('extracts numeric year from standard YYYY-MM-DD date string', () => {
      assert.equal(yearOf('2024-05-18'), 2024);
      assert.equal(yearOf('2022-12-31'), 2022);
      assert.equal(yearOf('2026-02-10'), 2026);
    });

    it('returns null for missing or empty date strings', () => {
      assert.equal(yearOf(null), null);
      assert.equal(yearOf(undefined), null);
      assert.equal(yearOf(''), null);
      assert.equal(yearOf('   '), null);
    });

    it('returns null for unparseable date strings', () => {
      assert.equal(yearOf('invalid-date'), null);
      assert.equal(yearOf('abc'), null);
    });
  });
});

describe('useFishTimeSeries', () => {
  const mockObservations: FishObservation[] = [
    {
      id: 1,
      researcherId: 1,
      category: 'ENDEMIC',
      speciesScientific: 'Barbodes lindog',
      speciesCommon: 'Lindog Barb',
      conservationStatus: 'CRITICALLY_ENDANGERED',
      coordinates: '8.00, 124.285', // Inside Marawi
      municipal: 'Marawi City',
      dateObserved: '2022-04-10',
      count: 2,
      reviewStatus: 'APPROVED',
      photos: [],
      createdAt: '2022-04-10',
      updatedAt: '2022-04-10',
    },
    {
      id: 2,
      researcherId: 1,
      category: 'INVASIVE',
      speciesScientific: 'Oreochromis niloticus',
      speciesCommon: 'Nile Tilapia',
      conservationStatus: 'LEAST_CONCERN',
      coordinates: '8.00, 124.285', // Inside Marawi
      municipal: 'Marawi City',
      dateObserved: '2023-06-15',
      count: 5,
      reviewStatus: 'APPROVED',
      photos: [],
      createdAt: '2023-06-15',
      updatedAt: '2023-06-15',
    },
    {
      id: 3,
      researcherId: 1,
      category: 'GENERAL',
      conservationStatus: 'NOT_EVALUATED',
      coordinates: '7.80, 124.20', // Inside Bayang
      municipal: 'Bayang',
      dateObserved: '2023-08-20',
      count: 12,
      reviewStatus: 'APPROVED',
      photos: [],
      createdAt: '2023-08-20',
      updatedAt: '2023-08-20',
    },
    {
      id: 4,
      researcherId: 1,
      category: 'ENDEMIC',
      speciesScientific: 'Barbodes tumba',
      speciesCommon: 'Tumba Barb',
      conservationStatus: 'CRITICALLY_ENDANGERED',
      coordinates: null, // Not on map
      municipal: 'Bayang',
      dateObserved: '2024-03-01',
      count: 1,
      reviewStatus: 'APPROVED',
      photos: [],
      createdAt: '2024-03-01',
      updatedAt: '2024-03-01',
    },
    {
      id: 5,
      researcherId: 1,
      category: 'INVASIVE',
      speciesScientific: 'Glossogobius giuris',
      conservationStatus: 'LEAST_CONCERN',
      coordinates: '7.50, 123.00', // Misses all zones
      municipal: 'Unknown LGU', // Unmatched
      dateObserved: null, // Undated
      count: 3,
      reviewStatus: 'APPROVED',
      photos: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  it('getDistinctYears returns sorted unique years excluding nulls', () => {
    const years = getDistinctYears(mockObservations);
    assert.deepEqual(years, [2022, 2023, 2024]);
  });

  it('individualCountOf returns count or defaults to 1', () => {
    assert.equal(individualCountOf(mockObservations[0]!), 2);
    assert.equal(individualCountOf(mockObservations[3]!), 1);
  });

  it('aggregates time series yearly by default', () => {
    const result = aggregateFishTimeSeries(mockObservations, sampleZones, { mode: 'year' });

    assert.deepEqual(result.years, [2022, 2023, 2024]);

    // 2022: 1 record, 2 individuals (ENDEMIC)
    assert.equal(result.yearly[2022]?.records, 1);
    assert.equal(result.yearly[2022]?.individuals, 2);
    assert.equal(result.yearly[2022]?.byCategory.ENDEMIC.records, 1);
    assert.equal(result.yearly[2022]?.byCategory.INVASIVE.records, 0);

    // 2023: 2 records (1 Invasive, 1 General), 17 individuals
    assert.equal(result.yearly[2023]?.records, 2);
    assert.equal(result.yearly[2023]?.individuals, 17);
    assert.equal(result.yearly[2023]?.byCategory.INVASIVE.records, 1);
    assert.equal(result.yearly[2023]?.byCategory.GENERAL.records, 1);

    // Data quality accounting
    assert.equal(result.dataQuality.totalRecords, 5);
    assert.equal(result.dataQuality.undatedRecords, 1); // id 5
    assert.equal(result.dataQuality.notOnMapRecords, 1); // id 4
    assert.equal(result.dataQuality.unmatchedRecords, 1); // id 5
  });

  it('aggregates time series cumulatively when mode is cumulative', () => {
    const result = aggregateFishTimeSeries(mockObservations, sampleZones, { mode: 'cumulative' });

    // 2022 cumulative: 1 record, 2 individuals
    assert.equal(result.yearly[2022]?.records, 1);
    assert.equal(result.yearly[2022]?.individuals, 2);

    // 2023 cumulative: 1 + 2 = 3 records, 2 + 17 = 19 individuals
    assert.equal(result.yearly[2023]?.records, 3);
    assert.equal(result.yearly[2023]?.individuals, 19);

    // 2024 cumulative: 3 + 1 = 4 records, 19 + 1 = 20 individuals
    assert.equal(result.yearly[2024]?.records, 4);
    assert.equal(result.yearly[2024]?.individuals, 20);
  });

  it('filters by category accurately', () => {
    const result = aggregateFishTimeSeries(mockObservations, sampleZones, {
      targetCategory: 'ENDEMIC',
    });

    // 2022 has 1 endemic
    assert.equal(result.yearly[2022]?.records, 1);
    // 2023 has 0 endemic
    assert.equal(result.yearly[2023]?.records, 0);
    // 2024 has 1 endemic
    assert.equal(result.yearly[2024]?.records, 1);
  });

  it('filters by municipality accurately', () => {
    const result = aggregateFishTimeSeries(mockObservations, sampleZones, {
      targetMunicipality: 'Marawi City',
    });

    // 2022 has 1 record in Marawi
    assert.equal(result.yearly[2022]?.records, 1);
    // 2023 has 1 record in Marawi
    assert.equal(result.yearly[2023]?.records, 1);
    // 2024 has 0 records in Marawi
    assert.equal(result.yearly[2024]?.records, 0);
  });
});
