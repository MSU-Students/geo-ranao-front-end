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

export interface WaterQualityParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  decimals: number;
  /** Realistic baseline reading (within the "good" band) that simulated values cluster around. */
  typical: number;
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
        getStatus: (v) => ascendingStatus(v, 6, 11, 17),
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
        getStatus: (v) => ascendingStatus(v, 0.08, 0.18, 0.32),
      },
      {
        key: 'ammonia', label: 'Ammonia', unit: 'mg/L', min: 0.01, max: 0.3, decimals: 2, typical: 0.025,
        getStatus: (v) => ascendingStatus(v, 0.04, 0.1, 0.18),
      },
      {
        key: 'nitrate', label: 'Nitrate', unit: 'mg/L', min: 0.1, max: 2, decimals: 2, typical: 0.25,
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
export function generateReading(siteId: string, monthIndex: number, param: WaterQualityParam): number {
  const seed = `${siteId}|${monthIndex}|${param.key}`;
  const noise = seededRandom(seed + '|noise') * 2 - 1; // -1..1
  const isExcursion = seededRandom(seed + '|excursion') < 0.18;
  const range = param.max - param.min;
  const spread = isExcursion ? range * 0.55 : range * 0.16;
  const value = param.typical + noise * spread;
  return Math.min(Math.max(value, param.min), param.max);
}

export function formatReading(value: number, param: WaterQualityParam): string {
  return `${value.toFixed(param.decimals)}${param.unit ? ' ' + param.unit : ''}`;
}
