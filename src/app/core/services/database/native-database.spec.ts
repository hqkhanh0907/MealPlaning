import { Database } from './database';
import { NativeDatabase } from './native-database';

describe('NativeDatabaseService', () => {
  it('extends DatabaseService abstract', () => {
    expect(new NativeDatabase()).toBeInstanceOf(Database);
  });

  it('throws a clear error when query is called before initialize', async () => {
    const svc = new NativeDatabase();
    await expectAsync(svc.query('SELECT 1')).toBeRejectedWithError(/not initialized/i);
  });

  it('throws a clear error when execute is called before initialize', async () => {
    const svc = new NativeDatabase();
    await expectAsync(svc.execute('SELECT 1')).toBeRejectedWithError(/not initialized/i);
  });
});
