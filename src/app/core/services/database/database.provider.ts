import {
  APP_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Database } from './database';
import { WebDatabase } from './web-database';
import { NativeDatabase } from './native-database';
import { LegacySqlJsMigrator } from './legacy-sqljs-migrator';
import { ProfileStore } from '../../stores/profile.store';
import { SeedLoader } from '../seed/seed-loader';

/** Upper bound for legacy import — never block startup longer than this. */
const LEGACY_MIGRATION_TIMEOUT_MS = 3000;

/**
 * Provides DatabaseService with platform-specific implementation
 * and ensures database is initialized before the app starts.
 *
 * Initialization order:
 *   1. DatabaseService.initialize() — open DB, run schema DDL + migrations
 *   2. (native only) LegacySqlJsMigrator — import legacy sql.js localStorage
 *      profile into native SQLite, if any. Never overwrites existing rows.
 *   3. ProfileStore.loadProfile() — load user profile into signal
 */
export function provideDatabaseService(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: Database,
      useClass: Capacitor.isNativePlatform() ? NativeDatabase : WebDatabase,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const db = inject(Database);
        const profileStore = inject(ProfileStore);
        const seedLoader = inject(SeedLoader);
        return async () => {
          await db.initialize();

          if (Capacitor.isNativePlatform()) {
            await runWithTimeout(
              new LegacySqlJsMigrator(db).migrate(),
              LEGACY_MIGRATION_TIMEOUT_MS,
              'legacy-sqljs-migration',
            ).catch((err) => console.warn('[DatabaseProvider] legacy migration skipped:', err));
          }

          try {
            const inserted = await seedLoader.run();
            if (inserted.ingredients > 0 || inserted.dishes > 0) {
              console.warn(
                `[DatabaseProvider] seed loaded: ${inserted.ingredients} ingredients, ${inserted.dishes} dishes`,
              );
            }
          } catch (err) {
            // Seed failure must NOT block app startup — log + continue.
            console.warn('[DatabaseProvider] seed load failed:', err);
          }

          await profileStore.loadProfile();
        };
      },
      multi: true,
    },
  ]);
}

function runWithTimeout<T>(p: Promise<T>, ms: number, tag: string): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[DatabaseProvider] ${tag} timed out after ${ms}ms`);
      resolve(undefined);
    }, ms);
  });
  return Promise.race([p, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
