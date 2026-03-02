import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { initialIngredients, initialDishes } from './data/initialData';
import { Ingredient, Dish, DayPlan, MealType, UserProfile, SaveAnalyzedDishPayload, DayNutritionSummary } from './types';
import { calculateDishesNutrition } from './utils/nutrition';
import { CalendarTab } from './components/CalendarTab';

// Lazy-loaded to reduce initial bundle size — these tabs are visited less often
const GroceryList = React.lazy(() => import('./components/GroceryList').then(m => ({ default: m.GroceryList })));
const AIImageAnalyzer = React.lazy(() => import('./components/AIImageAnalyzer').then(m => ({ default: m.AIImageAnalyzer })));
import { ManagementTab } from './components/ManagementTab';
import { SettingsTab } from './components/SettingsTab';
import { usePersistedState } from './hooks/usePersistedState';
import { useNotification } from './contexts/NotificationContext';
import { TypeSelectionModal } from './components/modals/TypeSelectionModal';
import { ClearPlanModal } from './components/modals/ClearPlanModal';
import { PlanningModal } from './components/modals/PlanningModal';
import { GoalSettingsModal } from './components/modals/GoalSettingsModal';
import { AISuggestionPreviewModal } from './components/modals/AISuggestionPreviewModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  Utensils,
  Sparkles,
  ShoppingCart,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { generateId } from './utils/helpers';
import { useDarkMode } from './hooks/useDarkMode';
import { useAISuggestion } from './hooks/useAISuggestion';
import { useModalManager } from './hooks/useModalManager';
import {
  createEmptyDayPlan,
  getDayPlanSlotKey,
  clearPlansByScope,
  updateDayPlanSlot,
} from './services/planService';
import {
  removeIngredientFromDishes,
  migrateDayPlans,
  migrateDishes,
  processAnalyzedDish,
  validateImportData,
} from './services/dataService';
import { BottomNavBar, DesktopNav, TabLoadingFallback } from './components/navigation';
import { getTabLabels } from './components/navigation/types';
import type { MainTab } from './components/navigation';

type ManagementSubTab = 'ingredients' | 'dishes';

/** Default user profile values used on first launch. */
const DEFAULT_USER_PROFILE: UserProfile = { weight: 83, proteinRatio: 2, targetCalories: 1500 };


// --- Main App component ---

