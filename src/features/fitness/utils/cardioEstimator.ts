type CardioType = 'running' | 'cycling' | 'swimming' | 'hiit' | 'walking' | 'elliptical' | 'rowing';
type CardioIntensity = 'low' | 'moderate' | 'high';

const MET_TABLE: Record<CardioType, Record<CardioIntensity, number>> = {
  running:    { low: 7.0,  moderate: 9.8,  high: 12.8 },
  cycling:    { low: 4.0,  moderate: 6.8,  high: 10.0 },
  swimming:   { low: 4.8,  moderate: 7.0,  high: 9.8 },
  hiit:       { low: 6.0,  moderate: 8.0,  high: 12.0 },
  walking:    { low: 2.5,  moderate: 3.5,  high: 5.0 },
  elliptical: { low: 4.0,  moderate: 5.0,  high: 7.5 },
  rowing:     { low: 4.8,  moderate: 7.0,  high: 10.5 },
};

export function estimateCardioBurn(
  type: CardioType,
  durationMin: number,
  intensity: CardioIntensity,
  weightKg: number,
): number {
  if (!Number.isFinite(durationMin) || durationMin <= 0) return 0;
  const met = MET_TABLE[type][intensity];
  return Math.round(durationMin * met * weightKg / 60);
}

export function getMETValue(type: CardioType, intensity: CardioIntensity): number {
  return MET_TABLE[type][intensity];
}

export { MET_TABLE };
export type { CardioType, CardioIntensity };
