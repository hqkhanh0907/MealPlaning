import React from 'react';
import {
  CalendarDays, Plus, Edit3, Sparkles, Loader2, Trash2,
  Info, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Meal, Dish, Ingredient, DayPlan, MealType, NutritionInfo, MealWithNutrition } from '../types';
import { calculateMealNutrition } from '../utils/nutrition';
import { Summary } from './Summary';
import { DateSelector } from './DateSelector';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Bữa Sáng',
  lunch: 'Bữa Trưa',
  dinner: 'Bữa Tối',
};

const getMissingMealsText = (meals: { breakfast: unknown; lunch: unknown; dinner: unknown }): string => {
  const missing: string[] = [];
  if (!meals.breakfast) missing.push('bữa sáng');
  if (!meals.lunch) missing.push('bữa trưa');
  if (!meals.dinner) missing.push('bữa tối');
  return missing.join(', ');
};

interface MealCardProps {
  type: MealType;
  meal: Meal | undefined;
  nutrition: NutritionInfo | null;
  onEdit: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ type, meal, nutrition, onEdit }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {MEAL_TYPE_LABELS[type]}
      </span>
      <button
        onClick={onEdit}
        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
      >
        <Edit3 className="w-4 h-4" />
      </button>
    </div>
    {meal && nutrition ? (
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-lg">{meal.name}</h4>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
            {Math.round(nutrition.calories)} kcal
          </span>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">
            {Math.round(nutrition.protein)}g Pro
          </span>
        </div>
      </div>
    ) : (
      <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
        <p className="text-sm text-slate-400">Chưa có món ăn</p>
      </div>
    )}
  </div>
);

interface RecommendationPanelProps {
  weight: number;
  targetProtein: number;
  selectedMeals: { breakfast: MealWithNutrition | null; lunch: MealWithNutrition | null; dinner: MealWithNutrition | null };
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ weight, targetProtein, selectedMeals }) => {
  const isComplete = selectedMeals.breakfast && selectedMeals.lunch && selectedMeals.dinner;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
        <Info className="w-5 h-5" />
        <h3>Gợi ý cho bạn</h3>
      </div>
      <div className="flex-1 space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          Dựa trên trọng lượng <strong>{weight}kg</strong>, bạn cần duy trì lượng protein cao (<strong>{targetProtein}g</strong>) để bảo vệ cơ bắp trong khi thâm hụt calo.
        </p>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <p className="text-emerald-800 font-medium mb-1">Mẹo tiêu hóa:</p>
          <p className="text-emerald-700/80">
            Hãy ưu tiên các món có Kimchi hoặc Sữa chua Hy Lạp để bổ sung probiotics, giúp hấp thụ protein tốt hơn.
          </p>
        </div>
        {isComplete ? (
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Kế hoạch ngày hôm nay đã hoàn tất!
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 font-medium">
            <AlertCircle className="w-4 h-4" />
            Bạn còn thiếu {getMissingMealsText(selectedMeals)}
          </div>
        )}
      </div>
    </div>
  );
};

interface CalendarTabProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayPlans: DayPlan[];
  meals: Meal[];
  dishes: Dish[];
  ingredients: Ingredient[];
  currentPlan: DayPlan;
  selectedMealsForSummary: { breakfast: MealWithNutrition | null; lunch: MealWithNutrition | null; dinner: MealWithNutrition | null };
  userWeight: number;
  targetCalories: number;
  targetProtein: number;
  isSuggesting: boolean;
  onOpenTypeSelection: () => void;
  onOpenClearPlan: () => void;
  onOpenGoalModal: () => void;
  onPlanMeal: (type: MealType) => void;
  onSuggestMealPlan: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export const CalendarTab: React.FC<CalendarTabProps> = ({
  selectedDate, onSelectDate, dayPlans, meals, dishes, ingredients, currentPlan,
  selectedMealsForSummary, userWeight, targetCalories, targetProtein,
  isSuggesting, onOpenTypeSelection, onOpenClearPlan, onOpenGoalModal, onPlanMeal, onSuggestMealPlan,
}) => {
  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Date Selection */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xl">
            <CalendarDays className="w-6 h-6 text-emerald-500" />
            <h2>Chọn ngày</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full border border-slate-200 text-center">
              {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <button
              onClick={onOpenTypeSelection}
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
            >
              <Plus className="w-4 h-4" />
              Lên kế hoạch
            </button>
          </div>
        </div>
        <DateSelector selectedDate={selectedDate} onSelectDate={onSelectDate} onPlanClick={onOpenTypeSelection} dayPlans={dayPlans} />
      </section>

      {/* Overview & Recommendation */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Summary
            selectedMeals={selectedMealsForSummary}
            targetCalories={targetCalories}
            targetProtein={targetProtein}
            onEditGoals={onOpenGoalModal}
          />
        </div>
        <RecommendationPanel weight={userWeight} targetProtein={targetProtein} selectedMeals={selectedMealsForSummary} />
      </section>

      {/* Planning Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Kế hoạch ăn uống</h2>
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onSuggestMealPlan}
              disabled={isSuggesting}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gợi ý AI
            </button>
            <button
              onClick={onOpenClearPlan}
              className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-medium hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
            <button
              onClick={onOpenTypeSelection}
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
            >
              <Plus className="w-4 h-4" />
              Lên kế hoạch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MEAL_TYPES.map(type => {
            const mealId = currentPlan[`${type}Id` as keyof DayPlan] as string | null;
            const meal = meals.find(m => m.id === mealId);
            const nutrition = meal ? calculateMealNutrition(meal, dishes, ingredients) : null;
            return <MealCard key={type} type={type} meal={meal} nutrition={nutrition} onEdit={() => onPlanMeal(type)} />;
          })}
        </div>
      </section>
    </div>
  );
};

