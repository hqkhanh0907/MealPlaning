import { useState, useCallback } from 'react';
import { MealType } from '../types';

export const useModalManager = () => {
  const [isMealPlannerOpen, setIsMealPlannerOpen] = useState(false);
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [planningType, setPlanningType] = useState<MealType | null>(null);

  const closeAll = useCallback(() => {
    setIsMealPlannerOpen(false);
    setIsClearPlanModalOpen(false);
    setIsGoalModalOpen(false);
  }, []);

  const openMealPlanner = useCallback((type: MealType) => {
    closeAll();
    setPlanningType(type);
    setIsMealPlannerOpen(true);
  }, [closeAll]);

  const closeMealPlanner = useCallback(() => setIsMealPlannerOpen(false), []);

  const openClearPlan = useCallback(() => { closeAll(); setIsClearPlanModalOpen(true); }, [closeAll]);
  const closeClearPlan = useCallback(() => setIsClearPlanModalOpen(false), []);

  const openGoalModal = useCallback(() => { closeAll(); setIsGoalModalOpen(true); }, [closeAll]);
  const closeGoalModal = useCallback(() => setIsGoalModalOpen(false), []);

  return {
    isMealPlannerOpen,
    isClearPlanModalOpen,
    isGoalModalOpen,
    planningType,
    openMealPlanner,
    closeMealPlanner,
    openClearPlan,
    closeClearPlan,
    openGoalModal,
    closeGoalModal,
  };
};
