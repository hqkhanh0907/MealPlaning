import React, { createContext, useContext, useEffect, useState } from 'react';

import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import {
  isFitnessMigrationCompleted,
  isMigrationNeeded,
  migrateFitnessData,
  migrateFromLocalStorage,
} from '../services/migrationService';
import { createSchema, getSchemaVersion, runSchemaMigrations } from '../services/schema';

const DatabaseContext = createContext<DatabaseService | null>(null);

export function DatabaseProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [db, setDb] = useState<DatabaseService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const service = createDatabaseService();
    service
      .initialize()
      .then(async () => {
        if (cancelled) return;

        // Migration-aware startup: check existing DB version
        const version = await getSchemaVersion(service);
        if (version > 0) {
          await runSchemaMigrations(service);
        }
        await createSchema(service);

        // Migrate legacy localStorage data to SQLite on first load
        if (isMigrationNeeded()) {
          await migrateFromLocalStorage(service);
        }
        if (!isFitnessMigrationCompleted()) {
          await migrateFitnessData(service);
        }

        if (cancelled) return;

        // Load all stores from SQLite before rendering the app
        const { useIngredientStore } = await import('../store/ingredientStore');
        const { useDishStore } = await import('../store/dishStore');
        const { useDayPlanStore } = await import('../store/dayPlanStore');
        const { useMealTemplateStore } = await import('../store/mealTemplateStore');
        const { useHealthProfileStore } = await import('../features/health-profile/store/healthProfileStore');
        const { useFitnessStore } = await import('../store/fitnessStore');

        await Promise.all([
          useIngredientStore.getState().loadAll(service),
          useDishStore.getState().loadAll(service),
          useDayPlanStore.getState().loadAll(service),
          useMealTemplateStore.getState().loadAll(service),
          useHealthProfileStore.getState().loadProfile(service),
          useFitnessStore.getState().initializeFromSQLite(service),
        ]);

        if (cancelled) return;
        setDb(service);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      service.close().catch(() => {});
    };
  }, []);

  if (error) {
    return <div role="alert">Database error: {error}</div>;
  }

  if (!db) {
    return <div>Loading...</div>;
  }

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseService {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return db;
}
