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
import { MealPlannerModal } from './components/modals/MealPlannerModal';
import { ClearPlanModal } from './components/modals/ClearPlanModal';
import { GoalSettingsModal } from './components/modals/GoalSettingsModal';
import { AISuggestionPreviewModal } from './components/modals/AISuggestionPreviewModal';
import { CopyPlanModal } from './components/modals/CopyPlanModal';
import { TemplateManager } from './components/modals/TemplateManager';
import { SaveTemplateModal } from './components/modals/SaveTemplateModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  Utensils,
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import { generateId, parseLocalDate } from './utils/helpers';
import { getLocalizedField } from './utils/localize';
import { useDarkMode } from './hooks/useDarkMode';
import { useAISuggestion } from './hooks/useAISuggestion';
import { useModalManager } from './hooks/useModalManager';
import { useCopyPlan } from './hooks/useCopyPlan';
import { useMealTemplate } from './hooks/useMealTemplate';
import {
  createEmptyDayPlan,
  clearPlansByScope,
  updateDayPlanSlot,
} from './services/planService';
import {
  removeIngredientFromDishes,
  migrateDayPlans,
  migrateDishes,
  migrateIngredients,
  processAnalyzedDish,
  validateImportData,
} from './services/dataService';
import { BottomNavBar, DesktopNav, TabLoadingFallback } from './components/navigation';
import { getTabLabels } from './components/navigation/types';
import type { MainTab } from './components/navigation';
import { useTranslateWorker } from './hooks/useTranslateWorker';
import { useTranslateProcessor } from './hooks/useTranslateProcessor';
import { useTranslateQueue } from './services/translateQueueService';
import { lookupFoodTranslation } from './data/foodDictionary';
import { UNDO_TOAST_DURATION_MS } from './data/constants';
import type { SupportedLang } from './types';

type ManagementSubTab = 'ingredients' | 'dishes';

/** Default user profile values used on first launch. */
const DEFAULT_USER_PROFILE: UserProfile = { weight: 83, proteinRatio: 2, targetCalories: 1500 };


// --- Main App component ---

