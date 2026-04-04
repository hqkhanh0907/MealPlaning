import { create } from 'zustand';

import type { DatabaseService } from '../services/databaseService';
import type { DayPlan, MealTemplate } from '../types';
import { generateUUID } from '../utils/helpers';
import { logger } from '../utils/logger';

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
  },
  deleteTemplate: id =>
    set(state => ({
      templates: state.templates.filter(t => t.id !== id),
    })),
  renameTemplate: (id, newName) =>
    set(state => ({
      templates: state.templates.map(t => (t.id === id ? { ...t, name: newName } : t)),
    })),
  applyTemplate: (template, targetDate) => ({
    date: targetDate,
    breakfastDishIds: [...template.breakfastDishIds],
    lunchDishIds: [...template.lunchDishIds],
    dinnerDishIds: [...template.dinnerDishIds],
  }),
  loadAll: async (db: DatabaseService) => {
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
