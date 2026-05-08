import { activityLabel, activityLabelLong, activityLabelShort } from './activity-label';

describe('activity-label', () => {
  it('sedentary: short = "Ít vận động", long = "Ít vận động (ngồi nhiều)"', () => {
    expect(activityLabel('sedentary')).toEqual({
      short: 'Ít vận động',
      long: 'Ít vận động (ngồi nhiều)',
    });
  });

  it('light: short = "Vận động nhẹ", long = "Nhẹ (1-3 ngày/tuần)"', () => {
    expect(activityLabel('light')).toEqual({
      short: 'Vận động nhẹ',
      long: 'Nhẹ (1-3 ngày/tuần)',
    });
  });

  it('moderate: short = "Vận động vừa" (canonical, drops bare "Vừa")', () => {
    expect(activityLabel('moderate')).toEqual({
      short: 'Vận động vừa',
      long: 'Trung bình (3-5 ngày/tuần)',
    });
  });

  it('heavy: short = "Vận động nặng", long = "Nặng (6-7 ngày/tuần)"', () => {
    expect(activityLabel('heavy')).toEqual({
      short: 'Vận động nặng',
      long: 'Nặng (6-7 ngày/tuần)',
    });
  });

  it('activityLabelShort returns short variant', () => {
    expect(activityLabelShort('moderate')).toBe('Vận động vừa');
    expect(activityLabelShort('sedentary')).toBe('Ít vận động');
  });

  it('activityLabelLong returns long variant', () => {
    expect(activityLabelLong('moderate')).toBe('Trung bình (3-5 ngày/tuần)');
    expect(activityLabelLong('heavy')).toBe('Nặng (6-7 ngày/tuần)');
  });

  it('parallel naming — all 4 short labels follow "Vận động X" or "Ít vận động"', () => {
    const shorts = (['sedentary', 'light', 'moderate', 'heavy'] as const).map((v) =>
      activityLabelShort(v),
    );
    expect(shorts).toEqual(['Ít vận động', 'Vận động nhẹ', 'Vận động vừa', 'Vận động nặng']);
  });

  it('no bare "Vừa" string in canonical labels (P1-13 parallel)', () => {
    const allLabels = (['sedentary', 'light', 'moderate', 'heavy'] as const).flatMap((v) => [
      activityLabel(v).short,
      activityLabel(v).long,
    ]);
    expect(allLabels.some((s) => s === 'Vừa')).toBe(false);
  });
});
