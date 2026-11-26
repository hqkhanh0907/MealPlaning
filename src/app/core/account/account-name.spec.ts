import { accountNameError } from './account-name';
import { isWorkspaceWrite } from './workspace-snapshot';

describe('Account inputs', () => {
  it('accepts names with accents, internal whitespace, apostrophes and hyphens', () => {
    expect(accountNameError("  Nguyễn Minh-An  O'Neil  ")).toBeNull();
    expect(accountNameError('Ánh')).toBeNull();
  });

  it('counts characters after trimming external whitespace', () => {
    expect(accountNameError('   ')).not.toBeNull();
    expect(accountNameError(` ${'𠮷'.repeat(100)} `)).toBeNull();
    expect(accountNameError('𠮷'.repeat(101))).not.toBeNull();
  });

  it('queues writes to owner data but skips protocol metadata and reads', () => {
    expect(isWorkspaceWrite('INSERT OR REPLACE INTO "workout_set" (id) VALUES (?)')).toBeTrue();
    expect(isWorkspaceWrite('DELETE FROM [planned_dish] WHERE id = ?')).toBeTrue();
    expect(isWorkspaceWrite('UPDATE sync_workspace SET revision = ?')).toBeFalse();
    expect(isWorkspaceWrite('SELECT * FROM workout_set')).toBeFalse();
  });
});
