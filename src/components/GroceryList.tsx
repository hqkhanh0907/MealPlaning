import React from 'react';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { Ingredient, Dish, Meal } from '../types';

interface GroceryListProps {
  selectedMeals: {
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
  };
  allDishes: Dish[];
  allIngredients: Ingredient[];
}

export const GroceryList: React.FC<GroceryListProps> = ({ selectedMeals, allDishes, allIngredients }) => {
  const isComplete = selectedMeals.breakfast || selectedMeals.lunch || selectedMeals.dinner;

  if (!isComplete) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Danh sách đi chợ</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Hãy lên kế hoạch ít nhất một bữa ăn để xem danh sách nguyên liệu cần chuẩn bị.
        </p>
      </div>
    );
  }

  // Aggregate ingredients from all selected meals
  const aggregated: Record<string, { name: string; amount: number; unit: string }> = {};

  const processMeal = (meal: Meal | null) => {
    if (!meal) return;
    meal.dishIds.forEach(dishId => {
      const dish = allDishes.find(d => d.id === dishId);
      if (!dish) return;
      dish.ingredients.forEach(di => {
        const ingredient = allIngredients.find(i => i.id === di.ingredientId);
        if (!ingredient) return;
        
        const key = ingredient.id;
        if (!aggregated[key]) {
          aggregated[key] = { name: ingredient.name, amount: di.amount, unit: ingredient.unit };
        } else {
          aggregated[key].amount += di.amount;
        }
      });
    });
  };

  processMeal(selectedMeals.breakfast);
  processMeal(selectedMeals.lunch);
  processMeal(selectedMeals.dinner);

  const groceryItems = Object.values(aggregated).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-emerald-600" />
        <h3 className="text-lg font-bold text-emerald-900">Danh sách đi chợ hôm nay</h3>
      </div>
      <div className="p-6">
        {groceryItems.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {groceryItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-slate-500 ml-2">
                    ({Math.round(item.amount)} {item.unit})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-center py-4">Không có nguyên liệu nào cần chuẩn bị.</p>
        )}
      </div>
    </div>
  );
};
