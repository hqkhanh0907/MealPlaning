import React from 'react';
import { X, Search, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Meal, Dish, Ingredient, MealType, DayPlan, NutritionInfo } from '../../types';
import { calculateMealNutrition } from '../../utils/nutrition';

type SortOption = 'name-asc' | 'name-desc' | 'cal-asc' | 'cal-desc' | 'pro-asc' | 'pro-desc';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Bữa Sáng',
  lunch: 'Bữa Trưa',
  dinner: 'Bữa Tối',
};

const ModalBackdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
    <button type="button" aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} tabIndex={-1} />
    {children}
  </div>
);

const sortMeals = (a: { name: string; nutrition: NutritionInfo }, b: { name: string; nutrition: NutritionInfo }, sortBy: SortOption): number => {
  switch (sortBy) {
    case 'name-asc': return a.name.localeCompare(b.name);
    case 'name-desc': return b.name.localeCompare(a.name);
    case 'cal-asc': return a.nutrition.calories - b.nutrition.calories;
    case 'cal-desc': return b.nutrition.calories - a.nutrition.calories;
    case 'pro-asc': return a.nutrition.protein - b.nutrition.protein;
    case 'pro-desc': return b.nutrition.protein - a.nutrition.protein;
    default: return 0;
  }
};

interface PlanningModalProps {
  planningType: MealType;
  meals: Meal[];
  dishes: Dish[];
  ingredients: Ingredient[];
  currentPlan: DayPlan;
  onSelectMeal: (type: MealType, mealId: string | null) => void;
  onClose: () => void;
  onBack: () => void;
}

export const PlanningModal: React.FC<PlanningModalProps> = ({
  planningType, meals, dishes, ingredients, currentPlan, onSelectMeal, onClose, onBack,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortOption>('name-asc');

  const filteredMeals = React.useMemo(() => {
    return meals
      .filter(m => m.type === planningType && m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(m => ({ meal: m, nutrition: calculateMealNutrition(m, dishes, ingredients) }))
      .sort((a, b) => sortMeals({ name: a.meal.name, nutrition: a.nutrition }, { name: b.meal.name, nutrition: b.nutrition }, sortBy));
  }, [meals, planningType, searchQuery, dishes, ingredients, sortBy]);

  const planKey = `${planningType}Id` as keyof DayPlan;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
        <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-all">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">Chọn món cho {MEAL_TYPE_LABELS[planningType]}</h3>
              <p className="text-xs sm:text-sm text-slate-500">Danh sách các món ăn phù hợp trong thư viện</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 py-4 sm:px-8 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bữa ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-sm sm:text-base"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white shadow-sm text-slate-700 font-medium appearance-none text-sm sm:text-base"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
            >
              <option value="name-asc">Tên (A-Z)</option>
              <option value="name-desc">Tên (Z-A)</option>
              <option value="cal-asc">Calo (Thấp - Cao)</option>
              <option value="cal-desc">Calo (Cao - Thấp)</option>
              <option value="pro-asc">Protein (Thấp - Cao)</option>
              <option value="pro-desc">Protein (Cao - Thấp)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 sm:space-y-4">
          {filteredMeals.map(({ meal, nutrition }) => {
            const isSelected = currentPlan[planKey] === meal.id;
            return (
              <button
                key={meal.id}
                onClick={() => onSelectMeal(planningType, isSelected ? null : meal.id)}
                className={`w-full text-left p-4 sm:p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'border-emerald-500 bg-white' : 'border-slate-100 hover:border-emerald-200'}`}
              >
                <div>
                  <h4 className={`font-bold text-base sm:text-lg mb-1 sm:mb-2 ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{meal.name}</h4>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                      {Math.round(nutrition.calories)} kcal
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      {Math.round(nutrition.protein)}g Protein
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent group-hover:border-emerald-300'}`}>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ModalBackdrop>
  );
};

