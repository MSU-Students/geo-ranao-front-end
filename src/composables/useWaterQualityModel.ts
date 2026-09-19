// Shared water-quality parameter definitions, status thresholds, and a
// deterministic monthly reading simulator — no real monthly dataset exists
// yet, so figures shown against this model must stay clearly labeled as
// simulated until a real data source is wired in.

export type StatusLevel = 'good' | 'warning' | 'serious' | 'critical';

// Reserved status palette — never reused for categorical series, always
// paired with an icon/label (never color alone).
export const STATUS_COLORS: Record<StatusLevel, string> = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};
export const STATUS_LABELS: Record<StatusLevel, string> = {
  good: 'Good',
  warning: 'Warning',
  serious: 'Serious',
  critical: 'Critical',
};
export const STATUS_LEVELS: StatusLevel[] = ['good', 'warning', 'serious', 'critical'];

// For parameters where higher = worse (pollutant/nutrient loading).
function ascendingStatus(
  value: number,
  goodMax: number,
  warningMax: number,
  seriousMax: number,
): StatusLevel {
  if (value <= goodMax) return 'good';
  if (value <= warningMax) return 'warning';
  if (value <= seriousMax) return 'serious';
  return 'critical';
}

// For parameters with an ideal middle band (both extremes are bad).
function centeredStatus(
  value: number,
  goodLo: number,
  goodHi: number,
  warningLo: number,
  warningHi: number,
  seriousLo: number,
  seriousHi: number,
): StatusLevel {
  if (value >= goodLo && value <= goodHi) return 'good';
  if (value >= warningLo && value <= warningHi) return 'warning';
  if (value >= seriousLo && value <= seriousHi) return 'serious';
  return 'critical';
}

// For parameters where lower = worse (depletion is the danger — e.g. dissolved oxygen).
function descendingStatus(
  value: number,
  goodMin: number,
  warningMin: number,
  seriousMin: number,
): StatusLevel {
  if (value >= goodMin) return 'good';
  if (value >= warningMin) return 'warning';
  if (value >= seriousMin) return 'serious';
  return 'critical';
}

// ─── DENR WATER QUALITY CLASSIFICATION (A / B / C) ───
// The regulatory "limitation" a reading is judged against — distinct from
// min/max below, which stay a much wider *sensor-plausibility* range used
// only for data-entry-mistake warnings and simulator bounds. Class C is the
// default everywhere a caller doesn't pick one (freshwater/fishery
// protection — the most relevant class for this platform's purpose).
export type WaterQualityClass = 'A' | 'B' | 'C';
export const WATER_QUALITY_CLASSES: WaterQualityClass[] = ['A', 'B', 'C'];
export const DEFAULT_WATER_QUALITY_CLASS: WaterQualityClass = 'C';
export const WATER_QUALITY_CLASS_LABELS: Record<WaterQualityClass, string> = {
  A: 'Class A',
  B: 'Class B',
  C: 'Class C',
};

// One class's limit for one parameter — 'max'/'min' are one-sided ("must not
// exceed" / "must not fall below"), 'range' is two-sided (e.g. temperature,
// pH). null means the source table left that class blank for this parameter.
export type ParamLimit =
  | { kind: 'max'; value: number }
  | { kind: 'min'; value: number }
  | { kind: 'range'; min: number; max: number }
  | null;

export type ClassLimits = Record<WaterQualityClass, ParamLimit>;

function maxLimit(value: number): ParamLimit {
  return { kind: 'max', value };
}
function minLimit(value: number): ParamLimit {
  return { kind: 'min', value };
}
function rangeLimit(min: number, max: number): ParamLimit {
  return { kind: 'range', min, max };
}

// A class left blank in the source table falls back to the nearest class
// that does define a limit, preferring the stricter/more-protective classes
// first (C, then B, then A) — never silently invented, always a real class's
// real number.
const LIMIT_FALLBACK_ORDER: WaterQualityClass[] = ['C', 'B', 'A'];
function resolveClassLimit(classLimits: ClassLimits, waterClass: WaterQualityClass): ParamLimit {
  if (classLimits[waterClass]) return classLimits[waterClass];
  for (const fallback of LIMIT_FALLBACK_ORDER) {
    if (classLimits[fallback]) return classLimits[fallback];
  }
  return null;
}