export default function App() {
  const { t } = useTranslation();
  const { theme, cycleTheme } = useDarkMode();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('calendar');
  const activeMainTabRef = useRef(activeMainTab);
  useEffect(() => { activeMainTabRef.current = activeMainTab; }, [activeMainTab]);

  const [hasNewAIResult, setHasNewAIResult] = useState(false);

  const handleTabChange = useCallback((tab: MainTab) => {
    setActiveMainTab(tab);
    if (tab === 'ai-analysis') setHasNewAIResult(false);
  }, []);

  const [activeManagementSubTab, setActiveManagementSubTab] = useState<ManagementSubTab>('dishes');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [userProfile, setUserProfile] = usePersistedState<UserProfile>('mp-user-profile', DEFAULT_USER_PROFILE);

  const [ingredients, setIngredients] = usePersistedState<Ingredient[]>('mp-ingredients', initialIngredients);
  const [rawDishes, setDishes] = usePersistedState<Dish[]>('mp-dishes', initialDishes);
  const [rawDayPlans, setDayPlans] = usePersistedState<DayPlan[]>('mp-day-plans', []);

  // Migrate old data formats
  const dishes = useMemo(() => migrateDishes(rawDishes), [rawDishes]);
  const dayPlans = useMemo(() => migrateDayPlans(rawDayPlans), [rawDayPlans]);

  // Persist migrated data back to localStorage if migration changed something (one-time on mount)
  const hasMigratedRef = useRef(false);
  useEffect(() => {
    if (hasMigratedRef.current) return;
    const needsMigration = rawDishes.some((d: unknown) => {
      const tags = (d as Record<string, unknown>).tags;
      return !Array.isArray(tags) || tags.length === 0;
    });
    if (needsMigration) {
      hasMigratedRef.current = true;
      setDishes(dishes);
    }
  }, [rawDishes, dishes, setDishes]);

  const modals = useModalManager();

  const notify = useNotification();

  const currentPlan = useMemo(() =>
    dayPlans.find(p => p.date === selectedDate) || createEmptyDayPlan(selectedDate),
    [dayPlans, selectedDate]
  );

  const dayNutrition = useMemo((): DayNutritionSummary => {
    const calc = (dishIds: string[]) => ({
      dishIds,
      ...calculateDishesNutrition(dishIds, dishes, ingredients),
    });
    return {
      breakfast: calc(currentPlan.breakfastDishIds),
      lunch: calc(currentPlan.lunchDishIds),
      dinner: calc(currentPlan.dinnerDishIds),
    };
  }, [currentPlan, dishes, ingredients]);

  const targetProtein = Math.round(userProfile.weight * userProfile.proteinRatio);

  const aiSuggestion = useAISuggestion({
    dishes, ingredients, targetCalories: userProfile.targetCalories,
    targetProtein, selectedDate, setDayPlans,
  });

  const handlePlanMeal = useCallback((type: MealType) => {
    modals.openPlanningModal(type);
  }, [modals]);

  const handleEditAISuggestionMeal = useCallback((type: MealType) => {
    aiSuggestion.editMeal(type);
    modals.openPlanningModal(type);
  }, [aiSuggestion, modals]);

  const handleClearPlan = useCallback((scope: 'day' | 'week' | 'month') => {
    setDayPlans(prev => clearPlansByScope(prev, selectedDate, scope));
    modals.closeClearPlan();
  }, [selectedDate, setDayPlans, modals]);

  const handleUpdatePlan = useCallback((type: MealType, dishIds: string[]) => {
    setDayPlans(prev => updateDayPlanSlot(prev, selectedDate, type, dishIds));
  }, [selectedDate, setDayPlans]);

  const isDishUsed = useCallback((dishId: string) =>
    dayPlans.some(p =>
      p.breakfastDishIds.includes(dishId) ||
      p.lunchDishIds.includes(dishId) ||
      p.dinnerDishIds.includes(dishId)
    ), [dayPlans]);

  const isIngredientUsed = useCallback((ingId: string) => dishes.some(d => d.ingredients.some(di => di.ingredientId === ingId)), [dishes]);

  const handleDeleteIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
    setDishes(prev => removeIngredientFromDishes(prev, id));
  }, [setIngredients, setDishes]);

  const handleSaveAnalyzedDish = useCallback((result: SaveAnalyzedDishPayload) => {
    const { newIngredients, dishIngredients } = processAnalyzedDish(result, ingredients);
    if (newIngredients.length > 0) setIngredients(prev => [...prev, ...newIngredients]);

    if (result.shouldCreateDish === false) {
      notify.success(t('notification.saveSuccess'), t('notification.savedIngredients', { count: newIngredients.length }));
      setActiveMainTab('management');
      setActiveManagementSubTab('ingredients');
    } else {
      setDishes(prev => [...prev, { id: generateId('dish'), name: result.name, ingredients: dishIngredients, tags: result.tags ?? ['lunch'] }]);
      notify.success(t('notification.saveSuccess'), t('notification.savedDish', { name: result.name, count: newIngredients.length }));
      setActiveMainTab('management');
      setActiveManagementSubTab('dishes');
    }
  }, [ingredients, notify, setIngredients, setDishes, t]);

  const openTypeSelection = useCallback(() => modals.openTypeSelection(), [modals]);
  const openClearPlan = useCallback(() => modals.openClearPlan(), [modals]);
  const openGoalModal = useCallback(() => modals.openGoalModal(), [modals]);

  const handleAnalysisComplete = useCallback(() => {
    if (activeMainTabRef.current !== 'ai-analysis') {
      setHasNewAIResult(true);
      notify.success(t('notification.analysisComplete'), t('notification.analysisCompleteHint'), { onClick: () => setActiveMainTab('ai-analysis') });
    }
  }, [notify, t]);

  const handleImportData = useCallback((data: Record<string, unknown>) => {
    const { validEntries, invalidKeys } = validateImportData(data);

    for (const key of invalidKeys) {
      notify.warning(t('notification.invalidData'), t('notification.invalidDataDesc', { key }));
    }

    if ('mp-ingredients' in validEntries) setIngredients(validEntries['mp-ingredients'] as Ingredient[]);
    if ('mp-dishes' in validEntries) setDishes(validEntries['mp-dishes'] as Dish[]);
    if ('mp-day-plans' in validEntries) setDayPlans(validEntries['mp-day-plans'] as DayPlan[]);
    if ('mp-user-profile' in validEntries) setUserProfile(validEntries['mp-user-profile'] as UserProfile);

    const importedCount = Object.keys(validEntries).length;
    if (importedCount > 0) {
      notify.success(t('notification.importSuccess'), t('notification.importSuccessDesc', { count: importedCount }));
    }
  }, [notify, setIngredients, setDishes, setDayPlans, setUserProfile, t]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-800 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 pt-safe" role="banner">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm" aria-hidden="true">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                <span className="sm:hidden">{getTabLabels(t)[activeMainTab]}</span>
                <span className="hidden sm:inline">Smart Meal Planner</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">{t('header.subtitle', { weight: userProfile.weight })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const THEME_LABELS: Record<string, string> = { light: t('header.themeLight'), dark: t('header.themeDark'), system: t('header.themeSystem') };
              const THEME_TITLES: Record<string, string> = { light: t('header.themeLightTitle'), dark: t('header.themeDarkTitle'), system: t('header.themeSystemTitle') };
              return (
                <button
                  onClick={cycleTheme}
                  className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                  aria-label={t('header.themeAriaLabel', { theme: THEME_LABELS[theme] })}
                  title={THEME_TITLES[theme]}
                >
                  {theme === 'light' && <Sun className="w-5 h-5" />}
                  {theme === 'dark' && <Moon className="w-5 h-5" />}
                  {theme === 'system' && <Monitor className="w-5 h-5" />}
                </button>
              );
            })()}
            <DesktopNav activeTab={activeMainTab} onTabChange={handleTabChange} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className={activeMainTab === 'calendar' ? 'block' : 'hidden'} role="tabpanel" aria-label={t('nav.calendar')}>
          <ErrorBoundary fallbackTitle={t('errorBoundary.calendarTab')}>
          <CalendarTab
            selectedDate={selectedDate} onSelectDate={setSelectedDate} dayPlans={dayPlans}
            dishes={dishes} ingredients={ingredients} currentPlan={currentPlan}
            dayNutrition={dayNutrition}
            userWeight={userProfile.weight} targetCalories={userProfile.targetCalories} targetProtein={targetProtein}
            isSuggesting={aiSuggestion.isLoading}
            onOpenTypeSelection={openTypeSelection} onOpenClearPlan={openClearPlan}
            onOpenGoalModal={openGoalModal} onPlanMeal={handlePlanMeal} onSuggestMealPlan={aiSuggestion.startSuggestion}
          />
          </ErrorBoundary>
        </div>

        {activeMainTab === 'grocery' && (
          <ErrorBoundary fallbackTitle={t('errorBoundary.groceryTab')}>
          <Suspense fallback={<TabLoadingFallback />}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('grocery.title')}</h2>
              </div>
            </div>
            <GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={selectedDate} allDishes={dishes} allIngredients={ingredients} />
          </div>
          </Suspense>
          </ErrorBoundary>
        )}

        <div className={activeMainTab === 'management' ? 'block' : 'hidden'} role="tabpanel" aria-label={t('nav.management')}>
          <ErrorBoundary fallbackTitle={t('errorBoundary.managementTab')}>
          <ManagementTab
            activeSubTab={activeManagementSubTab} onSubTabChange={setActiveManagementSubTab}
            ingredients={ingredients} dishes={dishes}
            onAddIngredient={ing => setIngredients(prev => [...prev, ing])}
            onUpdateIngredient={ing => setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i))}
            onDeleteIngredient={handleDeleteIngredient} isIngredientUsed={isIngredientUsed}
            onAddDish={dish => setDishes(prev => [...prev, dish])}
            onUpdateDish={dish => setDishes(prev => prev.map(d => d.id === dish.id ? dish : d))}
            onDeleteDish={id => setDishes(prev => prev.filter(d => d.id !== id))} isDishUsed={isDishUsed}
          />
          </ErrorBoundary>
        </div>

        {activeMainTab === 'ai-analysis' && (
          <ErrorBoundary fallbackTitle={t('errorBoundary.aiTab')}>
          <Suspense fallback={<TabLoadingFallback />}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('ai.title')}</h2>
              </div>
            </div>
            <AIImageAnalyzer onAnalysisComplete={handleAnalysisComplete} onSave={handleSaveAnalyzedDish} />
          </div>
          </Suspense>
          </ErrorBoundary>
        )}

        {activeMainTab === 'settings' && (
          <ErrorBoundary fallbackTitle={t('errorBoundary.settingsTab')}>
            <SettingsTab onImportData={handleImportData} />
          </ErrorBoundary>
        )}
      </main>

      {modals.isTypeSelectionModalOpen && <TypeSelectionModal currentPlan={currentPlan} onSelectType={handlePlanMeal} onClose={modals.closeTypeSelection} />}
      {modals.isPlanningModalOpen && modals.planningType && (
        <PlanningModal
          planningType={modals.planningType}
          dishes={dishes}
          ingredients={ingredients}
          currentDishIds={currentPlan[getDayPlanSlotKey(modals.planningType)] as string[]}
          onConfirm={(dishIds) => {
            const plannedType = modals.planningType;
            if (!plannedType) return;
            handleUpdatePlan(plannedType, dishIds);
            modals.closePlanningModal();
            const mealLabel = t(`meal.${plannedType}Full`);
            notify.success(t('notification.planUpdated'), t('notification.planUpdatedDesc', { count: dishIds.length, meal: mealLabel }));
          }}
          onClose={modals.closePlanningModal}
          onBack={modals.backToPlanningTypeSelection}
        />
      )}
      {modals.isClearPlanModalOpen && <ClearPlanModal dayPlans={dayPlans} selectedDate={selectedDate} onClear={handleClearPlan} onClose={modals.closeClearPlan} />}
      {modals.isGoalModalOpen && <GoalSettingsModal userProfile={userProfile} onUpdateProfile={setUserProfile} onClose={modals.closeGoalModal} />}

      <AISuggestionPreviewModal
        isOpen={aiSuggestion.isModalOpen}
        suggestion={aiSuggestion.suggestion}
        dishes={dishes}
        ingredients={ingredients}
        targetCalories={userProfile.targetCalories}
        targetProtein={targetProtein}
        isLoading={aiSuggestion.isLoading}
        error={aiSuggestion.error}
        onClose={aiSuggestion.close}
        onApply={aiSuggestion.apply}
        onRegenerate={aiSuggestion.regenerate}
        onEditMeal={handleEditAISuggestionMeal}
      />

      <BottomNavBar activeTab={activeMainTab} onTabChange={handleTabChange} showAIBadge={hasNewAIResult} />
    </div>
  );
}
