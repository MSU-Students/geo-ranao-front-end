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

export interface WaterQualityParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  decimals: number;
  /** Realistic baseline reading (within the "good" band) that simulated values cluster around. */
  typical: number;
  /** Approximate DENR freshwater guideline value, for reference lines on trend charts — omitted for two-sided ("centered") parameters where a single line doesn't apply. */
  guideline?: number;
  getStatus: (value: number) => StatusLevel;
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
        getStatus: (v) => centeredStatus(v, 25.5, 27.5, 24.5, 28.5, 24, 29.5),
      },
      {
        key: 'ph', label: 'pH', unit: '', min: 6.5, max: 8.5, decimals: 1, typical: 7.3,
        getStatus: (v) => centeredStatus(v, 7.0, 7.6, 6.8, 7.9, 6.6, 8.2),
      },
      {
        key: 'turbidity', label: 'Turbidity', unit: 'NTU', min: 2, max: 25, decimals: 1, typical: 4,
        guideline: 6,
        getStatus: (v) => ascendingStatus(v, 6, 11, 17),
      },
      {
        key: 'dissolvedOxygen', label: 'Dissolved Oxygen', unit: 'ppm', min: 1, max: 10, decimals: 1, typical: 7,
        guideline: 5,
        getStatus: (v) => descendingStatus(v, 6, 5, 3),
      },
      {
        key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', min: 100, max: 400, decimals: 0, typical: 140,
        getStatus: (v) => ascendingStatus(v, 175, 250, 325),
      },
      {
        key: 'tds', label: 'TDS', unit: 'mg/L', min: 50, max: 250, decimals: 0, typical: 75,
        getStatus: (v) => ascendingStatus(v, 100, 150, 200),
      },
      {
        key: 'tss', label: 'TSS', unit: 'mg/L', min: 5, max: 40, decimals: 1, typical: 8,
        getStatus: (v) => ascendingStatus(v, 12, 20, 30),
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
        guideline: 0.08,
        getStatus: (v) => ascendingStatus(v, 0.08, 0.18, 0.32),
      },
      {
        key: 'ammonia', label: 'Ammonia', unit: 'mg/L', min: 0.01, max: 0.3, decimals: 2, typical: 0.025,
        guideline: 0.04,
        getStatus: (v) => ascendingStatus(v, 0.04, 0.1, 0.18),
      },
      {
        key: 'nitrate', label: 'Nitrate', unit: 'mg/L', min: 0.1, max: 2, decimals: 2, typical: 0.25,
        guideline: 0.4,
        getStatus: (v) => ascendingStatus(v, 0.4, 0.9, 1.4),
      },
      {
        key: 'nitrite', label: 'Nitrite', unit: 'mg/L', min: 0.01, max: 0.1, decimals: 3, typical: 0.015,
        getStatus: (v) => ascendingStatus(v, 0.025, 0.045, 0.07),
      },
      {
        key: 'sulfate', label: 'Sulfate', unit: 'mg/L', min: 5, max: 50, decimals: 1, typical: 10,
        getStatus: (v) => ascendingStatus(v, 15, 27, 38),
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
        guideline: 4,
        getStatus: (v) => ascendingStatus(v, 4, 8, 11),
      },
    ],
  },
];

export const allWaterQualityParams: WaterQualityParam[] = waterQualityParameterGroups.flatMap(
  (g) => g.params,
);

export const months = [
  'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025',
  'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026',
];

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
