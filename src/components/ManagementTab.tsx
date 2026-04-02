import { BookOpen } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Dish, Ingredient } from '../types';
import { DishManager } from './DishManager';
import { IngredientManager } from './IngredientManager';

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
}

export const ManagementTab = React.memo(function ManagementTab({
  activeSubTab,
  onSubTabChange,
  ingredients,
  dishes,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  isIngredientUsed,
  onAddDish,
  onUpdateDish,
  onDeleteDish,
  isDishUsed,
}: ManagementTabProps) {
  const { t } = useTranslation();

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: 'dishes', label: t('management.subTabDish') },
    { key: 'ingredients', label: t('management.subTabIngredient') },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
        <div className="flex items-center gap-3">
          <BookOpen className="text-primary h-6 w-6 shrink-0" />
          <h2 className="text-xl font-bold text-slate-800 sm:text-2xl dark:text-slate-100">{t('management.title')}</h2>
        </div>
        <div className="scrollbar-hide bg-muted flex w-full flex-nowrap overflow-x-auto rounded-xl p-1 sm:w-auto">
          {SUB_TABS.map(tab => (
            <button
              key={tab.key}
              data-testid={`tab-management-${tab.key}`}
              onClick={() => onSubTabChange(tab.key)}
              className={`min-h-11 flex-1 rounded-lg px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-all sm:min-h-0 sm:flex-initial sm:py-1.5 sm:text-xs ${activeSubTab === tab.key ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700' : 'text-muted-foreground active:bg-slate-200 dark:active:bg-slate-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'dishes' && (
        <DishManager
          dishes={dishes}
          ingredients={ingredients}
          onAdd={onAddDish}
          onUpdate={onUpdateDish}
          onDelete={onDeleteDish}
          isUsed={isDishUsed}
          onCreateIngredient={onAddIngredient}
        />
      )}
      {activeSubTab === 'ingredients' && (
        <IngredientManager
          ingredients={ingredients}
          dishes={dishes}
          onAdd={onAddIngredient}
          onUpdate={onUpdateIngredient}
          onDelete={onDeleteIngredient}
          isUsed={isIngredientUsed}
        />
      )}
    </div>
  );
});

ManagementTab.displayName = 'ManagementTab';