// Turns one class's limit into the same 3-tier boundaries
// ascending/centered/descendingStatus already expect, so the regulatory
// number becomes the *edge* of "Critical" (or the center of the acceptable
// band for range-type limits) and Good/Warning/Serious are graduated
// fractions inward from it — same visual language as before, now driven by
// the selected class instead of hand-picked constants.
const GOOD_FRACTION = 0.6;
const WARNING_FRACTION = 0.85;
const RANGE_BUFFER_FRACTION = 0.15; // per tier, as a fraction of the acceptable range's width

function statusFromLimit(value: number, limit: ParamLimit): StatusLevel {
  if (!limit) return 'good'; // no class defines this parameter at all — nothing to judge against
  if (limit.kind === 'max') {
    return ascendingStatus(value, limit.value * GOOD_FRACTION, limit.value * WARNING_FRACTION, limit.value);
  }
  if (limit.kind === 'min') {
    return descendingStatus(value, limit.value, limit.value * WARNING_FRACTION, limit.value * GOOD_FRACTION);
  }
  const width = limit.max - limit.min;
  const buffer = width * RANGE_BUFFER_FRACTION;
  return centeredStatus(
    value,
    limit.min,
    limit.max,
    limit.min - buffer,
    limit.max + buffer,
    limit.min - buffer * 2,
    limit.max + buffer * 2,
  );
}

// Builds a getStatus() for a parameter that has real classification data —
// captures classLimits via closure so each param's getStatus stays a plain
// (value, waterClass?) => StatusLevel function, consistent with parameters
// that don't have classification data (e.g. Turbidity) and just ignore the
// second argument.
function classBasedStatus(classLimits: ClassLimits) {
  return (value: number, waterClass: WaterQualityClass = DEFAULT_WATER_QUALITY_CLASS): StatusLevel =>
    statusFromLimit(value, resolveClassLimit(classLimits, waterClass));
}

export interface WaterQualityParam {
  key: string;
  label: string;
  unit: string;
  /** Wide sensor-plausibility bounds — data-quality warnings and the simulator, NOT the regulatory limit. */
  min: number;
  max: number;
  decimals: number;
  /** Realistic baseline reading (within the "good" band) that simulated values cluster around. */
  typical: number;
  /** Fallback single-value reference line for parameters with no classLimits (e.g. Turbidity). */
  guideline?: number;
  /** DENR Class A/B/C regulatory limitation, per class — absent for parameters the source table doesn't cover. */
  classLimits?: ClassLimits;
  getStatus: (value: number, waterClass?: WaterQualityClass) => StatusLevel;
}

// Human-readable form of a parameter's regulatory limit for the selected
// class — "Normal Range" columns, tooltips, etc. Falls back to the old
// sensor-plausibility min–max for parameters with no classLimits.
export function formatClassLimit(param: WaterQualityParam, waterClass: WaterQualityClass = DEFAULT_WATER_QUALITY_CLASS): string {
  const unit = param.unit ? ` ${param.unit}` : '';
  if (!param.classLimits) return `${param.min}–${param.max}${unit}`;
  const limit = resolveClassLimit(param.classLimits, waterClass);
  if (!limit) return 'Not specified';
  if (limit.kind === 'max') return `≤ ${limit.value}${unit}`;
  if (limit.kind === 'min') return `≥ ${limit.value}${unit}`;
  return `${limit.min}–${limit.max}${unit}`;
}

// Single-number reference for a chart's guideline line — the upper bound
// for range-type limits, since a two-sided band can't be drawn as one line.
// Falls back to the old static `guideline` for parameters with no classLimits.
export function getClassLimitReferenceValue(
  param: WaterQualityParam,
  waterClass: WaterQualityClass = DEFAULT_WATER_QUALITY_CLASS,
): number | undefined {
  if (!param.classLimits) return param.guideline;
  const limit = resolveClassLimit(param.classLimits, waterClass);
  if (!limit) return undefined;
  return limit.kind === 'range' ? limit.max : limit.value;
}

export interface WaterQualityParamGroup {
  title: string;
  icon: string;
  color: string;
  params: WaterQualityParam[];
}

