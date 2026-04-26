import { DatabaseService } from './database.service';

export interface Migration {
  version: number;
  statements: readonly string[];
}

export class MigrationRunner {
  constructor(
    private readonly db: DatabaseService,
    private readonly migrations: readonly Migration[],
  ) {}

  async run(): Promise<void> {
    const currentVersion = await this.readUserVersion();
    const pending = [...this.migrations]
      .filter((migration) => migration.version > currentVersion)
      .sort((left, right) => left.version - right.version);

    for (const migration of pending) {
      for (const statement of migration.statements) {
        await this.db.execute(statement);
      }
      await this.db.execute(`PRAGMA user_version = ${migration.version};`);
    }
  }

  private async readUserVersion(): Promise<number> {
    const [row] = await this.db.query<{ user_version: number }>('PRAGMA user_version;');
    return row?.user_version ?? 0;
  }
}
