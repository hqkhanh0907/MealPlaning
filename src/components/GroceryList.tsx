import React from 'react';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { Ingredient, Dish, DishIngredient, MealWithNutrition } from '../types';

interface GroceryListProps {
  selectedMeals: {
    breakfast: MealWithNutrition | null;
    lunch: MealWithNutrition | null;
    dinner: MealWithNutrition | null;
  };
  allDishes: Dish[];
  allIngredients: Ingredient[];
}

type GroceryItem = { id: string; name: string; amount: number; unit: string };

// Collect all dish-ingredient pairs from selected meals
const collectDishIngredients = (meals: (MealWithNutrition | null)[], allDishes: Dish[]): DishIngredient[] => {
  const result: DishIngredient[] = [];
  for (const meal of meals) {
    if (!meal) continue;
    for (const dishId of meal.dishIds) {
      const dish = allDishes.find(d => d.id === dishId);
      if (dish) result.push(...dish.ingredients);
    }
  }
  return result;
};

// Aggregate ingredients, summing amounts for duplicates
const buildGroceryList = (dishIngredients: DishIngredient[], allIngredients: Ingredient[]): GroceryItem[] => {
  const map: Record<string, GroceryItem> = {};
  for (const di of dishIngredients) {
    const ing = allIngredients.find(i => i.id === di.ingredientId);
    if (!ing) continue;
    if (map[ing.id]) {
      map[ing.id].amount += di.amount;
    } else {
      map[ing.id] = { id: ing.id, name: ing.name, amount: di.amount, unit: ing.unit };
    }
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
};

const EmptyState: React.FC = () => (
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

export const GroceryList: React.FC<GroceryListProps> = ({ selectedMeals, allDishes, allIngredients }) => {
  const hasMeals = selectedMeals.breakfast || selectedMeals.lunch || selectedMeals.dinner;

  if (!hasMeals) return <EmptyState />;

  const mealsArray = [selectedMeals.breakfast, selectedMeals.lunch, selectedMeals.dinner];
  const dishIngredients = collectDishIngredients(mealsArray, allDishes);
  const groceryItems = buildGroceryList(dishIngredients, allIngredients);

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-emerald-600" />
        <h3 className="text-lg font-bold text-emerald-900">Danh sách đi chợ hôm nay</h3>
      </div>
      <div className="p-6">
        {groceryItems.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {groceryItems.map(item => (
              <li key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
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
