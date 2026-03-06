import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dish, Ingredient, MealType, NutritionInfo, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { calculateDishNutrition } from '../utils/nutrition';
import { Trash2, Edit3, ChefHat, Apple } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { DishEditModal } from './modals/DishEditModal';
import { ListToolbar } from './shared/ListToolbar';
import { EmptyState } from './shared/EmptyState';
import { DetailModal } from './shared/DetailModal';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useListManager } from '../hooks/useListManager';
import { getMealTagOptions, getTagShortLabels, getBaseSortOptions, UNDO_TOAST_DURATION_MS } from '../data/constants';
import type { BaseSortOption } from '../data/constants';

type DishSortOption = BaseSortOption | 'ing-asc' | 'ing-desc';

interface DishManagerProps {
  dishes: Dish[];
  ingredients: Ingredient[];
  onAdd: (dish: Dish) => void;
  onUpdate: (dish: Dish) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
  onCreateIngredient?: (ing: Ingredient) => void;
}

const ZERO_NUTRITION: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export const DishManager: React.FC<DishManagerProps> = ({ dishes, ingredients, onAdd, onUpdate, onDelete, isUsed, onCreateIngredient }) => {
  const notify = useNotification();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const tagLabels = getTagShortLabels(t);
  const mealTagOptions = getMealTagOptions(t);
  const dishSortOptions: { value: DishSortOption; label: string }[] = [
    ...getBaseSortOptions(t),
    { value: 'ing-asc', label: t('sort.ingredientCountAsc') },
    { value: 'ing-desc', label: t('sort.ingredientCountDesc') },
  ];

  const [filterTag, setFilterTag] = useState<MealType | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean; dishId: string | null; dishName: string;
  }>({ isOpen: false, dishId: null, dishName: '' });

  // --- Shared hooks ---
  const modal = useItemModalFlow<Dish>();

  const searchFn = useCallback((d: Dish, q: string) => {
    const ql = q.toLowerCase();
    return Object.values(d.name).some(n => n.toLowerCase().includes(ql));
  }, []);

  // Pre-compute nutrition once per dishes/ingredients change — avoids O(N log N) recalculation in sort comparator
  const nutritionMap = useMemo(() => {
    const map = new Map<string, NutritionInfo>();
    for (const dish of dishes) {
      map.set(dish.id, calculateDishNutrition(dish, ingredients));
    }
    return map;
  }, [dishes, ingredients]);

  const sortFn = useCallback((a: Dish, b: Dish, s: DishSortOption) => {
    const nA = nutritionMap.get(a.id) ?? ZERO_NUTRITION;
    const nB = nutritionMap.get(b.id) ?? ZERO_NUTRITION;
    switch (s) {
      case 'name-asc': return getLocalizedField(a.name, lang).localeCompare(getLocalizedField(b.name, lang));
      case 'name-desc': return getLocalizedField(b.name, lang).localeCompare(getLocalizedField(a.name, lang));
      case 'cal-asc': return nA.calories - nB.calories;
      case 'cal-desc': return nB.calories - nA.calories;
      case 'pro-asc': return nA.protein - nB.protein;
      case 'pro-desc': return nB.protein - nA.protein;
      case 'ing-asc': return a.ingredients.length - b.ingredients.length;
      case 'ing-desc': return b.ingredients.length - a.ingredients.length;
      default: return 0;
    }
  }, [nutritionMap, lang]);
  const extraFilter = useCallback((d: Dish) => !filterTag || (d.tags?.includes(filterTag) ?? false), [filterTag]);

  const list = useListManager<Dish, DishSortOption>({ items: dishes, searchFn, sortFn, defaultSort: 'name-asc', extraFilter });

  // --- Domain handlers ---
  const handleDishSubmit = useCallback((dish: Dish) => {
    if (modal.editingItem) onUpdate(dish); else onAdd(dish);
    modal.afterSubmit(dish);
  }, [modal, onAdd, onUpdate]);

  const handleEditClose = useCallback(() => {
    modal.closeEdit(false);
  }, [modal]);

  const handleDelete = (id: string, dname: string) => {
    if (isUsed(id)) { notify.warning(t('dish.cannotDelete'), t('dish.usedInPlan')); return; }
    setDeleteConfirmation({ isOpen: true, dishId: id, dishName: dname });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation.dishId) return;
    const deleted = dishes.find(d => d.id === deleteConfirmation.dishId);
    onDelete(deleteConfirmation.dishId);
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    if (deleted) {
      const displayName = getLocalizedField(deleted.name, lang);
      notify.info(t('dish.deleted'), t('dish.deletedDesc', { name: displayName }), {
        duration: UNDO_TOAST_DURATION_MS,
        action: { label: t('common.undo'), onClick: () => { onAdd(deleted); notify.success(t('common.undone'), t('dish.restoredDesc', { name: displayName })); } },
      });
    }
  };

  // --- Render helpers ---
  const emptyIcon = <ChefHat className="w-8 h-8 text-emerald-300" />;

  return (
    <div data-testid="dish-manager" className="space-y-6">
      <ListToolbar
        searchQuery={list.searchQuery} onSearchChange={list.setSearchQuery} searchPlaceholder={t('dish.searchPlaceholder')}
        sortOptions={dishSortOptions} sortBy={list.sortBy} onSortChange={v => list.setSortBy(v as DishSortOption)}
        viewLayout={list.viewLayout} onLayoutChange={list.setViewLayout}
        onAdd={() => modal.openEdit()} addLabel={t('dish.addNew')}
        searchTestId="input-search-dish" addTestId="btn-add-dish" sortTestId="select-sort-dish"
      >
        {/* Tag filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mt-2">
          <button onClick={() => setFilterTag(null)} data-testid="btn-filter-all-dishes" className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-8 ${filterTag ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-emerald-500 text-white'}`}>
            {t('common.all')} ({dishes.length})
          </button>
          {mealTagOptions.map(({ type, label, icon }) => {
            const count = dishes.filter(d => d.tags?.includes(type)).length;
            return (
              <button key={type} onClick={() => setFilterTag(filterTag === type ? null : type)} data-testid={`btn-filter-${type}`} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-8 ${filterTag === type ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {icon} {label} ({count})
              </button>
            );
          })}
        </div>
      </ListToolbar>

      {/* Grid View */}
      {list.viewLayout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.filteredItems.map(dish => {
            const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
            return (
              <div key={dish.id} className="relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col group text-left w-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500"><ChefHat className="w-5 h-5" /></div>
                    <div>
                      <button type="button" onClick={() => modal.openView(dish)} className="font-bold text-slate-800 dark:text-slate-100 text-lg text-left cursor-pointer after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded">{getLocalizedField(dish.name, lang)}</button>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{dish.ingredients.length} {t('dish.ingredients')}</p>
                      {dish.tags && dish.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {dish.tags.map(tag => <span key={tag} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{tagLabels[tag]}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Calories</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)}</span></div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-blue-400 font-bold uppercase">Protein</span><span className="text-sm font-bold text-blue-700 dark:text-blue-400">{Math.round(nutrition.protein)}g</span></div>
                </div>
                <div className="relative z-10 mt-auto flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
                  <button data-testid={`btn-edit-dish-${dish.id}`} onClick={() => modal.openEdit(dish)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"><Edit3 className="w-4 h-4" /> {t('common.edit')}</button>
                  <button data-testid={`btn-delete-dish-${dish.id}`} onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(dish.id) ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /> {t('common.delete')}</button>
                </div>
              </div>
            );
          })}
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName={t('dish.title').toLowerCase()} actionLabel={t('dish.addNew')} onAction={() => modal.openEdit()} className="col-span-full" />}
        </div>
      )}

      {/* List View */}
      {list.viewLayout === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.title')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('dish.tags')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.calories')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.protein')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {list.filteredItems.map(dish => {
                  const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
                  return (
                    <tr key={dish.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-4 h-4" /></div><div><button type="button" onClick={() => modal.openView(dish)} className="font-bold text-slate-800 dark:text-slate-100 text-left cursor-pointer hover:text-emerald-600 transition-colors">{getLocalizedField(dish.name, lang)}</button><p className="text-xs text-slate-500 dark:text-slate-400">{dish.ingredients.length} {t('dish.ingredients')}</p></div></div></td>
                      <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{dish.tags?.map(tag => <span key={tag} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded">{tagLabels[tag]}</span>)}</div></td>
                      <td className="px-4 py-3 text-right"><span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(nutrition.protein)}g</span></td>
                      <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                        <button data-testid={`btn-edit-dish-${dish.id}`} onClick={() => modal.openEdit(dish)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button data-testid={`btn-delete-dish-${dish.id}`} onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))} className={`p-2 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile List */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {list.filteredItems.map(dish => {
              const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
              return (
                <div key={dish.id} className="relative p-4 flex items-center justify-between gap-3 active:bg-slate-50 dark:active:bg-slate-700 transition-colors w-full text-left">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-5 h-5" /></div>
                    <div className="min-w-0"><button type="button" onClick={() => modal.openView(dish)} className="font-bold text-slate-800 dark:text-slate-100 truncate text-left cursor-pointer after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">{getLocalizedField(dish.name, lang)}</button><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{Math.round(nutrition.calories)} kcal</span><span className="text-blue-600 dark:text-blue-400">{Math.round(nutrition.protein)}g Pro</span></div></div>
                  </div>
                  <div className="relative z-10 flex items-center gap-1 shrink-0">
                    <button data-testid={`btn-edit-dish-${dish.id}`} onClick={() => modal.openEdit(dish)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button data-testid={`btn-delete-dish-${dish.id}`} onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))} className={`p-2.5 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName={t('dish.title').toLowerCase()} actionLabel={t('dish.addNew')} onAction={() => modal.openEdit()} />}
        </div>
      )}

      {/* View Detail Modal */}
      {modal.viewingItem && (() => {
        const dish = modal.viewingItem;
        const nutrition = nutritionMap.get(dish.id) ?? ZERO_NUTRITION;
        return (
          <DetailModal title={t('dish.detail')} editLabel={t('dish.editDish')} onClose={modal.closeView} onEdit={() => modal.openEditFromView(dish)}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-7 h-7" /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{getLocalizedField(dish.name, lang)}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{dish.ingredients.length} {t('dish.ingredients')}</p>
                {dish.tags && dish.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">{dish.tags.map(tag => <span key={tag} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">{tagLabels[tag]}</span>)}</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5"><p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Calories</p><p className="text-xl font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)} <span className="text-xs font-medium text-slate-400">kcal</span></p></div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3.5"><p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Protein</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{Math.round(nutrition.protein)}<span className="text-xs font-medium text-blue-400">g</span></p></div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3.5"><p className="text-[10px] text-amber-400 font-bold uppercase mb-1">Carbs</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{Math.round(nutrition.carbs)}<span className="text-xs font-medium text-amber-400">g</span></p></div>
              <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3.5"><p className="text-[10px] text-rose-400 font-bold uppercase mb-1">Fat</p><p className="text-xl font-bold text-rose-700 dark:text-rose-400">{Math.round(nutrition.fat)}<span className="text-xs font-medium text-rose-400">g</span></p></div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">{t('dish.ingredientList')}</p>
              <div className="space-y-2">
                {dish.ingredients.map(si => {
                  const ing = ingredients.find(i => i.id === si.ingredientId);
                  if (!ing) return null;
                  return (
                    <div key={si.ingredientId} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white dark:bg-slate-600 rounded-lg flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-slate-500"><Apple className="w-4 h-4" /></div><span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{getLocalizedField(ing.name, lang)}</span></div>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{si.amount} {getLocalizedField(ing.unit, lang)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </DetailModal>
        );
      })()}

      {/* Edit Modal */}
      {modal.isEditOpen && (
        <DishEditModal
          editingItem={modal.editingItem}
          ingredients={ingredients}
          onSubmit={handleDishSubmit}
          onClose={handleEditClose}
          onCreateIngredient={onCreateIngredient}
        />
      )}

      <ConfirmationModal isOpen={deleteConfirmation.isOpen} variant="danger" title={t('dish.confirmDelete')} message={<p>{t('dish.confirmDeleteMsg')} <span className="font-bold text-slate-800 dark:text-slate-100">&quot;{deleteConfirmation.dishName}&quot;</span>?<br/>{t('common.cannotUndo')}</p>} confirmLabel={t('common.deleteNow')} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })} />
    </div>
  );
};
