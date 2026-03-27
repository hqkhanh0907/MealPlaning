import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMealTemplateStore } from '../store/mealTemplateStore';
import type { DatabaseService } from '../services/databaseService';
import type { MealTemplate } from '../types';

function createMockDb(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return {
    initialize: vi.fn(),
    execute: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    transaction: vi.fn(),
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
    ...overrides,
  };
}

function resetStore() {
  useMealTemplateStore.setState({ templates: [] });
}

const SAMPLE_TEMPLATE: MealTemplate = {
  id: 'tpl-001',
  name: 'Chế độ giảm cân',
  breakfastDishIds: ['dish-a', 'dish-b'],
  lunchDishIds: ['dish-c'],
  dinnerDishIds: ['dish-d', 'dish-e', 'dish-f'],
  createdAt: '2024-06-15T08:00:00.000Z',
  tags: ['diet', 'low-carb'],
};

describe('mealTemplateStore — SQLite methods', () => {
  beforeEach(() => {
    resetStore();
  });

  it('loadTemplates loads and parses JSON data', async () => {
    const db = createMockDb({
      query: vi.fn().mockResolvedValue([
        { id: SAMPLE_TEMPLATE.id, name: SAMPLE_TEMPLATE.name, data: JSON.stringify(SAMPLE_TEMPLATE) },
      ]),
    });

    await useMealTemplateStore.getState().loadTemplates(db);

    expect(db.query).toHaveBeenCalledWith('SELECT id, name, data FROM meal_templates');

    const { templates } = useMealTemplateStore.getState();
    expect(templates).toHaveLength(1);
    expect(templates[0]).toEqual(SAMPLE_TEMPLATE);
  });

  it('saveTemplateToDb serializes to JSON', async () => {
    const db = createMockDb();

    await useMealTemplateStore.getState().saveTemplateToDb(db, SAMPLE_TEMPLATE);

    expect(db.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(sql).toContain('INSERT OR REPLACE INTO meal_templates');
    expect(params[0]).toBe(SAMPLE_TEMPLATE.id);
    expect(params[1]).toBe(SAMPLE_TEMPLATE.name);

    const storedData = JSON.parse(params[2] as string) as MealTemplate;
    expect(storedData.breakfastDishIds).toEqual(['dish-a', 'dish-b']);
    expect(storedData.tags).toEqual(['diet', 'low-carb']);

    const { templates } = useMealTemplateStore.getState();
    expect(templates).toHaveLength(1);
    expect(templates[0]).toEqual(SAMPLE_TEMPLATE);
  });

  it('deleteTemplateFromDb removes correctly', async () => {
    useMealTemplateStore.setState({ templates: [SAMPLE_TEMPLATE] });
    const db = createMockDb();

    await useMealTemplateStore.getState().deleteTemplateFromDb(db, SAMPLE_TEMPLATE.id);

    expect(db.execute).toHaveBeenCalledWith(
      'DELETE FROM meal_templates WHERE id = ?',
      [SAMPLE_TEMPLATE.id],
    );

    const { templates } = useMealTemplateStore.getState();
    expect(templates).toHaveLength(0);
  });

  it('JSON roundtrip preserves all fields', async () => {
    const stored: Record<string, unknown[]> = {};
    const db = createMockDb({
      execute: vi.fn().mockImplementation((_sql: string, params?: unknown[]) => {
        if (params) {
          stored['rows'] = stored['rows'] ?? [];
          stored['rows'] = stored['rows'].filter(
            (r) => (r as unknown[])[0] !== params[0],
          );
          stored['rows'].push(params);
        }
        return Promise.resolve();
      }),
      query: vi.fn().mockImplementation(() => {
        if (stored['rows']) {
          return Promise.resolve(
            stored['rows'].map((params) => {
              const p = params as unknown[];
              return { id: p[0], name: p[1], data: p[2] };
            }),
          );
        }
        return Promise.resolve([]);
      }),
    });

    await useMealTemplateStore.getState().saveTemplateToDb(db, SAMPLE_TEMPLATE);
    resetStore();
    await useMealTemplateStore.getState().loadTemplates(db);

    const { templates } = useMealTemplateStore.getState();
    expect(templates).toHaveLength(1);
    expect(templates[0]).toEqual(SAMPLE_TEMPLATE);
    expect(templates[0].id).toBe('tpl-001');
    expect(templates[0].breakfastDishIds).toEqual(['dish-a', 'dish-b']);
    expect(templates[0].lunchDishIds).toEqual(['dish-c']);
    expect(templates[0].dinnerDishIds).toEqual(['dish-d', 'dish-e', 'dish-f']);
    expect(templates[0].createdAt).toBe('2024-06-15T08:00:00.000Z');
    expect(templates[0].tags).toEqual(['diet', 'low-carb']);
  });

  it('handles empty templates list', async () => {
    const db = createMockDb({
      query: vi.fn().mockResolvedValue([]),
    });

    await useMealTemplateStore.getState().loadTemplates(db);

    const { templates } = useMealTemplateStore.getState();
    expect(templates).toHaveLength(0);
    expect(templates).toEqual([]);
  });
});
