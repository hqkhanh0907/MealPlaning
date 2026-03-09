import { useState, useCallback } from 'react';
import { MealType } from '../types';

export const useModalManager = () => {
  const [isMealPlannerOpen, setIsMealPlannerOpen] = useState(false);
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCopyPlanOpen, setIsCopyPlanOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [planningType, setPlanningType] = useState<MealType | null>(null);

  const closeAll = useCallback(() => {
    setIsMealPlannerOpen(false);
    setIsClearPlanModalOpen(false);
    setIsGoalModalOpen(false);
    setIsCopyPlanOpen(false);
    setIsTemplateManagerOpen(false);
    setIsSaveTemplateOpen(false);
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

  const openCopyPlanModal = useCallback(() => { closeAll(); setIsCopyPlanOpen(true); }, [closeAll]);
  const closeCopyPlanModal = useCallback(() => setIsCopyPlanOpen(false), []);

  const openTemplateManager = useCallback(() => { closeAll(); setIsTemplateManagerOpen(true); }, [closeAll]);
  const closeTemplateManager = useCallback(() => setIsTemplateManagerOpen(false), []);

  const openSaveTemplate = useCallback(() => { closeAll(); setIsSaveTemplateOpen(true); }, [closeAll]);
  const closeSaveTemplate = useCallback(() => setIsSaveTemplateOpen(false), []);

  return {
    isMealPlannerOpen,
    isClearPlanModalOpen,
    isGoalModalOpen,
    isCopyPlanOpen,
    isTemplateManagerOpen,
    isSaveTemplateOpen,
    planningType,
    openMealPlanner,
    closeMealPlanner,
    openClearPlan,
    closeClearPlan,
    openGoalModal,
    closeGoalModal,
    openCopyPlanModal,
    closeCopyPlanModal,
    openTemplateManager,
    closeTemplateManager,
    openSaveTemplate,
    closeSaveTemplate,
  };
};
