import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';

import { translateWorkoutType } from '@/features/fitness/utils/translateWorkoutType';

describe('translateWorkoutType', () => {
  const translations: Record<string, string> = {
    'fitness.workoutType.Push': 'Đẩy',
    'fitness.workoutType.Pull': 'Kéo',
    'fitness.workoutType.Legs': 'Chân',
    'fitness.workoutType.Upper': 'Thân trên',
    'fitness.workoutType.Lower': 'Thân dưới',
    'fitness.workoutType.Full Body A': 'Toàn thân A',
  };
  const mockT = vi.fn((key: string, opts?: Record<string, string>) => {
    return translations[key] ?? opts?.defaultValue ?? '';
  }) as unknown as TFunction;

  it('translates exact match', () => {
    expect(translateWorkoutType(mockT, 'Push')).toBe('Đẩy');
    expect(translateWorkoutType(mockT, 'Pull')).toBe('Kéo');
    expect(translateWorkoutType(mockT, 'Legs')).toBe('Chân');
  });

  it('translates numbered variants by parsing base label', () => {
    expect(translateWorkoutType(mockT, 'Push 3')).toBe('Đẩy 3');
    expect(translateWorkoutType(mockT, 'Pull 3')).toBe('Kéo 3');
    expect(translateWorkoutType(mockT, 'Legs 4')).toBe('Chân 4');
  });

  it('translates multi-word base with number', () => {
    expect(translateWorkoutType(mockT, 'Full Body A 3')).toBe('Toàn thân A 3');
    expect(translateWorkoutType(mockT, 'Upper 3')).toBe('Thân trên 3');
    expect(translateWorkoutType(mockT, 'Lower 4')).toBe('Thân dưới 4');
  });

  it('returns raw label when no translation exists', () => {
    expect(translateWorkoutType(mockT, 'Unknown')).toBe('Unknown');
    expect(translateWorkoutType(mockT, 'Custom 5')).toBe('Custom 5');
  });

  it('handles exact match for labels that look like numbered variants', () => {
    expect(translateWorkoutType(mockT, 'Full Body A')).toBe('Toàn thân A');
  });
});