export const waterQualityParameterGroups: WaterQualityParamGroup[] = [
  {
    title: 'Physico-Chemical',
    icon: 'science',
    color: 'teal-8',
    params: [
      {
        key: 'temperature', label: 'Temperature', unit: '°C', min: 24, max: 30, decimals: 1, typical: 26.5,
        // DENR classification: A 26–30, B 26–30, C 25–31
        classLimits: { A: rangeLimit(26, 30), B: rangeLimit(26, 30), C: rangeLimit(25, 31) },
        getStatus: classBasedStatus({ A: rangeLimit(26, 30), B: rangeLimit(26, 30), C: rangeLimit(25, 31) }),
      },
      {
        key: 'ph', label: 'pH', unit: '', min: 6.5, max: 8.5, decimals: 1, typical: 7.3,
        // DENR classification: A 6.5–8.5, B 6.5–8.5, C 6.0–9.0
        classLimits: { A: rangeLimit(6.5, 8.5), B: rangeLimit(6.5, 8.5), C: rangeLimit(6.0, 9.0) },
        getStatus: classBasedStatus({ A: rangeLimit(6.5, 8.5), B: rangeLimit(6.5, 8.5), C: rangeLimit(6.0, 9.0) }),
      },
      {
        key: 'turbidity', label: 'Turbidity', unit: 'NTU', min: 2, max: 25, decimals: 1, typical: 4,
        // Not covered by the DENR classification table the client supplied — kept on its own fixed thresholds.
        guideline: 6,
        getStatus: (v) => ascendingStatus(v, 6, 11, 17),
      },
      {
        key: 'dissolvedOxygen', label: 'Dissolved Oxygen', unit: 'ppm', min: 1, max: 10, decimals: 1, typical: 7,
        // DENR classification (minimum required): A 5, B 5, C 5
        classLimits: { A: minLimit(5), B: minLimit(5), C: minLimit(5) },
        getStatus: classBasedStatus({ A: minLimit(5), B: minLimit(5), C: minLimit(5) }),
      },
      {
        key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 100, max: 400, decimals: 0, typical: 140,
        // DENR classification: A ≤1000, B acceptable band 150–500, C not specified (falls back to B)
        classLimits: { A: maxLimit(1000), B: rangeLimit(150, 500), C: null },
        getStatus: classBasedStatus({ A: maxLimit(1000), B: rangeLimit(150, 500), C: null }),
      },
      {
        key: 'tds', label: 'TDS', unit: 'mg/L', min: 50, max: 250, decimals: 0, typical: 75,
        // DENR classification: A ≤500, B not specified (falls back to C), C ≤400
        classLimits: { A: maxLimit(500), B: null, C: maxLimit(400) },
        getStatus: classBasedStatus({ A: maxLimit(500), B: null, C: maxLimit(400) }),
      },
      {
        key: 'tss', label: 'TSS', unit: 'mg/L', min: 5, max: 40, decimals: 1, typical: 8,
        // DENR classification: A ≤50, B ≤65, C ≤80
        classLimits: { A: maxLimit(50), B: maxLimit(65), C: maxLimit(80) },
        getStatus: classBasedStatus({ A: maxLimit(50), B: maxLimit(65), C: maxLimit(80) }),
      },
    ],
  },
  {
    title: 'Nutrients',
    icon: 'grain',
    color: 'blue-8',
    params: [
      {
        key: 'phosphate', label: 'Phosphate', unit: 'mg/L', min: 0.01, max: 0.5, decimals: 2, typical: 0.05,
        // DENR classification: A ≤0.025, B ≤0.025, C ≤0.025
        classLimits: { A: maxLimit(0.025), B: maxLimit(0.025), C: maxLimit(0.025) },
        getStatus: classBasedStatus({ A: maxLimit(0.025), B: maxLimit(0.025), C: maxLimit(0.025) }),
      },
      {
        key: 'ammonia', label: 'Ammonia', unit: 'mg/L', min: 0.01, max: 0.3, decimals: 2, typical: 0.025,
        // DENR classification: A ≤0.06, B ≤0.06, C ≤0.06
        classLimits: { A: maxLimit(0.06), B: maxLimit(0.06), C: maxLimit(0.06) },
        getStatus: classBasedStatus({ A: maxLimit(0.06), B: maxLimit(0.06), C: maxLimit(0.06) }),
      },
      {
        key: 'nitrate', label: 'Nitrate', unit: 'mg/L', min: 0.1, max: 2, decimals: 2, typical: 0.25,
        // DENR classification: A ≤7, B ≤7, C ≤7
        classLimits: { A: maxLimit(7), B: maxLimit(7), C: maxLimit(7) },
        getStatus: classBasedStatus({ A: maxLimit(7), B: maxLimit(7), C: maxLimit(7) }),
      },
      {
        key: 'nitrite', label: 'Nitrite', unit: 'mg/L', min: 0.01, max: 0.1, decimals: 3, typical: 0.015,
        // DENR classification: A ≤1, B ≤1, C ≤0 (Class C requires none detectable)
        classLimits: { A: maxLimit(1), B: maxLimit(1), C: maxLimit(0) },
        getStatus: classBasedStatus({ A: maxLimit(1), B: maxLimit(1), C: maxLimit(0) }),
      },
      {
        key: 'sulfate', label: 'Sulfate', unit: 'mg/L', min: 5, max: 50, decimals: 1, typical: 10,
        // DENR classification: A ≤0.5, B ≤0.5, C ≤0.75
        classLimits: { A: maxLimit(0.5), B: maxLimit(0.5), C: maxLimit(0.75) },
        getStatus: classBasedStatus({ A: maxLimit(0.5), B: maxLimit(0.5), C: maxLimit(0.75) }),
      },
    ],
  },
  {
    title: 'Photosynthetic Pigment',
    icon: 'eco',
    color: 'green-8',
    params: [
      {
        key: 'chlorophyll', label: 'Chlorophyll-a', unit: 'µg/L', min: 1, max: 15, decimals: 2, typical: 2.5,
        // DENR classification: A ≤10, B ≤25, C ≤40
        classLimits: { A: maxLimit(10), B: maxLimit(25), C: maxLimit(40) },
        getStatus: classBasedStatus({ A: maxLimit(10), B: maxLimit(25), C: maxLimit(40) }),
      },
    ],
  },
];

