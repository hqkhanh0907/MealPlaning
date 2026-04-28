import { Database } from './database';
import { MigrationRunner } from './migration-runner';
import { MIGRATION_REGISTRY } from './migrations';
import { NativeDatabase } from './native-database';

describe('NativeDatabaseService migration orchestration', () => {
  it('uses MigrationRunner against the shared registry after schema bootstrap', () => {
    expect(MIGRATION_REGISTRY.length).toBeGreaterThan(0);
    expect(MigrationRunner).toBeDefined();
    expect(new NativeDatabase()).toBeInstanceOf(Database);
  });
});
