import {
  APP_INITIALIZER,
  EnvironmentProviders,
  Injector,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Database } from './database';
import { WebDatabase } from './web-database';
import { NativeDatabase } from './native-database';
import { ProfileStore } from '../../stores/profile.store';
import { SeedLoader } from '../seed/seed-loader';
import { AccountSession, accountDatabaseName } from '../../account/account-session';
import { AccountSync } from '../../account/account-sync';
import { environment } from '../../../../environments/environment';

export const SEED_STARTUP_DELAY_MS = 3000;

/**
 * Provides DatabaseService with platform-specific implementation
 * and ensures database is initialized before the app starts.
 *
 * Initialization order:
 *   1. DatabaseService.initialize() — open DB, run schema DDL + migrations
 *   2. ProfileStore.loadProfile() — load user profile into signal
 *   3. SeedLoader.run() — delayed fire-and-forget curated Vietnamese seed load
 *      (idempotent via `seed_artifact` fingerprints). Seeding must not block
 *      first paint or the first route render on Android cold start.
 *
 * NOTE: Legacy sql.js → native SQLite import was removed on 2026-05-08
 * (Story 2.6, pre-release migration collapse). The app never shipped
 * a sql.js build to real users, so there is no legacy state to import.
 */
export function provideDatabaseService(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: Database,
      useFactory: () => {
        const account = inject(AccountSession).current();
        const name = environment.dbName.replace(/\.db$/, '');
        return Capacitor.isNativePlatform()
          ? new NativeDatabase(account ? accountDatabaseName(account.id) : name, account?.id)
          : new WebDatabase();
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const injector = inject(Injector);
        const session = inject(AccountSession);
        return async () => {
          await session
            .restore()
            .catch(() => console.warn('[Account] Could not restore the device session.'));
          if (session.required && !session.current()) return;
          const db = injector.get(Database);
          const profileStore = injector.get(ProfileStore);
          const seedLoader = injector.get(SeedLoader);
          const sync = injector.get(AccountSync);
          await db.initialize();
          await profileStore.loadProfile();
          const needsProfile = session.required && !profileStore.profile();
          await sync.initialize(needsProfile);
          if (needsProfile) await profileStore.loadProfile();

          setTimeout(() => {
            void seedLoader
              .run()
              .then((inserted) => {
                if (inserted.ingredients > 0 || inserted.dishes > 0) {
                  console.warn(
                    `[DatabaseProvider] seed loaded: ${inserted.ingredients} ingredients, ${inserted.dishes} dishes`,
                  );
                }
              })
              .catch((err: unknown) => {
                // Seed failure must NOT block app startup — log + continue.
                console.warn('[DatabaseProvider] seed load failed:', err);
              });
          }, SEED_STARTUP_DELAY_MS);
        };
      },
      multi: true,
    },
  ]);
}
