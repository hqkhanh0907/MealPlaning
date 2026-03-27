import { DAY_LABELS, DAY_LABELS_SUNDAY_FIRST, ALL_MUSCLES, RPE_OPTIONS, CARDIO_TYPES } from '../features/fitness/constants';

describe('Fitness Constants', () => {
  it('DAY_LABELS has 7 days starting Monday', () => {
    expect(DAY_LABELS).toHaveLength(7);
    expect(DAY_LABELS[0]).toBe('T2');
    expect(DAY_LABELS[6]).toBe('CN');
  });

  it('DAY_LABELS_SUNDAY_FIRST aligns with Date.getDay()', () => {
    expect(DAY_LABELS_SUNDAY_FIRST[0]).toBe('CN');
    expect(DAY_LABELS_SUNDAY_FIRST[1]).toBe('T2');
  });

  it('ALL_MUSCLES has 7 groups', () => {
    expect(ALL_MUSCLES).toHaveLength(7);
  });

  it('RPE_OPTIONS range 6-10', () => {
    expect(RPE_OPTIONS[0]).toBe(6);
    expect(RPE_OPTIONS[RPE_OPTIONS.length - 1]).toBe(10);
  });

  it('CARDIO_TYPES has 7 types', () => {
    expect(CARDIO_TYPES).toHaveLength(7);
  });
});
