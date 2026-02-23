import React, { useState } from 'react';
import { meals, Meal } from './data/meals';
import { MealCard } from './components/MealCard';
import { Summary } from './components/Summary';
import { GroceryList } from './components/GroceryList';
import { Sunrise, Sun, Moon, UtensilsCrossed } from 'lucide-react';

export default function App() {
  const [selectedMeals, setSelectedMeals] = useState<{
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
  }>({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const handleSelectMeal = (type: 'breakfast' | 'lunch' | 'dinner', meal: Meal) => {
    setSelectedMeals((prev) => ({
      ...prev,
      [type]: prev[type]?.id === meal.id ? null : meal,
    }));
  };

  const breakfastOptions = meals.filter((m) => m.type === 'breakfast');
  const lunchOptions = meals.filter((m) => m.type === 'lunch');
  const dinnerOptions = meals.filter((m) => m.type === 'dinner');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-sm">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">High Protein Planner</h1>
              <p className="text-xs text-slate-500 font-medium">Hỗ trợ tiêu hoá & Tăng cơ</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
            <span>83kg</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>1m75</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-emerald-600">Mục tiêu: 1500 kcal</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        {/* Summary Section */}
        <section>
          <Summary 
            selectedMeals={selectedMeals} 
            targetCalories={1500} 
            targetProtein={166} 
          />
        </section>

        {/* Meal Selection Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800">Lên thực đơn hôm nay</h2>
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Chọn 1 món cho mỗi bữa</span>
          </div>

          {/* Breakfast */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-lg">
              <Sunrise className="w-6 h-6" />
              <h3>Bữa Sáng</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {breakfastOptions.map((meal) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal} 
                  isSelected={selectedMeals.breakfast?.id === meal.id}
                  onSelect={(m) => handleSelectMeal('breakfast', m)}
                />
              ))}
            </div>
          </div>

          {/* Lunch */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 font-semibold text-lg">
              <Sun className="w-6 h-6" />
              <h3>Bữa Trưa</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lunchOptions.map((meal) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal} 
                  isSelected={selectedMeals.lunch?.id === meal.id}
                  onSelect={(m) => handleSelectMeal('lunch', m)}
                />
              ))}
            </div>
          </div>

          {/* Dinner */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 font-semibold text-lg">
              <Moon className="w-6 h-6" />
              <h3>Bữa Tối</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dinnerOptions.map((meal) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal} 
                  isSelected={selectedMeals.dinner?.id === meal.id}
                  onSelect={(m) => handleSelectMeal('dinner', m)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Grocery List Section */}
        <section className="pt-8 border-t border-slate-200">
          <GroceryList selectedMeals={selectedMeals} />
        </section>
      </main>
    </div>
  );
}
