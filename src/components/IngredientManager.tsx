import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Ingredient, Dish, SupportedLang } from '../types';
import { getLocalizedField } from '../utils/localize';
import { Trash2, Edit3, Apple } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { IngredientEditModal } from './modals/IngredientEditModal';
import { ListToolbar } from './shared/ListToolbar';
import { EmptyState } from './shared/EmptyState';
import { DetailModal } from './shared/DetailModal';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useListManager } from '../hooks/useListManager';
import { BaseSortOption, getBaseSortOptions, UNDO_TOAST_DURATION_MS } from '../data/constants';

interface IngredientManagerProps {
  ingredients: Ingredient[];
  dishes?: Dish[];
  onAdd: (ing: Ingredient) => void;
  onUpdate: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  isUsed: (id: string) => boolean;
}

const getDisplayUnit = (unit: Ingredient['unit'], lang: SupportedLang) => {
  const u = getLocalizedField(unit, lang).toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${getLocalizedField(unit, lang)}`;
};

export const IngredientManager: React.FC<IngredientManagerProps> = ({ ingredients, dishes = [], onAdd, onUpdate, onDelete, isUsed }) => {
  const notify = useNotification();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean; ingredientId: string | null; ingredientName: string;
  }>({ isOpen: false, ingredientId: null, ingredientName: '' });

  // --- Shared hooks ---
  const modal = useItemModalFlow<Ingredient>();

  const searchFn = useCallback((ing: Ingredient, q: string) => {
    const ql = q.toLowerCase();
    return Object.values(ing.name).some(n => n.toLowerCase().includes(ql));
  }, []);
  const sortFn = useCallback((a: Ingredient, b: Ingredient, s: BaseSortOption) => {
    switch (s) {
      case 'name-asc': return getLocalizedField(a.name, lang).localeCompare(getLocalizedField(b.name, lang));
      case 'name-desc': return getLocalizedField(b.name, lang).localeCompare(getLocalizedField(a.name, lang));
      case 'cal-asc': return a.caloriesPer100 - b.caloriesPer100;
      case 'cal-desc': return b.caloriesPer100 - a.caloriesPer100;
      case 'pro-asc': return a.proteinPer100 - b.proteinPer100;
      case 'pro-desc': return b.proteinPer100 - a.proteinPer100;
    }
  }, [lang]);

  const list = useListManager<Ingredient, BaseSortOption>({ items: ingredients, searchFn, sortFn, defaultSort: 'name-asc' });

  // --- Domain helpers ---
  const getDishesUsingIngredient = (ingId: string): string[] =>
    dishes.filter(d => d.ingredients.some(di => di.ingredientId === ingId)).map(d => getLocalizedField(d.name, lang));

  // --- Domain handlers ---
  const handleSaveIngredient = useCallback((ing: Ingredient) => {
    const isEdit = ingredients.some(i => i.id === ing.id);
    if (isEdit) onUpdate(ing); else onAdd(ing);
    modal.closeEdit(false);
  }, [ingredients, onUpdate, onAdd, modal]);


  const handleDelete = (id: string, iname: string) => {
    if (isUsed(id)) { notify.warning(t('ingredient.cannotDelete'), t('ingredient.usedInDish')); return; }
    setDeleteConfirmation({ isOpen: true, ingredientId: id, ingredientName: iname });
  };

  const confirmDelete = () => {
    const ingredientId = deleteConfirmation.ingredientId;
    if (!ingredientId) return;
    const deleted = ingredients.find(i => i.id === ingredientId);
    onDelete(ingredientId);
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    if (deleted) {
      const displayName = getLocalizedField(deleted.name, lang);
      notify.info(t('ingredient.deleted'), t('ingredient.deletedDesc', { name: displayName }), {
        duration: UNDO_TOAST_DURATION_MS,
        action: { label: t('common.undo'), onClick: () => { onAdd(deleted); notify.success(t('common.undone'), t('ingredient.restoredDesc', { name: displayName })); } },
      });
    }
  };

  const renderUsedInDishes = (ingId: string) => {
    const usedIn = getDishesUsingIngredient(ingId);
    if (!usedIn.length) return null;
    return (
      <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">{t('ingredient.usedIn')} </span>
        <span className="text-slate-600 dark:text-slate-300">
          {usedIn.length <= 2 ? usedIn.join(', ') : `${usedIn.slice(0, 2).join(', ')} +${usedIn.length - 2}`}
        </span>
      </div>
    );
  };

  // --- Render ---
  const emptyIcon = <Apple className="w-8 h-8 text-emerald-300" />;

  return (
    <div className="space-y-6">
      <ListToolbar
        searchQuery={list.searchQuery} onSearchChange={list.setSearchQuery} searchPlaceholder={t('ingredient.searchPlaceholder')}
        sortOptions={getBaseSortOptions(t)} sortBy={list.sortBy} onSortChange={v => list.setSortBy(v as BaseSortOption)}
        viewLayout={list.viewLayout} onLayoutChange={list.setViewLayout}
        onAdd={() => modal.openEdit()} addLabel={t('ingredient.addNew')}
        searchTestId="input-search-ingredient" addTestId="btn-add-ingredient" sortTestId="select-sort-ingredient"
      />

      {/* Grid View */}
      {list.viewLayout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.filteredItems.map(ing => (
            <div key={ing.id} className="relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col group text-left w-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500"><Apple className="w-5 h-5" /></div>
                  <div>
                    <button type="button" onClick={() => modal.openView(ing)} className="font-bold text-slate-800 dark:text-slate-100 text-lg text-left cursor-pointer after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded">{getLocalizedField(ing.name, lang)}</button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{getDisplayUnit(ing.unit, lang)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('common.calories')}</span><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100}</span></div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-blue-400 font-bold uppercase">{t('common.protein')}</span><span className="text-sm font-bold text-blue-700 dark:text-blue-400">{ing.proteinPer100}g</span></div>
                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-amber-400 font-bold uppercase">{t('common.carbs')}</span><span className="text-sm font-bold text-amber-700 dark:text-amber-400">{ing.carbsPer100}g</span></div>
                <div className="bg-rose-50 dark:bg-rose-900/30 rounded-lg p-2 flex items-center justify-between"><span className="text-[10px] text-rose-400 font-bold uppercase">{t('common.fat')}</span><span className="text-sm font-bold text-rose-700 dark:text-rose-400">{ing.fatPer100}g</span></div>
              </div>
              {renderUsedInDishes(ing.id)}
              <div className="relative z-10 mt-auto flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button data-testid={`btn-edit-ingredient-${ing.id}`} onClick={() => modal.openEdit(ing)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"><Edit3 className="w-4 h-4" /> {t('common.edit')}</button>
                <button data-testid={`btn-delete-ingredient-${ing.id}`} onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))} aria-disabled={isUsed(ing.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isUsed(ing.id) ? 'text-slate-400 dark:text-slate-500 opacity-40' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /> {t('common.delete')}</button>
              </div>
            </div>
          ))}
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName={t('ingredient.title').toLowerCase()} actionLabel={t('ingredient.addNew')} onAction={() => modal.openEdit()} className="col-span-full" />}
        </div>
      )}

      {/* List View */}
      {list.viewLayout === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('ingredient.title')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.calories')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.protein')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.carbs')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.fat')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {list.filteredItems.map(ing => (
                  <tr key={ing.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><Apple className="w-4 h-4" /></div><div><button type="button" onClick={() => modal.openView(ing)} className="font-bold text-slate-800 dark:text-slate-100 text-left cursor-pointer hover:text-emerald-600 transition-colors">{getLocalizedField(ing.name, lang)}</button><p className="text-xs text-slate-500 dark:text-slate-400">{getDisplayUnit(ing.unit, lang)}</p></div></div></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100}</span></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-blue-600 dark:text-blue-400">{ing.proteinPer100}g</span></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-amber-600 dark:text-amber-400">{ing.carbsPer100}g</span></td>
                    <td className="px-4 py-3 text-right"><span className="font-bold text-rose-600 dark:text-rose-400">{ing.fatPer100}g</span></td>
                    <td className="px-4 py-3"><div className="flex items-center justify-end gap-3">
                      <button data-testid={`btn-edit-ingredient-${ing.id}`} onClick={() => modal.openEdit(ing)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button data-testid={`btn-delete-ingredient-${ing.id}`} onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))} aria-disabled={isUsed(ing.id)} className={`p-2 rounded-lg transition-all ${isUsed(ing.id) ? 'text-slate-300 dark:text-slate-500 opacity-40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {list.filteredItems.map(ing => (
              <div key={ing.id} className="relative p-4 flex items-center justify-between gap-3 active:bg-slate-50 dark:active:bg-slate-700 transition-colors w-full text-left">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><Apple className="w-5 h-5" /></div>
                  <div className="min-w-0"><button type="button" onClick={() => modal.openView(ing)} className="font-bold text-slate-800 dark:text-slate-100 truncate text-left cursor-pointer after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded">{getLocalizedField(ing.name, lang)}</button><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{ing.caloriesPer100} kcal</span><span className="text-blue-600 dark:text-blue-400">{ing.proteinPer100}g Pro</span></div></div>
                </div>
                <div className="relative z-10 flex items-center gap-3 shrink-0">
                  <button data-testid={`btn-edit-ingredient-${ing.id}`} onClick={() => modal.openEdit(ing)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                  <button data-testid={`btn-delete-ingredient-${ing.id}`} onClick={() => handleDelete(ing.id, getLocalizedField(ing.name, lang))} aria-disabled={isUsed(ing.id)} className={`p-2.5 rounded-lg transition-all ${isUsed(ing.id) ? 'text-slate-300 dark:text-slate-500 opacity-40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {list.filteredItems.length === 0 && <EmptyState icon={emptyIcon} searchQuery={list.searchQuery} entityName={t('ingredient.title').toLowerCase()} actionLabel={t('ingredient.addNew')} onAction={() => modal.openEdit()} />}
        </div>
      )}

      {/* View Detail Modal */}
      {modal.viewingItem && (() => {
        const ing = modal.viewingItem;
        const usedIn = getDishesUsingIngredient(ing.id);
        return (
          <DetailModal title={t('ingredient.detail')} editLabel={t('ingredient.editIngredient')} onClose={modal.closeView} onEdit={() => modal.openEditFromView(ing)}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0"><Apple className="w-7 h-7" /></div>
              <div><h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{getLocalizedField(ing.name, lang)}</h3><p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{getDisplayUnit(ing.unit, lang)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5"><p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">{t('common.calories')}</p><p className="text-xl font-bold text-slate-700 dark:text-slate-300">{ing.caloriesPer100} <span className="text-xs font-medium text-slate-400">kcal</span></p></div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3.5"><p className="text-[10px] text-blue-400 font-bold uppercase mb-1">{t('common.protein')}</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{ing.proteinPer100}<span className="text-xs font-medium text-blue-400">g</span></p></div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3.5"><p className="text-[10px] text-amber-400 font-bold uppercase mb-1">{t('common.carbs')}</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{ing.carbsPer100}<span className="text-xs font-medium text-amber-400">g</span></p></div>
              <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-3.5"><p className="text-[10px] text-rose-400 font-bold uppercase mb-1">{t('common.fat')}</p><p className="text-xl font-bold text-rose-700 dark:text-rose-400">{ing.fatPer100}<span className="text-xs font-medium text-rose-400">g</span></p></div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3.5"><p className="text-[10px] text-green-400 font-bold uppercase mb-1">{t('common.fiber')}</p><p className="text-xl font-bold text-green-700 dark:text-green-400">{ing.fiberPer100}<span className="text-xs font-medium text-green-400">g</span></p></div>
            {usedIn.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('ingredient.usedIn')}</p>
                <div className="flex flex-wrap gap-1.5">{usedIn.map(n => <span key={n} className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">{n}</span>)}</div>
              </div>
            )}
          </DetailModal>
        );
      })()}

      {/* Edit Modal */}
      {modal.isEditOpen && (
        <IngredientEditModal
          editingItem={modal.editingItem}
          onSubmit={handleSaveIngredient}
          onClose={() => modal.closeEdit(false)}
        />
      )}

      <ConfirmationModal isOpen={deleteConfirmation.isOpen} variant="danger" title={t('ingredient.confirmDelete')} message={<p>{t('ingredient.confirmDeleteMsg')} <span className="font-bold text-slate-800 dark:text-slate-100">&quot;{deleteConfirmation.ingredientName}&quot;</span>?</p>} confirmLabel={t('common.deleteNow')} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })} />
    </div>
  );
};
