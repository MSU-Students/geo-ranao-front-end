export interface WaterRegion {
  name: string;
  area: number; // in square kilometers
  depth: number; // in meters
  waterQuality: 'Good' | 'Moderate' | 'Poor';
}
