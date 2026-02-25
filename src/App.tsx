import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { initialIngredients, initialDishes, initialMeals } from './data/initialData';
import { Ingredient, Dish, Meal, DayPlan, MealType, DishIngredient, UserProfile, SaveAnalyzedDishPayload } from './types';
import { calculateMealNutrition } from './utils/nutrition';
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
import {
  CalendarDays,
  Settings2,
  Utensils,
  Sparkles,
  BookOpen,
  ShoppingCart
} from 'lucide-react';
import { suggestMealPlan, AvailableMealInfo } from './services/geminiService';

// --- Types ---

type MainTab = 'calendar' | 'management' | 'ai-analysis' | 'grocery';
type ManagementSubTab = 'ingredients' | 'dishes' | 'meals';

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

const applySuggestionToDayPlans = (
  plans: DayPlan[], selectedDate: string,
  suggestion: { breakfastId: string; lunchId: string; dinnerId: string }
): DayPlan[] => {
  const existing = plans.find(p => p.date === selectedDate);
  if (existing) {
    return plans.map(p =>
      p.date === selectedDate
        ? { ...p, breakfastId: suggestion.breakfastId || p.breakfastId, lunchId: suggestion.lunchId || p.lunchId, dinnerId: suggestion.dinnerId || p.dinnerId }
        : p
    );
  }
  return [...plans, { date: selectedDate, breakfastId: suggestion.breakfastId || null, lunchId: suggestion.lunchId || null, dinnerId: suggestion.dinnerId || null }];
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

const NAV_ITEMS: { tab: MainTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'calendar', icon: <CalendarDays className="w-5 h-5" />, label: 'Lịch trình' },
  { tab: 'management', icon: <BookOpen className="w-5 h-5" />, label: 'Thư viện' },
  { tab: 'ai-analysis', icon: <Sparkles className="w-5 h-5" />, label: 'AI' },
  { tab: 'grocery', icon: <ShoppingCart className="w-5 h-5" />, label: 'Đi chợ' },
];

const DESKTOP_NAV_ITEMS: { tab: MainTab; icon: React.ReactNode; label: string }[] = [
  { tab: 'calendar', icon: <CalendarDays className="w-4 h-4" />, label: 'Lịch trình' },
  { tab: 'management', icon: <Settings2 className="w-4 h-4" />, label: 'Quản lý' },
  { tab: 'ai-analysis', icon: <Sparkles className="w-4 h-4" />, label: 'AI Phân tích' },
  { tab: 'grocery', icon: <ShoppingCart className="w-4 h-4" />, label: 'Đi chợ' },
];