export const allWaterQualityParams: WaterQualityParam[] = waterQualityParameterGroups.flatMap(
  (g) => g.params,
);

// The 6 fixed tributary rivers being sampled — unlike the 24 lake sites,
// these are always read at Surface only (no depth variation), per the real
// sampling protocol for tributaries.
export interface TributaryRiverSite {
  siteId: string;
  lat: number;
  lng: number;
}

export const TRIBUTARY_RIVER_SITES: TributaryRiverSite[] = [
  { siteId: 'Masiu Tail (Sawir)', lat: 7.787944, lng: 124.323028 },
  { siteId: 'Masiu River', lat: 7.816861, lng: 124.329611 },
  { siteId: 'Taraka River', lat: 7.885528, lng: 124.344472 },
  { siteId: 'Poona Bayabao River', lat: 7.85075, lng: 124.340306 },
  { siteId: 'Ditsaan Ramain River', lat: 7.979417, lng: 124.354639 },
  { siteId: 'Marawi City (Outlet) River', lat: 8.002806, lng: 124.291639 },
];

export const TRIBUTARY_RIVER_SITE_IDS = new Set(TRIBUTARY_RIVER_SITES.map((r) => r.siteId));

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Reading Period now picks a year, then a month within that year (Jan–Dec) —
// the year list starts at 2025, runs through at least 2030, and keeps
// extending one year past whatever year it currently is after that.
export const READING_START_YEAR = 2025;
const READING_END_YEAR = Math.max(2030, new Date().getFullYear() + 1);
export const READING_YEARS: number[] = [];
for (let y = READING_START_YEAR; y <= READING_END_YEAR; y++) READING_YEARS.push(y);

// Flat Jan-2025..Dec-<latest> timeline — index = (year - READING_START_YEAR) * 12 + monthInYear.
export const months = READING_YEARS.flatMap((year) => MONTH_NAMES.map((m) => `${m} ${year}`));

// Deterministic pseudo-random in [0, 1), seeded by string so the same
// site + month + parameter always yields the same simulated reading.
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

// Clusters around each parameter's realistic "typical" baseline rather than
// spreading uniformly across the full sensor range — real readings are mostly
// normal with occasional excursions, not evenly distributed across min..max.
// depthM defaults to 0 (surface) so every existing call site keeps behaving
// exactly as before unless it opts into a specific depth.
export function generateReading(
  siteId: string,
  monthIndex: number,
  param: WaterQualityParam,
  depthM = 0,
): number {
  const seed = `${siteId}|${monthIndex}|${param.key}`;
  const noise = seededRandom(seed + '|noise') * 2 - 1; // -1..1
  const isExcursion = seededRandom(seed + '|excursion') < 0.18;
  const range = param.max - param.min;
  const spread = isExcursion ? range * 0.55 : range * 0.16;
  const surfaceValue = param.typical + noise * spread;
  const value = applyDepthEffect(surfaceValue, depthM, param, siteId);
  return Math.min(Math.max(value, param.min), param.max);
}

