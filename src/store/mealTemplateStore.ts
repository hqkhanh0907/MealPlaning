import { create } from 'zustand';

import type { DatabaseService } from '../services/databaseService';
import type { DayPlan, MealTemplate } from '../types';
import { generateUUID } from '../utils/helpers';
import { logger } from '../utils/logger';
import { persistToDb } from './helpers/dbWriteQueue';

let _db: DatabaseService | null = null;

/** @internal Reset DB reference — test-only */
export function __resetTemplateDbForTesting(): void {
  _db = null;
}

interface MealTemplateRow {
  id: string;
  name: string;
  data: string;
}

interface MealTemplateState {
  templates: MealTemplate[];
  saveTemplate: (name: string, plan: DayPlan, tags?: string[]) => void;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, newName: string) => void;
  applyTemplate: (template: MealTemplate, targetDate: string) => DayPlan;
  loadAll: (db: DatabaseService) => Promise<void>;
}

export const useMealTemplateStore = create<MealTemplateState>(set => ({
  templates: [],
  saveTemplate: (name, plan, tags) => {
    const template: MealTemplate = {
      id: generateUUID(),
      name,
      breakfastDishIds: [...plan.breakfastDishIds],
      lunchDishIds: [...plan.lunchDishIds],
      dinnerDishIds: [...plan.dinnerDishIds],
      createdAt: new Date().toISOString(),
      ...(tags && tags.length > 0 ? { tags } : {}),
    };
    set(state => ({ templates: [...state.templates, template] }));
    if (_db) {
      const { id: _id, name: _name, ...rest } = template;
      persistToDb(
        _db,
        'INSERT INTO meal_templates (id, name, data) VALUES (?,?,?)',
        [template.id, template.name, JSON.stringify(rest)],
        'saveTemplate',
      );
    }
  },
  deleteTemplate: id => {
    set(state => ({ templates: state.templates.filter(t => t.id !== id) }));
    if (_db) persistToDb(_db, 'DELETE FROM meal_templates WHERE id = ?', [id], 'deleteTemplate');
  },
  renameTemplate: (id, newName) => {
    set(state => ({ templates: state.templates.map(t => (t.id === id ? { ...t, name: newName } : t)) }));
    if (_db) persistToDb(_db, 'UPDATE meal_templates SET name = ? WHERE id = ?', [newName, id], 'renameTemplate');
  },
  applyTemplate: (template, targetDate) => ({
    date: targetDate,
    breakfastDishIds: [...template.breakfastDishIds],
    lunchDishIds: [...template.lunchDishIds],
    dinnerDishIds: [...template.dinnerDishIds],
  }),
  loadAll: async (db: DatabaseService) => {
    _db = db;
    const rows = await db.query<MealTemplateRow>('SELECT * FROM meal_templates');
    if (rows.length === 0) return;
    const templates: MealTemplate[] = rows
      .map(r => {
        try {
          const data = JSON.parse(r.data) as Omit<MealTemplate, 'id' | 'name'>;
          return { id: r.id, name: r.name, ...data };
        } catch {
          logger.warn(
            { component: 'mealTemplateStore', action: 'loadAll' },
            `Corrupt template data[${r.id}]: ${r.data.slice(0, 80)}`,
          );
          return null;
        }
      })
      .filter((t): t is MealTemplate => t !== null);
    set({ templates });
  },
}));
