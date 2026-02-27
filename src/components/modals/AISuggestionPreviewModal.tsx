import React, { useState, useMemo } from 'react';
import { X, Sparkles, ChefHat, RefreshCw, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
import { Dish, Ingredient, MealType, MealPlanSuggestion } from '../../types';
import { calculateDishesNutrition } from '../../utils/nutrition';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Bữa Sáng',
  lunch: 'Bữa Trưa',
  dinner: 'Bữa Tối',
};

const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🌤️',
  dinner: '🌙',
};

const MEAL_TYPE_COLORS: Record<MealType, { bg: string; border: string; text: string }> = {
  breakfast: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  lunch: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  dinner: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
};

interface AISuggestionPreviewModalProps {
  isOpen: boolean;
  suggestion: MealPlanSuggestion | null;
  dishes: Dish[];
  ingredients: Ingredient[];
  targetCalories: number;
  targetProtein: number;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onApply: (selectedMeals: { breakfast: boolean; lunch: boolean; dinner: boolean }) => void;
  onRegenerate: () => void;
  onEditMeal: (type: MealType) => void;
}

export const AISuggestionPreviewModal: React.FC<AISuggestionPreviewModalProps> = ({
  isOpen,
  suggestion,
  dishes,
  ingredients,
  targetCalories,
  targetProtein,
  isLoading,
  error,
  onClose,
  onApply,
  onRegenerate,
  onEditMeal,
}) => {
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  // Reset selections when suggestion changes
  React.useEffect(() => {
    if (suggestion) {
      setSelectedMeals({
        breakfast: (suggestion.breakfastDishIds?.length ?? 0) > 0,
        lunch: (suggestion.lunchDishIds?.length ?? 0) > 0,
        dinner: (suggestion.dinnerDishIds?.length ?? 0) > 0,
      });
    }
  }, [suggestion]);

  const nutritionSummary = useMemo(() => {
    if (!suggestion) return { calories: 0, protein: 0 };

    let totalCalories = 0;
    let totalProtein = 0;

    if (selectedMeals.breakfast && suggestion.breakfastDishIds?.length) {
      const n = calculateDishesNutrition(suggestion.breakfastDishIds, dishes, ingredients);
      totalCalories += n.calories;
      totalProtein += n.protein;
    }
    if (selectedMeals.lunch && suggestion.lunchDishIds?.length) {
      const n = calculateDishesNutrition(suggestion.lunchDishIds, dishes, ingredients);
      totalCalories += n.calories;
      totalProtein += n.protein;
    }
    if (selectedMeals.dinner && suggestion.dinnerDishIds?.length) {
      const n = calculateDishesNutrition(suggestion.dinnerDishIds, dishes, ingredients);
      totalCalories += n.calories;
      totalProtein += n.protein;
    }

    return { calories: Math.round(totalCalories), protein: Math.round(totalProtein) };
  }, [suggestion, selectedMeals, dishes, ingredients]);

  const getMealNutrition = (dishIds: string[] | undefined) => {
    if (!dishIds?.length) return { calories: 0, protein: 0 };
    const n = calculateDishesNutrition(dishIds, dishes, ingredients);
    return { calories: Math.round(n.calories), protein: Math.round(n.protein) };
  };

  const getDishNames = (dishIds: string[] | undefined) => {
    if (!dishIds?.length) return [];
    return dishIds.map(id => dishes.find(d => d.id === id)?.name).filter(Boolean) as string[];
  };

  const toggleMeal = (type: MealType) => {
    setSelectedMeals(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const hasAnySuggestion = suggestion && (
    (suggestion.breakfastDishIds?.length ?? 0) > 0 ||
    (suggestion.lunchDishIds?.length ?? 0) > 0 ||
    (suggestion.dinnerDishIds?.length ?? 0) > 0
  );

  const hasAnySelected = selectedMeals.breakfast || selectedMeals.lunch || selectedMeals.dinner;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Gợi ý bữa ăn từ AI</h3>
              <p className="text-xs text-slate-500">Xem trước và chỉnh sửa trước khi áp dụng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full text-slate-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-indigo-600 animate-bounce" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">AI đang phân tích...</p>
                <p className="text-sm text-slate-500 mt-1">Đang tìm thực đơn tối ưu cho bạn</p>
              </div>
              <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"
                  style={{ width: '60%', animation: 'loading 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">Không thể tạo gợi ý</p>
                <p className="text-sm text-slate-500 mt-1">{error}</p>
              </div>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </button>
            </div>
          )}

          {/* Empty Suggestion State */}
          {!isLoading && !error && !hasAnySuggestion && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">Chưa tìm được gợi ý phù hợp</p>
                <p className="text-sm text-slate-500 mt-1">
                  Hãy thử thêm món ăn vào thư viện hoặc điều chỉnh mục tiêu
                </p>
              </div>
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Gợi ý lại
              </button>
            </div>
          )}

          {/* Suggestion Preview */}
          {!isLoading && !error && hasAnySuggestion && suggestion && (
            <>
              {/* Reasoning Card */}
              {suggestion.reasoning && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-800 mb-1">Lý do gợi ý</p>
                      <p className="text-sm text-indigo-700 leading-relaxed">{suggestion.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meal Cards */}
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => {
                const dishIds = type === 'breakfast'
                  ? suggestion.breakfastDishIds
                  : type === 'lunch'
                    ? suggestion.lunchDishIds
                    : suggestion.dinnerDishIds;
                const names = getDishNames(dishIds);
                const nutrition = getMealNutrition(dishIds);
                const isSelected = selectedMeals[type];
                const hasContent = names.length > 0;
                const colors = MEAL_TYPE_COLORS[type];

                if (!hasContent) return null;

                return (
                  <div
                    key={type}
                    className={`rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? `${colors.bg} ${colors.border}` 
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header with checkbox and edit */}
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMeal(type)}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={`text-sm font-bold uppercase tracking-wider ${isSelected ? colors.text : 'text-slate-400'}`}>
                            {MEAL_TYPE_ICONS[type]} {MEAL_TYPE_LABELS[type]}
                          </span>
                        </label>
                        <button
                          onClick={() => onEditMeal(type)}
                          disabled={!isSelected}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected 
                              ? 'text-slate-600 hover:bg-white/50 hover:text-slate-800' 
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Thay đổi
                        </button>
                      </div>

                      {/* Dish names */}
                      <div className="space-y-2 mb-3">
                        {names.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <ChefHat className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className={`font-medium ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Nutrition summary */}
                      <div className={`pt-3 border-t ${isSelected ? 'border-slate-200/50' : 'border-slate-200'}`}>
                        <div className="flex gap-4 text-sm">
                          <span className={`font-bold ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>
                            {nutrition.calories} kcal
                          </span>
                          <span className={`font-bold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                            {nutrition.protein}g protein
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total Summary */}
              <div className="p-4 bg-slate-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng cộng (các bữa đã chọn)</p>
                    <p className="text-lg font-bold text-slate-800">
                      {nutritionSummary.calories} kcal · {nutritionSummary.protein}g protein
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Mục tiêu</p>
                    <p className="text-sm font-medium text-slate-600">
                      {targetCalories} kcal · {targetProtein}g protein
                    </p>
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Calo</span>
                      <span className={`font-medium ${nutritionSummary.calories > targetCalories ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {Math.round((nutritionSummary.calories / targetCalories) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.calories > targetCalories ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (nutritionSummary.calories / targetCalories) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Protein</span>
                      <span className={`font-medium ${nutritionSummary.protein >= targetProtein ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {Math.round((nutritionSummary.protein / targetProtein) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${nutritionSummary.protein >= targetProtein ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (nutritionSummary.protein / targetProtein) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && hasAnySuggestion && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-all"
            >
              Hủy
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Gợi ý lại</span>
              </button>
              <button
                onClick={() => onApply(selectedMeals)}
                disabled={!hasAnySelected}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Áp dụng
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

