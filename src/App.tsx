import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { initialIngredients, initialDishes } from './data/initialData';
import { Ingredient, Dish, DayPlan, MealType, DishIngredient, UserProfile, SaveAnalyzedDishPayload, DayNutritionSummary } from './types';
import { calculateDishesNutrition, calculateDishNutrition } from './utils/nutrition';
import { GroceryList } from './components/GroceryList';
import { AIImageAnalyzer } from './components/AIImageAnalyzer';
import { CalendarTab } from './components/CalendarTab';
import { ManagementTab } from './components/ManagementTab';
import { usePersistedState } from './hooks/usePersistedState';
import { useNotification } from './contexts/NotificationContext';
import { TypeSelectionModal } from './components/modals/TypeSelectionModal';
import { ClearPlanModal } from './components/modals/ClearPlanModal';
import { PlanningModal } from './components/modals/PlanningModal';
import { GoalSettingsModal } from './components/modals/GoalSettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  CalendarDays,
  Settings2,
  Utensils,
  Sparkles,
  BookOpen,
  ShoppingCart
} from 'lucide-react';
import { suggestMealPlan, AvailableDishInfo } from './services/geminiService';

// --- Types ---

type MainTab = 'calendar' | 'management' | 'ai-analysis' | 'grocery';
type ManagementSubTab = 'ingredients' | 'dishes';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Bữa Sáng',
  lunch: 'Bữa Trưa',
  dinner: 'Bữa Tối',
};

// --- Pure helper functions ---

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

const removeIngredientFromDishes = (dishes: Dish[], ingredientId: string): Dish[] =>
  dishes.map(d => ({ ...d, ingredients: d.ingredients.filter(di => di.ingredientId !== ingredientId) }));

