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
import { ProfileStore } from '../../stores/profile.store';
import { SeedLoader } from '../seed/seed-loader';

/**
 * Provides DatabaseService with platform-specific implementation
 * and ensures database is initialized before the app starts.
 *
 * Initialization order:
 *   1. DatabaseService.initialize() — open DB, run schema DDL + migrations
 *   2. SeedLoader.run() — insert curated Vietnamese seed (idempotent via
 *      `seed_artifact` fingerprints)
 *   3. ProfileStore.loadProfile() — load user profile into signal
 *
 * NOTE: Legacy sql.js → native SQLite import was removed on 2026-05-08
 * (Story 2.6, pre-release migration collapse). The app never shipped
 * a sql.js build to real users, so there is no legacy state to import.
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
