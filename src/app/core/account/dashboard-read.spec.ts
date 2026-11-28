import { readAccountDashboard } from './dashboard-read';

describe('native dashboard account boundary', () => {
  it('allows the existing read path only for an unavailable implementation', async () => {
    for (const code of ['UNIMPLEMENTED', 'dashboard_native_unavailable']) {
      const read = jasmine.createSpy('read').and.rejectWith({ code });
      expect(await readAccountDashboard('2026-11-28', 'account-a', read)).toBeNull();
      expect(read).toHaveBeenCalledOnceWith({ date: '2026-11-28' });
    }
  });
  it('keeps account and local database errors visible to the dashboard', async () => {
    for (const code of [
      'dashboard_session_required',
      'dashboard_session_changed',
      'dashboard_session_revoked',
      'dashboard_database_unavailable',
      'dashboard_read_failed',
    ]) {
      const error = { code };
      await expectAsync(
        readAccountDashboard('2026-11-28', 'account-a', () => Promise.reject(error)),
      ).toBeRejectedWith(error);
    }
  });
  it('refuses a native response from another owner during a session switch', async () => {
    const read = jasmine
      .createSpy('read')
      .and.resolveTo({ date: '2026-11-28', ownerId: 'account-b' });
    await expectAsync(readAccountDashboard('2026-11-28', 'account-a', read)).toBeRejectedWithError(
      'Dashboard account changed.',
    );
  });
});
