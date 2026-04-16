import {
  APP_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from './database.service';
import { WebDatabaseService } from './web-database.service';

/**
 * Provides DatabaseService with platform-specific implementation
 * and ensures database is initialized before the app starts.
 *
 * - Native (Android): NativeDatabaseService (to be implemented)
 * - Web/Browser:      WebDatabaseService (sql.js WASM)
 */
export function provideDatabaseService(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DatabaseService,
      useClass: Capacitor.isNativePlatform()
        ? WebDatabaseService // TODO: replace with NativeDatabaseService when implemented
        : WebDatabaseService,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const db = inject(DatabaseService);
        return () => db.initialize();
      },
      multi: true,
    },
  ]);
}
