import React, { createContext, useContext, useEffect, useState } from 'react';

import { EmptyState } from '../components/shared/EmptyState';
import { createSurfaceStateContract } from '../components/shared/surfaceState';
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
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const service = createDatabaseService();
    setDb(null);
    setError(null);
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
          useHealthProfileStore
            .getState()
            .loadProfile(service)
            .then(() => useHealthProfileStore.getState().loadActiveGoal(service)),
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
  }, [attempt]);

  if (error) {
    return (
      <div className="bg-muted dark:bg-background flex min-h-dvh items-center justify-center px-4 py-10">
        <div role="alert" className="w-full max-w-xl">
          <EmptyState
            variant="hero"
            contract={createSurfaceStateContract({
              surface: 'shell.startup',
              state: 'error',
              copy: {
                title: 'Không thể chuẩn bị ứng dụng',
                missing: 'Kết nối cơ sở dữ liệu cục bộ',
                reason: error,
                nextStep: 'Thử khởi động lại shell để tải lại dữ liệu nền',
              },
              primaryAction: {
                label: 'Thử lại',
                onAction: () => setAttempt(current => current + 1),
              },
            })}
          />
        </div>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="bg-muted dark:bg-background flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <EmptyState
            variant="hero"
            contract={createSurfaceStateContract({
              surface: 'shell.startup',
              state: 'loading',
              copy: {
                title: 'Đang chuẩn bị MealPlaning',
                missing: 'Dữ liệu nền và điều hướng ban đầu',
                reason: 'Ứng dụng đang mở cơ sở dữ liệu, chạy migration và nạp trạng thái cần thiết',
                nextStep: 'Giữ màn hình này trong giây lát, shell sẽ sẵn sàng ngay sau khi đồng bộ xong',
              },
            })}
          />
        </div>
      </div>
    );
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
