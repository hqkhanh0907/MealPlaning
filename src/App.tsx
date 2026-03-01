import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { initialIngredients, initialDishes } from './data/initialData';
import { Ingredient, Dish, DayPlan, MealType, UserProfile, SaveAnalyzedDishPayload, DayNutritionSummary, MealPlanSuggestion } from './types';
import { calculateDishesNutrition, calculateDishNutrition } from './utils/nutrition';
import { CalendarTab } from './components/CalendarTab';

// Lazy load less-frequently used tabs for code splitting
const GroceryList = React.lazy(() => import('./components/GroceryList').then(m => ({ default: m.GroceryList })));
const AIImageAnalyzer = React.lazy(() => import('./components/AIImageAnalyzer').then(m => ({ default: m.AIImageAnalyzer })));
import { ManagementTab } from './components/ManagementTab';
import { usePersistedState } from './hooks/usePersistedState';
import { useNotification } from './contexts/NotificationContext';
import { TypeSelectionModal } from './components/modals/TypeSelectionModal';
import { ClearPlanModal } from './components/modals/ClearPlanModal';
import { PlanningModal } from './components/modals/PlanningModal';
import { GoalSettingsModal } from './components/modals/GoalSettingsModal';
import { AISuggestionPreviewModal } from './components/modals/AISuggestionPreviewModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  CalendarDays,
  Settings2,
  Utensils,
  Sparkles,
  BookOpen,
  ShoppingCart,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { suggestMealPlan, AvailableDishInfo } from './services/geminiService';
import { generateId } from './utils/helpers';
import { useDarkMode } from './hooks/useDarkMode';
import {
  createEmptyDayPlan,
  getDayPlanSlotKey,
  clearPlansByScope,
  applySuggestionToDayPlans,
  updateDayPlanSlot,
} from './services/planService';
import {
  removeIngredientFromDishes,
  migrateDayPlans,
  migrateDishes,
  processAnalyzedDish,
} from './services/dataService';

// --- Types ---

type MainTab = 'calendar' | 'management' | 'ai-analysis' | 'grocery';
type ManagementSubTab = 'ingredients' | 'dishes';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Bữa Sáng',
  lunch: 'Bữa Trưa',
  dinner: 'Bữa Tối',
};


// --- Extracted UI components ---

const TAB_LABELS: Record<MainTab, string> = {
  'calendar': 'Lịch trình',
  'management': 'Thư viện',
  'ai-analysis': 'AI Phân tích',
  'grocery': 'Đi chợ',
};

const NAV_ITEMS: { tab: MainTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'calendar', icon: <CalendarDays className="w-6 h-6" />, label: 'Lịch trình' },
  { tab: 'management', icon: <BookOpen className="w-6 h-6" />, label: 'Thư viện' },
  { tab: 'ai-analysis', icon: <Sparkles className="w-6 h-6" />, label: 'AI' },
  { tab: 'grocery', icon: <ShoppingCart className="w-6 h-6" />, label: 'Đi chợ' },
];

const DESKTOP_NAV_ITEMS: { tab: MainTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'calendar', icon: <CalendarDays className="w-4 h-4" />, label: 'Lịch trình' },
  { tab: 'management', icon: <Settings2 className="w-4 h-4" />, label: 'Quản lý' },
  { tab: 'ai-analysis', icon: <Sparkles className="w-4 h-4" />, label: 'AI Phân tích' },
  { tab: 'grocery', icon: <ShoppingCart className="w-4 h-4" />, label: 'Đi chợ' },
];

