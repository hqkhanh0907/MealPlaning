import { create } from 'zustand';
import type { DayPlan, MealTemplate } from '../types';
import type { DatabaseService } from '../services/databaseService';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'meal-templates';

interface MealTemplateRow {
  id: string;
  name: string;
  data: string;
}

const loadTemplates = (): MealTemplate[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved) as MealTemplate[];
  } catch { /* corrupted data — use default */ }
  return [];
};

interface MealTemplateState {
  templates: MealTemplate[];
  saveTemplate: (name: string, plan: DayPlan, tags?: string[]) => void;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, newName: string) => void;
  applyTemplate: (template: MealTemplate, targetDate: string) => DayPlan;
  hydrate: () => void;
  loadAll: (db: DatabaseService) => Promise<void>;
}

export const useMealTemplateStore = create<MealTemplateState>((set) => ({
  templates: [],
  saveTemplate: (name, plan, tags) => {
    const template: MealTemplate = {
      id: generateId('tpl'),
      name,
      breakfastDishIds: [...plan.breakfastDishIds],
      lunchDishIds: [...plan.lunchDishIds],
      dinnerDishIds: [...plan.dinnerDishIds],
      createdAt: new Date().toISOString(),
      ...(tags && tags.length > 0 ? { tags } : {}),
    };
    set((state) => ({ templates: [...state.templates, template] }));
  },
  deleteTemplate: (id) => set((state) => ({
    templates: state.templates.filter(t => t.id !== id),
  })),
  renameTemplate: (id, newName) => set((state) => ({
    templates: state.templates.map(t => t.id === id ? { ...t, name: newName } : t),
  })),
  applyTemplate: (template, targetDate) => ({
    date: targetDate,
    breakfastDishIds: [...template.breakfastDishIds],
    lunchDishIds: [...template.lunchDishIds],
    dinnerDishIds: [...template.dinnerDishIds],
  }),
  hydrate: () => set({ templates: loadTemplates() }),
  loadAll: async (db: DatabaseService) => {
    const rows = await db.query<MealTemplateRow>('SELECT * FROM meal_templates');
    if (rows.length === 0) {
      set({ templates: loadTemplates() });
      return;
    }
    const templates: MealTemplate[] = rows.map((r) => {
      const data = JSON.parse(r.data) as Omit<MealTemplate, 'id' | 'name'>;
      return { id: r.id, name: r.name, ...data };
    });
    set({ templates });
  },
}));

useMealTemplateStore.subscribe((state, prev) => {
  if (state.templates !== prev.templates) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.templates)); }
    catch { /* localStorage full */ }
  }
});
