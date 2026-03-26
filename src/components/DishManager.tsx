import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dish, Ingredient, MealType, NutritionInfo, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { calculateDishNutrition } from '../utils/nutrition';
import { Trash2, Edit3, ChefHat, Apple, Copy, GitCompareArrows, X } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { DishEditModal } from './modals/DishEditModal';
import { ListToolbar } from './shared/ListToolbar';
import { EmptyState } from './shared/EmptyState';
import { DetailModal } from './shared/DetailModal';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useListManager } from '../hooks/useListManager';
import { getMealTagOptions, getTagShortLabels, getBaseSortOptions, UNDO_TOAST_DURATION_MS } from '../data/constants';
import { generateId } from '../utils/helpers';
import type { BaseSortOption } from '../data/constants';

type DishSortOption = BaseSortOption | 'ing-asc' | 'ing-desc' | 'rating-asc' | 'rating-desc';

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
    { value: 'rating-desc', label: t('sort.ratingDesc') },
    { value: 'rating-asc', label: t('sort.ratingAsc') },
  ];

  const [filterTag, setFilterTag] = useState<MealType | null>(null);

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const MAX_COMPARE = 3;
  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < MAX_COMPARE) { next.add(id); }
      else { notify.warning(t('dish.maxCompare')); return prev; }
      return next;
    });
  }, [notify, t]);

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
      case 'rating-asc': return (a.rating ?? 0) - (b.rating ?? 0);
      case 'rating-desc': return (b.rating ?? 0) - (a.rating ?? 0);
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
    const dishId = deleteConfirmation.dishId;
    if (!dishId) return;
    const deleted = dishes.find(d => d.id === dishId);
    onDelete(dishId);
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    if (deleted) {
      const displayName = getLocalizedField(deleted.name, lang);
      notify.info(t('dish.deleted'), t('dish.deletedDesc', { name: displayName }), {
        duration: UNDO_TOAST_DURATION_MS,
        action: { label: t('common.undo'), onClick: () => { onAdd(deleted); notify.success(t('common.undone'), t('dish.restoredDesc', { name: displayName })); } },
      });
    }
  };

  const handleClone = useCallback((dish: Dish) => {
    const suffix = t('dish.copySuffix');
    const cloned: Dish = {
      ...dish,
      id: generateId('dish'),
      name: Object.fromEntries(
        Object.entries(dish.name).map(([k, v]) => [k, `${v} ${suffix}`])
      ) as Dish['name'],
      ingredients: dish.ingredients.map(si => ({ ...si })),
      tags: dish.tags ? [...dish.tags] : [],
    };
    onAdd(cloned);
    const displayName = getLocalizedField(dish.name, lang);
    notify.success(t('dish.cloned'), t('dish.clonedDesc', { name: displayName }));
  }, [t, onAdd, lang, notify]);

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
              <div key={dish.id} className={`relative bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col group text-left w-full ${compareIds.has(dish.id) ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/50' : 'border-slate-100 dark:border-slate-700'}`}>
                <button data-testid={`btn-compare-${dish.id}`} onClick={() => toggleCompare(dish.id)} className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all ${compareIds.has(dish.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200 dark:border-slate-600 text-transparent hover:border-blue-400 hover:text-blue-400'}`} aria-label={t('dish.compare')}>
                  <GitCompareArrows className="w-4 h-4" />
                </button>
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
                {dish.rating && dish.rating > 0 && (
                  <div className="flex items-center gap-0.5 mb-2" data-testid={`dish-rating-${dish.id}`}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={`text-sm ${s <= dish.rating! ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}>★</span>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('common.calories')}</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)}</span></div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-blue-400 font-bold uppercase">{t('common.protein')}</span><span className="text-sm font-bold text-blue-700 dark:text-blue-400">{Math.round(nutrition.protein)}g</span></div>
                </div>
                <div className="relative z-10 mt-auto flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                  <button data-testid={`btn-clone-dish-${dish.id}`} onClick={() => handleClone(dish)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"><Copy className="w-4 h-4" /> {t('dish.clone')}</button>
                  <button data-testid={`btn-edit-dish-${dish.id}`} onClick={() => modal.openEdit(dish)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"><Edit3 className="w-4 h-4" /> {t('common.edit')}</button>
                  <button data-testid={`btn-delete-dish-${dish.id}`} onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))} aria-disabled={isUsed(dish.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(dish.id) ? 'text-slate-400 dark:text-slate-500 opacity-40' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /> {t('common.delete')}</button>
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
                    <tr key={dish.id} className={`transition-colors ${compareIds.has(dish.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><button data-testid={`btn-compare-${dish.id}`} onClick={() => toggleCompare(dish.id)} className={`w-6 h-6 rounded flex items-center justify-center border-2 shrink-0 transition-all ${compareIds.has(dish.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200 dark:border-slate-600 text-transparent hover:border-blue-400'}`} aria-label={t('dish.compare')}><GitCompareArrows className="w-3 h-3" /></button><div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-4 h-4" /></div><div><button type="button" onClick={() => modal.openView(dish)} className="font-bold text-slate-800 dark:text-slate-100 text-left cursor-pointer hover:text-emerald-600 transition-colors">{getLocalizedField(dish.name, lang)}</button><p className="text-xs text-slate-500 dark:text-slate-400">{dish.ingredients.length} {t('dish.ingredients')}</p></div></div></td>
                      <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{dish.tags?.map(tag => <span key={tag} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded">{tagLabels[tag]}</span>)}</div></td>
                      <td className="px-4 py-3 text-right"><span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(nutrition.protein)}g</span></td>
                      <td className="px-4 py-3"><div className="flex items-center justify-end gap-3">
                        <button data-testid={`btn-clone-dish-${dish.id}`} onClick={() => handleClone(dish)} aria-label={`${t('common.clone')} ${getLocalizedField(dish.name, lang)}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"><Copy className="w-4 h-4" /></button>
                        <button data-testid={`btn-edit-dish-${dish.id}`} onClick={() => modal.openEdit(dish)} aria-label={`${t('common.edit')} ${getLocalizedField(dish.name, lang)}`} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button data-testid={`btn-delete-dish-${dish.id}`} onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))} aria-disabled={isUsed(dish.id)} aria-label={`${t('common.delete')} ${getLocalizedField(dish.name, lang)}`} className={`p-2 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-300 dark:text-slate-500 opacity-40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
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
                <div key={dish.id} className={`relative p-4 flex items-center justify-between gap-3 transition-colors w-full text-left ${compareIds.has(dish.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'active:bg-slate-50 dark:active:bg-slate-700'}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button data-testid={`btn-compare-${dish.id}`} onClick={() => toggleCompare(dish.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 shrink-0 relative z-10 transition-all ${compareIds.has(dish.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200 dark:border-slate-600 text-transparent hover:border-blue-400'}`} aria-label={t('dish.compare')}><GitCompareArrows className="w-3.5 h-3.5" /></button>
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><ChefHat className="w-5 h-5" /></div>
                    <div className="min-w-0"><button type="button" onClick={() => modal.openView(dish)} className="font-bold text-slate-800 dark:text-slate-100 truncate text-left cursor-pointer after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">{getLocalizedField(dish.name, lang)}</button><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{Math.round(nutrition.calories)} kcal</span><span className="text-blue-600 dark:text-blue-400">{Math.round(nutrition.protein)}g Pro</span></div></div>
                  </div>
                  <div className="relative z-10 flex items-center gap-3 shrink-0">
                    <button data-testid={`btn-clone-dish-${dish.id}`} onClick={() => handleClone(dish)} aria-label={`${t('common.clone')} ${getLocalizedField(dish.name, lang)}`} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"><Copy className="w-4 h-4" /></button>
                    <button data-testid={`btn-edit-dish-${dish.id}`} onClick={() => modal.openEdit(dish)} aria-label={`${t('common.edit')} ${getLocalizedField(dish.name, lang)}`} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                    <button data-testid={`btn-delete-dish-${dish.id}`} onClick={() => handleDelete(dish.id, getLocalizedField(dish.name, lang))} aria-disabled={isUsed(dish.id)} aria-label={`${t('common.delete')} ${getLocalizedField(dish.name, lang)}`} className={`p-2.5 rounded-lg transition-all ${isUsed(dish.id) ? 'text-slate-300 dark:text-slate-500 opacity-40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
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
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5"><p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">{t('common.calories')}</p><p className="text-xl font-bold text-slate-700 dark:text-slate-300">{Math.round(nutrition.calories)} <span className="text-xs font-medium text-slate-400">kcal</span></p></div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3.5"><p className="text-[10px] text-blue-400 font-bold uppercase mb-1">{t('common.protein')}</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{Math.round(nutrition.protein)}<span className="text-xs font-medium text-blue-400">g</span></p></div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3.5"><p className="text-[10px] text-amber-400 font-bold uppercase mb-1">{t('common.carbs')}</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{Math.round(nutrition.carbs)}<span className="text-xs font-medium text-amber-400">g</span></p></div>
              <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3.5"><p className="text-[10px] text-rose-400 font-bold uppercase mb-1">{t('common.fat')}</p><p className="text-xl font-bold text-rose-700 dark:text-rose-400">{Math.round(nutrition.fat)}<span className="text-xs font-medium text-rose-400">g</span></p></div>
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
          allDishes={dishes}
          onSubmit={handleDishSubmit}
          onClose={handleEditClose}
          onCreateIngredient={onCreateIngredient}
        />
      )}

      <ConfirmationModal isOpen={deleteConfirmation.isOpen} variant="danger" title={t('dish.confirmDelete')} message={<p>{t('dish.confirmDeleteMsg')} <span className="font-bold text-slate-800 dark:text-slate-100">&quot;{deleteConfirmation.dishName}&quot;</span>?<br/>{t('common.cannotUndo')}</p>} confirmLabel={t('common.deleteNow')} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })} />

      {/* Floating Compare Button */}
      {compareIds.size >= 2 && !showCompare && (
        <button data-testid="btn-open-compare" onClick={() => setShowCompare(true)} className="fixed bottom-24 right-4 z-40 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 font-bold text-sm transition-all">
          <GitCompareArrows className="w-5 h-5" />
          {t('dish.compareSelected', { count: compareIds.size })}
        </button>
      )}

      {/* Compare Panel */}
      {showCompare && (() => {
        const compareDishes = dishes.filter(d => compareIds.has(d.id));
        const NUTRITION_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;
        const NUTRITION_COLORS: Record<string, string> = {
          calories: 'text-slate-700 dark:text-slate-300',
          protein: 'text-blue-600 dark:text-blue-400',
          carbs: 'text-amber-600 dark:text-amber-400',
          fat: 'text-rose-600 dark:text-rose-400',
          fiber: 'text-green-600 dark:text-green-400',
        };
        return (
          <dialog data-testid="compare-panel" open className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center m-0 w-full h-full border-none p-0 bg-transparent" aria-label={t('dish.compareNutrition')}>
            <div className="fixed inset-0 bg-black/50" aria-hidden="true"><button type="button" className="w-full h-full cursor-default border-none bg-transparent" onClick={() => setShowCompare(false)} aria-label={t('common.closeBackdrop')} data-testid="compare-backdrop" /></div>
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative z-10">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <GitCompareArrows className="w-5 h-5 text-blue-500" />
                  {t('dish.compareNutrition')}
                </h3>
                <button onClick={() => setShowCompare(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-all" aria-label={t('common.close')}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-2 text-xs font-bold text-slate-400 uppercase">&nbsp;</th>
                      {compareDishes.map(d => (
                        <th key={d.id} className="text-center py-2 px-2 text-sm font-bold text-slate-800 dark:text-slate-100">{getLocalizedField(d.name, lang)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NUTRITION_KEYS.map(key => {
                      const values = compareDishes.map(d => {
                        const n = nutritionMap.get(d.id) ?? ZERO_NUTRITION;
                        return Math.round(n[key]);
                      });
                      const best = key === 'calories' ? Math.min(...values) : Math.max(...values);
                      return (
                        <tr key={key} className="border-t border-slate-50 dark:border-slate-700">
                          <td className="py-2.5 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t(`common.${key}`)}</td>
                          {values.map((v, i) => (
                            <td key={compareDishes[i].id} className="text-center py-2.5 px-2">
                              <span className={`text-lg font-bold ${NUTRITION_COLORS[key]} ${v === best ? 'underline decoration-2 decoration-blue-400' : ''}`}>
                                {v}{key === 'calories' ? '' : 'g'}
                              </span>
                              {key === 'calories' && <span className="text-xs text-slate-400 ml-0.5">kcal</span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </dialog>
        );
      })()}
    </div>
  );
};
