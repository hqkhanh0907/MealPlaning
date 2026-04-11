import {
  buildStateDescription,
  createSurfaceStateContract,
  resolveCanonicalSurfaceState,
  shouldBlockForRequiredValue,
  SURFACE_STATE_MATRIX,
} from '@/components/shared/surfaceState';

describe('surfaceState contract', () => {
  it('locks all canonical states for wave 1', () => {
    expect(SURFACE_STATE_MATRIX['dashboard.hero'].allowedStates).toContain('zero');
    expect(SURFACE_STATE_MATRIX['dashboard.todays-plan'].allowedStates).toContain('empty');
    expect(SURFACE_STATE_MATRIX['settings.goal'].allowedStates).toContain('setup');
    expect(SURFACE_STATE_MATRIX['calendar.nutrition'].allowedStates).toContain('loading');
    expect(SURFACE_STATE_MATRIX['calendar.meals'].allowedStates).toContain('warning');
    expect(SURFACE_STATE_MATRIX['fitness.plan'].allowedStates).toContain('success');
    expect(SURFACE_STATE_MATRIX['fitness.plan'].allowedStates).toContain('warning');
    expect(SURFACE_STATE_MATRIX['fitness.plan'].allowedStates).toContain('error');
    expect(SURFACE_STATE_MATRIX['library.ingredients'].allowedStates).toContain('empty');
    expect(SURFACE_STATE_MATRIX['ai.analysis'].allowsExternalPrimaryAction).toBe(true);
  });

  it('treats not configured as setup instead of zero', () => {
    expect(resolveCanonicalSurfaceState({ isConfigured: false, isZero: true })).toBe('setup');
  });

  it('builds copy from missing thing, reason, and next step', () => {
    expect(
      buildStateDescription({
        missing: 'mục tiêu dinh dưỡng',
        reason: 'chưa có hồ sơ sức khỏe',
        nextStep: 'mở phần cài đặt',
      }),
    ).toBe('Thiếu: mục tiêu dinh dưỡng · Lý do: chưa có hồ sơ sức khỏe · Tiếp theo: mở phần cài đặt');
  });

  it('blocks only when a required value is actually missing', () => {
    expect(shouldBlockForRequiredValue({ required: true, hasValue: false })).toBe(true);
    expect(shouldBlockForRequiredValue({ required: false, hasValue: false })).toBe(false);
    expect(shouldBlockForRequiredValue({ required: true, hasValue: true })).toBe(false);
  });

  it('requires a primary action unless the surface declares an external primary action', () => {
    expect(() =>
      createSurfaceStateContract({
        surface: 'fitness.plan',
        state: 'setup',
        copy: { title: 'Chưa thiết lập mục tiêu' },
      }),
    ).toThrow('requires one primary action');

    expect(
      createSurfaceStateContract({
        surface: 'settings.goal',
        state: 'setup',
        copy: { title: 'Chưa thiết lập mục tiêu' },
      }),
    ).toMatchObject({
      surface: 'settings.goal',
      state: 'setup',
    });
  });
});
