import { useCallback } from 'react';
import { DayPlan, MealTemplate } from '../types';
import { usePersistedState } from './usePersistedState';
import { generateId } from '../utils/helpers';

export const useMealTemplate = () => {
  const [templates, setTemplates] = usePersistedState<MealTemplate[]>('meal-templates', []);

  const saveTemplate = useCallback((name: string, plan: DayPlan, tags?: string[]) => {
    const template: MealTemplate = {
      id: generateId('tpl'),
      name,
      breakfastDishIds: [...plan.breakfastDishIds],
      lunchDishIds: [...plan.lunchDishIds],
      dinnerDishIds: [...plan.dinnerDishIds],
      createdAt: new Date().toISOString(),
      ...(tags && tags.length > 0 ? { tags } : {}),
    };
    setTemplates(prev => [...prev, template]);
  }, [setTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [setTemplates]);

  const renameTemplate = useCallback((id: string, newName: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  }, [setTemplates]);

  const applyTemplate = useCallback((template: MealTemplate, targetDate: string): DayPlan => {
    return {
      date: targetDate,
      breakfastDishIds: [...template.breakfastDishIds],
      lunchDishIds: [...template.lunchDishIds],
      dinnerDishIds: [...template.dinnerDishIds],
    };
  }, []);

  return { templates, saveTemplate, deleteTemplate, renameTemplate, applyTemplate };
};
