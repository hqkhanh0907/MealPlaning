import React from 'react';
import { Meal } from '../data/meals';
import { Activity, Flame, Beef, Wheat, Droplet, Leaf } from 'lucide-react';

interface SummaryProps {
  selectedMeals: {
    breakfast: Meal | null;
    lunch: Meal | null;
    dinner: Meal | null;
  };
  targetCalories: number;
  targetProtein: number;
}

export const Summary: React.FC<SummaryProps> = ({ selectedMeals, targetCalories, targetProtein }) => {
  const totalCalories = (selectedMeals.breakfast?.calories || 0) + (selectedMeals.lunch?.calories || 0) + (selectedMeals.dinner?.calories || 0);
  const totalProtein = (selectedMeals.breakfast?.protein || 0) + (selectedMeals.lunch?.protein || 0) + (selectedMeals.dinner?.protein || 0);
  const totalCarbs = (selectedMeals.breakfast?.carbs || 0) + (selectedMeals.lunch?.carbs || 0) + (selectedMeals.dinner?.carbs || 0);
  const totalFat = (selectedMeals.breakfast?.fat || 0) + (selectedMeals.lunch?.fat || 0) + (selectedMeals.dinner?.fat || 0);
  const totalFiber = (selectedMeals.breakfast?.fiber || 0) + (selectedMeals.lunch?.fiber || 0) + (selectedMeals.dinner?.fiber || 0);

  const calPercent = Math.min(100, (totalCalories / targetCalories) * 100);
  const proPercent = Math.min(100, (totalProtein / targetProtein) * 100);

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tổng quan dinh dưỡng</h2>
          <p className="text-sm text-slate-500">Mục tiêu: {targetCalories} kcal, {targetProtein}g Protein</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Calories Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Flame className="w-5 h-5 text-orange-500" /> Calories
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-800">{totalCalories}</span>
              <span className="text-sm text-slate-500"> / {targetCalories} kcal</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${totalCalories > targetCalories ? 'bg-rose-500' : 'bg-orange-500'}`}
              style={{ width: `${calPercent}%` }}
            />
          </div>
        </div>

        {/* Protein Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Beef className="w-5 h-5 text-blue-500" /> Protein
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-800">{totalProtein}</span>
              <span className="text-sm text-slate-500"> / {targetProtein} g</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${proPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <Wheat className="w-4 h-4" />
            <span className="text-sm font-medium">Carbs</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{totalCarbs}<span className="text-sm font-normal text-amber-700/70 ml-1">g</span></p>
        </div>
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100/50">
          <div className="flex items-center gap-2 text-rose-700 mb-1">
            <Droplet className="w-4 h-4" />
            <span className="text-sm font-medium">Fat</span>
          </div>
          <p className="text-2xl font-bold text-rose-900">{totalFat}<span className="text-sm font-normal text-rose-700/70 ml-1">g</span></p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <Leaf className="w-4 h-4" />
            <span className="text-sm font-medium">Chất xơ</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{totalFiber}<span className="text-sm font-normal text-emerald-700/70 ml-1">g</span></p>
        </div>
      </div>
    </div>
  );
};
