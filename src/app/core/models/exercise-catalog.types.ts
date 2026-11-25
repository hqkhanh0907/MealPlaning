export type SourceFrame = 'start' | 'mid' | 'end' | 'hold';

export interface SourceCatalogVariant {
  id: string;
  name: string;
  difference?: string;
}

export interface SourceCatalogEntry {
  id: string;
  name: string;
  aliases: readonly string[];
  variants: readonly SourceCatalogVariant[];
  equipment: readonly string[];
  equipmentLabel: string | null;
  primaryMuscles: readonly string[];
  secondaryMuscles: readonly string[];
  movementPattern: string;
  category: string;
  unilateral: boolean;
  frames: readonly SourceFrame[];
  width: number;
  height: number;
}
