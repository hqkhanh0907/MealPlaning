import { create } from 'zustand';
import type { DayPlan, MealTemplate } from '../types';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'meal-templates';

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
}));

useMealTemplateStore.subscribe((state, prev) => {
  if (state.templates !== prev.templates) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.templates)); }
    catch { /* localStorage full */ }
  }
});
