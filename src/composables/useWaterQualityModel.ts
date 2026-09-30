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

// ─── DENR WATER QUALITY CLASSIFICATION ───
// This platform judges every reading against a single regulatory limitation
// — DENR Class C (freshwater/fishery protection) — rather than offering a
// choice of Class A/B/C. The three-tier picker was more complexity than the
// standardization needed to convey, and Class C is the class the source
// limitation table covers most completely. Distinct from min/max below,
// which stay a much wider *sensor-plausibility* range used only for
// data-entry-mistake warnings and simulator bounds.
export const WATER_QUALITY_CLASS_LABEL = 'Class C';

// One parameter's regulatory limit — 'max'/'min' are one-sided ("must not
// exceed" / "must not fall below"), 'range' is two-sided (e.g. temperature,
// pH). null means the source table doesn't cover this parameter at all.
export type ParamLimit =
  | { kind: 'max'; value: number }
  | { kind: 'min'; value: number }
  | { kind: 'range'; min: number; max: number }
  | null;

function maxLimit(value: number): ParamLimit {
  return { kind: 'max', value };
}
function minLimit(value: number): ParamLimit {
  return { kind: 'min', value };
}
function rangeLimit(min: number, max: number): ParamLimit {
  return { kind: 'range', min, max };
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
  if (!limit) return 'good'; // this parameter has no regulatory limit at all — nothing to judge against
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

// Builds a getStatus() for a parameter that has a real regulatory limit —
// captures it via closure so each param's getStatus stays a plain
// (value) => StatusLevel function, consistent with parameters that have no
// limit at all (e.g. Turbidity, judged on its own fixed thresholds instead).
function classBasedStatus(limit: ParamLimit) {
  return (value: number): StatusLevel => statusFromLimit(value, limit);
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
  /** Fallback single-value reference line for parameters with no `limit` (e.g. Turbidity). */
  guideline?: number;
  /** 0 is a legitimate "non-detect" reading for this parameter, not a sensor fault — skip the out-of-range warning for it even though it's below `min`. */
  allowZero?: boolean;
  /** DENR Class C regulatory limitation — absent for parameters the source table doesn't cover. */
  limit?: ParamLimit;
  getStatus: (value: number) => StatusLevel;
}

// Human-readable form of a parameter's regulatory limit — "Normal Range"
// columns, tooltips, etc. Falls back to the sensor-plausibility min–max for
// parameters with no `limit`.
export function formatClassLimit(param: WaterQualityParam): string {
  const unit = param.unit ? ` ${param.unit}` : '';
  if (!param.limit) return `${param.min}–${param.max}${unit}`;
  const limit = param.limit;
  if (limit.kind === 'max') return `≤ ${limit.value}${unit}`;
  if (limit.kind === 'min') return `≥ ${limit.value}${unit}`;
  return `${limit.min}–${limit.max}${unit}`;
}

// Single-number reference for a chart's guideline line — the upper bound
// for range-type limits, since a two-sided band can't be drawn as one line.
// Falls back to the static `guideline` for parameters with no `limit`.
export function getClassLimitReferenceValue(param: WaterQualityParam): number | undefined {
  if (!param.limit) return param.guideline;
  return param.limit.kind === 'range' ? param.limit.max : param.limit.value;
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
        // DENR Class C limit: 25–31°C
        limit: rangeLimit(25, 31),
        getStatus: classBasedStatus(rangeLimit(25, 31)),
      },
      {
        key: 'ph', label: 'pH', unit: '', min: 6.5, max: 8.5, decimals: 1, typical: 7.3,
        // DENR Class C limit: 6.0–9.0
        limit: rangeLimit(6.0, 9.0),
        getStatus: classBasedStatus(rangeLimit(6.0, 9.0)),
      },
      {
        key: 'turbidity', label: 'Turbidity', unit: 'NTU', min: 2, max: 25, decimals: 1, typical: 4,
        // Not covered by the DENR classification table the client supplied — kept on its own fixed thresholds.
        guideline: 6,
        getStatus: (v) => ascendingStatus(v, 6, 11, 17),
      },
      {
        key: 'dissolvedOxygen', label: 'Dissolved Oxygen', unit: 'ppm', min: 1, max: 10, decimals: 1, typical: 7,
        // DENR Class C limit (minimum required): 5 ppm
        limit: minLimit(5),
        getStatus: classBasedStatus(minLimit(5)),
      },
      {
        key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 100, max: 400, decimals: 0, typical: 140,
        // DENR leaves Class C blank for conductivity — this platform used to
        // fall back to Class B's acceptable band (150–500) for it, and keeps
        // doing so here (just without the A/B/C picker) rather than silently
        // going unjudged, which dropping it outright would do.
        limit: rangeLimit(150, 500),
        getStatus: classBasedStatus(rangeLimit(150, 500)),
      },
      {
        key: 'tds', label: 'TDS', unit: 'mg/L', min: 50, max: 250, decimals: 0, typical: 75,
        // DENR Class C limit: ≤400 mg/L
        limit: maxLimit(400),
        getStatus: classBasedStatus(maxLimit(400)),
      },
      {
        key: 'tss', label: 'TSS', unit: 'mg/L', min: 5, max: 40, decimals: 1, typical: 8,
        // DENR Class C limit: ≤80 mg/L
        limit: maxLimit(80),
        getStatus: classBasedStatus(maxLimit(80)),
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
        allowZero: true,
        // DENR Class C limit: ≤0.025 mg/L
        limit: maxLimit(0.025),
        getStatus: classBasedStatus(maxLimit(0.025)),
      },
      {
        key: 'ammonia', label: 'Ammonia', unit: 'mg/L', min: 0.01, max: 0.3, decimals: 2, typical: 0.025,
        allowZero: true,
        // DENR Class C limit: ≤0.06 mg/L
        limit: maxLimit(0.06),
        getStatus: classBasedStatus(maxLimit(0.06)),
      },
      {
        key: 'nitrate', label: 'Nitrate', unit: 'mg/L', min: 0.1, max: 2, decimals: 2, typical: 0.25,
        allowZero: true,
        // DENR Class C limit: ≤7 mg/L
        limit: maxLimit(7),
        getStatus: classBasedStatus(maxLimit(7)),
      },
      {
        key: 'nitrite', label: 'Nitrite', unit: 'mg/L', min: 0.01, max: 0.1, decimals: 3, typical: 0.015,
        allowZero: true,
        // DENR Class C limit: none detectable
        limit: maxLimit(0),
        getStatus: classBasedStatus(maxLimit(0)),
      },
      {
        key: 'sulfate', label: 'Sulfate', unit: 'mg/L', min: 5, max: 50, decimals: 1, typical: 10,
        // DENR Class C limit: ≤0.75 mg/L
        limit: maxLimit(0.75),
        getStatus: classBasedStatus(maxLimit(0.75)),
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
        // DENR Class C limit: ≤40 µg/L
        limit: maxLimit(40),
        getStatus: classBasedStatus(maxLimit(40)),
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

// Reading Period picks a year, then a month within that year (Jan–Dec).
// READING_YEARS/months are grown in place (never reassigned) rather than
// precomputed to some fixed end year — the YearPicker component calls
// ensureReadingYearsCoverage() as soon as it lets someone pick a year beyond
// what's already generated, so the year range has no real upper bound
// without needing to precompute an arbitrarily long list up front. Existing
// imports of READING_YEARS/months keep working unchanged, since both stay
// the same array reference — they just get longer over time.
export const READING_START_YEAR = 2025;
export const READING_YEARS: number[] = [];
// Flat Jan-2025..Dec-<latest> timeline — index = (year - READING_START_YEAR) * 12 + monthInYear.
export const months: string[] = [];

export function ensureReadingYearsCoverage(uptoYear: number): void {
  let lastYear = READING_YEARS.length ? READING_YEARS[READING_YEARS.length - 1]! : READING_START_YEAR - 1;
  while (lastYear < uptoYear) {
    lastYear += 1;
    READING_YEARS.push(lastYear);
    MONTH_NAMES.forEach((m) => months.push(`${m} ${lastYear}`));
  }
}

// Seed a reasonable initial range so every existing call site has data to
// read before anyone opens the year picker.
ensureReadingYearsCoverage(new Date().getFullYear() + 10);

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
  if (value === 0 && param.allowZero) return null;
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
