import { DatabaseService } from './database.service';
import { NativeDatabaseService } from './native-database.service';

describe('NativeDatabaseService', () => {
  it('extends DatabaseService abstract', () => {
    expect(new NativeDatabaseService()).toBeInstanceOf(DatabaseService);
  });

  it('throws a clear error when query is called before initialize', async () => {
    const svc = new NativeDatabaseService();
    await expectAsync(svc.query('SELECT 1')).toBeRejectedWithError(/not initialized/i);
  });

  it('throws a clear error when execute is called before initialize', async () => {
    const svc = new NativeDatabaseService();
    await expectAsync(svc.execute('SELECT 1')).toBeRejectedWithError(/not initialized/i);
  });
});
