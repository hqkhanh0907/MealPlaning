import React from 'react';
import { BookOpen } from 'lucide-react';
import { Ingredient, Dish } from '../types';
import { IngredientManager } from './IngredientManager';
import { DishManager } from './DishManager';
import { DataBackup } from './DataBackup';

type SubTab = 'ingredients' | 'dishes';

interface ManagementTabProps {
  activeSubTab: SubTab;
  onSubTabChange: (tab: SubTab) => void;
  ingredients: Ingredient[];
  dishes: Dish[];
  onAddIngredient: (ing: Ingredient) => void;
  onUpdateIngredient: (ing: Ingredient) => void;
  onDeleteIngredient: (id: string) => void;
  isIngredientUsed: (id: string) => boolean;
  onAddDish: (dish: Dish) => void;
  onUpdateDish: (dish: Dish) => void;
  onDeleteDish: (id: string) => void;
  isDishUsed: (id: string) => boolean;
  onImportData: (data: Record<string, unknown>) => void;
}

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'dishes', label: 'Món ăn' },
  { key: 'ingredients', label: 'Nguyên liệu' },
];

export const ManagementTab: React.FC<ManagementTabProps> = ({
  activeSubTab, onSubTabChange,
  ingredients, dishes,
  onAddIngredient, onUpdateIngredient, onDeleteIngredient, isIngredientUsed,
  onAddDish, onUpdateDish, onDeleteDish, isDishUsed,
  onImportData,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-500 shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Thư viện dữ liệu</h2>
        </div>
        <div className="flex w-full sm:w-auto overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl flex-nowrap">
          {SUB_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onSubTabChange(tab.key)}
              className={`flex-1 sm:flex-initial px-4 py-2.5 sm:py-1.5 rounded-lg text-sm sm:text-xs font-bold transition-all whitespace-nowrap min-h-11 sm:min-h-0 ${activeSubTab === tab.key ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 active:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'dishes' && (
        <DishManager
          dishes={dishes} ingredients={ingredients}
          onAdd={onAddDish} onUpdate={onUpdateDish}
          onDelete={onDeleteDish} isUsed={isDishUsed}
        />
      )}
      {activeSubTab === 'ingredients' && (
        <IngredientManager
          ingredients={ingredients} dishes={dishes}
          onAdd={onAddIngredient} onUpdate={onUpdateIngredient}
          onDelete={onDeleteIngredient} isUsed={isIngredientUsed}
        />
      )}

      {/* Data Backup */}
      <div className="pt-4 border-t border-slate-200">
        <DataBackup onImport={onImportData} />
      </div>
    </div>
  );
};
