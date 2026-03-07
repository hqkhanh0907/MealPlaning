import { useState, useCallback } from 'react';
import { MealType } from '../types';

/**
 * Manages all modal open/close states and the active planning type.
 * Extracted from App.tsx to respect SRP — App only composes, not manages modal state.
 */
export const useModalManager = () => {
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false);
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [planningType, setPlanningType] = useState<MealType | null>(null);

  const closeAll = useCallback(() => {
    setIsPlanningModalOpen(false);
    setIsTypeSelectionModalOpen(false);
    setIsClearPlanModalOpen(false);
    setIsGoalModalOpen(false);
  }, []);

  const openTypeSelection = useCallback(() => { closeAll(); setIsTypeSelectionModalOpen(true); }, [closeAll]);
  const closeTypeSelection = useCallback(() => setIsTypeSelectionModalOpen(false), []);

  const openClearPlan = useCallback(() => { closeAll(); setIsClearPlanModalOpen(true); }, [closeAll]);
  const closeClearPlan = useCallback(() => setIsClearPlanModalOpen(false), []);

  const openGoalModal = useCallback(() => { closeAll(); setIsGoalModalOpen(true); }, [closeAll]);
  const closeGoalModal = useCallback(() => setIsGoalModalOpen(false), []);

  const openPlanningModal = useCallback((type: MealType) => {
    closeAll();
    setPlanningType(type);
    setIsPlanningModalOpen(true);
  }, [closeAll]);

  const closePlanningModal = useCallback(() => setIsPlanningModalOpen(false), []);

  const backToPlanningTypeSelection = useCallback(() => {
    setIsPlanningModalOpen(false);
    setIsTypeSelectionModalOpen(true);
  }, []);

  return {
    isPlanningModalOpen,
    isTypeSelectionModalOpen,
    isClearPlanModalOpen,
    isGoalModalOpen,
    planningType,

    openTypeSelection,
    closeTypeSelection,
    openClearPlan,
    closeClearPlan,
    openGoalModal,
    closeGoalModal,
    openPlanningModal,
    closePlanningModal,
    backToPlanningTypeSelection,
  };
};
