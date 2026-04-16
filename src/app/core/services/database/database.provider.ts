import {
  APP_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from './database.service';
import { WebDatabaseService } from './web-database.service';
import { ProfileStore } from '../../stores/profile.store';

/**
 * Provides DatabaseService with platform-specific implementation
 * and ensures database is initialized before the app starts.
 *
 * Initialization order:
 *   1. DatabaseService.initialize() — open DB, run schema DDL
 *   2. ProfileStore.loadProfile() — load user profile into signal
 */
export function provideDatabaseService(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DatabaseService,
      useClass: Capacitor.isNativePlatform()
        ? WebDatabaseService // TODO: replace with NativeDatabaseService
        : WebDatabaseService,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const db = inject(DatabaseService);
        const profileStore = inject(ProfileStore);
        return async () => {
          await db.initialize();
          await profileStore.loadProfile();
        };
      },
      multi: true,
    },
  ]);
}