export function formatReading(value: number, param: WaterQualityParam): string {
  return `${value.toFixed(param.decimals)}${param.unit ? ' ' + param.unit : ''}`;
}

// ─── DATA QUALITY WARNINGS ───
// A value outside a parameter's expected min–max range is very likely a
// data-entry mistake or sensor fault rather than a real Lake Lanao reading —
// flagged for a human to look at during review, never silently dropped or
// auto-rejected. Shared by the bulk-upload parser and the admin review table
// so "unusual" means the same thing in both places.
export function getParamWarning(param: WaterQualityParam, value: number): string | null {
  if (value < param.min || value > param.max) {
    return `${param.label} (${value}${param.unit}) is outside the expected range ${param.min}–${param.max}${param.unit}`;
  }
  return null;
}

export function getReadingWarnings(values: Partial<Record<string, number>>): string[] {
  const warnings: string[] = [];
  for (const param of allWaterQualityParams) {
    const value = values[param.key];
    if (value === undefined) continue;
    const warning = getParamWarning(param, value);
    if (warning) warnings.push(warning);
  }
  return warnings;
}

// ─── DEPTH MODEL ───
// The client's real field sampling uses these fixed depths (matches the
// "SURFACE / 5m / 10m / .../ 100m" convention in the actual data template),
// not an arbitrary continuous profile.
export const DEPTHS = [0, 5, 10, 15, 20, 40, 60, 80, 100];
export function depthLabel(depthM: number): string {
  return depthM === 0 ? 'Surface' : `${depthM}m`;
}
export const DEPTH_OPTIONS = DEPTHS.map((d) => ({ label: depthLabel(d), value: d }));

// Direction + how much of a parameter's full min–max range it plausibly
// drifts between the surface and deep water, based on typical lake
// stratification behavior. Positive direction = increases with depth
// (e.g. nutrients released by decomposition in the hypolimnion), negative =
// decreases with depth (e.g. light- or oxygen-dependent parameters).
const DEPTH_TREND: Record<string, { direction: 1 | -1; sensitivity: number }> = {
  temperature: { direction: -1, sensitivity: 0.55 },
  ph: { direction: -1, sensitivity: 0.15 },
  turbidity: { direction: -1, sensitivity: 0.35 },
  dissolvedOxygen: { direction: -1, sensitivity: 0.75 },
  conductivity: { direction: 1, sensitivity: 0.25 },
  tds: { direction: 1, sensitivity: 0.25 },
  tss: { direction: 1, sensitivity: 0.2 },
  phosphate: { direction: 1, sensitivity: 0.6 },
  ammonia: { direction: 1, sensitivity: 0.65 },
  nitrate: { direction: -1, sensitivity: 0.4 },
  nitrite: { direction: 1, sensitivity: 0.3 },
  sulfate: { direction: 1, sensitivity: 0.2 },
  chlorophyll: { direction: -1, sensitivity: 0.8 },
};

// Logistic transition centered on a per-site thermocline depth — gentle in
// the mixed epilimnion, steep through the thermocline, gentle again below it.
// Reused for every parameter so the whole lake shares one physically
// plausible stratification shape rather than an independent curve per param.
function applyDepthEffect(
  surfaceValue: number,
  depthM: number,
  param: WaterQualityParam,
  siteId: string,
): number {
  if (depthM <= 0) return surfaceValue;
  const trend = DEPTH_TREND[param.key];
  if (!trend) return surfaceValue;
  const thermoclineDepth = 8 + seededRandom(`${siteId}|thermocline`) * 8; // 8–16m
  const curve = 1 / (1 + Math.exp(-(depthM - thermoclineDepth) / 6));
  const range = param.max - param.min;
  const shift = trend.direction * trend.sensitivity * range * curve;
  const jitter = (seededRandom(`${siteId}|${depthM}|${param.key}|jitter`) * 2 - 1) * range * 0.03;
  return surfaceValue + shift + jitter;
}

export interface DepthReadingPoint {
  depth: number;
  value: number;
}

// Vertical profile for one parameter across the 9 canonical field-sampling
// depths, built from the same generateReading() every other chart uses — so
// the profile always matches whatever the rest of the dashboard shows.
export function generateDepthProfile(
  siteId: string,
  monthIndex: number,
  param: WaterQualityParam,
): DepthReadingPoint[] {
  return DEPTHS.map((depth) => ({
    depth,
    value: generateReading(siteId, monthIndex, param, depth),
  }));
}
