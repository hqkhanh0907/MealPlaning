import React, { createContext, useContext, useEffect, useState } from 'react';
import { createDatabaseService, type DatabaseService } from '../services/databaseService';
import { createSchema } from '../services/schema';

const DatabaseContext = createContext<DatabaseService | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DatabaseService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = createDatabaseService();
    service
      .initialize()
      .then(async () => {
        await createSchema(service);
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