const getWeekRange = (dateStr: string): { start: Date; end: Date } => {
  const targetDate = new Date(dateStr);
  const day = targetDate.getDay();
  const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(targetDate.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const isDateInRange = (dateStr: string, start: Date, end: Date): boolean => {
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

const clearPlansByScope = (plans: DayPlan[], selectedDate: string, scope: 'day' | 'week' | 'month'): DayPlan[] => {
  if (scope === 'day') return plans.filter(p => p.date !== selectedDate);
  if (scope === 'week') {
    const { start, end } = getWeekRange(selectedDate);
    return plans.filter(p => !isDateInRange(p.date, start, end));
  }
  const targetDate = new Date(selectedDate);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  return plans.filter(p => {
    const pDate = new Date(p.date);
    return pDate.getFullYear() !== year || pDate.getMonth() !== month;
  });
};

const EMPTY_DAY_PLAN = (date: string): DayPlan => ({
  date, breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [],
});

const getDayPlanSlotKey = (type: MealType): keyof DayPlan => {
  const map: Record<MealType, keyof DayPlan> = {
    breakfast: 'breakfastDishIds',
    lunch: 'lunchDishIds',
    dinner: 'dinnerDishIds',
  };
  return map[type];
};

const applySuggestionToDayPlans = (
  plans: DayPlan[], selectedDate: string,
  suggestion: { breakfastDishIds: string[]; lunchDishIds: string[]; dinnerDishIds: string[] }
): DayPlan[] => {
  const existing = plans.find(p => p.date === selectedDate);
  const merged: DayPlan = {
    date: selectedDate,
    breakfastDishIds: suggestion.breakfastDishIds.length > 0 ? suggestion.breakfastDishIds : (existing?.breakfastDishIds ?? []),
    lunchDishIds: suggestion.lunchDishIds.length > 0 ? suggestion.lunchDishIds : (existing?.lunchDishIds ?? []),
    dinnerDishIds: suggestion.dinnerDishIds.length > 0 ? suggestion.dinnerDishIds : (existing?.dinnerDishIds ?? []),
  };
  if (existing) {
    return plans.map(p => p.date === selectedDate ? merged : p);
  }
  return [...plans, merged];
};

// Data migration: convert old format (breakfastId/mealId) to new format (dishIds)
const migrateDayPlans = (plans: unknown[]): DayPlan[] => {
  return plans.map((p: unknown) => {
    const plan = p as Record<string, unknown>;
    // Already new format
    if (Array.isArray(plan.breakfastDishIds)) return plan as unknown as DayPlan;
    // Old format — we can't lookup meals anymore, so just create empty
    return EMPTY_DAY_PLAN(plan.date as string);
  });
};

const migrateDishes = (dishes: unknown[]): Dish[] => {
  return (dishes as Record<string, unknown>[]).map(d => ({
    ...(d as unknown as Dish),
    tags: Array.isArray((d as Record<string, unknown>).tags) ? (d as unknown as Dish).tags : [] as MealType[],
  }));
};

const processAnalyzedDish = (
  result: SaveAnalyzedDishPayload, existingIngredients: Ingredient[]
): { newIngredients: Ingredient[]; dishIngredients: DishIngredient[] } => {
  const newIngredients: Ingredient[] = [];
  const dishIngredients: DishIngredient[] = [];
  const allIngredients = [...existingIngredients];

  for (const aiIng of result.ingredients) {
    let existingIng = allIngredients.find(i => i.name.toLowerCase() === aiIng.name.toLowerCase());
    if (!existingIng) {
      const newIng: Ingredient = {
        id: generateId('ing'), name: aiIng.name, unit: aiIng.unit,
        caloriesPer100: aiIng.nutritionPerStandardUnit.calories, proteinPer100: aiIng.nutritionPerStandardUnit.protein,
        carbsPer100: aiIng.nutritionPerStandardUnit.carbs, fatPer100: aiIng.nutritionPerStandardUnit.fat, fiberPer100: aiIng.nutritionPerStandardUnit.fiber,
      };
      newIngredients.push(newIng);
      allIngredients.push(newIng);
      existingIng = newIng;
    }
    dishIngredients.push({ ingredientId: existingIng.id, amount: aiIng.amount });
  }
  return { newIngredients, dishIngredients };
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
  <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 sm:hidden">
    <div className="flex items-center justify-around px-2 py-1">
      {NAV_ITEMS.map(({ tab, icon, label }) => (
        <button key={tab} onClick={() => onTabChange(tab)} className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-h-14 rounded-xl transition-all relative ${activeTab === tab ? 'text-emerald-600' : 'text-slate-400 active:text-slate-600'}`}>
          <div className="relative">
            {icon}
            {tab === 'ai-analysis' && showAIBadge && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
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
  <nav className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
    {DESKTOP_NAV_ITEMS.map(({ tab, icon, label }) => (
      <button key={tab} onClick={() => onTabChange(tab)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
        {icon}<span>{label}</span>
      </button>
    ))}
  </nav>
);

// --- Main App component ---

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('calendar');
  const activeMainTabRef = useRef(activeMainTab);
  useEffect(() => { activeMainTabRef.current = activeMainTab; }, [activeMainTab]);

  // Clear AI badge when navigating to AI tab
  useEffect(() => {
    if (activeMainTab === 'ai-analysis') setHasNewAIResult(false);
  }, [activeMainTab]);

  const [activeManagementSubTab, setActiveManagementSubTab] = useState<ManagementSubTab>('dishes');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [userProfile, setUserProfile] = usePersistedState<UserProfile>('mp-user-profile', { weight: 83, proteinRatio: 2, targetCalories: 1500 });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const [ingredients, setIngredients] = usePersistedState<Ingredient[]>('mp-ingredients', initialIngredients);
  const [rawDishes, setDishes] = usePersistedState<Dish[]>('mp-dishes', initialDishes);
  const [rawDayPlans, setDayPlans] = usePersistedState<DayPlan[]>('mp-day-plans', []);

  // Migrate old data formats
  const dishes = useMemo(() => migrateDishes(rawDishes), [rawDishes]);
  const dayPlans = useMemo(() => migrateDayPlans(rawDayPlans), [rawDayPlans]);

  // Persist migrated data back to localStorage if migration changed something
  useEffect(() => {
    const needsMigration = rawDishes.some((d: unknown) => !Array.isArray((d as Record<string, unknown>).tags));
    if (needsMigration) {
      setDishes(dishes);
    }
  }, []); // Only run once on mount

  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false);
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [planningType, setPlanningType] = useState<MealType | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [hasNewAIResult, setHasNewAIResult] = useState(false);

  const notify = useNotification();

  const currentPlan = useMemo(() =>
    dayPlans.find(p => p.date === selectedDate) || EMPTY_DAY_PLAN(selectedDate),
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

  const handleSuggestMealPlan = useCallback(async () => {
    try {
      setIsSuggesting(true);
      const availableDishes: AvailableDishInfo[] = dishes.map(d => {
        const n = calculateDishNutrition(d, ingredients);
        return { id: d.id, name: d.name, tags: d.tags, calories: Math.round(n.calories), protein: Math.round(n.protein) };
      });
      const suggestion = await suggestMealPlan(userProfile.targetCalories, targetProtein, availableDishes);
      if (suggestion.breakfastDishIds.length > 0 || suggestion.lunchDishIds.length > 0 || suggestion.dinnerDishIds.length > 0) {
        setDayPlans(prev => applySuggestionToDayPlans(prev, selectedDate, suggestion));
        notify.success('Đã gợi ý thực đơn!', suggestion.reasoning || 'AI đã chọn thực đơn phù hợp cho bạn.');
      }
    } catch (error) {
      console.error("Failed to suggest meal plan:", error);
      notify.error('Gợi ý thất bại', 'Có lỗi xảy ra khi gợi ý thực đơn. Vui lòng kiểm tra lại API Key.');
    } finally {
      setIsSuggesting(false);
    }
  }, [dishes, ingredients, userProfile.targetCalories, targetProtein, selectedDate, notify]);

  const handleClearPlan = useCallback((scope: 'day' | 'week' | 'month') => {
    setDayPlans(prev => clearPlansByScope(prev, selectedDate, scope));
    setIsClearPlanModalOpen(false);
  }, [selectedDate]);

  const handleUpdatePlan = useCallback((type: MealType, dishIds: string[]) => {
    const slotKey = getDayPlanSlotKey(type);
    setDayPlans(prev => {
      const existing = prev.find(p => p.date === selectedDate);
      if (existing) return prev.map(p => p.date === selectedDate ? { ...p, [slotKey]: dishIds } : p);
      return [...prev, { ...EMPTY_DAY_PLAN(selectedDate), [slotKey]: dishIds }];
    });
  }, [selectedDate]);

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
  }, []);

  const handleSaveAnalyzedDish = useCallback((result: SaveAnalyzedDishPayload) => {
    const { newIngredients, dishIngredients } = processAnalyzedDish(result, ingredients);
    if (newIngredients.length > 0) setIngredients(prev => [...prev, ...newIngredients]);

    if (result.shouldCreateDish === false) {
      notify.success('Lưu thành công!', `Đã lưu ${newIngredients.length} nguyên liệu mới vào thư viện.`);
      setActiveMainTab('management');
      setActiveManagementSubTab('ingredients');
    } else {
      setDishes(prev => [...prev, { id: `dish-${Date.now()}`, name: result.name, ingredients: dishIngredients, tags: [] }]);
      notify.success('Lưu thành công!', `Đã lưu món "${result.name}" và ${newIngredients.length} nguyên liệu mới.`);
      setActiveMainTab('management');
      setActiveManagementSubTab('dishes');
    }
  }, [ingredients, notify]);

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
    const IMPORT_KEYS = ['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile'];
    for (const key of IMPORT_KEYS) {
      if (key in data) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">
                <span className="sm:hidden">{TAB_LABELS[activeMainTab]}</span>
                <span className="hidden sm:inline">Smart Meal Planner</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Dinh dưỡng chính xác cho {userProfile.weight}kg</p>
            </div>
          </div>
          <DesktopNav activeTab={activeMainTab} onTabChange={setActiveMainTab} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className={activeMainTab === 'calendar' ? 'block' : 'hidden'}>
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

        <div className={activeMainTab === 'grocery' ? 'block' : 'hidden'}>
          <ErrorBoundary fallbackTitle="Lỗi tab Đi chợ">
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800">Danh sách đi chợ</h2>
              </div>
            </div>
            <GroceryList currentPlan={currentPlan} dayPlans={dayPlans} selectedDate={selectedDate} allDishes={dishes} allIngredients={ingredients} />
          </div>
          </ErrorBoundary>
        </div>

        <div className={activeMainTab === 'management' ? 'block' : 'hidden'}>
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

        <div className={activeMainTab === 'ai-analysis' ? 'block' : 'hidden'}>
          <ErrorBoundary fallbackTitle="Lỗi tab AI Phân tích">
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800">AI Phân tích hình ảnh</h2>
              </div>
            </div>
            <AIImageAnalyzer onAnalysisComplete={handleAnalysisComplete} onSave={handleSaveAnalyzedDish} />
          </div>
          </ErrorBoundary>
        </div>
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

      <BottomNavBar activeTab={activeMainTab} onTabChange={setActiveMainTab} showAIBadge={hasNewAIResult} />
    </div>
  );
}
