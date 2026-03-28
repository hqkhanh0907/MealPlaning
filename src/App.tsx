import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { MealType, SaveAnalyzedDishPayload, DayNutritionSummary } from './types';
import { calculateDishesNutrition } from './utils/nutrition';
import { CalendarTab } from './components/CalendarTab';

// Lazy-loaded to reduce initial bundle size — these tabs are visited less often
const importManagementTab = () => import('./components/ManagementTab').then(m => ({ default: m.ManagementTab }));
const AIImageAnalyzer = React.lazy(() => import('./components/AIImageAnalyzer').then(m => ({ default: m.AIImageAnalyzer })));
const ManagementTab = React.lazy(importManagementTab);
const FitnessTab = React.lazy(() => import('./features/fitness/components/FitnessTab').then(m => ({ default: m.FitnessTab })));
const DashboardTab = React.lazy(() => import('./features/dashboard/components/DashboardTab').then(m => ({ default: m.DashboardTab })));
const SettingsTab = React.lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));

// Lazy-loaded modals — only loaded when opened
const MealPlannerModal = React.lazy(() => import('./components/modals/MealPlannerModal').then(m => ({ default: m.MealPlannerModal })));
const ClearPlanModal = React.lazy(() => import('./components/modals/ClearPlanModal').then(m => ({ default: m.ClearPlanModal })));
const GoalSettingsModal = React.lazy(() => import('./components/modals/GoalSettingsModal').then(m => ({ default: m.GoalSettingsModal })));
const AISuggestionPreviewModal = React.lazy(() => import('./components/modals/AISuggestionPreviewModal').then(m => ({ default: m.AISuggestionPreviewModal })));
const CopyPlanModal = React.lazy(() => import('./components/modals/CopyPlanModal').then(m => ({ default: m.CopyPlanModal })));
const TemplateManager = React.lazy(() => import('./components/modals/TemplateManager').then(m => ({ default: m.TemplateManager })));
const SaveTemplateModal = React.lazy(() => import('./components/modals/SaveTemplateModal').then(m => ({ default: m.SaveTemplateModal })));
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNotification } from './contexts/NotificationContext';
import {
  Utensils,
  Bot,
  SlidersHorizontal,
  ChevronLeft,
} from 'lucide-react';
import { generateId, parseLocalDate } from './utils/helpers';
import { getLocalizedField } from './utils/localize';
import { useDarkMode } from './hooks/useDarkMode';
import { useAISuggestion } from './hooks/useAISuggestion';
import { useModalManager } from './hooks/useModalManager';
import { useCopyPlan } from './hooks/useCopyPlan';
import { useAutoSync } from './hooks/useAutoSync';
import { usePrefetchAfterIdle } from './hooks/usePrefetchAfterIdle';
import {
  createEmptyDayPlan,
  clearPlansByScope,
  updateDayPlanSlot,
} from './services/planService';
import {
  removeIngredientFromDishes,
  processAnalyzedDish,
} from './services/dataService';
import { BottomNavBar, DesktopNav, TabLoadingFallback } from './components/navigation';
import { getTabLabels } from './components/navigation/types';
import type { MainTab } from './components/navigation';
import { UNDO_TOAST_DURATION_MS } from './data/constants';

// Zustand stores
import { useIngredientStore } from './store/ingredientStore';
import { useDishStore } from './store/dishStore';
import { useDayPlanStore } from './store/dayPlanStore';
import { useMealTemplateStore } from './store/mealTemplateStore';
import { useUIStore } from './store/uiStore';
import { useNavigationStore } from './store/navigationStore';
import { useHealthProfileStore } from './features/health-profile/store/healthProfileStore';
import { useAppOnboardingStore } from './store/appOnboardingStore';
import { AppOnboarding } from './components/AppOnboarding';


// --- Main App component ---