const BottomNavBar: React.FC<{ activeTab: MainTab; onTabChange: (tab: MainTab) => void }> = ({ activeTab, onTabChange }) => (
  <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 sm:hidden">
    <div className="flex items-center justify-around px-2 py-1">
      {NAV_ITEMS.map(({ tab, icon, label }) => (
        <button key={tab} onClick={() => onTabChange(tab)} className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-h-14 rounded-xl transition-all ${activeTab === tab ? 'text-emerald-600' : 'text-slate-400 active:text-slate-600'}`}>
          {icon}<span className="text-[10px] font-bold">{label}</span>
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

  const [activeManagementSubTab, setActiveManagementSubTab] = useState<ManagementSubTab>('meals');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [userProfile, setUserProfile] = usePersistedState<UserProfile>('mp-user-profile', { weight: 83, proteinRatio: 2, targetCalories: 1500 });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const [ingredients, setIngredients] = usePersistedState<Ingredient[]>('mp-ingredients', initialIngredients);
  const [dishes, setDishes] = usePersistedState<Dish[]>('mp-dishes', initialDishes);
  const [meals, setMeals] = usePersistedState<Meal[]>('mp-meals', initialMeals);
  const [dayPlans, setDayPlans] = usePersistedState<DayPlan[]>('mp-day-plans', []);

  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false);
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);
  const [planningType, setPlanningType] = useState<MealType | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const notify = useNotification();

  const currentPlan = useMemo(() =>
    dayPlans.find(p => p.date === selectedDate) || { date: selectedDate, breakfastId: null, lunchId: null, dinnerId: null },
    [dayPlans, selectedDate]
  );

  const selectedMealsForSummary = useMemo(() => {
    const getMeal = (id: string | null) => {
      if (!id) return null;
      const meal = meals.find(m => m.id === id);
      if (!meal) return null;
      return { ...meal, ...calculateMealNutrition(meal, dishes, ingredients) };
    };
    return { breakfast: getMeal(currentPlan.breakfastId), lunch: getMeal(currentPlan.lunchId), dinner: getMeal(currentPlan.dinnerId) };
  }, [currentPlan, meals, dishes, ingredients]);

  const targetProtein = Math.round(userProfile.weight * userProfile.proteinRatio);

  const handlePlanMeal = useCallback((type: MealType) => {
    setPlanningType(type);
    setIsTypeSelectionModalOpen(false);
    setIsPlanningModalOpen(true);
  }, []);

  const handleSuggestMealPlan = useCallback(async () => {
    try {
      setIsSuggesting(true);
      const availableMeals: AvailableMealInfo[] = meals.map(m => {
        const n = calculateMealNutrition(m, dishes, ingredients);
        return { id: m.id, name: m.name, type: m.type, calories: Math.round(n.calories), protein: Math.round(n.protein) };
      });
      const suggestion = await suggestMealPlan(userProfile.targetCalories, targetProtein, availableMeals);
      if (suggestion.breakfastId || suggestion.lunchId || suggestion.dinnerId) {
        setDayPlans(prev => applySuggestionToDayPlans(prev, selectedDate, suggestion));
        notify.success('Đã gợi ý thực đơn!', suggestion.reasoning || 'AI đã chọn thực đơn phù hợp cho bạn.');
      }
    } catch (error) {
      console.error("Failed to suggest meal plan:", error);
      notify.error('Gợi ý thất bại', 'Có lỗi xảy ra khi gợi ý thực đơn. Vui lòng kiểm tra lại API Key.');
    } finally {
      setIsSuggesting(false);
    }
  }, [meals, dishes, ingredients, userProfile.targetCalories, targetProtein, selectedDate]);

  const handleClearPlan = useCallback((scope: 'day' | 'week' | 'month') => {
    setDayPlans(prev => clearPlansByScope(prev, selectedDate, scope));
    setIsClearPlanModalOpen(false);
  }, [selectedDate]);

  const handleUpdatePlan = useCallback((type: MealType, mealId: string | null) => {
    setDayPlans(prev => {
      const existing = prev.find(p => p.date === selectedDate);
      if (existing) return prev.map(p => p.date === selectedDate ? { ...p, [`${type}Id`]: mealId } : p);
      return [...prev, { date: selectedDate, breakfastId: type === 'breakfast' ? mealId : null, lunchId: type === 'lunch' ? mealId : null, dinnerId: type === 'dinner' ? mealId : null }];
    });
  }, [selectedDate]);

  const isMealUsed = useCallback((mealId: string) => dayPlans.some(p => p.breakfastId === mealId || p.lunchId === mealId || p.dinnerId === mealId), [dayPlans]);
  const isDishUsed = useCallback((dishId: string) => meals.some(m => m.dishIds.includes(dishId)), [meals]);
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
      setDishes(prev => [...prev, { id: `dish-${Date.now()}`, name: result.name, ingredients: dishIngredients }]);
      notify.success('Lưu thành công!', `Đã lưu món "${result.name}" và ${newIngredients.length} nguyên liệu mới.`);
      setActiveMainTab('management');
      setActiveManagementSubTab('dishes');
    }
  }, [ingredients]);

  const openTypeSelection = useCallback(() => setIsTypeSelectionModalOpen(true), []);
  const openClearPlan = useCallback(() => setIsClearPlanModalOpen(true), []);
  const openGoalModal = useCallback(() => setIsGoalModalOpen(true), []);

  const handleAnalysisComplete = useCallback(() => {
    if (activeMainTabRef.current !== 'ai-analysis') {
      notify.success('Phân tích hoàn tất!', 'Nhấn để xem kết quả', { onClick: () => setActiveMainTab('ai-analysis') });
    }
  }, [notify]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">Smart Meal Planner</h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Dinh dưỡng chính xác cho {userProfile.weight}kg</p>
            </div>
          </div>

          {/* Desktop Navigation - hidden on mobile */}
          <DesktopNav activeTab={activeMainTab} onTabChange={setActiveMainTab} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className={activeMainTab === 'calendar' ? 'block' : 'hidden'}>
          <CalendarTab
            selectedDate={selectedDate} onSelectDate={setSelectedDate} dayPlans={dayPlans}
            meals={meals} dishes={dishes} ingredients={ingredients} currentPlan={currentPlan}
            selectedMealsForSummary={selectedMealsForSummary}
            userWeight={userProfile.weight} targetCalories={userProfile.targetCalories} targetProtein={targetProtein}
            isSuggesting={isSuggesting}
            onOpenTypeSelection={openTypeSelection} onOpenClearPlan={openClearPlan}
            onOpenGoalModal={openGoalModal} onPlanMeal={handlePlanMeal} onSuggestMealPlan={handleSuggestMealPlan}
          />
        </div>

        <div className={activeMainTab === 'grocery' ? 'block' : 'hidden'}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800">Danh sách đi chợ</h2>
              </div>
            </div>
            <GroceryList selectedMeals={selectedMealsForSummary} allDishes={dishes} allIngredients={ingredients} />
          </div>
        </div>

        <div className={activeMainTab === 'management' ? 'block' : 'hidden'}>
          <ManagementTab
            activeSubTab={activeManagementSubTab} onSubTabChange={setActiveManagementSubTab}
            ingredients={ingredients} dishes={dishes} meals={meals}
            onAddIngredient={ing => setIngredients(prev => [...prev, ing])}
            onUpdateIngredient={ing => setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i))}
            onDeleteIngredient={handleDeleteIngredient} isIngredientUsed={isIngredientUsed}
            onAddDish={dish => setDishes(prev => [...prev, dish])}
            onUpdateDish={dish => setDishes(prev => prev.map(d => d.id === dish.id ? dish : d))}
            onDeleteDish={id => setDishes(prev => prev.filter(d => d.id !== id))} isDishUsed={isDishUsed}
            onAddMeal={meal => setMeals(prev => [...prev, meal])}
            onUpdateMeal={meal => setMeals(prev => prev.map(m => m.id === meal.id ? meal : m))}
            onDeleteMeal={id => setMeals(prev => prev.filter(m => m.id !== id))} isMealUsed={isMealUsed}
          />
        </div>

        <div className={activeMainTab === 'ai-analysis' ? 'block' : 'hidden'}>
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-800">AI Phân tích hình ảnh</h2>
              </div>
            </div>
            <AIImageAnalyzer onAnalysisComplete={handleAnalysisComplete} onSave={handleSaveAnalyzedDish} />
          </div>
        </div>
      </main>


      {/* Modals */}
      {isTypeSelectionModalOpen && <TypeSelectionModal currentPlan={currentPlan} onSelectType={handlePlanMeal} onClose={() => setIsTypeSelectionModalOpen(false)} />}
      {isPlanningModalOpen && planningType && <PlanningModal planningType={planningType} meals={meals} dishes={dishes} ingredients={ingredients} currentPlan={currentPlan} onSelectMeal={handleUpdatePlan} onClose={() => setIsPlanningModalOpen(false)} onBack={() => { setIsPlanningModalOpen(false); setIsTypeSelectionModalOpen(true); }} />}
      {isClearPlanModalOpen && <ClearPlanModal onClear={handleClearPlan} onClose={() => setIsClearPlanModalOpen(false)} />}
      {isGoalModalOpen && <GoalSettingsModal userProfile={userProfile} onUpdateProfile={setUserProfile} onClose={() => setIsGoalModalOpen(false)} />}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar activeTab={activeMainTab} onTabChange={setActiveMainTab} />
    </div>
  );
}
