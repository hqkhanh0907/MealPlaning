import React from 'react';
import {
  CalendarDays, Plus, Edit3, Sparkles, Loader2, Trash2,
  Info, AlertCircle, CheckCircle2, ChefHat, MoreVertical
} from 'lucide-react';
import { Dish, Ingredient, DayPlan, MealType, DayNutritionSummary, SlotInfo } from '../types';
import { Summary } from './Summary';
import { DateSelector } from './DateSelector';
import { getDynamicTips, NutritionTip } from '../utils/tips';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Bữa Sáng',
  lunch: 'Bữa Trưa',
  dinner: 'Bữa Tối',
};

const getMissingSlots = (dayNutrition: DayNutritionSummary): string => {
  const missing: string[] = [];
  if (dayNutrition.breakfast.dishIds.length === 0) missing.push('bữa sáng');
  if (dayNutrition.lunch.dishIds.length === 0) missing.push('bữa trưa');
  if (dayNutrition.dinner.dishIds.length === 0) missing.push('bữa tối');
  return missing.join(', ');
};

interface MealCardProps {
  type: MealType;
  slot: SlotInfo;
  dishes: Dish[];
  onEdit: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ type, slot, dishes, onEdit }) => {
  const dishNames = slot.dishIds
    .map(id => dishes.find(d => d.id === id)?.name)
    .filter(Boolean);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {MEAL_TYPE_LABELS[type]}
        </span>
        <button
          onClick={onEdit}
          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      {dishNames.length > 0 ? (
        <div className="space-y-2">
          {dishNames.map((name) => (
            <div key={name} className="flex items-center gap-2">
              <ChefHat className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium text-slate-800 text-sm">{name}</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-50">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
              {Math.round(slot.calories)} kcal
            </span>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">
              {Math.round(slot.protein)}g Pro
            </span>
          </div>
        </div>
      ) : (
        <button onClick={onEdit} className="w-full py-3 sm:py-4 text-center border-2 border-dashed border-slate-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 active:bg-emerald-50 transition-all min-h-12 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4 text-slate-300" />
          <p className="text-sm text-slate-400">Thêm món ăn</p>
        </button>
      )}
    </div>
  );
};

interface RecommendationPanelProps {
  weight: number;
  targetCalories: number;
  targetProtein: number;
  dayNutrition: DayNutritionSummary;
}

const TIP_STYLES: Record<NutritionTip['type'], string> = {
  success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
  warning: 'bg-amber-50 border-amber-100 text-amber-800',
  info: 'bg-blue-50 border-blue-100 text-blue-800',
};

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ weight, targetCalories, targetProtein, dayNutrition }) => {
  const tips = React.useMemo(() => getDynamicTips(dayNutrition, targetCalories, targetProtein), [dayNutrition, targetCalories, targetProtein]);
  const isComplete = dayNutrition.breakfast.dishIds.length > 0 && dayNutrition.lunch.dishIds.length > 0 && dayNutrition.dinner.dishIds.length > 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col">
      <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
        <Info className="w-5 h-5" />
        <h3>Gợi ý cho bạn</h3>
      </div>
      <div className="flex-1 space-y-3 text-sm text-slate-600 leading-relaxed">
        <p className="text-slate-500">
          Mục tiêu: <strong>{weight}kg</strong> · <strong>{targetCalories} kcal</strong> · <strong>{targetProtein}g protein</strong>
        </p>

        {tips.map((tip, idx) => (
          <div key={idx} className={`p-3 rounded-xl border ${TIP_STYLES[tip.type]}`}>
            <p className="font-medium">
              <span className="mr-1.5">{tip.emoji}</span>
              {tip.text}
            </p>
          </div>
        ))}

        {isComplete ? (
          <div className="flex items-center gap-2 text-emerald-600 font-medium pt-1">
            <CheckCircle2 className="w-4 h-4" />
            Kế hoạch ngày hôm nay đã hoàn tất!
          </div>
        ) : dayNutrition.breakfast.dishIds.length > 0 || dayNutrition.lunch.dishIds.length > 0 || dayNutrition.dinner.dishIds.length > 0 ? (
          <div className="flex items-center gap-2 text-amber-600 font-medium pt-1">
            <AlertCircle className="w-4 h-4" />
            Bạn còn thiếu {getMissingSlots(dayNutrition)}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export interface CalendarTabProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayPlans: DayPlan[];
  dishes: Dish[];
  ingredients: Ingredient[];
  currentPlan: DayPlan;
  dayNutrition: DayNutritionSummary;
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

const MoreMenu: React.FC<{ onClearPlan: () => void }> = ({ onClearPlan }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all min-h-11 min-w-11"
        aria-label="Thêm tùy chọn"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 min-w-44">
          <button
            onClick={() => { onClearPlan(); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Xóa kế hoạch
          </button>
        </div>
      )}
    </div>
  );
};

export const CalendarTab: React.FC<CalendarTabProps> = ({
  selectedDate, onSelectDate, dayPlans, dishes,
  dayNutrition, userWeight, targetCalories, targetProtein,
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
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 min-h-11"
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
            dayNutrition={dayNutrition}
            targetCalories={targetCalories}
            targetProtein={targetProtein}
            onEditGoals={onOpenGoalModal}
          />
        </div>
        <RecommendationPanel weight={userWeight} targetCalories={targetCalories} targetProtein={targetProtein} dayNutrition={dayNutrition} />
      </section>

      {/* Planning Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Kế hoạch ăn uống</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenTypeSelection}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 min-h-11"
            >
              <Plus className="w-4 h-4" />
              Lên kế hoạch
            </button>
            <button
              onClick={onSuggestMealPlan}
              disabled={isSuggesting}
              className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-100 active:scale-[0.98] transition-all disabled:opacity-50 min-h-11"
            >
              {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">Gợi ý AI</span>
              <span className="sm:hidden">AI</span>
            </button>
            <MoreMenu onClearPlan={onOpenClearPlan} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {MEAL_TYPES.map(type => (
            <MealCard key={type} type={type} slot={dayNutrition[type]} dishes={dishes} onEdit={() => onPlanMeal(type)} />
          ))}
        </div>
      </section>
    </div>
  );
};

