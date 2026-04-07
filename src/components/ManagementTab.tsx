import { BookOpen } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { SubTabBar } from '@/components/shared/SubTabBar';

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

  const SUB_TABS = [
    { id: 'dishes', label: t('management.subTabDish') },
    { id: 'ingredients', label: t('management.subTabIngredient') },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-primary h-6 w-6 shrink-0" />
          <h2 className="text-foreground text-xl font-semibold sm:text-2xl">{t('management.title')}</h2>
        </div>
        <SubTabBar
          tabs={SUB_TABS}
          activeTab={activeSubTab}
          onTabChange={id => onSubTabChange(id as SubTab)}
          className="w-full sm:w-auto"
        />
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
