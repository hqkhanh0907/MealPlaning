import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetQueue, _waitForIdle } from '../store/helpers/dbWriteQueue';
import { __resetTemplateDbForTesting, useMealTemplateStore } from '../store/mealTemplateStore';
import type { DayPlan } from '../types';

function resetStore() {
  __resetTemplateDbForTesting();
  useMealTemplateStore.setState({ templates: [] });
}

const SAMPLE_PLAN: DayPlan = {
  date: '2024-06-15',
  breakfastDishIds: ['dish-a', 'dish-b'],
  lunchDishIds: ['dish-c'],
  dinnerDishIds: ['dish-d', 'dish-e', 'dish-f'],
};

describe('mealTemplateStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('saveTemplate', () => {
    it('creates a template from a day plan', () => {
      useMealTemplateStore.getState().saveTemplate('Chế độ giảm cân', SAMPLE_PLAN, ['diet', 'low-carb']);

      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Chế độ giảm cân');
      expect(templates[0].breakfastDishIds).toEqual(['dish-a', 'dish-b']);
      expect(templates[0].lunchDishIds).toEqual(['dish-c']);
      expect(templates[0].dinnerDishIds).toEqual(['dish-d', 'dish-e', 'dish-f']);
      expect(templates[0].tags).toEqual(['diet', 'low-carb']);
      expect(templates[0].id).toBeTruthy();
      expect(templates[0].createdAt).toBeTruthy();
    });

    it('creates a template without tags', () => {
      useMealTemplateStore.getState().saveTemplate('No tags plan', SAMPLE_PLAN);

      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0].tags).toBeUndefined();
    });

    it('appends to existing templates', () => {
      useMealTemplateStore.getState().saveTemplate('Template 1', SAMPLE_PLAN);
      useMealTemplateStore.getState().saveTemplate('Template 2', SAMPLE_PLAN);

      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(2);
      expect(templates[0].name).toBe('Template 1');
      expect(templates[1].name).toBe('Template 2');
    });

    it('generates unique ids for each template', () => {
      useMealTemplateStore.getState().saveTemplate('Template 1', SAMPLE_PLAN);
      useMealTemplateStore.getState().saveTemplate('Template 2', SAMPLE_PLAN);

      const { templates } = useMealTemplateStore.getState();
      expect(templates[0].id).not.toBe(templates[1].id);
    });

    it('copies dish ids (not references) from the plan', () => {
      const plan: DayPlan = {
        date: '2024-06-15',
        breakfastDishIds: ['dish-x'],
        lunchDishIds: ['dish-y'],
        dinnerDishIds: ['dish-z'],
      };

      useMealTemplateStore.getState().saveTemplate('Copy test', plan);

      plan.breakfastDishIds.push('dish-extra');

      const { templates } = useMealTemplateStore.getState();
      expect(templates[0].breakfastDishIds).toEqual(['dish-x']);
    });
  });

  describe('deleteTemplate', () => {
    it('removes a template by id', () => {
      useMealTemplateStore.getState().saveTemplate('To delete', SAMPLE_PLAN);
      const id = useMealTemplateStore.getState().templates[0].id;

      useMealTemplateStore.getState().deleteTemplate(id);

      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(0);
    });

    it('only removes the targeted template', () => {
      useMealTemplateStore.getState().saveTemplate('Keep', SAMPLE_PLAN);
      useMealTemplateStore.getState().saveTemplate('Delete', SAMPLE_PLAN);
      const deleteId = useMealTemplateStore.getState().templates[1].id;

      useMealTemplateStore.getState().deleteTemplate(deleteId);

      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Keep');
    });
  });

  describe('renameTemplate', () => {
    it('renames an existing template', () => {
      useMealTemplateStore.getState().saveTemplate('Old name', SAMPLE_PLAN);
      const id = useMealTemplateStore.getState().templates[0].id;

      useMealTemplateStore.getState().renameTemplate(id, 'New name');

      const { templates } = useMealTemplateStore.getState();
      expect(templates[0].name).toBe('New name');
    });

    it('does not modify other templates', () => {
      useMealTemplateStore.getState().saveTemplate('Template A', SAMPLE_PLAN);
      useMealTemplateStore.getState().saveTemplate('Template B', SAMPLE_PLAN);
      const idA = useMealTemplateStore.getState().templates[0].id;

      useMealTemplateStore.getState().renameTemplate(idA, 'Renamed A');

      const { templates } = useMealTemplateStore.getState();
      expect(templates[0].name).toBe('Renamed A');
      expect(templates[1].name).toBe('Template B');
    });
  });

  describe('applyTemplate', () => {
    it('creates a DayPlan from a template for a target date', () => {
      useMealTemplateStore.getState().saveTemplate('Test', SAMPLE_PLAN, ['diet']);
      const template = useMealTemplateStore.getState().templates[0];

      const result = useMealTemplateStore.getState().applyTemplate(template, '2025-01-20');

      expect(result.date).toBe('2025-01-20');
      expect(result.breakfastDishIds).toEqual(['dish-a', 'dish-b']);
      expect(result.lunchDishIds).toEqual(['dish-c']);
      expect(result.dinnerDishIds).toEqual(['dish-d', 'dish-e', 'dish-f']);
    });

    it('returns a new array (not a reference to template arrays)', () => {
      useMealTemplateStore.getState().saveTemplate('Test', SAMPLE_PLAN);
      const template = useMealTemplateStore.getState().templates[0];

      const result = useMealTemplateStore.getState().applyTemplate(template, '2025-01-20');

      result.breakfastDishIds.push('extra');
      expect(template.breakfastDishIds).toEqual(['dish-a', 'dish-b']);
    });
  });

  describe('data integrity', () => {
    it('preserves all fields through save and retrieve', () => {
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-06-15T08:00:00.000Z');

      useMealTemplateStore.getState().saveTemplate('Chế độ giảm cân', SAMPLE_PLAN, ['diet', 'low-carb']);

      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('Chế độ giảm cân');
      expect(templates[0].breakfastDishIds).toEqual(['dish-a', 'dish-b']);
      expect(templates[0].lunchDishIds).toEqual(['dish-c']);
      expect(templates[0].dinnerDishIds).toEqual(['dish-d', 'dish-e', 'dish-f']);
      expect(templates[0].createdAt).toBe('2024-06-15T08:00:00.000Z');
      expect(templates[0].tags).toEqual(['diet', 'low-carb']);

      vi.restoreAllMocks();
    });

    it('handles empty templates list', () => {
      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(0);
      expect(templates).toEqual([]);
    });
  });

  describe('loadAll', () => {
    it('loads templates from database', async () => {
      const mockDb = {
        query: vi.fn().mockResolvedValue([
          {
            id: 'tpl-1',
            name: 'Low Carb',
            data: JSON.stringify({
              breakfastDishIds: ['d1'],
              lunchDishIds: ['d2', 'd3'],
              dinnerDishIds: [],
              createdAt: '2025-01-01T00:00:00.000Z',
              tags: ['diet'],
            }),
          },
        ]),
      };

      await useMealTemplateStore.getState().loadAll(mockDb as never);

      const { templates } = useMealTemplateStore.getState();
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('tpl-1');
      expect(templates[0].name).toBe('Low Carb');
      expect(templates[0].breakfastDishIds).toEqual(['d1']);
      expect(templates[0].lunchDishIds).toEqual(['d2', 'd3']);
      expect(templates[0].dinnerDishIds).toEqual([]);
      expect(templates[0].tags).toEqual(['diet']);
    });

    it('does nothing when database returns empty rows', async () => {
      useMealTemplateStore.getState().saveTemplate('Keep', SAMPLE_PLAN);

      const mockDb = {
        query: vi.fn().mockResolvedValue([]),
      };

      await useMealTemplateStore.getState().loadAll(mockDb as never);

      expect(useMealTemplateStore.getState().templates).toHaveLength(1);
    });
  });

  describe('saveTemplate – edge cases', () => {
    it('omits tags when empty array is passed', () => {
      useMealTemplateStore.getState().saveTemplate('No tags', SAMPLE_PLAN, []);

      const { templates } = useMealTemplateStore.getState();
      expect(templates[0].tags).toBeUndefined();
    });
  });

  describe('SQLite persistence', () => {
    const mockDb = {
      query: vi.fn().mockResolvedValue([]),
      execute: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
    };

    beforeEach(async () => {
      _resetQueue();
      mockDb.execute.mockClear();
      mockDb.query.mockClear();
      mockDb.query.mockResolvedValue([]);
      await useMealTemplateStore.getState().loadAll(mockDb as never);
    });

    afterEach(() => {
      __resetTemplateDbForTesting();
      _resetQueue();
    });

    it('persists saveTemplate via queue', async () => {
      useMealTemplateStore.getState().saveTemplate('Test', SAMPLE_PLAN, ['tag']);
      await _waitForIdle();

      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO meal_templates (id, name, data) VALUES (?,?,?)',
        expect.arrayContaining(['Test']),
      );
    });

    it('persists deleteTemplate via queue', async () => {
      useMealTemplateStore.getState().saveTemplate('Temp', SAMPLE_PLAN);
      await _waitForIdle();
      const id = useMealTemplateStore.getState().templates[0].id;

      mockDb.execute.mockClear();
      useMealTemplateStore.getState().deleteTemplate(id);
      await _waitForIdle();

      expect(mockDb.execute).toHaveBeenCalledWith('DELETE FROM meal_templates WHERE id = ?', [id]);
    });

    it('persists renameTemplate via queue', async () => {
      useMealTemplateStore.getState().saveTemplate('Old', SAMPLE_PLAN);
      await _waitForIdle();
      const id = useMealTemplateStore.getState().templates[0].id;

      mockDb.execute.mockClear();
      useMealTemplateStore.getState().renameTemplate(id, 'New');
      await _waitForIdle();

      expect(mockDb.execute).toHaveBeenCalledWith('UPDATE meal_templates SET name = ? WHERE id = ?', ['New', id]);
    });

    it('does not persist when _db is null', () => {
      __resetTemplateDbForTesting();
      mockDb.execute.mockClear();

      useMealTemplateStore.getState().saveTemplate('No persist', SAMPLE_PLAN);

      expect(mockDb.execute).not.toHaveBeenCalled();
    });

    it('loadAll filters out corrupt template JSON gracefully', async () => {
      mockDb.query.mockResolvedValueOnce([
        { id: 'good', name: 'Good', data: JSON.stringify({ breakfast: [], lunch: [], dinner: [], tags: [] }) },
        { id: 'bad', name: 'Bad', data: 'not-json{{{' },
      ]);
      await useMealTemplateStore.getState().loadAll(mockDb as never);

      const templates = useMealTemplateStore.getState().templates;
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('good');
    });
  });
});