export default function App() {
  const { t } = useTranslation();
  const isAppOnboarded = useAppOnboardingStore((s) => s.isAppOnboarded);
  const { theme, setTheme } = useDarkMode();

  const prefetchFns = useMemo(() => [importManagementTab], []);
  usePrefetchAfterIdle(prefetchFns);

  // Reset runtime-only stores on mount (no persistent data — safe to keep)
  // Data stores (ingredients, dishes, dayPlans, templates) are now loaded from SQLite by DatabaseContext
  useState(() => {
    useUIStore.getState().hydrate();
    useNavigationStore.setState({ activeTab: 'calendar', pageStack: [], showBottomNav: true, tabScrollPositions: {} });
  });

  // Read state from Zustand stores
  const { ingredients, setIngredients, addIngredient, updateIngredient } = useIngredientStore();
  const { dishes, setDishes, addDish, updateDish, deleteDish, isIngredientUsed } = useDishStore();
  const { dayPlans, setDayPlans, isDishUsed, restoreDayPlans } = useDayPlanStore();
  const healthProfile = useHealthProfileStore((s) => s.profile);
  const { templates, saveTemplate, deleteTemplate, renameTemplate, applyTemplate } = useMealTemplateStore();
  const { hasNewAIResult, setHasNewAIResult, activeManagementSubTab, setActiveManagementSubTab, selectedDate, setSelectedDate } = useUIStore();
  const activeMainTab = useNavigationStore(s => s.activeTab);
  const navigateTab = useNavigationStore(s => s.navigateTab);
  const pageStack = useNavigationStore(s => s.pageStack);
  const pushPage = useNavigationStore(s => s.pushPage);
  const popPage = useNavigationStore(s => s.popPage);

  const handleOpenSettings = useCallback(() => {
    pushPage({ id: 'settings', component: 'SettingsTab' });
  }, [pushPage]);

  const isSettingsOpen = pageStack.length > 0 && pageStack[pageStack.length - 1].id === 'settings';

  const handleTabChange = useCallback((tab: MainTab) => {
    navigateTab(tab);
    if (tab === 'ai-analysis') setHasNewAIResult(false);
  }, [navigateTab, setHasNewAIResult]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      const tabs: MainTab[] = ['calendar', 'library', 'ai-analysis', 'fitness', 'dashboard'];
      const digit = Number.parseInt(e.key, 10);
      if (digit >= 1 && digit <= 5) {
        e.preventDefault();
        handleTabChange(tabs[digit - 1]);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleTabChange]);

  const modals = useModalManager();
  const notify = useNotification();
  const copyPlanHook = useCopyPlan(dayPlans, setDayPlans);

  const currentPlan = useMemo(() =>
    dayPlans.find(p => p.date === selectedDate) || createEmptyDayPlan(selectedDate),
    [dayPlans, selectedDate]
  );

  const dayNutrition = useMemo((): DayNutritionSummary => {
    const calc = (dishIds: string[]) => ({
      dishIds,
      ...calculateDishesNutrition(dishIds, dishes, ingredients, currentPlan.servings),
    });
    return {
      breakfast: calc(currentPlan.breakfastDishIds),
      lunch: calc(currentPlan.lunchDishIds),
      dinner: calc(currentPlan.dinnerDishIds),
    };
  }, [currentPlan, dishes, ingredients]);

  const targetProtein = Math.round(healthProfile.weightKg * healthProfile.proteinRatio);

  const aiSuggestion = useAISuggestion({
    dishes, ingredients, targetCalories: healthProfile.targetCalories,
    targetProtein, selectedDate, setDayPlans,
  });

  const handlePlanMeal = useCallback((type: MealType) => {
    modals.openMealPlanner(type);
  }, [modals]);

  const handleEditAISuggestionMeal = useCallback((type: MealType) => {
    aiSuggestion.editMeal(type);
    modals.openMealPlanner(type);
  }, [aiSuggestion, modals]);

  const handleClearPlan = useCallback((scope: 'day' | 'week' | 'month', meals?: MealType[]) => {
    const backup = [...dayPlans];
    setDayPlans(prev => clearPlansByScope(prev, selectedDate, scope, meals));
    modals.closeClearPlan();
    notify.success(t('notification.planCleared'), t('clearPlan.undoMessage'), {
      duration: UNDO_TOAST_DURATION_MS,
      action: {
        label: t('common.undo'),
        onClick: () => {
          setDayPlans(backup);
          notify.success(t('clearPlan.undone'));
        },
      },
    });
  }, [dayPlans, selectedDate, setDayPlans, modals, notify, t]);

  const handleUpdatePlan = useCallback((type: MealType, dishIds: string[]) => {
    useDayPlanStore.getState().updatePlan(selectedDate, type, dishIds);
  }, [selectedDate]);

  const handleQuickAdd = useCallback((type: MealType, dishId: string) => {
    setDayPlans(prev => {
      const existing = prev.find(p => p.date === selectedDate);
      const slotKey = `${type}DishIds` as const;
      const currentIds = existing?.[slotKey] ?? [];
      return updateDayPlanSlot(prev, selectedDate, type, [...currentIds, dishId]);
    });
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      notify.success(t('notification.dishAdded'), getLocalizedField(dish.name));
    }
  }, [selectedDate, setDayPlans, dishes, notify, t]);

  const handleUpdateServings = useCallback((dishId: string, count: number) => {
    useDayPlanStore.getState().updateServings(selectedDate, dishId, count);
  }, [selectedDate]);

  const handleDeleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    setDishes(prev => removeIngredientFromDishes(prev, id));
  }, [setIngredients, setDishes]);

  const handleSaveAnalyzedDish = useCallback((result: SaveAnalyzedDishPayload) => {
    const { newIngredients, dishIngredients } = processAnalyzedDish(result, ingredients);
    if (newIngredients.length > 0) setIngredients(prev => [...prev, ...newIngredients]);

    if (result.shouldCreateDish === false) {
      notify.success(t('notification.saveSuccess'), t('notification.savedIngredients', { count: newIngredients.length }));
      navigateTab('library');
      setActiveManagementSubTab('ingredients');
    } else {
      setDishes(prev => [...prev, { id: generateId('dish'), name: { vi: result.name, en: result.name }, ingredients: dishIngredients, tags: result.tags ?? ['lunch'] }]);
      notify.success(t('notification.saveSuccess'), t('notification.savedDish', { name: result.name, count: newIngredients.length }));
      navigateTab('library');
      setActiveManagementSubTab('dishes');
    }
  }, [ingredients, notify, setIngredients, setDishes, navigateTab, setActiveManagementSubTab, t]);

  const openTypeSelection = useCallback(() => {
    const emptySlots: MealType[] = [];
    if (currentPlan.breakfastDishIds.length === 0) emptySlots.push('breakfast');
    if (currentPlan.lunchDishIds.length === 0) emptySlots.push('lunch');
    if (currentPlan.dinnerDishIds.length === 0) emptySlots.push('dinner');
    modals.openMealPlanner(emptySlots[0] ?? 'breakfast');
  }, [modals, currentPlan]);
  const openClearPlan = useCallback(() => modals.openClearPlan(), [modals]);
  const openGoalModal = useCallback(() => modals.openGoalModal(), [modals]);
  const openCopyPlan = useCallback(() => modals.openCopyPlanModal(), [modals]);
  const openTemplateManager = useCallback(() => modals.openTemplateManager(), [modals]);

  const handleSaveTemplate = useCallback((name: string, tags?: string[]) => {
    saveTemplate(name, currentPlan, tags);
    modals.closeSaveTemplate();
    notify.success(t('notification.templateSaved'));
  }, [currentPlan, saveTemplate, modals, notify, t]);

  const handleCopyPlanAction = useCallback((targetDates: string[], mergeMode: boolean) => {
    const snapshot = dayPlans
      .filter(p => targetDates.includes(p.date))
      .map(p => ({ ...p, breakfastDishIds: [...p.breakfastDishIds], lunchDishIds: [...p.lunchDishIds], dinnerDishIds: [...p.dinnerDishIds] }));
    copyPlanHook.copyPlan(selectedDate, targetDates, mergeMode);
    modals.closeCopyPlanModal();

    const undoCopy = () => {
      restoreDayPlans(snapshot);
      notify.info(t('notification.undone'), t('notification.undoneDesc'));
    };

    notify.success(t('notification.planCopied'), t('notification.planCopiedDesc', { count: targetDates.length }), {
      duration: 30000,
      action: { label: t('action.undo'), onClick: undoCopy },
    });
  }, [dayPlans, selectedDate, copyPlanHook, modals, restoreDayPlans, notify, t]);

  const handleAnalysisComplete = useCallback(() => {
    // c8 ignore next 4
    if (useNavigationStore.getState().activeTab !== 'ai-analysis') {
      setHasNewAIResult(true);
      notify.success(t('notification.analysisComplete'), t('notification.analysisCompleteHint'), { onClick: () => navigateTab('ai-analysis') });
    }
  }, [setHasNewAIResult, notify, navigateTab, t]);



  // Auto-sync data to Google Drive when authenticated
  useAutoSync();

  if (!isAppOnboarded) {
    return <AppOnboarding />;
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-800 transition-colors">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 pt-safe" role="banner">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-emerald-500 text-white p-1.5 sm:p-2 rounded-xl shadow-sm" aria-hidden="true">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                <span className="sm:hidden">{getTabLabels(t)[activeMainTab]}</span>
                <span className="hidden sm:inline">Smart Meal Planner</span>
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium sm:hidden">
                {parseLocalDate(selectedDate).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">{t('header.subtitle', { weight: healthProfile.weightKg })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DesktopNav activeTab={activeMainTab} onTabChange={handleTabChange} />
            <button
              type="button"
              aria-label="Cài đặt"
              data-testid="btn-open-settings"
              onClick={handleOpenSettings}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-8">
        <div className={activeMainTab === 'calendar' ? 'block animate-fade-in' : 'hidden'} role="tabpanel" aria-label={t('nav.calendar')} key={`calendar-${activeMainTab}`} inert={activeMainTab === 'calendar' ? undefined : true}>
          <ErrorBoundary fallbackTitle={t('errorBoundary.calendarTab')}>
          <CalendarTab
            selectedDate={selectedDate} onSelectDate={setSelectedDate} dayPlans={dayPlans}
            dishes={dishes} ingredients={ingredients} currentPlan={currentPlan}
            dayNutrition={dayNutrition}
            userWeight={healthProfile.weightKg} targetCalories={healthProfile.targetCalories} targetProtein={targetProtein}
            isSuggesting={aiSuggestion.isLoading}
            servings={currentPlan.servings}
            onOpenTypeSelection={openTypeSelection} onOpenClearPlan={openClearPlan}
            onOpenGoalModal={openGoalModal} onPlanMeal={handlePlanMeal} onSuggestMealPlan={aiSuggestion.startSuggestion}
            onCopyPlan={openCopyPlan} onSaveTemplate={modals.openSaveTemplate} onOpenTemplateManager={openTemplateManager}
            onQuickAdd={handleQuickAdd}
            onUpdateServings={handleUpdateServings}
          />
          </ErrorBoundary>
        </div>

        {activeMainTab === 'fitness' && (
          <ErrorBoundary fallbackTitle={t('nav.fitness')}>
          <Suspense fallback={<TabLoadingFallback />}>
            <FitnessTab />
          </Suspense>
          </ErrorBoundary>
        )}

        <div className={activeMainTab === 'library' ? 'block animate-fade-in' : 'hidden'} role="tabpanel" aria-label={t('nav.library')} key={`library-${activeMainTab}`} inert={activeMainTab === 'library' ? undefined : true}>
          <ErrorBoundary fallbackTitle={t('errorBoundary.managementTab')}>
          <Suspense fallback={<TabLoadingFallback />}>
          <ManagementTab
            activeSubTab={activeManagementSubTab} onSubTabChange={setActiveManagementSubTab}
            ingredients={ingredients} dishes={dishes}
            onAddIngredient={addIngredient}
            onUpdateIngredient={updateIngredient}
            onDeleteIngredient={handleDeleteIngredient} isIngredientUsed={isIngredientUsed}
            onAddDish={addDish}
            onUpdateDish={updateDish}
            onDeleteDish={deleteDish} isDishUsed={isDishUsed}
          />
          </Suspense>
          </ErrorBoundary>
        </div>

        {activeMainTab === 'ai-analysis' && (
          <ErrorBoundary fallbackTitle={t('errorBoundary.aiTab')}>
          <Suspense fallback={<TabLoadingFallback />}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('ai.title')}</h2>
              </div>
            </div>
            <AIImageAnalyzer onAnalysisComplete={handleAnalysisComplete} onSave={handleSaveAnalyzedDish} />
          </div>
          </Suspense>
          </ErrorBoundary>
        )}

        {activeMainTab === 'dashboard' && (
          <ErrorBoundary fallbackTitle={t('nav.dashboard')}>
          <Suspense fallback={<TabLoadingFallback />}>
            <DashboardTab />
          </Suspense>
          </ErrorBoundary>
        )}
      </main>

      <Suspense fallback={null}>
      {modals.isMealPlannerOpen && modals.planningType && (
        <MealPlannerModal
          dishes={dishes}
          ingredients={ingredients}
          currentPlan={currentPlan}
          selectedDate={selectedDate}
          initialTab={modals.planningType}
          targetCalories={healthProfile.targetCalories}
          targetProtein={targetProtein}
          onConfirm={(changes) => {
            for (const [type, dishIds] of Object.entries(changes)) {
              handleUpdatePlan(type as MealType, dishIds);
            }
            modals.closeMealPlanner();
            const changedCount = Object.keys(changes).length;
            const totalDishes = Object.values(changes).reduce((sum, ids) => sum + ids.length, 0);
            if (changedCount === 1) {
              const mealType = Object.keys(changes)[0] as MealType;
              const mealLabel = t(`meal.${mealType}Full`);
              notify.success(t('notification.planUpdated'), t('notification.planUpdatedDesc', { count: totalDishes, meal: mealLabel }));
            } else {
              notify.success(t('notification.planUpdated'), t('notification.planUpdatedDesc', { count: totalDishes, meal: `${changedCount} ${t('common.item')}` }));
            }
          }}
          onClose={modals.closeMealPlanner}
        />
      )}
      {modals.isClearPlanModalOpen && <ClearPlanModal dayPlans={dayPlans} selectedDate={selectedDate} onClear={handleClearPlan} onClose={modals.closeClearPlan} />}
      {modals.isGoalModalOpen && <GoalSettingsModal userProfile={{ weight: healthProfile.weightKg, proteinRatio: healthProfile.proteinRatio, targetCalories: healthProfile.targetCalories }} onUpdateProfile={(p) => useHealthProfileStore.setState((s) => ({ profile: { ...s.profile, weightKg: p.weight, proteinRatio: p.proteinRatio, targetCalories: p.targetCalories } }))} onClose={modals.closeGoalModal} />}

      {modals.isCopyPlanOpen && (
        <CopyPlanModal
          sourceDate={selectedDate}
          sourcePlan={currentPlan}
          dishes={dishes}
          onCopy={handleCopyPlanAction}
          onClose={modals.closeCopyPlanModal}
        />
      )}
      {modals.isTemplateManagerOpen && (
        <TemplateManager
          templates={templates}
          dishes={dishes}
          onApply={(template) => {
            const plan = applyTemplate(template, selectedDate);
            setDayPlans(prev => {
              const idx = prev.findIndex(p => p.date === selectedDate);
              if (idx >= 0) { const u = [...prev]; u[idx] = plan; return u; }
              return [...prev, plan];
            });
            modals.closeTemplateManager();
            notify.success(t('notification.templateApplied'));
          }}
          onDelete={(id) => {
            deleteTemplate(id);
            notify.success(t('notification.templateDeleted'));
          }}
          onRename={(id, newName) => {
            renameTemplate(id, newName);
            notify.success(t('notification.templateRenamed'));
          }}
          onClose={modals.closeTemplateManager}
        />
      )}
      {modals.isSaveTemplateOpen && (
        <SaveTemplateModal
          currentPlan={currentPlan}
          dishes={dishes}
          onSave={handleSaveTemplate}
          onClose={modals.closeSaveTemplate}
        />
      )}

      <AISuggestionPreviewModal
        isOpen={aiSuggestion.isModalOpen}
        suggestion={aiSuggestion.suggestion}
        dishes={dishes}
        ingredients={ingredients}
        targetCalories={healthProfile.targetCalories}
        targetProtein={targetProtein}
        isLoading={aiSuggestion.isLoading}
        error={aiSuggestion.error}
        onClose={aiSuggestion.close}
        onApply={aiSuggestion.apply}
        onRegenerate={aiSuggestion.regenerate}
        onEditMeal={handleEditAISuggestionMeal}
      />
      </Suspense>

      <BottomNavBar activeTab={activeMainTab} onTabChange={handleTabChange} showAIBadge={hasNewAIResult} />

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto" data-testid="settings-overlay">
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 pt-safe">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex items-center gap-3">
              <button
                type="button"
                aria-label={t('common.back')}
                data-testid="btn-close-settings"
                onClick={popPage}
                className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('nav.settings')}</h2>
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <SettingsTab theme={theme} setTheme={setTheme} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
