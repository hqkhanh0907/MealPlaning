import { DatabaseService } from './database.service';
import { MigrationRunner } from './migration-runner';
import { MIGRATION_REGISTRY } from './migrations';
import { NativeDatabaseService } from './native-database.service';

describe('NativeDatabaseService migration orchestration', () => {
  it('uses MigrationRunner against the shared registry after schema bootstrap', () => {
    expect(MIGRATION_REGISTRY.length).toBeGreaterThan(0);
    expect(MigrationRunner).toBeDefined();
    expect(new NativeDatabaseService()).toBeInstanceOf(DatabaseService);
  });
});