export default function App() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLang;
  const { theme, setTheme } = useDarkMode();
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

  const [rawIngredients, setIngredients] = usePersistedState<Ingredient[]>('mp-ingredients', initialIngredients);
  const [rawDishes, setDishes] = usePersistedState<Dish[]>('mp-dishes', initialDishes);
  const [rawDayPlans, setDayPlans] = usePersistedState<DayPlan[]>('mp-day-plans', []);

  // Migrate old data formats
  const ingredients = useMemo(() => migrateIngredients(rawIngredients), [rawIngredients]);
  const dishes = useMemo(() => migrateDishes(rawDishes), [rawDishes]);

  // ── Background translation ─────────────────────────────────────────────
  /** Apply a translated field back into the persisted state */
  const updateTranslatedField = useCallback(
    (itemId: string, itemType: 'ingredient' | 'dish', direction: 'vi-en' | 'en-vi', translated: string) => {
      const targetLang: SupportedLang = direction === 'vi-en' ? 'en' : 'vi';
      if (itemType === 'ingredient') {
        setIngredients((prev) =>
          prev.map((ing) =>
            ing.id === itemId
              ? { ...ing, name: { ...ing.name, [targetLang]: translated } }
              : ing,
          ),
        );
      } else {
        setDishes((prev) =>
          prev.map((dish) =>
            dish.id === itemId
              ? { ...dish, name: { ...dish.name, [targetLang]: translated } }
              : dish,
          ),
        );
      }
    },
    [setIngredients, setDishes],
  );

  const { sendJob } = useTranslateWorker({
    onTranslated: updateTranslatedField,
    ingredients,
    dishes,
    currentLang,
  });

  useTranslateProcessor({ sendJob });
  // ──────────────────────────────────────────────────────────────────────
  const dayPlans = useMemo(() => migrateDayPlans(rawDayPlans), [rawDayPlans]);

  // Persist migrated data back to localStorage if migration changed something (one-time on mount)
  const hasMigratedRef = useRef(false);
  useEffect(() => {
    if (hasMigratedRef.current) return;
    const needsDishMigration = rawDishes.some((d: unknown) => {
      const tags = (d as Record<string, unknown>).tags;
      return !Array.isArray(tags) || tags.length === 0;
    });
    const needsIngMigration = rawIngredients.some((i: unknown) => {
      const name = (i as Record<string, unknown>).name;
      return typeof name === 'string';
    });
    if (needsDishMigration || needsIngMigration) {
      hasMigratedRef.current = true;
      if (needsDishMigration) setDishes(dishes);
      if (needsIngMigration) setIngredients(ingredients);
    }
  }, [rawDishes, rawIngredients, dishes, ingredients, setDishes, setIngredients]);

  const modals = useModalManager();

  const notify = useNotification();

  const copyPlanHook = useCopyPlan(dayPlans, setDayPlans);
  const mealTemplates = useMealTemplate();

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
    modals.openMealPlanner(type);
  }, [modals]);

  const handleEditAISuggestionMeal = useCallback((type: MealType) => {
    aiSuggestion.editMeal(type);
    modals.openMealPlanner(type);
  }, [aiSuggestion, modals]);

  const handleClearPlan = useCallback((scope: 'day' | 'week' | 'month') => {
    const backup = [...dayPlans];
    setDayPlans(prev => clearPlansByScope(prev, selectedDate, scope));
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
    setDayPlans(prev => updateDayPlanSlot(prev, selectedDate, type, dishIds));
  }, [selectedDate, setDayPlans]);

  const handleQuickAdd = useCallback((type: MealType, dishId: string) => {
    setDayPlans(prev => {
      const existing = prev.find(p => p.date === selectedDate);
      const slotKey = `${type}DishIds` as const;
      const currentIds = existing?.[slotKey] ?? [];
      return updateDayPlanSlot(prev, selectedDate, type, [...currentIds, dishId]);
    });
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      notify.success(t('notification.dishAdded'), getLocalizedField(dish.name, i18n.language as SupportedLang));
    }
  }, [selectedDate, setDayPlans, dishes, notify, t, i18n.language]);

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
      setDishes(prev => [...prev, { id: generateId('dish'), name: { vi: result.name, en: result.name }, ingredients: dishIngredients, tags: result.tags ?? ['lunch'] }]);
      notify.success(t('notification.saveSuccess'), t('notification.savedDish', { name: result.name, count: newIngredients.length }));
      setActiveMainTab('management');
      setActiveManagementSubTab('dishes');
    }
  }, [ingredients, notify, setIngredients, setDishes, t]);

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

  const handleSaveTemplate = useCallback((name: string) => {
    mealTemplates.saveTemplate(name, currentPlan);
    modals.closeSaveTemplate();
    notify.success(t('notification.templateSaved'));
  }, [currentPlan, mealTemplates, modals, notify, t]);

  const handleAnalysisComplete = useCallback(() => {
    // c8 ignore next 4
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

  // Enqueue background translation for the "other" language after saving.
  // If the static food dictionary has an instant match, apply it directly
  // without waiting for the WASM translate worker.
  const enqueueTranslation = useTranslateQueue.getState().enqueue;
  const direction: 'vi-en' | 'en-vi' = currentLang === 'vi' ? 'vi-en' : 'en-vi';
  const otherLang: SupportedLang = currentLang === 'vi' ? 'en' : 'vi';

  const handleAddIngredient = useCallback((ing: Ingredient) => {
    const sourceText = ing.name[currentLang];
    const dictResult = sourceText ? lookupFoodTranslation(sourceText, direction) : null;
    const saved = dictResult
      ? { ...ing, name: { ...ing.name, [otherLang]: dictResult } }
      : ing;
    setIngredients(prev => [...prev, saved]);
    if (sourceText && !dictResult) {
      enqueueTranslation({ itemId: ing.id, itemType: 'ingredient', sourceText, direction });
    }
  }, [setIngredients, currentLang, otherLang, enqueueTranslation, direction]);

  const handleUpdateIngredient = useCallback((ing: Ingredient) => {
    const sourceText = ing.name[currentLang];
    const dictResult = sourceText ? lookupFoodTranslation(sourceText, direction) : null;
    const saved = dictResult
      ? { ...ing, name: { ...ing.name, [otherLang]: dictResult } }
      : ing;
    setIngredients(prev => prev.map(i => i.id === ing.id ? saved : i));
    if (sourceText && !dictResult) {
      enqueueTranslation({ itemId: ing.id, itemType: 'ingredient', sourceText, direction });
    }
  }, [setIngredients, currentLang, otherLang, enqueueTranslation, direction]);

  const handleAddDish = useCallback((dish: Dish) => {
    const sourceText = dish.name[currentLang];
    const dictResult = sourceText ? lookupFoodTranslation(sourceText, direction) : null;
    const saved = dictResult
      ? { ...dish, name: { ...dish.name, [otherLang]: dictResult } }
      : dish;
    setDishes(prev => [...prev, saved]);
    if (sourceText && !dictResult) {
      enqueueTranslation({ itemId: dish.id, itemType: 'dish', sourceText, direction });
    }
  }, [setDishes, currentLang, otherLang, enqueueTranslation, direction]);

  const handleUpdateDish = useCallback((dish: Dish) => {
    const sourceText = dish.name[currentLang];
    const dictResult = sourceText ? lookupFoodTranslation(sourceText, direction) : null;
    const saved = dictResult
      ? { ...dish, name: { ...dish.name, [otherLang]: dictResult } }
      : dish;
    setDishes(prev => prev.map(d => d.id === dish.id ? saved : d));
    if (sourceText && !dictResult) {
      enqueueTranslation({ itemId: dish.id, itemType: 'dish', sourceText, direction });
    }
  }, [setDishes, currentLang, otherLang, enqueueTranslation, direction]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-800 transition-colors">
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
                {parseLocalDate(selectedDate).toLocaleDateString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: 'numeric', month: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">{t('header.subtitle', { weight: userProfile.weight })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DesktopNav activeTab={activeMainTab} onTabChange={handleTabChange} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-8">
        <div className={activeMainTab === 'calendar' ? 'block' : 'hidden'} role="tabpanel" aria-label={t('nav.calendar')} inert={activeMainTab === 'calendar' ? undefined : true}>
          <ErrorBoundary fallbackTitle={t('errorBoundary.calendarTab')}>
          <CalendarTab
            selectedDate={selectedDate} onSelectDate={setSelectedDate} dayPlans={dayPlans}
            dishes={dishes} ingredients={ingredients} currentPlan={currentPlan}
            dayNutrition={dayNutrition}
            userWeight={userProfile.weight} targetCalories={userProfile.targetCalories} targetProtein={targetProtein}
            isSuggesting={aiSuggestion.isLoading}
            onOpenTypeSelection={openTypeSelection} onOpenClearPlan={openClearPlan}
            onOpenGoalModal={openGoalModal} onPlanMeal={handlePlanMeal} onSuggestMealPlan={aiSuggestion.startSuggestion}
            onCopyPlan={openCopyPlan} onSaveTemplate={modals.openSaveTemplate} onOpenTemplateManager={openTemplateManager}
            onQuickAdd={handleQuickAdd}
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

        <div className={activeMainTab === 'management' ? 'block' : 'hidden'} role="tabpanel" aria-label={t('nav.management')} inert={activeMainTab === 'management' ? undefined : true}>
          <ErrorBoundary fallbackTitle={t('errorBoundary.managementTab')}>
          <ManagementTab
            activeSubTab={activeManagementSubTab} onSubTabChange={setActiveManagementSubTab}
            ingredients={ingredients} dishes={dishes}
            onAddIngredient={handleAddIngredient}
            onUpdateIngredient={handleUpdateIngredient}
            onDeleteIngredient={handleDeleteIngredient} isIngredientUsed={isIngredientUsed}
            onAddDish={handleAddDish}
            onUpdateDish={handleUpdateDish}
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
            <SettingsTab onImportData={handleImportData} dishes={dishes} ingredients={ingredients} theme={theme} setTheme={setTheme} />
          </ErrorBoundary>
        )}
      </main>

      {modals.isMealPlannerOpen && modals.planningType && (
        <MealPlannerModal
          dishes={dishes}
          ingredients={ingredients}
          currentPlan={currentPlan}
          selectedDate={selectedDate}
          initialTab={modals.planningType}
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
      {modals.isGoalModalOpen && <GoalSettingsModal userProfile={userProfile} onUpdateProfile={setUserProfile} onClose={modals.closeGoalModal} />}

      {modals.isCopyPlanOpen && (
        <CopyPlanModal
          sourceDate={selectedDate}
          sourcePlan={currentPlan}
          dishes={dishes}
          onCopy={(targetDates) => {
            copyPlanHook.copyPlan(selectedDate, targetDates);
            modals.closeCopyPlanModal();
            notify.success(t('notification.planCopied'), t('notification.planCopiedDesc', { count: targetDates.length }));
          }}
          onClose={modals.closeCopyPlanModal}
        />
      )}
      {modals.isTemplateManagerOpen && (
        <TemplateManager
          templates={mealTemplates.templates}
          dishes={dishes}
          onApply={(template) => {
            const plan = mealTemplates.applyTemplate(template, selectedDate);
            setDayPlans(prev => {
              const idx = prev.findIndex(p => p.date === selectedDate);
              if (idx >= 0) { const u = [...prev]; u[idx] = plan; return u; }
              return [...prev, plan];
            });
            modals.closeTemplateManager();
            notify.success(t('notification.templateApplied'));
          }}
          onDelete={(id) => {
            mealTemplates.deleteTemplate(id);
            notify.success(t('notification.templateDeleted'));
          }}
          onRename={(id, newName) => {
            mealTemplates.renameTemplate(id, newName);
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
