import React from 'react';
import { Meal, Ingredient } from '../data/meals';
import { ShoppingCart, CheckCircle } from 'lucide-react';

interface GroceryListProps {
  selectedMeals: {
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
  };
}

export const GroceryList: React.FC<GroceryListProps> = ({ selectedMeals }) => {
  const isComplete = selectedMeals.breakfast && selectedMeals.lunch && selectedMeals.dinner;

  if (!isComplete) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Danh sách đi chợ</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Hãy chọn đủ 3 bữa (Sáng, Trưa, Tối) để xem danh sách nguyên liệu cần chuẩn bị cho ngày hôm nay.
        </p>
      </div>
    );
  }

  // Aggregate ingredients
  const allIngredients = [
    ...(selectedMeals.breakfast?.ingredients || []),
    ...(selectedMeals.lunch?.ingredients || []),
    ...(selectedMeals.dinner?.ingredients || []),
  ];

  const aggregated = allIngredients.reduce((acc, curr) => {
    const key = `${curr.name}-${curr.unit}`;
    if (!acc[key]) {
      acc[key] = { ...curr };
    } else {
      acc[key].amount += curr.amount;
    }
    return acc;
  }, {} as Record<string, Ingredient>);

  const groceryItems = (Object.values(aggregated) as Ingredient[]).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-emerald-600" />
        <h3 className="text-lg font-bold text-emerald-900">Danh sách đi chợ hôm nay</h3>
      </div>
      <div className="p-6">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {groceryItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-slate-500 ml-2">
                  ({item.amount} {item.unit})
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
