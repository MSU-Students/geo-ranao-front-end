import type { FishObservation, FishCategory } from './useFishObservations';
import { parseCoordinates } from './useFishCoordinates';
import type { MunicipalZone } from './useMunicipalZones';
import { resolveFishMunicipality, yearOf } from './useFishMunicipality';
import type { FishYearMode } from './useFishYearState';

export interface CategoryMetrics {
  records: number;
  individuals: number;
}

export interface MunicipalityMetrics {
  records: number;
  individuals: number;
  endemic: number;
  invasive: number;
  general: number;
}

export interface SpeciesMetrics {
  scientificName: string;
  commonName: string;
  category: FishCategory;
  conservationStatus: string;
  records: number;
  individuals: number;
}

export interface YearAggregation {
  year: number;
  records: number;
  individuals: number;
  byCategory: Record<FishCategory, CategoryMetrics>;
  byMunicipality: Record<string, MunicipalityMetrics>;
  bySpecies: Record<string, SpeciesMetrics>;
}

export interface DataQualityMetrics {
  totalRecords: number;
  undatedRecords: number;
  notOnMapRecords: number;
  unmatchedRecords: number;
}

export interface TimeSeriesResult {
  years: number[];
  yearly: Record<number, YearAggregation>;
  dataQuality: DataQualityMetrics;
}

/**
 * Extracts distinct valid years from a collection of observations, sorted ascending.
 */
export function getDistinctYears(observations: FishObservation[]): number[] {
  const yearsSet = new Set<number>();
  for (const obs of observations) {
    const yr = yearOf(obs.dateObserved);
    if (yr !== null) {
      yearsSet.add(yr);
    }
  }
  return Array.from(yearsSet).sort((a, b) => a - b);
}

/**
 * Returns the individual count represented by an observation record.
 */
export function individualCountOf(obs: FishObservation): number {
  if (obs.count != null && obs.count > 0) {
    return obs.count;
  }
  return 1;
}

export interface AggregateOptions {
  mode?: FishYearMode | undefined;
  targetMunicipality?: string | null | undefined;
  targetCategory?: FishCategory | 'all' | null | undefined;
  targetSpecies?: string | null | undefined;
}

/**
 * Pure aggregation function for fish time series analysis.
 * Computes yearly / cumulative counts, species & municipality distributions,
 * and tracks data quality metrics (Undated, Not on map, Unmatched).
 */
