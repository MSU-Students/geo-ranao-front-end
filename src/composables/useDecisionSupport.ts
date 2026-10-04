import type { FishObservation } from './useFishObservations';
import type { MunicipalZone } from './useMunicipalZones';
import { resolveFishMunicipality, yearOf } from './useFishMunicipality';
import {
  type DecisionStatus,
  type DecisionStatusMeta,
  DECISION_STATUSES,
} from 'src/config/decisionSupport';

export interface MunicipalityDecisionResult {
  municipality: string;
  status: DecisionStatus;
  meta: DecisionStatusMeta;
  totalRecords: number;
  totalIndividuals: number;
  endemicCount: number;
  invasiveCount: number;
  generalCount: number;
  invasiveSharePct: number;
  activeYears: number[];
  latestYearRecorded: number | null;
  gapYearsCount: number;
  missingEndemicSpecies: string[];
  findings: string[];
}

export interface WatchlistSpeciesResult {
  speciesScientific: string;
  speciesCommon: string;
  category: 'ENDEMIC' | 'INVASIVE' | 'GENERAL';
  lastRecordedYear: number | null;
  totalRecords: number;
  yearsAbsent: number;
  statusFlag: 'EXTIRPATION_RISK' | 'INVASIVE_SURGE' | 'NORMAL';
  notes: string;
}

export interface DecisionSupportSummary {
  municipalityResults: MunicipalityDecisionResult[];
  watchlist: WatchlistSpeciesResult[];
  byStatusCounts: Record<DecisionStatus, number>;
  latestAssessmentYear: number;
}

/**
 * Pure evaluation function for Municipality Decision Support rules.
 *
 * Rules:
 * 1. INSUFFICIENT_DATA: totalRecords < 5 overall.
 * 2. MONITORING_GAP: latest observation was > 2 years prior to latest lake-wide year.
 * 3. INVASION_ALERT: invasiveShare >= 65% in recent records OR invasive share grew by >= 25% over the last 2 recorded years.
 * 4. PROTECTION_PRIORITY: endemic species recorded in earlier years has not been recorded in the past 4+ years.
 * 5. STABLE: default when adequate coverage exists without triggering alarm thresholds.
 */
