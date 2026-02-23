import React from 'react';
import { Meal } from '../data/meals';
import { CheckCircle2, Circle } from 'lucide-react';

interface MealCardProps {
  meal: Meal;
  isSelected: boolean;
  onSelect: (meal: Meal) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, isSelected, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(meal)}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-emerald-500 bg-emerald-50/50 shadow-md' 
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <div className="absolute top-4 right-4 text-emerald-500">
        {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 text-slate-300" />}
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 pr-8">{meal.name}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-3 line-clamp-2">{meal.description}</p>
      
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md">
          {meal.calories} kcal
        </span>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
          Protein: {meal.protein}g
        </span>
        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md">
          Carb: {meal.carbs}g
        </span>
        <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md">
          Fat: {meal.fat}g
        </span>
        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
          Chất xơ: {meal.fiber}g
        </span>
      </div>
    </div>
  );
};
