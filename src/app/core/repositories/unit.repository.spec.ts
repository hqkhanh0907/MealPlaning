import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../services/database/database.service';
import { UnitRepository } from './unit.repository';

describe('UnitRepository', () => {
  let repo: UnitRepository;
  let db: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    db = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
      'initialize',
      'execute',
      'query',
      'getOne',
      'withTransaction',
    ]);
    db.query.and.resolveTo([
      {
        id: 'g',
        display_name_vi: 'gram',
        display_name_en: 'gram',
        short_name_vi: 'g',
        unit_type: 'mass',
        is_global: 1,
        base_factor_g: 1,
        base_factor_ml: null,
        is_approximate: 0,
        display_order: 1,
      },
    ]);

    TestBed.configureTestingModule({
      providers: [UnitRepository, { provide: DatabaseService, useValue: db }],
    });

    repo = TestBed.inject(UnitRepository);
  });

  it('lists units ordered by display order', async () => {
    const units = await repo.list();

    expect(units.length).toBe(1);
    expect(units[0].id).toBe('g');
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM unit ORDER BY display_order ASC, id ASC');
  });
});