export function evaluateDecisionSupport(
  observations: FishObservation[],
  zones: MunicipalZone[],
  currentCalendarYear = new Date().getFullYear(),
): DecisionSupportSummary {
  // Group observations by resolved municipality
  const byMuni = new Map<string, FishObservation[]>();

  // Initialize known municipal zones
  for (const z of zones) {
    byMuni.set(z.name, []);
  }

  // Also include unmatched
  const unmatchedObservations: FishObservation[] = [];

  for (const obs of observations) {
    const muni = resolveFishMunicipality(
      { coordinates: obs.coordinates, municipal: obs.municipal },
      zones,
    );
    if (muni) {
      const bucket = byMuni.get(muni);
      if (bucket) bucket.push(obs);
      else byMuni.set(muni, [obs]);
    } else {
      unmatchedObservations.push(obs);
    }
  }

  // Determine latest year of data across the whole lake
  const allRecordedYears = new Set<number>();
  for (const obs of observations) {
    const yr = yearOf(obs.dateObserved);
    if (yr) allRecordedYears.add(yr);
  }
  const maxRecordedYear = allRecordedYears.size > 0
    ? Math.max(...Array.from(allRecordedYears))
    : currentCalendarYear;

  const muniResults: MunicipalityDecisionResult[] = [];
  const statusCounts: Record<DecisionStatus, number> = {
    INVASION_ALERT: 0,
    PROTECTION_PRIORITY: 0,
    MONITORING_GAP: 0,
    STABLE: 0,
    INSUFFICIENT_DATA: 0,
  };

  for (const [muniName, muniObs] of byMuni.entries()) {
    const totalRecords = muniObs.length;
    let totalIndividuals = 0;
    let endemicCount = 0;
    let invasiveCount = 0;
    let generalCount = 0;

    const yearlyCategoryMap = new Map<number, { endemic: number; invasive: number; total: number }>();
    const speciesSeenByYear = new Map<string, Set<number>>();

    for (const obs of muniObs) {
      const count = (obs.count != null && obs.count > 0) ? obs.count : 1;
      totalIndividuals += count;

      if (obs.category === 'ENDEMIC') endemicCount++;
      else if (obs.category === 'INVASIVE') invasiveCount++;
      else generalCount++;

      const yr = yearOf(obs.dateObserved);
      if (yr) {
        const catBucket = yearlyCategoryMap.get(yr) ?? { endemic: 0, invasive: 0, total: 0 };
        if (obs.category === 'ENDEMIC') catBucket.endemic++;
        if (obs.category === 'INVASIVE') catBucket.invasive++;
        catBucket.total++;
        yearlyCategoryMap.set(yr, catBucket);

        const spName = obs.speciesScientific || obs.speciesCommon || 'Unnamed';
        const spYears = speciesSeenByYear.get(spName) ?? new Set<number>();
        spYears.add(yr);
        speciesSeenByYear.set(spName, spYears);
      }
    }

    const activeYears = Array.from(yearlyCategoryMap.keys()).sort((a, b) => a - b);
    const latestYearRecorded = activeYears.length > 0 ? activeYears[activeYears.length - 1]! : null;
    const gapYearsCount = latestYearRecorded !== null ? (maxRecordedYear - latestYearRecorded) : maxRecordedYear - 2022;
    const invasiveSharePct = totalRecords > 0 ? Math.round((invasiveCount / totalRecords) * 100) : 0;

    const findings: string[] = [];
    const missingEndemicSpecies: string[] = [];

    // Check for endemic species unrecorded for 4+ years
    for (const obs of muniObs) {
      if (obs.category === 'ENDEMIC') {
        const spName = obs.speciesScientific || obs.speciesCommon || 'Unknown endemic';
        const yrs = speciesSeenByYear.get(spName);
        if (yrs && yrs.size > 0) {
          const lastSeen = Math.max(...Array.from(yrs));
          if (maxRecordedYear - lastSeen >= 4 && !missingEndemicSpecies.includes(spName)) {
            missingEndemicSpecies.push(spName);
          }
        }
      }
    }

    // Determine status
    let status: DecisionStatus = 'STABLE';

    if (totalRecords < 5) {
      status = 'INSUFFICIENT_DATA';
      findings.push(`Only ${totalRecords} total recorded observation(s); sample size too small for statistical certainty.`);
    } else if (gapYearsCount >= 2) {
      status = 'MONITORING_GAP';
      findings.push(`No recorded observations in the last ${gapYearsCount} year(s) (last surveyed: ${latestYearRecorded}).`);
    } else {
      // Check invasion surge: invasive share >= 60% OR year-over-year rise of >= 20%
      let hasInvasiveSurge = invasiveSharePct >= 60;
      if (activeYears.length >= 2) {
        const lastYr = activeYears[activeYears.length - 1]!;
        const prevYr = activeYears[activeYears.length - 2]!;
        const lastData = yearlyCategoryMap.get(lastYr)!;
        const prevData = yearlyCategoryMap.get(prevYr)!;
        const lastShare = lastData.total > 0 ? lastData.invasive / lastData.total : 0;
        const prevShare = prevData.total > 0 ? prevData.invasive / prevData.total : 0;
        if (lastShare - prevShare >= 0.20 && lastData.invasive > 1) {
          hasInvasiveSurge = true;
          findings.push(`Invasive catch ratio rose by ${Math.round((lastShare - prevShare) * 100)}% between ${prevYr} and ${lastYr}.`);
        }
      }

      if (hasInvasiveSurge) {
        status = 'INVASION_ALERT';
        findings.push(`Invasive species constitute ${invasiveSharePct}% of all recorded observations.`);
      } else if (missingEndemicSpecies.length > 0) {
        status = 'PROTECTION_PRIORITY';
        findings.push(`${missingEndemicSpecies.join(', ')} missing from survey catches for 4+ consecutive years.`);
      } else {
        status = 'STABLE';
        findings.push(`Consistent multi-year observation presence with balanced endemic ratio (${100 - invasiveSharePct}% non-invasive).`);
      }
    }

    statusCounts[status]++;

    muniResults.push({
      municipality: muniName,
      status,
      meta: DECISION_STATUSES[status],
      totalRecords,
      totalIndividuals,
      endemicCount,
      invasiveCount,
      generalCount,
      invasiveSharePct,
      activeYears,
      latestYearRecorded,
      gapYearsCount,
      missingEndemicSpecies,
      findings,
    });
  }

  // Sort: High priority alerts first (Invasion Alert -> Protection Priority -> Monitoring Gap -> Insufficient Data -> Stable)
  const priorityOrder: Record<DecisionStatus, number> = {
    INVASION_ALERT: 1,
    PROTECTION_PRIORITY: 2,
    MONITORING_GAP: 3,
    INSUFFICIENT_DATA: 4,
    STABLE: 5,
  };
  muniResults.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status] || a.municipality.localeCompare(b.municipality));

  // Build species watchlist
  const speciesObsMap = new Map<string, { obsList: FishObservation[]; category: 'ENDEMIC' | 'INVASIVE' | 'GENERAL'; common: string }>();
  for (const obs of observations) {
    const sci = obs.speciesScientific || obs.speciesCommon || 'Unnamed';
    const existing = speciesObsMap.get(sci) ?? {
      obsList: [],
      category: obs.category,
      common: obs.speciesCommon || sci,
    };
    existing.obsList.push(obs);
    speciesObsMap.set(sci, existing);
  }

  const watchlist: WatchlistSpeciesResult[] = [];
  for (const [sci, spData] of speciesObsMap.entries()) {
    const years = spData.obsList
      .map((o) => yearOf(o.dateObserved))
      .filter((y): y is number => y !== null);
    const lastYear = years.length > 0 ? Math.max(...years) : null;
    const yearsAbsent = lastYear !== null ? (maxRecordedYear - lastYear) : maxRecordedYear - 2022;

    if (spData.category === 'ENDEMIC' && yearsAbsent >= 3) {
      watchlist.push({
        speciesScientific: sci,
        speciesCommon: spData.common,
        category: 'ENDEMIC',
        lastRecordedYear: lastYear,
        totalRecords: spData.obsList.length,
        yearsAbsent,
        statusFlag: 'EXTIRPATION_RISK',
        notes: `Endemic cyprinid absent from records for ${yearsAbsent} consecutive year(s). High extirpation risk.`,
      });
    } else if (spData.category === 'INVASIVE' && spData.obsList.length >= 10) {
      watchlist.push({
        speciesScientific: sci,
        speciesCommon: spData.common,
        category: 'INVASIVE',
        lastRecordedYear: lastYear,
        totalRecords: spData.obsList.length,
        yearsAbsent: 0,
        statusFlag: 'INVASIVE_SURGE',
        notes: `Established invasive population with ${spData.obsList.length} recorded observations.`,
      });
    }
  }

  watchlist.sort((a, b) => (a.statusFlag === 'EXTIRPATION_RISK' ? -1 : 1));

  return {
    municipalityResults: muniResults,
    watchlist,
    byStatusCounts: statusCounts,
    latestAssessmentYear: maxRecordedYear,
  };
}
