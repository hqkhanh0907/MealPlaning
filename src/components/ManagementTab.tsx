import React from 'react';
import { BookOpen } from 'lucide-react';
import { Ingredient, Dish, Meal } from '../types';
import { IngredientManager } from './IngredientManager';
import { DishManager } from './DishManager';
import { MealManager } from './MealManager';

type SubTab = 'ingredients' | 'dishes' | 'meals';

interface ManagementTabProps {
  activeSubTab: SubTab;
  onSubTabChange: (tab: SubTab) => void;
  ingredients: Ingredient[];
  dishes: Dish[];
  meals: Meal[];
  onAddIngredient: (ing: Ingredient) => void;
  onUpdateIngredient: (ing: Ingredient) => void;
  onDeleteIngredient: (id: string) => void;
  isIngredientUsed: (id: string) => boolean;
  onAddDish: (dish: Dish) => void;
  onUpdateDish: (dish: Dish) => void;
  onDeleteDish: (id: string) => void;
  isDishUsed: (id: string) => boolean;
  onAddMeal: (meal: Meal) => void;
  onUpdateMeal: (meal: Meal) => void;
  onDeleteMeal: (id: string) => void;
  isMealUsed: (id: string) => boolean;
}

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'meals', label: 'Bữa ăn' },
  { key: 'dishes', label: 'Món ăn' },
  { key: 'ingredients', label: 'Nguyên liệu' },
];

export const ManagementTab: React.FC<ManagementTabProps> = ({
  activeSubTab, onSubTabChange,
  ingredients, dishes, meals,
  onAddIngredient, onUpdateIngredient, onDeleteIngredient, isIngredientUsed,
  onAddDish, onUpdateDish, onDeleteDish, isDishUsed,
  onAddMeal, onUpdateMeal, onDeleteMeal, isMealUsed,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-800">Thư viện dữ liệu</h2>
        </div>
        <div className="flex overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl flex-nowrap">
          {SUB_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onSubTabChange(tab.key)}
              className={`px-4 py-2.5 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-11 sm:min-h-0 ${activeSubTab === tab.key ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 active:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'ingredients' && (
        <IngredientManager
          ingredients={ingredients} dishes={dishes}
          onAdd={onAddIngredient} onUpdate={onUpdateIngredient}
          onDelete={onDeleteIngredient} isUsed={isIngredientUsed}
        />
      )}
      {activeSubTab === 'dishes' && (
        <DishManager
          dishes={dishes} ingredients={ingredients}
          onAdd={onAddDish} onUpdate={onUpdateDish}
          onDelete={onDeleteDish} isUsed={isDishUsed}
        />
      )}
      {activeSubTab === 'meals' && (
        <MealManager
          meals={meals} dishes={dishes} ingredients={ingredients}
          onAdd={onAddMeal} onUpdate={onUpdateMeal}
          onDelete={onDeleteMeal} isUsed={isMealUsed}
        />
      )}
    </div>
  );
};

