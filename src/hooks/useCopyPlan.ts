import { useCallback } from 'react';
import { DayPlan } from '../types';

export const useCopyPlan = (
  dayPlans: DayPlan[],
  setDayPlans: React.Dispatch<React.SetStateAction<DayPlan[]>>
) => {
  const copyPlan = useCallback((sourceDate: string, targetDates: string[]) => {
    const sourcePlan = dayPlans.find(p => p.date === sourceDate);
    if (!sourcePlan) return;

    setDayPlans(prev => {
      const updated = [...prev];
      for (const targetDate of targetDates) {
        const existingIndex = updated.findIndex(p => p.date === targetDate);
        const newPlan: DayPlan = {
          date: targetDate,
          breakfastDishIds: [...sourcePlan.breakfastDishIds],
          lunchDishIds: [...sourcePlan.lunchDishIds],
          dinnerDishIds: [...sourcePlan.dinnerDishIds],
        };
        if (existingIndex >= 0) {
          updated[existingIndex] = newPlan;
        } else {
          updated.push(newPlan);
        }
      }
      return updated;
    });
  }, [dayPlans, setDayPlans]);

  return { copyPlan };
};
