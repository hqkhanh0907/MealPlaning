import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { IngredientRepository } from '../repositories/ingredient.repository';
import { Database } from '../services/database/database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';
import { AccountSession, type AccountIdentity } from './account-session';
import { NATIVE_CATALOG_READ, type CatalogCommand, type NativeCatalogRead } from './catalog-read';

const owner: AccountIdentity = { id: 'aaaaaaaaaaaaaaa', username: 'ingredient_qa', name: 'An' };
const row = {
  id: 'first',
  name: 'Đậu đỏ',
  category: 'Đậu & Hạt',
  calories: 101,
  protein: 2.5,
  carbs: 5,
  fat: 1,
  fiber: 0,
  source: 'manual' as const,
  created_at: '2026-11-28',
  updated_at: null,
};
const reply = (command: CatalogCommand, value: NativeCatalogRead['value']): NativeCatalogRead => ({
  ownerId: owner.id,
  op: command.op,
  value,
});

describe('authenticated ingredient reads', () => {
  const current = signal<AccountIdentity | null>(owner);
  const native =
    jasmine.createSpy<
      (params: { ownerId: string; command: CatalogCommand }) => Promise<NativeCatalogRead>
    >('catalogRead');
  function repository(db: unknown): IngredientRepository {
    TestBed.configureTestingModule({
      providers: [
        { provide: AccountSession, useValue: { current } },
        { provide: Database, useValue: db },
        { provide: NATIVE_CATALOG_READ, useValue: native },
      ],
    });
    return TestBed.inject(IngredientRepository);
  }
  beforeEach(() => {
    current.set(owner);
    native.calls.reset();
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
  });

  it('sends the seven bounded commands and treats a missing row as a completed native read', async () => {
    const db = { query: jasmine.createSpy('query'), getOne: jasmine.createSpy('getOne') };
    const repo = repository(db);
    native.and.callFake(async ({ ownerId, command }) => {
      expect(ownerId).toBe(owner.id);
      switch (command.op) {
        case 'countDishReferences':
          return reply(command, 2);
        case 'getById':
        case 'findByExactName':
          return reply(command, null);
        default:
          return reply(command, [row]);
      }
    });
    expect(await repo.list()).toEqual([row]);
    expect(await repo.searchByName('Đậ%_')).toEqual([row]);
    expect(await repo.findRecentlyUsed(-1)).toEqual([row]);
    expect(await repo.getById('missing')).toBeNull();
    expect(await repo.findByIds(['missing', 'first', 'first'])).toEqual([row]);
    expect(await repo.findByExactName(' CÁ ')).toBeNull();
    expect(await repo.countDishReferences('first')).toBe(2);
    expect(await repo.findByIds([])).toEqual([]);
    expect(await repo.findByExactName('\u0301 ')).toBeNull();
    expect(native.calls.allArgs().map(([r]) => r.command)).toEqual([
      { op: 'list' },
      { op: 'searchByName', query: 'Đậ%_' },
      { op: 'findRecentlyUsed', limit: -1 },
      { op: 'getById', id: 'missing' },
      { op: 'findByIds', ids: ['missing', 'first', 'first'] },
      { op: 'findByExactName', name: ' CÁ ' },
      { op: 'countDishReferences', id: 'first' },
    ]);
    expect(db.query).not.toHaveBeenCalled();
    expect(db.getOne).not.toHaveBeenCalled();
  });

  it('reads uncommitted AI ingredient inserts, updates and exact matches on the writer', async () => {
    const db = await createTestDatabase();
    try {
      const repo = repository(db);
      native.and.rejectWith(new Error('Uncommitted data must stay on the writer connection'));
      await expectAsync(
        db.withTransaction(async () => {
          const inserted = await repo.insert({
            name: row.name,
            category: row.category,
            calories: row.calories,
            protein: row.protein,
            carbs: row.carbs,
            fat: row.fat,
            fiber: row.fiber,
            source: 'ai',
          });
          expect((await repo.findByExactName('DAU DO'))?.id).toBe(inserted.id);
          await repo.update(inserted.id, { name: 'Đậu đen' });
          const found = await repo.findByIds([inserted.id, 'missing', inserted.id]);
          expect(found.map((r) => [r.id, r.name, r.source])).toEqual([
            [inserted.id, 'Đậu đen', 'manual'],
            [inserted.id, 'Đậu đen', 'manual'],
          ]);
          throw new Error('rollback fixture');
        }),
      ).toBeRejectedWithError('rollback fixture');
      expect(
        await db.getOne("SELECT id FROM ingredient WHERE name IN ('Đậu đỏ','Đậu đen')"),
      ).toBeNull();
      expect(native).not.toHaveBeenCalled();
    } finally {
      teardownTestDatabase();
    }
  });

  it('uses the writer when a transaction begins while a native read is in flight', async () => {
    const db = {
      hasActiveTransaction: false,
      query: jasmine.createSpy('query').and.resolveTo([row]),
    };
    const repo = repository(db);
    native.and.callFake(async ({ command }) => {
      db.hasActiveTransaction = true;
      return reply(command, []);
    });
    expect(await repo.list()).toEqual([row]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('rejects stale owners, mismatched operations and query errors without falling back', async () => {
    const query = jasmine.createSpy('query').and.resolveTo([row]);
    const repo = repository({ query });
    native.and.callFake(async ({ command }) => ({
      ...reply(command, [row]),
      ownerId: 'bbbbbbbbbbbbbbb',
    }));
    await expectAsync(repo.list()).toBeRejectedWithError(/Unexpected native/);
    native.and.callFake(async () => reply({ op: 'findRecentlyUsed', limit: 1 }, [row]));
    await expectAsync(repo.list()).toBeRejectedWithError(/Unexpected native/);
    native.and.callFake(async ({ command }) => {
      current.set({ ...owner });
      return reply(command, [row]);
    });
    await expectAsync(repo.list()).toBeRejectedWithError(/account changed/);
    native.and.rejectWith(new Error('catalog_read_failed'));
    await expectAsync(repo.list()).toBeRejectedWithError('catalog_read_failed');
    current.set(null);
    await expectAsync(repo.list()).toBeRejectedWithError(/account is required/);
    expect(query).not.toHaveBeenCalled();
  });

  it('limits fallback to missing native support and rejects account changes during the SQL read', async () => {
    const query = jasmine.createSpy('query').and.resolveTo([row]);
    const repo = repository({ query });
    for (const code of ['UNIMPLEMENTED', 'catalog_native_unavailable']) {
      native.and.callFake(async () => {
        throw { code };
      });
      expect(await repo.list()).toEqual([row]);
    }
    query.and.callFake(async () => {
      current.set({ ...owner });
      return [row];
    });
    await expectAsync(repo.list()).toBeRejectedWithError(/account changed/);
  });
});