export function aggregateFishTimeSeries(
  observations: FishObservation[],
  zones: MunicipalZone[],
  options: AggregateOptions = {},
): TimeSeriesResult {
  const mode = options.mode ?? 'year';
  const allYears = getDistinctYears(observations);

  let undatedCount = 0;
  let notOnMapCount = 0;
  let unmatchedCount = 0;

  // Base raw year buckets
  const rawYearly: Record<number, YearAggregation> = {};
  for (const yr of allYears) {
    rawYearly[yr] = {
      year: yr,
      records: 0,
      individuals: 0,
      byCategory: {
        ENDEMIC: { records: 0, individuals: 0 },
        INVASIVE: { records: 0, individuals: 0 },
        GENERAL: { records: 0, individuals: 0 },
      },
      byMunicipality: {},
      bySpecies: {},
    };
  }

  for (const obs of observations) {
    const yr = yearOf(obs.dateObserved);
    const coords = parseCoordinates(obs.coordinates);
    const muni = resolveFishMunicipality(obs, zones);

    // Track data quality metrics across all loaded records
    if (yr === null) undatedCount++;
    if (!coords) notOnMapCount++;
    if (!muni) unmatchedCount++;

    // Check filters
    if (options.targetCategory && options.targetCategory !== 'all') {
      if (obs.category !== options.targetCategory) continue;
    }
    if (options.targetMunicipality && options.targetMunicipality !== 'All Municipalities') {
      if (muni !== options.targetMunicipality) continue;
    }
    if (options.targetSpecies && options.targetSpecies !== 'All Species') {
      const spName = obs.speciesScientific || obs.speciesCommon;
      if (spName !== options.targetSpecies) continue;
    }

    if (yr === null || !rawYearly[yr]) continue;

    const count = individualCountOf(obs);
    const yearBucket = rawYearly[yr];

    yearBucket.records += 1;
    yearBucket.individuals += count;

    // Category breakdown
    const cat = obs.category;
    if (yearBucket.byCategory[cat]) {
      yearBucket.byCategory[cat].records += 1;
      yearBucket.byCategory[cat].individuals += count;
    }

    // Municipality breakdown
    const muniKey = muni || 'Unmatched';
    if (!yearBucket.byMunicipality[muniKey]) {
      yearBucket.byMunicipality[muniKey] = {
        records: 0,
        individuals: 0,
        endemic: 0,
        invasive: 0,
        general: 0,
      };
    }
    const muniMetric = yearBucket.byMunicipality[muniKey];
    muniMetric.records += 1;
    muniMetric.individuals += count;
    if (cat === 'ENDEMIC') muniMetric.endemic += 1;
    else if (cat === 'INVASIVE') muniMetric.invasive += 1;
    else muniMetric.general += 1;

    // Species breakdown
    if (obs.speciesScientific || obs.speciesCommon) {
      const spKey = obs.speciesScientific || obs.speciesCommon!;
      if (!yearBucket.bySpecies[spKey]) {
        yearBucket.bySpecies[spKey] = {
          scientificName: obs.speciesScientific || '—',
          commonName: obs.speciesCommon || 'Unnamed species',
          category: obs.category,
          conservationStatus: obs.conservationStatus,
          records: 0,
          individuals: 0,
        };
      }
      yearBucket.bySpecies[spKey].records += 1;
      yearBucket.bySpecies[spKey].individuals += count;
    }
  }

  // Handle cumulative mode if requested
  const resultYearly: Record<number, YearAggregation> = {};

  if (mode === 'cumulative') {
    let runningRecords = 0;
    let runningIndividuals = 0;
    const runningCategory: Record<FishCategory, CategoryMetrics> = {
      ENDEMIC: { records: 0, individuals: 0 },
      INVASIVE: { records: 0, individuals: 0 },
      GENERAL: { records: 0, individuals: 0 },
    };
    const runningMuni: Record<string, MunicipalityMetrics> = {};
    const runningSpecies: Record<string, SpeciesMetrics> = {};

    for (const yr of allYears) {
      const current = rawYearly[yr];
      if (!current) continue;

      runningRecords += current.records;
      runningIndividuals += current.individuals;

      for (const cat of ['ENDEMIC', 'INVASIVE', 'GENERAL'] as FishCategory[]) {
        runningCategory[cat].records += current.byCategory[cat].records;
        runningCategory[cat].individuals += current.byCategory[cat].individuals;
      }

      for (const [mName, mVal] of Object.entries(current.byMunicipality)) {
        if (!runningMuni[mName]) {
          runningMuni[mName] = { records: 0, individuals: 0, endemic: 0, invasive: 0, general: 0 };
        }
        const rm = runningMuni[mName]!;
        rm.records += mVal.records;
        rm.individuals += mVal.individuals;
        rm.endemic += mVal.endemic;
        rm.invasive += mVal.invasive;
        rm.general += mVal.general;
      }

      for (const [spKey, spVal] of Object.entries(current.bySpecies)) {
        if (!runningSpecies[spKey]) {
          runningSpecies[spKey] = { ...spVal, records: 0, individuals: 0 };
        }
        const rs = runningSpecies[spKey]!;
        rs.records += spVal.records;
        rs.individuals += spVal.individuals;
      }

      resultYearly[yr] = {
        year: yr,
        records: runningRecords,
        individuals: runningIndividuals,
        byCategory: {
          ENDEMIC: { ...runningCategory.ENDEMIC },
          INVASIVE: { ...runningCategory.INVASIVE },
          GENERAL: { ...runningCategory.GENERAL },
        },
        byMunicipality: JSON.parse(JSON.stringify(runningMuni)) as Record<string, MunicipalityMetrics>,
        bySpecies: JSON.parse(JSON.stringify(runningSpecies)) as Record<string, SpeciesMetrics>,
      };
    }
  } else {
    for (const yr of allYears) {
      const entry = rawYearly[yr];
      if (entry) resultYearly[yr] = entry;
    }
  }

  return {
    years: allYears,
    yearly: resultYearly,
    dataQuality: {
      totalRecords: observations.length,
      undatedRecords: undatedCount,
      notOnMapRecords: notOnMapCount,
      unmatchedRecords: unmatchedCount,
    },
  };
}
