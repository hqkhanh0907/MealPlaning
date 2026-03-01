import React from 'react';
import { X, Search, ChevronRight, CheckCircle2, ChefHat } from 'lucide-react';
import { Dish, Ingredient, MealType, NutritionInfo } from '../../types';
import { calculateDishNutrition, calculateDishesNutrition } from '../../utils/nutrition';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

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

const sortDishes = (a: { name: string; nutrition: NutritionInfo }, b: { name: string; nutrition: NutritionInfo }, sortBy: SortOption): number => {
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
  dishes: Dish[];
  ingredients: Ingredient[];
  currentDishIds: string[];
  onConfirm: (dishIds: string[]) => void;
  onClose: () => void;
  onBack: () => void;
}

export const PlanningModal: React.FC<PlanningModalProps> = ({
  planningType, dishes, ingredients, currentDishIds, onConfirm, onClose, onBack,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortOption>('name-asc');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set(currentDishIds));

  useModalBackHandler(true, onClose);

  const toggleDish = (dishId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(dishId)) next.delete(dishId);
      else next.add(dishId);
      return next;
    });
  };

  const filteredDishes = React.useMemo(() => {
    return dishes
      .filter(d => d.tags?.includes(planningType))
      .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(d => ({ dish: d, nutrition: calculateDishNutrition(d, ingredients) }))
      .sort((a, b) => sortDishes({ name: a.dish.name, nutrition: a.nutrition }, { name: b.dish.name, nutrition: b.nutrition }, sortBy));
  }, [dishes, planningType, searchQuery, ingredients, sortBy]);

  const selectedNutrition = React.useMemo(() => {
    return calculateDishesNutrition(Array.from(selectedIds), dishes, ingredients);
  }, [selectedIds, dishes, ingredients]);

  const selectedCount = selectedIds.size;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
        <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-all min-h-11 min-w-11 flex items-center justify-center">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Chọn món cho {MEAL_TYPE_LABELS[planningType]}</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Chọn các món ăn cho bữa này</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-all min-h-11 min-w-11 flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4 py-3 sm:px-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none bg-white dark:bg-slate-700 dark:text-slate-100 shadow-sm text-base"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 focus:border-emerald-500 outline-none bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-medium text-base sm:text-sm min-h-11"
            >
              <option value="name-asc">Tên (A-Z)</option>
              <option value="name-desc">Tên (Z-A)</option>
              <option value="cal-asc">Calo (Thấp → Cao)</option>
              <option value="cal-desc">Calo (Cao → Thấp)</option>
              <option value="pro-asc">Protein (Thấp → Cao)</option>
              <option value="pro-desc">Protein (Cao → Thấp)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3">
          {filteredDishes.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có món ăn phù hợp cho {MEAL_TYPE_LABELS[planningType]}.</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Hãy thêm món ăn và gắn tag &quot;{MEAL_TYPE_LABELS[planningType]}&quot; trong Thư viện.</p>
            </div>
          )}
          {filteredDishes.map(({ dish, nutrition }) => {
            const isSelected = selectedIds.has(dish.id);
            return (
              <button
                key={dish.id}
                onClick={() => toggleDish(dish.id)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between group min-h-16 active:scale-[0.98] ${isSelected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-600'}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`font-bold text-base truncate ${isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>{dish.name}</h4>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{Math.round(nutrition.calories)} kcal</span>
                      <span className="text-xs font-bold text-blue-500 dark:text-blue-400">{Math.round(nutrition.protein)}g Pro</span>
                    </div>
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-3 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-600 text-transparent group-hover:border-emerald-300'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-4 sm:px-8 sm:py-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Đã chọn: <span className="font-bold text-slate-800 dark:text-slate-100">{selectedCount} món</span>
            </span>
            {selectedCount > 0 && (
              <span className="text-slate-500 dark:text-slate-400">
                {Math.round(selectedNutrition.calories)} kcal · {Math.round(selectedNutrition.protein)}g Pro
              </span>
            )}
          </div>
          <button
            onClick={() => onConfirm(Array.from(selectedIds))}
            className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg min-h-12"
          >
            <CheckCircle2 className="w-5 h-5" />
            Xác nhận{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

