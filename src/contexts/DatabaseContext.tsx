import React, { createContext, useContext, useEffect, useState } from 'react';
import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import { createSchema } from '../services/schema';
import { isMigrationNeeded, migrateFromLocalStorage, isFitnessMigrationCompleted, migrateFitnessData } from '../services/migrationService';

const DatabaseContext = createContext<DatabaseService | null>(null);

export function DatabaseProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [db, setDb] = useState<DatabaseService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = createDatabaseService();
    service
      .initialize()
      .then(async () => {
        await createSchema(service);

        // Migrate legacy localStorage data to SQLite on first load
        if (isMigrationNeeded()) {
          await migrateFromLocalStorage(service);
        }
        if (!isFitnessMigrationCompleted()) {
          await migrateFitnessData(service);
        }

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

        setDb(service);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
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