const BottomNavBar: React.FC<{ activeTab: MainTab; onTabChange: (tab: MainTab) => void; showAIBadge?: boolean }> = ({ activeTab, onTabChange, showAIBadge }) => (
  <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 z-30 sm:hidden" aria-label="Điều hướng chính">
    <div className="flex items-center justify-around px-2 py-1" role="tablist">
      {NAV_ITEMS.map(({ tab, icon, label }) => (
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          aria-label={label}
          onClick={() => onTabChange(tab)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-h-14 rounded-xl transition-all relative ${activeTab === tab ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 active:text-slate-600'}`}
        >
          <div className="relative">
            {icon}
            {tab === 'ai-analysis' && showAIBadge && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </div>
          <span className="text-[11px] font-bold">{label}</span>
          {activeTab === tab && <div className="absolute -bottom-1 w-5 h-0.5 bg-emerald-500 rounded-full" />}
        </button>
      ))}
    </div>
    <div className="pb-safe" />
  </nav>
);

const DesktopNav: React.FC<{ activeTab: MainTab; onTabChange: (tab: MainTab) => void }> = ({ activeTab, onTabChange }) => (
  <nav className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" aria-label="Điều hướng chính">
    {DESKTOP_NAV_ITEMS.map(({ tab, icon, label }) => (
      <button
        key={tab}
        role="tab"
        aria-selected={activeTab === tab}
        onClick={() => onTabChange(tab)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
      >
        {icon}<span>{label}</span>
      </button>
    ))}
  </nav>
);

const TabLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
      <div className="w-8 h-8 border-3 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-sm font-medium">Đang tải...</p>
    </div>
  </div>
);

// --- Main App component ---

export default function App() {
  const { theme, cycleTheme } = useDarkMode();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('calendar');
  const activeMainTabRef = useRef(activeMainTab);
  useEffect(() => { activeMainTabRef.current = activeMainTab; }, [activeMainTab]);

  // Clear AI badge when navigating to AI tab
  useEffect(() => {
    if (activeMainTab === 'ai-analysis') setHasNewAIResult(false);
  }, [activeMainTab]);

  const [activeManagementSubTab, setActiveManagementSubTab] = useState<ManagementSubTab>('dishes');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [userProfile, setUserProfile] = usePersistedState<UserProfile>('mp-user-profile', { weight: 83, proteinRatio: 2, targetCalories: 1500 });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

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

  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false);
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [planningType, setPlanningType] = useState<MealType | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [hasNewAIResult, setHasNewAIResult] = useState(false);

  // AI Suggestion Preview state
  const [isAISuggestionModalOpen, setIsAISuggestionModalOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<MealPlanSuggestion | null>(null);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);

  // AbortController ref for cancelling AI calls
  const aiSuggestionAbortRef = useRef<AbortController | null>(null);

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

  const handlePlanMeal = useCallback((type: MealType) => {
    setPlanningType(type);
    setIsTypeSelectionModalOpen(false);
    setIsPlanningModalOpen(true);
  }, []);

  // Open AI Suggestion Preview Modal and start fetching
  const handleSuggestMealPlan = useCallback(async () => {
    // Abort any existing request
    if (aiSuggestionAbortRef.current) {
      aiSuggestionAbortRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    aiSuggestionAbortRef.current = abortController;

    setIsAISuggestionModalOpen(true);
    setAiSuggestion(null);
    setAiSuggestionError(null);
    setIsSuggesting(true);

    try {
      const availableDishes: AvailableDishInfo[] = dishes.map(d => {
        const n = calculateDishNutrition(d, ingredients);
        return { id: d.id, name: d.name, tags: d.tags, calories: Math.round(n.calories), protein: Math.round(n.protein) };
      });
      const suggestion = await suggestMealPlan(userProfile.targetCalories, targetProtein, availableDishes, abortController.signal);

      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setAiSuggestion(suggestion);
      }
    } catch (error) {
      // Don't show error if request was intentionally aborted
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error("Failed to suggest meal plan:", error);
      if (!abortController.signal.aborted) {
        setAiSuggestionError('Có lỗi xảy ra khi gợi ý thực đơn. Vui lòng thử lại.');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSuggesting(false);
      }
    }
  }, [dishes, ingredients, userProfile.targetCalories, targetProtein]);

  // Apply AI suggestion to day plans
  const handleApplyAISuggestion = useCallback((selectedMeals: { breakfast: boolean; lunch: boolean; dinner: boolean }) => {
    if (!aiSuggestion) return;

    const filteredSuggestion = {
      breakfastDishIds: selectedMeals.breakfast ? aiSuggestion.breakfastDishIds : [],
      lunchDishIds: selectedMeals.lunch ? aiSuggestion.lunchDishIds : [],
      dinnerDishIds: selectedMeals.dinner ? aiSuggestion.dinnerDishIds : [],
      reasoning: aiSuggestion.reasoning,
    };

    setDayPlans(prev => applySuggestionToDayPlans(prev, selectedDate, filteredSuggestion));
    setIsAISuggestionModalOpen(false);
    setAiSuggestion(null);
    aiSuggestionAbortRef.current = null;
    notify.success('Đã cập nhật kế hoạch!', 'Thực đơn gợi ý từ AI đã được áp dụng.');
  }, [aiSuggestion, selectedDate, notify, setDayPlans]);

  // Regenerate AI suggestion
  const handleRegenerateAISuggestion = useCallback(async () => {
    // Abort any existing request
    if (aiSuggestionAbortRef.current) {
      aiSuggestionAbortRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    aiSuggestionAbortRef.current = abortController;

    setAiSuggestion(null);
    setAiSuggestionError(null);
    setIsSuggesting(true);

    try {
      const availableDishes: AvailableDishInfo[] = dishes.map(d => {
        const n = calculateDishNutrition(d, ingredients);
        return { id: d.id, name: d.name, tags: d.tags, calories: Math.round(n.calories), protein: Math.round(n.protein) };
      });
      const suggestion = await suggestMealPlan(userProfile.targetCalories, targetProtein, availableDishes, abortController.signal);

      if (!abortController.signal.aborted) {
        setAiSuggestion(suggestion);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error("Failed to regenerate suggestion:", error);
      if (!abortController.signal.aborted) {
        setAiSuggestionError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSuggesting(false);
      }
    }
  }, [dishes, ingredients, userProfile.targetCalories, targetProtein]);

  // Edit a meal in AI suggestion (opens planning modal for that meal type)
  const handleEditAISuggestionMeal = useCallback((type: MealType) => {
    // Abort any pending AI request when editing
    if (aiSuggestionAbortRef.current) {
      aiSuggestionAbortRef.current.abort();
      aiSuggestionAbortRef.current = null;
    }
    // Close AI modal and open planning modal for edit
    setIsAISuggestionModalOpen(false);
    setIsSuggesting(false);
    setPlanningType(type);
    setIsPlanningModalOpen(true);
  }, []);

  // Close AI suggestion modal and abort any pending AI calls
  const handleCloseAISuggestionModal = useCallback(() => {
    // Abort any pending AI request
    if (aiSuggestionAbortRef.current) {
      aiSuggestionAbortRef.current.abort();
      aiSuggestionAbortRef.current = null;
    }
    setIsAISuggestionModalOpen(false);
    setAiSuggestion(null);
    setAiSuggestionError(null);
    setIsSuggesting(false);
  }, []);

  const handleClearPlan = useCallback((scope: 'day' | 'week' | 'month') => {
    setDayPlans(prev => clearPlansByScope(prev, selectedDate, scope));
    setIsClearPlanModalOpen(false);
  }, [selectedDate, setDayPlans]);

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
      notify.success('Lưu thành công!', `Đã lưu ${newIngredients.length} nguyên liệu mới vào thư viện.`);
      setActiveMainTab('management');
      setActiveManagementSubTab('ingredients');
    } else {
      setDishes(prev => [...prev, { id: generateId('dish'), name: result.name, ingredients: dishIngredients, tags: result.tags ?? ['lunch'] }]);
      notify.success('Lưu thành công!', `Đã lưu món "${result.name}" và ${newIngredients.length} nguyên liệu mới.`);
      setActiveMainTab('management');
      setActiveManagementSubTab('dishes');
    }
  }, [ingredients, notify, setIngredients, setDishes]);

  const openTypeSelection = useCallback(() => setIsTypeSelectionModalOpen(true), []);
  const openClearPlan = useCallback(() => setIsClearPlanModalOpen(true), []);
  const openGoalModal = useCallback(() => setIsGoalModalOpen(true), []);

  const handleAnalysisComplete = useCallback(() => {
    if (activeMainTabRef.current !== 'ai-analysis') {
      setHasNewAIResult(true);
      notify.success('Phân tích hoàn tất!', 'Nhấn để xem kết quả', { onClick: () => setActiveMainTab('ai-analysis') });
    }
  }, [notify]);

  const handleImportData = useCallback((data: Record<string, unknown>) => {
    const validators: Record<string, (v: unknown) => boolean> = {
      'mp-ingredients': (v) => Array.isArray(v) && v.every((i: unknown) =>
        typeof i === 'object' && i !== null && 'id' in i && 'name' in i && 'unit' in i
      ),
      'mp-dishes': (v) => Array.isArray(v) && v.every((d: unknown) =>
        typeof d === 'object' && d !== null && 'id' in d && 'name' in d && 'ingredients' in d
      ),
      'mp-day-plans': (v) => Array.isArray(v) && v.every((p: unknown) =>
        typeof p === 'object' && p !== null && 'date' in p
      ),
      'mp-user-profile': (v) =>
        typeof v === 'object' && v !== null && 'weight' in v && 'targetCalories' in v,
    };

    let importedCount = 0;
    for (const [key, validate] of Object.entries(validators)) {
      if (key in data) {
        if (validate(data[key])) {
          localStorage.setItem(key, JSON.stringify(data[key]));
          importedCount++;
        } else {
          notify.warning('Dữ liệu không hợp lệ', `Bỏ qua "${key}" do sai format.`);
        }
      }
    }

    if (importedCount > 0) {
      window.location.reload();
    }
  }, [notify]);

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
                <span className="sm:hidden">{TAB_LABELS[activeMainTab]}</span>
                <span className="hidden sm:inline">Smart Meal Planner</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Dinh dưỡng chính xác cho {userProfile.weight}kg</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
              aria-label={`Chế độ hiển thị: ${theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Hệ thống'}`}
              title={theme === 'light' ? 'Sáng — nhấn để đổi' : theme === 'dark' ? 'Tối — nhấn để đổi' : 'Theo hệ thống — nhấn để đổi'}
            >
              {theme === 'light' && <Sun className="w-5 h-5" />}
              {theme === 'dark' && <Moon className="w-5 h-5" />}
              {theme === 'system' && <Monitor className="w-5 h-5" />}
            </button>
            <DesktopNav activeTab={activeMainTab} onTabChange={setActiveMainTab} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className={activeMainTab === 'calendar' ? 'block' : 'hidden'} role="tabpanel" aria-label="Lịch trình">
          <ErrorBoundary fallbackTitle="Lỗi tab Lịch trình">
          <CalendarTab
            selectedDate={selectedDate} onSelectDate={setSelectedDate} dayPlans={dayPlans}
            dishes={dishes} ingredients={ingredients} currentPlan={currentPlan}
            dayNutrition={dayNutrition}
            userWeight={userProfile.weight} targetCalories={userProfile.targetCalories} targetProtein={targetProtein}
            isSuggesting={isSuggesting}
            onOpenTypeSelection={openTypeSelection} onOpenClearPlan={openClearPlan}
            onOpenGoalModal={openGoalModal} onPlanMeal={handlePlanMeal} onSuggestMealPlan={handleSuggestMealPlan}
          />
          </ErrorBoundary>
        </div>

        {activeMainTab === 'grocery' && (
          <ErrorBoundary fallbackTitle="Lỗi tab Đi chợ">
          <Suspense fallback={<TabLoadingFallback />}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Danh sách đi chợ</h2>
              </div>
            </div>
            <GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={selectedDate} allDishes={dishes} allIngredients={ingredients} />
          </div>
          </Suspense>
          </ErrorBoundary>
        )}

        <div className={activeMainTab === 'management' ? 'block' : 'hidden'} role="tabpanel" aria-label="Thư viện">
          <ErrorBoundary fallbackTitle="Lỗi tab Thư viện">
          <ManagementTab
            activeSubTab={activeManagementSubTab} onSubTabChange={setActiveManagementSubTab}
            ingredients={ingredients} dishes={dishes}
            onAddIngredient={ing => setIngredients(prev => [...prev, ing])}
            onUpdateIngredient={ing => setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i))}
            onDeleteIngredient={handleDeleteIngredient} isIngredientUsed={isIngredientUsed}
            onAddDish={dish => setDishes(prev => [...prev, dish])}
            onUpdateDish={dish => setDishes(prev => prev.map(d => d.id === dish.id ? dish : d))}
            onDeleteDish={id => setDishes(prev => prev.filter(d => d.id !== id))} isDishUsed={isDishUsed}
            onImportData={handleImportData}
          />
          </ErrorBoundary>
        </div>

        {activeMainTab === 'ai-analysis' && (
          <ErrorBoundary fallbackTitle="Lỗi tab AI Phân tích">
          <Suspense fallback={<TabLoadingFallback />}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">AI Phân tích hình ảnh</h2>
              </div>
            </div>
            <AIImageAnalyzer onAnalysisComplete={handleAnalysisComplete} onSave={handleSaveAnalyzedDish} />
          </div>
          </Suspense>
          </ErrorBoundary>
        )}
      </main>

      {isTypeSelectionModalOpen && <TypeSelectionModal currentPlan={currentPlan} onSelectType={handlePlanMeal} onClose={() => setIsTypeSelectionModalOpen(false)} />}
      {isPlanningModalOpen && planningType && (
        <PlanningModal
          planningType={planningType}
          dishes={dishes}
          ingredients={ingredients}
          currentDishIds={currentPlan[getDayPlanSlotKey(planningType)] as string[]}
          onConfirm={(dishIds) => {
            handleUpdatePlan(planningType, dishIds);
            setIsPlanningModalOpen(false);
            notify.success('Đã cập nhật!', `Đã chọn ${dishIds.length} món cho ${MEAL_TYPE_LABELS[planningType]}`);
          }}
          onClose={() => setIsPlanningModalOpen(false)}
          onBack={() => { setIsPlanningModalOpen(false); setIsTypeSelectionModalOpen(true); }}
        />
      )}
      {isClearPlanModalOpen && <ClearPlanModal dayPlans={dayPlans} selectedDate={selectedDate} onClear={handleClearPlan} onClose={() => setIsClearPlanModalOpen(false)} />}
      {isGoalModalOpen && <GoalSettingsModal userProfile={userProfile} onUpdateProfile={setUserProfile} onClose={() => setIsGoalModalOpen(false)} />}

      <AISuggestionPreviewModal
        isOpen={isAISuggestionModalOpen}
        suggestion={aiSuggestion}
        dishes={dishes}
        ingredients={ingredients}
        targetCalories={userProfile.targetCalories}
        targetProtein={targetProtein}
        isLoading={isSuggesting}
        error={aiSuggestionError}
        onClose={handleCloseAISuggestionModal}
        onApply={handleApplyAISuggestion}
        onRegenerate={handleRegenerateAISuggestion}
        onEditMeal={handleEditAISuggestionMeal}
      />

      <BottomNavBar activeTab={activeMainTab} onTabChange={setActiveMainTab} showAIBadge={hasNewAIResult} />
    </div>
  );
}
